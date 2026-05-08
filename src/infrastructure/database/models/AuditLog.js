const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  acao: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entidade: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entidade_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dados_anteriores: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  dados_novos: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false
});

module.exports = AuditLog;
