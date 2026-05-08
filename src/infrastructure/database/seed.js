/**
 * Script de seed — popula o banco com dados iniciais para testes.
 * Cria: unidades, produtos, estoque, usuários de diferentes perfis.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Unidade, Produto, Estoque, Fidelidade } = require('./models');

async function seed() {
  try {
    console.log('[SEED] Conectando ao banco de dados...');
    await sequelize.authenticate();

    // Verifica se já existe seed
    const existeAdmin = await Usuario.findOne({ where: { email: 'admin@raizes.com' } });
    if (existeAdmin) {
      console.log('[SEED] Dados já existem. Pulando seed.');
      process.exit(0);
    }

    console.log('[SEED] Inserindo dados iniciais...');

    // === UNIDADES ===
    const unidades = await Unidade.bulkCreate([
      { nome: 'Raízes Centro - Recife', endereco: 'Rua do Sol, 100', cidade: 'Recife', estado: 'PE', telefone: '81999001100' },
      { nome: 'Raízes Shopping - Salvador', endereco: 'Av. Tancredo Neves, 2000', cidade: 'Salvador', estado: 'BA', telefone: '71988002200' },
      { nome: 'Raízes Praia - Fortaleza', endereco: 'Av. Beira Mar, 500', cidade: 'Fortaleza', estado: 'CE', telefone: '85977003300' }
    ]);

    // === PRODUTOS ===
    const produtos = await Produto.bulkCreate([
      { nome: 'Acarajé Tradicional', descricao: 'Acarajé com vatapá, camarão e salada', preco: 18.90, categoria: 'Salgados' },
      { nome: 'Tapioca de Carne Seca', descricao: 'Tapioca recheada com carne seca e queijo coalho', preco: 22.50, categoria: 'Tapiocas' },
      { nome: 'Baião de Dois Completo', descricao: 'Arroz com feijão verde, queijo coalho, carne seca e nata', preco: 35.90, categoria: 'Pratos' },
      { nome: 'Caldo de Sururu', descricao: 'Caldo de sururu com temperos nordestinos', preco: 15.00, categoria: 'Caldos' },
      { nome: 'Suco de Cajá', descricao: 'Suco natural de cajá 500ml', preco: 9.90, categoria: 'Bebidas' },
      { nome: 'Cartola', descricao: 'Banana frita com queijo coalho, canela e açúcar', preco: 14.50, categoria: 'Sobremesas' },
      { nome: 'Coxinha de Charque', descricao: 'Coxinha recheada com charque desfiado', preco: 12.00, categoria: 'Salgados' },
      { nome: 'Refrigerante Guaraná Jesus', descricao: 'Guaraná Jesus 350ml', preco: 7.50, categoria: 'Bebidas' }
    ]);

    // === ESTOQUE (por unidade) ===
    const estoqueData = [];
    for (const unidade of unidades) {
      for (const produto of produtos) {
        estoqueData.push({
          unidade_id: unidade.id,
          produto_id: produto.id,
          quantidade: Math.floor(Math.random() * 50) + 10
        });
      }
    }
    await Estoque.bulkCreate(estoqueData);

    // === USUÁRIOS ===
    const senhaHash = await bcrypt.hash('Senha@123', 10);

    const usuarios = await Usuario.bulkCreate([
      { nome: 'Administrador Geral', email: 'admin@raizes.com', senha_hash: senhaHash, role: 'ADMIN', cpf: '11111111111', consentimento_lgpd: true },
      { nome: 'Gerente Recife', email: 'gerente@raizes.com', senha_hash: senhaHash, role: 'GERENTE', cpf: '22222222222', consentimento_lgpd: true },
      { nome: 'Atendente Maria', email: 'atendente@raizes.com', senha_hash: senhaHash, role: 'ATENDENTE', cpf: '33333333333', consentimento_lgpd: true },
      { nome: 'Cozinheiro João', email: 'cozinha@raizes.com', senha_hash: senhaHash, role: 'COZINHA', cpf: '44444444444', consentimento_lgpd: true },
      { nome: 'Cliente Pedro', email: 'cliente@raizes.com', senha_hash: senhaHash, role: 'CLIENTE', cpf: '55555555555', consentimento_lgpd: true, consentimento_fidelidade: true },
      { nome: 'Cliente Ana', email: 'ana@raizes.com', senha_hash: senhaHash, role: 'CLIENTE', cpf: '66666666666', consentimento_lgpd: true, consentimento_fidelidade: true }
    ]);

    // === FIDELIDADE (para clientes com consentimento) ===
    const clientes = usuarios.filter(u => u.role === 'CLIENTE');
    for (const cliente of clientes) {
      await Fidelidade.create({
        cliente_id: cliente.id,
        pontos_acumulados: 150,
        pontos_utilizados: 0,
        saldo_pontos: 150
      });
    }

    console.log('[SEED] Dados iniciais inseridos com sucesso!');
    console.log('[SEED] Usuários criados (senha: Senha@123):');
    console.log('  - admin@raizes.com (ADMIN)');
    console.log('  - gerente@raizes.com (GERENTE)');
    console.log('  - atendente@raizes.com (ATENDENTE)');
    console.log('  - cozinha@raizes.com (COZINHA)');
    console.log('  - cliente@raizes.com (CLIENTE)');
    console.log('  - ana@raizes.com (CLIENTE)');

    process.exit(0);
  } catch (error) {
    console.error('[SEED] Erro no seed:', error.message);
    process.exit(1);
  }
}

seed();
