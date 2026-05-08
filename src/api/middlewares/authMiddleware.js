const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Verifica se o token é válido e injeta os dados do usuário no request.
 */
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'TOKEN_NAO_FORNECIDO',
      message: 'Token de autenticação não fornecido. Envie o header Authorization: Bearer <token>.',
      details: [],
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'TOKEN_INVALIDO',
      message: 'Token inválido ou expirado. Faça login novamente.',
      details: [],
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
}

/**
 * Middleware de autorização por roles.
 * Verifica se o usuário autenticado possui um dos perfis permitidos.
 * @param  {...string} rolesPermitidos - Roles que podem acessar o endpoint.
 */
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'NAO_AUTENTICADO',
        message: 'Usuário não autenticado.',
        details: [],
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }

    if (!rolesPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({
        error: 'ACESSO_NEGADO',
        message: `Acesso negado. Perfis permitidos: ${rolesPermitidos.join(', ')}.`,
        details: [{ field: 'role', issue: `Seu perfil (${req.usuario.role}) não tem permissão.` }],
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }

    next();
  };
}

module.exports = { autenticar, autorizar };
