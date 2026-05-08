const sequelize = require('../connection');
const Usuario = require('./Usuario');
const Unidade = require('./Unidade');
const Produto = require('./Produto');
const Estoque = require('./Estoque');
const Pedido = require('./Pedido');
const ItemPedido = require('./ItemPedido');
const Pagamento = require('./Pagamento');
const Fidelidade = require('./Fidelidade');
const HistoricoFidelidade = require('./HistoricoFidelidade');
const AuditLog = require('./AuditLog');
const Promocao = require('./Promocao');

// === ASSOCIAÇÕES ===

// Usuario -> Pedidos
Usuario.hasMany(Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });
Pedido.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });

// Unidade -> Pedidos
Unidade.hasMany(Pedido, { foreignKey: 'unidade_id', as: 'pedidos' });
Pedido.belongsTo(Unidade, { foreignKey: 'unidade_id', as: 'unidade' });

// Pedido -> Itens
Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id', as: 'itens' });
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Produto -> Itens
Produto.hasMany(ItemPedido, { foreignKey: 'produto_id', as: 'itens_pedido' });
ItemPedido.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

// Pedido -> Pagamento
Pedido.hasOne(Pagamento, { foreignKey: 'pedido_id', as: 'pagamento' });
Pagamento.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Unidade -> Estoque
Unidade.hasMany(Estoque, { foreignKey: 'unidade_id', as: 'estoque' });
Estoque.belongsTo(Unidade, { foreignKey: 'unidade_id', as: 'unidade' });

// Produto -> Estoque
Produto.hasMany(Estoque, { foreignKey: 'produto_id', as: 'estoque' });
Estoque.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

// Usuario -> Fidelidade
Usuario.hasOne(Fidelidade, { foreignKey: 'cliente_id', as: 'fidelidade' });
Fidelidade.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });

// Usuario -> Historico Fidelidade
Usuario.hasMany(HistoricoFidelidade, { foreignKey: 'cliente_id', as: 'historico_fidelidade' });
HistoricoFidelidade.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });

// Pedido -> Historico Fidelidade
Pedido.hasMany(HistoricoFidelidade, { foreignKey: 'pedido_id', as: 'historico_fidelidade' });
HistoricoFidelidade.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Produto -> Promocao
Produto.hasMany(Promocao, { foreignKey: 'produto_id', as: 'promocoes' });
Promocao.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

// Unidade -> Promocao
Unidade.hasMany(Promocao, { foreignKey: 'unidade_id', as: 'promocoes' });
Promocao.belongsTo(Unidade, { foreignKey: 'unidade_id', as: 'unidade' });

module.exports = {
  sequelize,
  Usuario,
  Unidade,
  Produto,
  Estoque,
  Pedido,
  ItemPedido,
  Pagamento,
  Fidelidade,
  HistoricoFidelidade,
  AuditLog,
  Promocao
};
