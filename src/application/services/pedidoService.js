const { sequelize, Pedido, ItemPedido, Produto, Estoque, Unidade } = require('../../infrastructure/database/models');
const { CANAIS_VALIDOS } = require('../../domain/enums/CanalPedido');
const { FORMAS_VALIDAS } = require('../../domain/enums/FormaPagamento');
const { validarTransicao } = require('../../domain/enums/StatusPedido');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de Pedidos — orquestra criação, consulta e atualização de status.
 */
class PedidoService {
  /**
   * Cria um novo pedido com validação de estoque.
   */
  async criarPedido({ clienteId, unidadeId, canalPedido, itens, formaPagamento, observacao }) {
    // Validações de campos obrigatórios
    const erros = [];
    if (!canalPedido) erros.push({ field: 'canalPedido', issue: 'Campo obrigatório' });
    if (!unidadeId) erros.push({ field: 'unidadeId', issue: 'Campo obrigatório' });
    if (!itens || !Array.isArray(itens) || itens.length === 0) erros.push({ field: 'itens', issue: 'Deve conter ao menos 1 item' });
    if (!formaPagamento) erros.push({ field: 'formaPagamento', issue: 'Campo obrigatório' });

    if (erros.length > 0) {
      throw new AppError('Dados obrigatórios não informados.', 422, 'VALIDACAO_FALHOU', erros);
    }

    // Validação do canal
    if (!CANAIS_VALIDOS.includes(canalPedido)) {
      throw new AppError(
        `Canal de pedido inválido. Valores aceitos: ${CANAIS_VALIDOS.join(', ')}.`,
        422, 'CANAL_INVALIDO',
        [{ field: 'canalPedido', issue: `Valor '${canalPedido}' não é válido.` }]
      );
    }

    // Validação da forma de pagamento
    if (!FORMAS_VALIDAS.includes(formaPagamento)) {
      throw new AppError(
        `Forma de pagamento inválida. Valores aceitos: ${FORMAS_VALIDAS.join(', ')}.`,
        422, 'FORMA_PAGAMENTO_INVALIDA',
        [{ field: 'formaPagamento', issue: `Valor '${formaPagamento}' não é válido.` }]
      );
    }

    // Verifica se a unidade existe
    const unidade = await Unidade.findByPk(unidadeId);
    if (!unidade) {
      throw new AppError('Unidade não encontrada.', 404, 'UNIDADE_NAO_ENCONTRADA', [
        { field: 'unidadeId', issue: `Unidade ${unidadeId} não existe.` }
      ]);
    }

    // Validação de itens (quantidade positiva)
    for (let i = 0; i < itens.length; i++) {
      if (!itens[i].produtoId || !itens[i].quantidade || itens[i].quantidade <= 0) {
        throw new AppError('Item do pedido inválido.', 422, 'ITEM_INVALIDO', [
          { field: `itens[${i}]`, issue: 'produtoId e quantidade (> 0) são obrigatórios.' }
        ]);
      }
    }

    // Transação para garantir consistência
    const transaction = await sequelize.transaction();

    try {
      let total = 0;
      const itensProcessados = [];

      for (let i = 0; i < itens.length; i++) {
        const { produtoId, quantidade } = itens[i];

        // Busca produto
        const produto = await Produto.findByPk(produtoId, { transaction });
        if (!produto || !produto.ativo) {
          await transaction.rollback();
          throw new AppError('Produto não encontrado.', 404, 'PRODUTO_NAO_ENCONTRADO', [
            { field: `itens[${i}].produtoId`, issue: `Produto ${produtoId} não existe ou está inativo.` }
          ]);
        }

        // Verifica estoque na unidade
        const estoque = await Estoque.findOne({
          where: { unidade_id: unidadeId, produto_id: produtoId },
          transaction
        });

        if (!estoque || estoque.quantidade < quantidade) {
          await transaction.rollback();
          throw new AppError('Estoque insuficiente para um ou mais itens.', 409, 'ESTOQUE_INSUFICIENTE', [
            { field: `itens[${i}].quantidade`, issue: `Disponível: ${estoque ? estoque.quantidade : 0}` }
          ]);
        }

        const subtotal = parseFloat(produto.preco) * quantidade;
        total += subtotal;

        itensProcessados.push({
          produtoId,
          quantidade,
          precoUnitario: parseFloat(produto.preco),
          subtotal
        });

        // Decrementa estoque
        await estoque.update(
          { quantidade: estoque.quantidade - quantidade },
          { transaction }
        );
      }

      // Cria o pedido
      const pedido = await Pedido.create({
        cliente_id: clienteId,
        unidade_id: unidadeId,
        canal_pedido: canalPedido,
        forma_pagamento: formaPagamento,
        total: total.toFixed(2),
        observacao: observacao || null,
        status: 'AGUARDANDO_PAGAMENTO'
      }, { transaction });

      // Cria itens do pedido
      for (const item of itensProcessados) {
        await ItemPedido.create({
          pedido_id: pedido.id,
          produto_id: item.produtoId,
          quantidade: item.quantidade,
          preco_unitario: item.precoUnitario,
          subtotal: item.subtotal
        }, { transaction });
      }

      await transaction.commit();

      return {
        pedidoId: pedido.id,
        status: pedido.status,
        canalPedido: pedido.canal_pedido,
        total: parseFloat(pedido.total),
        itens: itensProcessados,
        createdAt: pedido.createdAt
      };
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Lista pedidos com filtros e paginação.
   */
  async listarPedidos({ page = 1, limit = 10, canalPedido, status, clienteId, unidadeId }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (canalPedido) where.canal_pedido = canalPedido;
    if (status) where.status = status;
    if (clienteId) where.cliente_id = clienteId;
    if (unidadeId) where.unidade_id = unidadeId;

    const { count, rows } = await Pedido.findAndCountAll({
      where,
      include: [
        { model: ItemPedido, as: 'itens', include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome'] }] },
        { model: Unidade, as: 'unidade', attributes: ['id', 'nome'] }
      ],
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

  /**
   * Busca pedido por ID.
   */
  async buscarPorId(pedidoId) {
    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        { model: ItemPedido, as: 'itens', include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome', 'preco'] }] },
        { model: Unidade, as: 'unidade', attributes: ['id', 'nome', 'cidade'] }
      ]
    });

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404, 'PEDIDO_NAO_ENCONTRADO');
    }

    return pedido;
  }

  /**
   * Atualiza o status do pedido com validação de transição.
   */
  async atualizarStatus(pedidoId, novoStatus) {
    const pedido = await Pedido.findByPk(pedidoId);

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404, 'PEDIDO_NAO_ENCONTRADO');
    }

    if (!validarTransicao(pedido.status, novoStatus)) {
      throw new AppError(
        `Transição de status inválida: ${pedido.status} → ${novoStatus}.`,
        409, 'TRANSICAO_INVALIDA',
        [{ field: 'status', issue: `Não é possível mudar de ${pedido.status} para ${novoStatus}.` }]
      );
    }

    const statusAnterior = pedido.status;
    await pedido.update({ status: novoStatus });

    return { pedidoId: pedido.id, statusAnterior, statusAtual: novoStatus };
  }

  /**
   * Cancela um pedido e devolve o estoque.
   */
  async cancelarPedido(pedidoId) {
    const pedido = await Pedido.findByPk(pedidoId, {
      include: [{ model: ItemPedido, as: 'itens' }]
    });

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404, 'PEDIDO_NAO_ENCONTRADO');
    }

    if (pedido.status === 'ENTREGUE' || pedido.status === 'CANCELADO') {
      throw new AppError(
        `Não é possível cancelar pedido com status ${pedido.status}.`,
        409, 'CANCELAMENTO_INVALIDO'
      );
    }

    const transaction = await sequelize.transaction();

    try {
      // Devolve estoque
      for (const item of pedido.itens) {
        const estoque = await Estoque.findOne({
          where: { unidade_id: pedido.unidade_id, produto_id: item.produto_id },
          transaction
        });
        if (estoque) {
          await estoque.update(
            { quantidade: estoque.quantidade + item.quantidade },
            { transaction }
          );
        }
      }

      await pedido.update({ status: 'CANCELADO' }, { transaction });
      await transaction.commit();

      return { pedidoId: pedido.id, status: 'CANCELADO' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new PedidoService();
