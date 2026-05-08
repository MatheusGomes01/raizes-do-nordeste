const express = require('express');
const router = express.Router();
const authService = require('../../application/services/authService');
const { auditMiddleware } = require('../middlewares/auditMiddleware');

router.use(auditMiddleware);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário e obter token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 example: cliente@raizes.com
 *               senha:
 *                 type: string
 *                 example: Senha@123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 tokenType:
 *                   type: string
 *                   example: Bearer
 *                 expiresIn:
 *                   type: integer
 *                   example: 86400
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const resultado = await authService.login(email, senha);

    await req.audit('LOGIN', 'Usuario', resultado.user.id, null, { email: resultado.user.email });

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/registrar:
 *   post:
 *     summary: Registrar novo usuário (cliente)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha, consentimento_lgpd]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               senha:
 *                 type: string
 *                 example: Senha@123
 *               cpf:
 *                 type: string
 *                 example: "12345678901"
 *               telefone:
 *                 type: string
 *                 example: "81999998888"
 *               consentimento_lgpd:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       409:
 *         description: E-mail ou CPF já cadastrado
 *       422:
 *         description: Dados inválidos
 */
router.post('/registrar', async (req, res, next) => {
  try {
    const resultado = await authService.registrar(req.body);

    await req.audit('REGISTRO', 'Usuario', resultado.id, null, { email: resultado.email, role: resultado.role });

    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
