const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { Promocao, Produto, Unidade } = require('../../infrastructure/database/models');
const { AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @swagger
 * /promocoes:
 *   get:
 *     summary: Listar promoções ativas
 *     tags: [Promocoes]
 *     parameters:
 *       - in: query
 *         name: unidadeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de promoções ativas
 */
router.get('/', async (req, res, next) => {
  try {
    const where = { ativa: true, data_fim: { [Op.gte]: new Date() } };
    if (req.query.unidadeId) where.unidade_id = req.query.unidadeId;

    const promocoes = await Promocao.findAll({
      where,
      include: [
        { model: Produto, as: 'produto', attributes: ['id', 'nome', 'preco'] },
        { model: Unidade, as: 'unidade', attributes: ['id', 'nome'] }
      ],
      order: [['data_fim', 'ASC']]
    });

    res.json(promocoes);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /promocoes:
 *   post:
 *     summary: Criar promoção (ADMIN/GERENTE)
 *     tags: [Promocoes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, tipo_desconto, valor_desconto, data_inicio, data_fim]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Promoção Junina"
 *               descricao:
 *                 type: string
 *               tipo_desconto:
 *                 type: string
 *                 enum: [PERCENTUAL, VALOR_FIXO]
 *               valor_desconto:
 *                 type: number
 *                 example: 15
 *               produto_id:
 *                 type: integer
 *               unidade_id:
 *                 type: integer
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Promoção criada
 *       422:
 *         description: Dados inválidos
 */
router.post('/', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const { nome, descricao, tipo_desconto, valor_desconto, produto_id, unidade_id, data_inicio, data_fim } = req.body;

    if (!nome || !tipo_desconto || !valor_desconto || !data_inicio || !data_fim) {
      throw new AppError('Campos obrigatórios não informados.', 422, 'CAMPOS_OBRIGATORIOS', [
        ...(!nome ? [{ field: 'nome', issue: 'Campo obrigatório' }] : []),
        ...(!tipo_desconto ? [{ field: 'tipo_desconto', issue: 'Campo obrigatório' }] : []),
        ...(!valor_desconto ? [{ field: 'valor_desconto', issue: 'Campo obrigatório' }] : []),
        ...(!data_inicio ? [{ field: 'data_inicio', issue: 'Campo obrigatório' }] : []),
        ...(!data_fim ? [{ field: 'data_fim', issue: 'Campo obrigatório' }] : [])
      ]);
    }

    if (!['PERCENTUAL', 'VALOR_FIXO'].includes(tipo_desconto)) {
      throw new AppError('Tipo de desconto inválido.', 422, 'TIPO_DESCONTO_INVALIDO', [
        { field: 'tipo_desconto', issue: 'Valores aceitos: PERCENTUAL, VALOR_FIXO' }
      ]);
    }

    const promocao = await Promocao.create({
      nome, descricao, tipo_desconto, valor_desconto,
      produto_id: produto_id || null,
      unidade_id: unidade_id || null,
      data_inicio, data_fim
    });

    res.status(201).json(promocao);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
