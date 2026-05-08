/**
 * Enum dos status possíveis de um pedido.
 * Fluxo: AGUARDANDO_PAGAMENTO → PAGO → EM_PREPARO → PRONTO → ENTREGUE
 *                                                              → CANCELADO (a qualquer momento antes de ENTREGUE)
 */
const StatusPedido = Object.freeze({
  AGUARDANDO_PAGAMENTO: 'AGUARDANDO_PAGAMENTO',
  PAGO: 'PAGO',
  EM_PREPARO: 'EM_PREPARO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
});

const STATUS_VALIDOS = Object.values(StatusPedido);

/**
 * Transições válidas de status do pedido.
 */
const TRANSICOES_VALIDAS = {
  AGUARDANDO_PAGAMENTO: ['PAGO', 'CANCELADO'],
  PAGO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: []
};

function validarTransicao(statusAtual, novoStatus) {
  const permitidos = TRANSICOES_VALIDAS[statusAtual];
  return permitidos && permitidos.includes(novoStatus);
}

module.exports = { StatusPedido, STATUS_VALIDOS, TRANSICOES_VALIDAS, validarTransicao };
