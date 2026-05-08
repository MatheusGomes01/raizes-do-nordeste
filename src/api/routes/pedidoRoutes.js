const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { auditMiddleware } = require('../middlewares/auditMiddleware');
const pedidoService = require('../../application/services/pedidoService');
const fidelidadeService = require('../../application/services/fidelidadeService');

router.use(auditMiddleware);

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [canalPedido, unidadeId, itens, formaPagamento]
 *             properties:
 *               canalPedido:
 *                 type: string
 *                 enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *                 example: TOTEM
 *               unidadeId:
 *                 type: integer
 *                 example: 1
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produtoId:
 *                       type: integer
 *                       example: 1
 *                     quantidade:
 *                       type: integer
 *                       example: 2
 *               formaPagamento:
 *                 type: string
 *                 enum: [PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO]
 *                 example: PIX
 *               observacao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       404:
 *         description: Unidade ou produto não encontrado
 *       409:
 *         description: Estoque insuficiente
 *       422:
 *         description: Dados inválidos
 */
router.post('/', autenticar, async (req, res, next) => {
  try {
    const resultado = await pedidoService.criarPedido({
      clienteId: req.usuario.id,
      ...req.body
    });

    await req.audit('PEDIDO_CRIADO', 'Pedido', resultado.pedidoId, null, {
      canalPedido: resultado.canalPedido,
      total: resultado.total,
      itens: resultado.itens.length
    });

    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Listar pedidos com filtros e paginação
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: canalPedido
 *         schema:
 *           type: string
 *           enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AGUARDANDO_PAGAMENTO, PAGO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO]
 *       - in: query
 *         name: unidadeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Não autenticado
 */
router.get('/', autenticar, async (req, res, next) => {
  try {
    const filtros = { ...req.query };

    // Clientes só veem seus próprios pedidos
    if (req.usuario.role === 'CLIENTE') {
      filtros.clienteId = req.usuario.id;
    }

    const resultado = await pedidoService.listarPedidos(filtros);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Buscar pedido por ID
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do pedido
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', autenticar, async (req, res, next) => {
  try {
    const pedido = await pedidoService.buscarPorId(parseInt(req.params.id));
    res.json(pedido);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos/{id}/status:
 *   patch:
 *     summary: Atualizar status do pedido (ADMIN/GERENTE/ATENDENTE/COZINHA)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PAGO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO]
 *     responses:
 *       200:
 *         description: Status atualizado
 *       409:
 *         description: Transição de status inválida
 */
router.patch('/:id/status', autenticar, autorizar('ADMIN', 'GERENTE', 'ATENDENTE', 'COZINHA'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const resultado = await pedidoService.atualizarStatus(parseInt(req.params.id), status);

    await req.audit('STATUS_ATUALIZADO', 'Pedido', resultado.pedidoId,
      { status: resultado.statusAnterior },
      { status: resultado.statusAtual }
    );

    // Se o pedido foi entregue, acumula pontos de fidelidade
    if (resultado.statusAtual === 'ENTREGUE') {
      const pedido = await pedidoService.buscarPorId(resultado.pedidoId);
      await fidelidadeService.acumularPontos(
        pedido.cliente_id,
        pedido.id,
        parseFloat(pedido.total)
      );
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pedidos/{id}/cancelar:
 *   post:
 *     summary: Cancelar pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *       409:
 *         description: Não é possível cancelar
 */
router.post('/:id/cancelar', autenticar, async (req, res, next) => {
  try {
    const resultado = await pedidoService.cancelarPedido(parseInt(req.params.id));

    await req.audit('PEDIDO_CANCELADO', 'Pedido', resultado.pedidoId, null, { status: 'CANCELADO' });

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
