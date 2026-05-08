const { Fidelidade, HistoricoFidelidade, Usuario } = require('../../infrastructure/database/models');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de Fidelidade — acúmulo e resgate de pontos.
 * Requer consentimento do cliente (LGPD).
 */
class FidelidadeService {
  /**
   * Consulta saldo de pontos do cliente.
   */
  async consultarSaldo(clienteId) {
    const fidelidade = await Fidelidade.findOne({ where: { cliente_id: clienteId } });

    if (!fidelidade) {
      throw new AppError('Programa de fidelidade não encontrado para este cliente.', 404, 'FIDELIDADE_NAO_ENCONTRADA');
    }

    return {
      clienteId,
      pontosAcumulados: fidelidade.pontos_acumulados,
      pontosUtilizados: fidelidade.pontos_utilizados,
      saldoPontos: fidelidade.saldo_pontos
    };
  }

  /**
   * Acumula pontos após pedido pago (1 ponto por real gasto).
   */
  async acumularPontos(clienteId, pedidoId, valorPedido) {
    const usuario = await Usuario.findByPk(clienteId);
    if (!usuario || !usuario.consentimento_fidelidade) {
      // Sem consentimento, não acumula (LGPD)
      return null;
    }

    let fidelidade = await Fidelidade.findOne({ where: { cliente_id: clienteId } });

    if (!fidelidade) {
      fidelidade = await Fidelidade.create({
        cliente_id: clienteId,
        pontos_acumulados: 0,
        pontos_utilizados: 0,
        saldo_pontos: 0
      });
    }

    const pontosGanhos = Math.floor(valorPedido * (parseInt(process.env.PONTOS_POR_REAL) || 1));

    await fidelidade.update({
      pontos_acumulados: fidelidade.pontos_acumulados + pontosGanhos,
      saldo_pontos: fidelidade.saldo_pontos + pontosGanhos
    });

    await HistoricoFidelidade.create({
      cliente_id: clienteId,
      pedido_id: pedidoId,
      tipo: 'ACUMULO',
      pontos: pontosGanhos,
      descricao: `Acúmulo de ${pontosGanhos} pontos pelo pedido #${pedidoId}`
    });

    return { pontosGanhos, saldoAtual: fidelidade.saldo_pontos + pontosGanhos };
  }

  /**
   * Resgata pontos (desconto em pedido futuro).
   */
  async resgatarPontos(clienteId, pontosResgate) {
    if (!pontosResgate || pontosResgate <= 0) {
      throw new AppError('Quantidade de pontos deve ser maior que zero.', 422, 'PONTOS_INVALIDOS');
    }

    const usuario = await Usuario.findByPk(clienteId);
    if (!usuario || !usuario.consentimento_fidelidade) {
      throw new AppError('Cliente não participa do programa de fidelidade.', 403, 'SEM_CONSENTIMENTO_FIDELIDADE');
    }

    const fidelidade = await Fidelidade.findOne({ where: { cliente_id: clienteId } });

    if (!fidelidade || fidelidade.saldo_pontos < pontosResgate) {
      throw new AppError('Saldo de pontos insuficiente.', 409, 'SALDO_INSUFICIENTE', [
        { field: 'pontos', issue: `Saldo disponível: ${fidelidade ? fidelidade.saldo_pontos : 0}` }
      ]);
    }

    const valorDesconto = pontosResgate * (parseFloat(process.env.VALOR_POR_PONTO) || 0.10);

    await fidelidade.update({
      pontos_utilizados: fidelidade.pontos_utilizados + pontosResgate,
      saldo_pontos: fidelidade.saldo_pontos - pontosResgate
    });

    await HistoricoFidelidade.create({
      cliente_id: clienteId,
      pedido_id: null,
      tipo: 'RESGATE',
      pontos: pontosResgate,
      descricao: `Resgate de ${pontosResgate} pontos (R$ ${valorDesconto.toFixed(2)} de desconto)`
    });

    return {
      pontosResgatados: pontosResgate,
      valorDesconto: valorDesconto.toFixed(2),
      saldoRestante: fidelidade.saldo_pontos - pontosResgate
    };
  }

  /**
   * Consulta histórico de fidelidade do cliente.
   */
  async consultarHistorico(clienteId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await HistoricoFidelidade.findAndCountAll({
      where: { cliente_id: clienteId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = new FidelidadeService();
