/**
 * Formas de pagamento aceitas.
 */
const FormaPagamento = Object.freeze({
  PIX: 'PIX',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  DINHEIRO: 'DINHEIRO'
});

const FORMAS_VALIDAS = Object.values(FormaPagamento);

module.exports = { FormaPagamento, FORMAS_VALIDAS };
