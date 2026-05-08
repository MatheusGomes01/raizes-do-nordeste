const { v4: uuidv4 } = require('uuid');

/**
 * Mock do Gateway de Pagamento Externo.
 * Simula o envio de pagamento e retorno do status.
 * 
 * Regras do mock:
 * - Valores acima de R$ 500,00 são recusados (simula limite).
 * - Forma de pagamento DINHEIRO é sempre aprovada.
 * - 90% de chance de aprovação para outros métodos.
 */
async function processarPagamento({ pedidoId, valor, formaPagamento }) {
  // Simula latência de rede (100-500ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));

  const transactionId = uuidv4();
  const timestamp = new Date().toISOString();

  // Regra: valores acima de 500 são recusados
  if (valor > 500) {
    return {
      success: false,
      transactionId,
      status: 'RECUSADO',
      message: 'Valor excede o limite permitido pelo gateway.',
      payload: {
        pedidoId,
        valor,
        formaPagamento,
        motivo: 'LIMITE_EXCEDIDO',
        timestamp
      }
    };
  }

  // Dinheiro sempre aprovado
  if (formaPagamento === 'DINHEIRO') {
    return {
      success: true,
      transactionId,
      status: 'APROVADO',
      message: 'Pagamento em dinheiro registrado com sucesso.',
      payload: {
        pedidoId,
        valor,
        formaPagamento,
        timestamp
      }
    };
  }

  // 90% de chance de aprovação
  const aprovado = Math.random() < 0.9;

  if (aprovado) {
    return {
      success: true,
      transactionId,
      status: 'APROVADO',
      message: 'Pagamento aprovado pelo gateway.',
      payload: {
        pedidoId,
        valor,
        formaPagamento,
        bandeira: formaPagamento.includes('CARTAO') ? 'VISA' : null,
        timestamp
      }
    };
  }

  return {
    success: false,
    transactionId,
    status: 'RECUSADO',
    message: 'Pagamento recusado pelo gateway. Tente novamente.',
    payload: {
      pedidoId,
      valor,
      formaPagamento,
      motivo: 'RECUSADO_GATEWAY',
      timestamp
    }
  };
}

module.exports = { processarPagamento };
