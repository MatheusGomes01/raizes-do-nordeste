const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { AuditLog, Usuario } = require('../../infrastructure/database/models');

/**
 * @swagger
 * /auditoria:
 *   get:
 *     summary: Consultar logs de auditoria (ADMIN)
 *     tags: [Auditoria]
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
 *           default: 20
 *       - in: query
 *         name: acao
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de ação (ex. PEDIDO_CRIADO, LOGIN, STATUS_ATUALIZADO)
 *       - in: query
 *         name: entidade
 *         schema:
 *           type: string
 *         description: Filtrar por entidade (ex. Pedido, Usuario, Pagamento)
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *       403:
 *         description: Apenas ADMIN pode acessar
 */
router.get('/', autenticar, autorizar('ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, acao, entidade } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
