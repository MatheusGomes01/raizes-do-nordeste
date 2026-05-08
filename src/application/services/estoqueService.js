const { Estoque, Produto, Unidade } = require('../../infrastructure/database/models');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de Estoque — controle de entrada/saída por unidade.
 */
class EstoqueService {
  /**
   * Consulta estoque de uma unidade.
   */
  async consultarPorUnidade(unidadeId) {
    const unidade = await Unidade.findByPk(unidadeId);
    if (!unidade) {
      throw new AppError('Unidade não encontrada.', 404, 'UNIDADE_NAO_ENCONTRADA');
    }

    const estoque = await Estoque.findAll({
      where: { unidade_id: unidadeId },
      include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome', 'preco', 'categoria'] }],
      order: [[{ model: Produto, as: 'produto' }, 'nome', 'ASC']]
    });

    return {
      unidade: { id: unidade.id, nome: unidade.nome },
      itens: estoque.map(e => ({
        produtoId: e.produto_id,
        produto: e.produto.nome,
        categoria: e.produto.categoria,
        preco: parseFloat(e.produto.preco),
        quantidade: e.quantidade
      }))
    };
  }

  /**
   * Movimenta estoque (entrada ou saída).
   */
  async movimentar({ unidadeId, produtoId, tipo, quantidade }) {
    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      throw new AppError('Tipo de movimentação inválido. Use ENTRADA ou SAIDA.', 422, 'TIPO_INVALIDO', [
        { field: 'tipo', issue: 'Valores aceitos: ENTRADA, SAIDA' }
      ]);
    }

    if (!quantidade || quantidade <= 0) {
      throw new AppError('Quantidade deve ser maior que zero.', 422, 'QUANTIDADE_INVALIDA', [
        { field: 'quantidade', issue: 'Deve ser um número positivo.' }
      ]);
    }

    const unidade = await Unidade.findByPk(unidadeId);
    if (!unidade) {
      throw new AppError('Unidade não encontrada.', 404, 'UNIDADE_NAO_ENCONTRADA');
    }

    const produto = await Produto.findByPk(produtoId);
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404, 'PRODUTO_NAO_ENCONTRADO');
    }

    let estoque = await Estoque.findOne({
      where: { unidade_id: unidadeId, produto_id: produtoId }
    });

    if (!estoque) {
      // Cria registro de estoque se não existir
      estoque = await Estoque.create({
        unidade_id: unidadeId,
        produto_id: produtoId,
        quantidade: 0
      });
    }

    if (tipo === 'SAIDA' && estoque.quantidade < quantidade) {
      throw new AppError('Estoque insuficiente para saída.', 409, 'ESTOQUE_INSUFICIENTE', [
        { field: 'quantidade', issue: `Disponível: ${estoque.quantidade}` }
      ]);
    }

    const novaQuantidade = tipo === 'ENTRADA'
      ? estoque.quantidade + quantidade
      : estoque.quantidade - quantidade;

    await estoque.update({ quantidade: novaQuantidade });

    return {
      unidadeId,
      produtoId,
      produto: produto.nome,
      tipo,
      quantidadeMovimentada: quantidade,
      saldoAnterior: estoque.quantidade + (tipo === 'ENTRADA' ? -quantidade : quantidade),
      saldoAtual: novaQuantidade
    };
  }
}

module.exports = new EstoqueService();
