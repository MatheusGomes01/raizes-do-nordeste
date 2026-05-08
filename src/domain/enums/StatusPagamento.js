/**
 * Status do pagamento retornado pelo gateway mock.
 */
const StatusPagamento = Object.freeze({
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  RECUSADO: 'RECUSADO'
});

module.exports = { StatusPagamento };
