const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const { Unidade } = require('../../infrastructure/database/models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @swagger
 * /unidades:
 *   get:
 *     summary: Listar todas as unidades da rede
 *     tags: [Unidades]
 *     responses:
 *       200:
 *         description: Lista de unidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   endereco:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 */
router.get('/', async (req, res, next) => {
  try {
    const unidades = await Unidade.findAll({
      where: { ativa: true },
      order: [['nome', 'ASC']]
    });
    res.json(unidades);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /unidades/{id}:
 *   get:
 *     summary: Buscar unidade por ID
 *     tags: [Unidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados da unidade
 *       404:
 *         description: Unidade não encontrada
 */
router.get('/:id', async (req, res, next) => {
  try {
    const unidade = await Unidade.findByPk(req.params.id);
    if (!unidade) {
      throw new AppError('Unidade não encontrada.', 404, 'UNIDADE_NAO_ENCONTRADA');
    }
    res.json(unidade);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /unidades:
 *   post:
 *     summary: Criar nova unidade (ADMIN/GERENTE)
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, endereco, cidade, estado]
 *             properties:
 *               nome:
 *                 type: string
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Unidade criada
 *       403:
 *         description: Sem permissão
 */
router.post('/', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const { nome, endereco, cidade, estado, telefone } = req.body;

    if (!nome || !endereco || !cidade || !estado) {
      throw new AppError('Campos obrigatórios não informados.', 422, 'CAMPOS_OBRIGATORIOS', [
        ...(!nome ? [{ field: 'nome', issue: 'Campo obrigatório' }] : []),
        ...(!endereco ? [{ field: 'endereco', issue: 'Campo obrigatório' }] : []),
        ...(!cidade ? [{ field: 'cidade', issue: 'Campo obrigatório' }] : []),
        ...(!estado ? [{ field: 'estado', issue: 'Campo obrigatório' }] : [])
      ]);
    }

    const unidade = await Unidade.create({ nome, endereco, cidade, estado, telefone });
    res.status(201).json(unidade);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
