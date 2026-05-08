const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const HistoricoFidelidade = sequelize.define('HistoricoFidelidade', {
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
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'pedidos', key: 'id' }
  },
  tipo: {
    type: DataTypes.ENUM('ACUMULO', 'RESGATE'),
    allowNull: false
  },
  pontos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'historico_fidelidade',
  timestamps: true
});

module.exports = HistoricoFidelidade;
