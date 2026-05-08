const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Estoque = sequelize.define('Estoque', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  unidade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'unidades', key: 'id' }
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'produtos', key: 'id' }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'estoque',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['unidade_id', 'produto_id']
    }
  ]
});

module.exports = Estoque;
