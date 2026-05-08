const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Pagamento = sequelize.define('Pagamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'pedidos', key: 'id' }
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  forma_pagamento: {
    type: DataTypes.ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'APROVADO', 'RECUSADO'),
    allowNull: false,
    defaultValue: 'PENDENTE'
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gateway_response: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'pagamentos',
  timestamps: true
});

module.exports = Pagamento;
