const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { auditMiddleware } = require('../middlewares/auditMiddleware');
const { Usuario } = require('../../infrastructure/database/models');
const { AppError } = require('../middlewares/errorHandler');

router.use(auditMiddleware);

/**
 * @swagger
 * /usuarios/perfil:
 *   get:
 *     summary: Obter perfil do usuário autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil (sem dados sensíveis)
 *       401:
 *         description: Não autenticado
 */
router.get('/perfil', autenticar, async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nome', 'email', 'role', 'consentimento_lgpd', 'consentimento_fidelidade', 'created_at']
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404, 'USUARIO_NAO_ENCONTRADO');
    }

    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos os usuários (ADMIN/GERENTE)
 *     tags: [Usuarios]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, GERENTE, ATENDENTE, COZINHA, CLIENTE]
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Sem permissão
 */
router.get('/', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (role) where.role = role;

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      attributes: ['id', 'nome', 'email', 'role', 'ativo', 'created_at'],
      order: [['nome', 'ASC']],
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
