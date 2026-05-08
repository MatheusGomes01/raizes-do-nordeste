/**
 * Enum dos canais de pedido disponíveis na rede Raízes do Nordeste.
 * Requisito de multicanalidade: APP, TOTEM, BALCAO, PICKUP, WEB.
 */
const CanalPedido = Object.freeze({
  APP: 'APP',
  TOTEM: 'TOTEM',
  BALCAO: 'BALCAO',
  PICKUP: 'PICKUP',
  WEB: 'WEB'
});

const CANAIS_VALIDOS = Object.values(CanalPedido);

module.exports = { CanalPedido, CANAIS_VALIDOS };
