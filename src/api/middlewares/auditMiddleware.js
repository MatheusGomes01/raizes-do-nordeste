const AuditLog = require('../../infrastructure/database/models/AuditLog');

/**
 * Serviço de auditoria — registra ações sensíveis no banco de dados.
 * Usado para rastreabilidade e conformidade com LGPD.
 */
async function registrarAuditoria({ usuarioId, acao, entidade, entidadeId, dadosAnteriores, dadosNovos, ip, userAgent }) {
  try {
    await AuditLog.create({
      usuario_id: usuarioId,
      acao,
      entidade,
      entidade_id: entidadeId,
      dados_anteriores: dadosAnteriores || null,
      dados_novos: dadosNovos || null,
      ip: ip || null,
      user_agent: userAgent || null
    });
  } catch (error) {
    // Log de auditoria não deve quebrar o fluxo principal
    console.error('[AUDIT] Erro ao registrar auditoria:', error.message);
  }
}

/**
 * Middleware que injeta a função de auditoria no request.
 */
function auditMiddleware(req, res, next) {
  req.audit = async (acao, entidade, entidadeId, dadosAnteriores, dadosNovos) => {
    await registrarAuditoria({
      usuarioId: req.usuario ? req.usuario.id : null,
      acao,
      entidade,
      entidadeId,
      dadosAnteriores,
      dadosNovos,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  };
  next();
}

module.exports = { auditMiddleware, registrarAuditoria };
