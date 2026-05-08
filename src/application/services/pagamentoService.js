const { Pedido, Pagamento } = require('../../infrastructure/database/models');
const { processarPagamento } = require('../../infrastructure/external/pagamentoGatewayMock');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de Pagamento — orquestra o fluxo de pagamento mock.
 * Fluxo: Pedido → Gateway Mock → Registro → Atualização de Status.
 */
class PagamentoService {
  /**
   * Processa pagamento de um pedido via gateway mock.
   */
  async processarPagamentoPedido(pedidoId) {
    const pedido = await Pedido.findByPk(pedidoId);

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404, 'PEDIDO_NAO_ENCONTRADO');
    }

    if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
      throw new AppError(
        'Pedido não está aguardando pagamento.',
        409, 'STATUS_INVALIDO_PAGAMENTO',
        [{ field: 'status', issue: `Status atual: ${pedido.status}` }]
      );
    }

    // Verifica se já existe pagamento para este pedido
    const pagamentoExistente = await Pagamento.findOne({ where: { pedido_id: pedidoId, status: 'APROVADO' } });
    if (pagamentoExistente) {
      throw new AppError(
        'Já existe um pagamento aprovado para este pedido.',
        409, 'PAGAMENTO_DUPLICADO'
      );
    }

    // Envia para o gateway mock
    const respostaGateway = await processarPagamento({
      pedidoId,
      valor: parseFloat(pedido.total),
      formaPagamento: pedido.forma_pagamento
    });

    // Registra o pagamento no banco
    const pagamento = await Pagamento.create({
      pedido_id: pedidoId,
      valor: parseFloat(pedido.total),
      forma_pagamento: pedido.forma_pagamento,
      status: respostaGateway.status,
      gateway_transaction_id: respostaGateway.transactionId,
      gateway_response: respostaGateway.payload
    });

    // Se aprovado, atualiza status do pedido
    if (respostaGateway.success) {
      await pedido.update({ status: 'PAGO' });
    }

    return {
      pagamentoId: pagamento.id,
      pedidoId: pedido.id,
      valor: parseFloat(pagamento.valor),
      status: pagamento.status,
      transactionId: respostaGateway.transactionId,
      message: respostaGateway.message,
      statusPedido: respostaGateway.success ? 'PAGO' : 'AGUARDANDO_PAGAMENTO',
      gatewayResponse: respostaGateway.payload
    };
  }

  /**
   * Consulta pagamento de um pedido.
   */
  async consultarPagamento(pedidoId) {
    const pagamento = await Pagamento.findOne({
      where: { pedido_id: pedidoId },
      order: [['created_at', 'DESC']]
    });

    if (!pagamento) {
      throw new AppError('Nenhum pagamento encontrado para este pedido.', 404, 'PAGAMENTO_NAO_ENCONTRADO');
    }

    return pagamento;
  }
}

module.exports = new PagamentoService();
