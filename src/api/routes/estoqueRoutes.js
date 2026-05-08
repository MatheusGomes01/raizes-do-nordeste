const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { auditMiddleware } = require('../middlewares/auditMiddleware');
const estoqueService = require('../../application/services/estoqueService');

router.use(auditMiddleware);

/**
 * @swagger
 * /estoque/{unidadeId}:
 *   get:
 *     summary: Consultar estoque de uma unidade
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unidadeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estoque da unidade
 *       404:
 *         description: Unidade não encontrada
 */
router.get('/:unidadeId', autenticar, autorizar('ADMIN', 'GERENTE', 'ATENDENTE'), async (req, res, next) => {
  try {
    const resultado = await estoqueService.consultarPorUnidade(parseInt(req.params.unidadeId));
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /estoque/movimentar:
 *   post:
 *     summary: Movimentar estoque (entrada/saída)
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unidadeId, produtoId, tipo, quantidade]
 *             properties:
 *               unidadeId:
 *                 type: integer
 *                 example: 1
 *               produtoId:
 *                 type: integer
 *                 example: 1
 *               tipo:
 *                 type: string
 *                 enum: [ENTRADA, SAIDA]
 *                 example: ENTRADA
 *               quantidade:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       200:
 *         description: Movimentação realizada
 *       404:
 *         description: Unidade ou produto não encontrado
 *       409:
 *         description: Estoque insuficiente para saída
 */
router.post('/movimentar', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const resultado = await estoqueService.movimentar(req.body);

    await req.audit(
      `ESTOQUE_${req.body.tipo}`,
      'Estoque',
      null,
      { saldo: resultado.saldoAnterior },
      { saldo: resultado.saldoAtual, quantidade: req.body.quantidade }
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
