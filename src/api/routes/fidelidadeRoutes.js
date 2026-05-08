const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const { auditMiddleware } = require('../middlewares/auditMiddleware');
const fidelidadeService = require('../../application/services/fidelidadeService');
const { Usuario } = require('../../infrastructure/database/models');
const { AppError } = require('../middlewares/errorHandler');

router.use(auditMiddleware);

/**
 * @swagger
 * /fidelidade/saldo:
 *   get:
 *     summary: Consultar saldo de pontos do cliente autenticado
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo de pontos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clienteId:
 *                   type: integer
 *                 pontosAcumulados:
 *                   type: integer
 *                 pontosUtilizados:
 *                   type: integer
 *                 saldoPontos:
 *                   type: integer
 *       404:
 *         description: Fidelidade não encontrada
 */
router.get('/saldo', autenticar, async (req, res, next) => {
  try {
    const resultado = await fidelidadeService.consultarSaldo(req.usuario.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /fidelidade/historico:
 *   get:
 *     summary: Consultar histórico de pontos do cliente
 *     tags: [Fidelidade]
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
 *     responses:
 *       200:
 *         description: Histórico de pontos
 */
router.get('/historico', autenticar, async (req, res, next) => {
  try {
    const resultado = await fidelidadeService.consultarHistorico(req.usuario.id, req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /fidelidade/resgatar:
 *   post:
 *     summary: Resgatar pontos de fidelidade
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pontos]
 *             properties:
 *               pontos:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       200:
 *         description: Pontos resgatados com sucesso
 *       409:
 *         description: Saldo insuficiente
 */
router.post('/resgatar', autenticar, async (req, res, next) => {
  try {
    const { pontos } = req.body;
    const resultado = await fidelidadeService.resgatarPontos(req.usuario.id, pontos);

    await req.audit('RESGATE_PONTOS', 'Fidelidade', null, null, {
      pontosResgatados: resultado.pontosResgatados,
      valorDesconto: resultado.valorDesconto
    });

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /fidelidade/consentimento:
 *   post:
 *     summary: Ativar/desativar consentimento para programa de fidelidade (LGPD)
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consentimento]
 *             properties:
 *               consentimento:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Consentimento atualizado
 */
router.post('/consentimento', autenticar, async (req, res, next) => {
  try {
    const { consentimento } = req.body;

    if (typeof consentimento !== 'boolean') {
      throw new AppError('Campo consentimento deve ser true ou false.', 422, 'CAMPO_INVALIDO');
    }

    await Usuario.update(
      { consentimento_fidelidade: consentimento },
      { where: { id: req.usuario.id } }
    );

    await req.audit('CONSENTIMENTO_FIDELIDADE', 'Usuario', req.usuario.id, null, { consentimento });

    res.json({
      message: consentimento
        ? 'Consentimento para programa de fidelidade ativado.'
        : 'Consentimento para programa de fidelidade revogado.',
      consentimento_fidelidade: consentimento
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
