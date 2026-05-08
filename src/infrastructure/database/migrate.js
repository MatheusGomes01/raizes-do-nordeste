/**
 * Script de migração — cria todas as tabelas no banco de dados.
 * Executado automaticamente pelo docker-compose na inicialização.
 */
require('dotenv').config();

const { sequelize } = require('./models');

async function migrate() {
  try {
    console.log('[MIGRATE] Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('[MIGRATE] Conexão estabelecida com sucesso.');

    console.log('[MIGRATE] Sincronizando modelos (criando tabelas)...');
    await sequelize.sync({ force: false, alter: true });
    console.log('[MIGRATE] Tabelas criadas/atualizadas com sucesso.');

    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE] Erro na migração:', error.message);
    process.exit(1);
  }
}

migrate();
