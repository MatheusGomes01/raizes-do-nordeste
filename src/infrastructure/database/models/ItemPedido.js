const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const ItemPedido = sequelize.define('ItemPedido', {
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
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'produtos', key: 'id' }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'itens_pedido',
  timestamps: true
});

module.exports = ItemPedido;
