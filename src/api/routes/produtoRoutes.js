const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const produtoService = require('../../application/services/produtoService');

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Listar produtos (cardápio geral)
 *     tags: [Produtos]
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
 *         name: categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de produtos com paginação
 */
router.get('/', async (req, res, next) => {
  try {
    const resultado = await produtoService.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /produtos/cardapio/{unidadeId}:
 *   get:
 *     summary: Consultar cardápio por unidade (com disponibilidade)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: unidadeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cardápio da unidade com estoque
 *       404:
 *         description: Unidade não encontrada
 */
router.get('/cardapio/:unidadeId', async (req, res, next) => {
  try {
    const resultado = await produtoService.cardapioPorUnidade(parseInt(req.params.unidadeId));
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Buscar produto por ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do produto
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', async (req, res, next) => {
  try {
    const produto = await produtoService.buscarPorId(parseInt(req.params.id));
    res.json(produto);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Criar novo produto (ADMIN/GERENTE)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, preco, categoria]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Cuscuz com Charque
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *                 example: 25.90
 *               categoria:
 *                 type: string
 *                 example: Pratos
 *               imagem_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produto criado
 *       422:
 *         description: Dados inválidos
 */
router.post('/', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const produto = await produtoService.criar(req.body);
    res.status(201).json(produto);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualizar produto (ADMIN/GERENTE)
 *     tags: [Produtos]
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
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               categoria:
 *                 type: string
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const produto = await produtoService.atualizar(parseInt(req.params.id), req.body);
    res.json(produto);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Desativar produto (ADMIN/GERENTE)
 *     tags: [Produtos]
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
 *         description: Produto desativado
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:id', autenticar, autorizar('ADMIN', 'GERENTE'), async (req, res, next) => {
  try {
    const resultado = await produtoService.desativar(parseInt(req.params.id));
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
