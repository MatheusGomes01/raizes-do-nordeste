const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Promocao = sequelize.define('Promocao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_desconto: {
    type: DataTypes.ENUM('PERCENTUAL', 'VALOR_FIXO'),
    allowNull: false
  },
  valor_desconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'produtos', key: 'id' }
  },
  unidade_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'unidades', key: 'id' }
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ativa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'promocoes',
  timestamps: true
});

module.exports = Promocao;
