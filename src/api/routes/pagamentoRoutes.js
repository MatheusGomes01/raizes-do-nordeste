const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const { auditMiddleware } = require('../middlewares/auditMiddleware');
const pagamentoService = require('../../application/services/pagamentoService');

router.use(auditMiddleware);

/**
 * @swagger
 * /pagamentos/{pedidoId}/processar:
 *   post:
 *     summary: Processar pagamento de um pedido (gateway mock)
 *     tags: [Pagamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultado do processamento do pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagamentoId:
 *                   type: integer
 *                 pedidoId:
 *                   type: integer
 *                 valor:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [APROVADO, RECUSADO]
 *                 transactionId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 statusPedido:
 *                   type: string
 *                 gatewayResponse:
 *                   type: object
 *       404:
 *         description: Pedido não encontrado
 *       409:
 *         description: Pedido não está aguardando pagamento ou pagamento duplicado
 */
router.post('/:pedidoId/processar', autenticar, async (req, res, next) => {
  try {
    const resultado = await pagamentoService.processarPagamentoPedido(parseInt(req.params.pedidoId));

    await req.audit(
      `PAGAMENTO_${resultado.status}`,
      'Pagamento',
      resultado.pagamentoId,
      null,
      {
        pedidoId: resultado.pedidoId,
        valor: resultado.valor,
        status: resultado.status,
        transactionId: resultado.transactionId
      }
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /pagamentos/{pedidoId}:
 *   get:
 *     summary: Consultar pagamento de um pedido
 *     tags: [Pagamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do pagamento
 *       404:
 *         description: Pagamento não encontrado
 */
router.get('/:pedidoId', autenticar, async (req, res, next) => {
  try {
    const pagamento = await pagamentoService.consultarPagamento(parseInt(req.params.pedidoId));
    res.json(pagamento);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
