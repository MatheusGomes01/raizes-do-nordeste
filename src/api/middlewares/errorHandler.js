/**
 * Middleware global de tratamento de erros.
 * Garante que todas as respostas de erro seguem o padrão JSON definido.
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack ? err.stack.split('\n')[1] : '');

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: err.errorCode || 'ERRO_INTERNO',
    message: err.message || 'Ocorreu um erro interno no servidor.',
    details: err.details || [],
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // Em produção, não expor detalhes internos
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.message = 'Ocorreu um erro interno no servidor.';
    errorResponse.details = [];
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Classe de erro customizada para erros de negócio.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

module.exports = { errorHandler, AppError };
