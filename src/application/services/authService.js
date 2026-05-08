const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../infrastructure/database/models');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de autenticação — login, registro e refresh.
 */
class AuthService {
  /**
   * Realiza login e retorna token JWT.
   */
  async login(email, senha) {
    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios.', 400, 'CAMPOS_OBRIGATORIOS', [
        ...(!email ? [{ field: 'email', issue: 'Campo obrigatório' }] : []),
        ...(!senha ? [{ field: 'senha', issue: 'Campo obrigatório' }] : [])
      ]);
    }

    const usuario = await Usuario.findOne({ where: { email, ativo: true } });

    if (!usuario) {
      throw new AppError('E-mail ou senha inválidos.', 401, 'CREDENCIAIS_INVALIDAS');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      throw new AppError('E-mail ou senha inválidos.', 401, 'CREDENCIAIS_INVALIDAS');
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    };
  }

  /**
   * Registra um novo usuário (cliente).
   */
  async registrar({ nome, email, senha, cpf, telefone, consentimento_lgpd }) {
    if (!nome || !email || !senha) {
      throw new AppError('Nome, e-mail e senha são obrigatórios.', 400, 'CAMPOS_OBRIGATORIOS', [
        ...(!nome ? [{ field: 'nome', issue: 'Campo obrigatório' }] : []),
        ...(!email ? [{ field: 'email', issue: 'Campo obrigatório' }] : []),
        ...(!senha ? [{ field: 'senha', issue: 'Campo obrigatório' }] : [])
      ]);
    }

    if (!consentimento_lgpd) {
      throw new AppError('O consentimento LGPD é obrigatório para cadastro.', 422, 'CONSENTIMENTO_OBRIGATORIO', [
        { field: 'consentimento_lgpd', issue: 'Deve ser true para prosseguir com o cadastro.' }
      ]);
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Formato de e-mail inválido.', 422, 'EMAIL_INVALIDO', [
        { field: 'email', issue: 'Formato inválido' }
      ]);
    }

    // Validação de senha (mínimo 6 caracteres)
    if (senha.length < 6) {
      throw new AppError('A senha deve ter no mínimo 6 caracteres.', 422, 'SENHA_FRACA', [
        { field: 'senha', issue: 'Mínimo 6 caracteres' }
      ]);
    }

    // Verifica duplicidade de e-mail
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      throw new AppError('E-mail já cadastrado.', 409, 'EMAIL_DUPLICADO', [
        { field: 'email', issue: 'Este e-mail já está em uso.' }
      ]);
    }

    // Verifica duplicidade de CPF
    if (cpf) {
      const cpfExistente = await Usuario.findOne({ where: { cpf } });
      if (cpfExistente) {
        throw new AppError('CPF já cadastrado.', 409, 'CPF_DUPLICADO', [
          { field: 'cpf', issue: 'Este CPF já está em uso.' }
        ]);
      }
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha_hash: senhaHash,
      cpf: cpf || null,
      telefone: telefone || null,
      role: 'CLIENTE',
      consentimento_lgpd,
      consentimento_fidelidade: false
    });

    return {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      role: novoUsuario.role
    };
  }
}

module.exports = new AuthService();
