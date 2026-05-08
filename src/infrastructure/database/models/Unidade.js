const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Unidade = sequelize.define('Unidade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  endereco: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  ativa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'unidades',
  timestamps: true
});

module.exports = Unidade;
