const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  senha_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING(11),
    allowNull: true,
    unique: true
  },
  telefone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'GERENTE', 'ATENDENTE', 'COZINHA', 'CLIENTE'),
    allowNull: false,
    defaultValue: 'CLIENTE'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  consentimento_lgpd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consentimento_fidelidade: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = Usuario;
