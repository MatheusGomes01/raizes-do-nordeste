const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Fidelidade = sequelize.define('Fidelidade', {
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
  pontos_acumulados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  pontos_utilizados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  saldo_pontos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'fidelidade',
  timestamps: true
});

module.exports = Fidelidade;
