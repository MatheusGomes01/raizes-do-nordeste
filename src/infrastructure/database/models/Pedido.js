const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  unidade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'unidades', key: 'id' }
  },
  canal_pedido: {
    type: DataTypes.ENUM('APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'
    ),
    allowNull: false,
    defaultValue: 'AGUARDANDO_PAGAMENTO'
  },
  forma_pagamento: {
    type: DataTypes.ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO'),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'pedidos',
  timestamps: true
});

module.exports = Pedido;
