# 🌿 Raízes do Nordeste - API Back-End

API RESTful para a rede de lanchonetes **Raízes do Nordeste**, desenvolvida com Node.js, Express, Sequelize e PostgreSQL.

## 📋 Índice

- [Requisitos](#requisitos)
- [Como Executar](#como-executar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Arquitetura](#arquitetura)
- [Endpoints Principais](#endpoints-principais)
- [Usuários de Teste](#usuários-de-teste)
- [Testes (Postman)](#testes-postman)
- [Fluxo Crítico](#fluxo-crítico)
- [LGPD e Segurança](#lgpd-e-segurança)

---

## Requisitos

- **Docker** >= 20.x
- **Docker Compose** >= 2.x

> ⚠️ Não é necessário instalar Node.js, PostgreSQL ou qualquer dependência manualmente. Tudo roda via Docker.

---

## Como Executar

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd raizes-backend-professional
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

### 3. Subir os containers (banco + API)
```bash
docker compose up --build
```

O comando acima irá:
- Criar o container PostgreSQL com o banco `raizes_nordeste`
- Executar as **migrations** (criação de tabelas)
- Executar o **seed** (dados iniciais: unidades, produtos, estoque, usuários)
- Iniciar a API na porta **3000**

### 4. Acessar a API
- **API:** http://localhost:3000
- **Swagger/OpenAPI:** http://localhost:3000/docs
- **Health Check:** http://localhost:3000/health

### 5. Parar os containers
```bash
docker compose down
```

Para limpar os dados do banco (reset completo):
```bash
docker compose down -v
docker compose up --build
```

---

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| PORT | Porta da API | 3000 |
| NODE_ENV | Ambiente | development |
| JWT_SECRET | Chave secreta do JWT | raizes_nordeste_secret_key_2026 |
| JWT_EXPIRES_IN | Expiração do token | 1d |
| DB_HOST | Host do PostgreSQL | postgres |
| DB_PORT | Porta do PostgreSQL | 5432 |
| DB_NAME | Nome do banco | raizes_nordeste |
| DB_USER | Usuário do banco | postgres |
| DB_PASSWORD | Senha do banco | postgres123 |
| PONTOS_POR_REAL | Pontos de fidelidade por R$ | 1 |
| VALOR_POR_PONTO | Valor em R$ de cada ponto | 0.10 |

---

## Documentação da API (Swagger)

Após iniciar a API, acesse:

📖 **http://localhost:3000/docs**

A documentação Swagger contém todos os endpoints, schemas, exemplos de request/response e códigos de status.

JSON do Swagger: http://localhost:3000/docs.json

---

## Arquitetura

O projeto segue uma **arquitetura em camadas** com separação clara de responsabilidades:

```
src/
├── domain/                    # Camada de Domínio
│   └── enums/                 # Enums e regras de negócio
│       ├── CanalPedido.js     # APP, TOTEM, BALCAO, PICKUP, WEB
│       ├── StatusPedido.js    # Transições de status válidas
│       ├── Roles.js           # Perfis de usuário
│       ├── FormaPagamento.js  # Formas de pagamento
│       └── StatusPagamento.js # Status do gateway
│
├── application/               # Camada de Aplicação (Casos de Uso)
│   └── services/
│       ├── authService.js     # Login e registro
│       ├── pedidoService.js   # Criação, consulta, status
│       ├── pagamentoService.js# Fluxo de pagamento mock
│       ├── estoqueService.js  # Movimentação de estoque
│       ├── produtoService.js  # CRUD de produtos
│       └── fidelidadeService.js # Pontos e resgate
│
├── infrastructure/            # Camada de Infraestrutura
│   ├── database/
│   │   ├── connection.js      # Conexão Sequelize/PostgreSQL
│   │   ├── migrate.js         # Script de migração
│   │   ├── seed.js            # Dados iniciais
│   │   └── models/            # Modelos ORM (entidades)
│   ├── external/
│   │   └── pagamentoGatewayMock.js  # Gateway de pagamento simulado
│   ├── server.js              # Inicialização Express
│   └── swagger.js             # Configuração OpenAPI
│
├── api/                       # Camada de Interface (Controllers)
│   ├── routes/
│   │   ├── authRoutes.js      # /auth
│   │   ├── usuarioRoutes.js   # /usuarios
│   │   ├── unidadeRoutes.js   # /unidades
│   │   ├── produtoRoutes.js   # /produtos
│   │   ├── estoqueRoutes.js   # /estoque
│   │   ├── pedidoRoutes.js    # /pedidos
│   │   ├── pagamentoRoutes.js # /pagamentos
│   │   └── fidelidadeRoutes.js# /fidelidade
│   └── middlewares/
│       ├── authMiddleware.js  # JWT + autorização por roles
│       ├── auditMiddleware.js # Logs de auditoria
│       └── errorHandler.js    # Tratamento padronizado de erros
```

---

## Endpoints Principais

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | /auth/login | Login (obter token) | Público |
| POST | /auth/registrar | Registro de cliente | Público |
| GET | /usuarios/perfil | Perfil do usuário | JWT |
| GET | /usuarios | Listar usuários | ADMIN/GERENTE |
| GET | /unidades | Listar unidades | Público |
| GET | /produtos | Listar produtos | Público |
| GET | /produtos/cardapio/:unidadeId | Cardápio por unidade | Público |
| POST | /produtos | Criar produto | ADMIN/GERENTE |
| GET | /estoque/:unidadeId | Consultar estoque | ADMIN/GERENTE/ATENDENTE |
| POST | /estoque/movimentar | Entrada/saída estoque | ADMIN/GERENTE |
| POST | /pedidos | Criar pedido | JWT (qualquer) |
| GET | /pedidos | Listar pedidos | JWT |
| GET | /pedidos/:id | Detalhe do pedido | JWT |
| PATCH | /pedidos/:id/status | Atualizar status | ADMIN/GERENTE/ATENDENTE/COZINHA |
| POST | /pedidos/:id/cancelar | Cancelar pedido | JWT |
| POST | /pagamentos/:pedidoId/processar | Processar pagamento mock | JWT |
| GET | /pagamentos/:pedidoId | Consultar pagamento | JWT |
| GET | /fidelidade/saldo | Saldo de pontos | JWT |
| GET | /fidelidade/historico | Histórico de pontos | JWT |
| POST | /fidelidade/resgatar | Resgatar pontos | JWT |
| POST | /fidelidade/consentimento | Consentimento LGPD | JWT |

---

## Usuários de Teste

Após o seed, os seguintes usuários estão disponíveis:

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@raizes.com | Senha@123 | ADMIN |
| gerente@raizes.com | Senha@123 | GERENTE |
| atendente@raizes.com | Senha@123 | ATENDENTE |
| cozinha@raizes.com | Senha@123 | COZINHA |
| cliente@raizes.com | Senha@123 | CLIENTE |
| ana@raizes.com | Senha@123 | CLIENTE |

---

## Testes (Postman)

A coleção Postman está em: `postman/Raizes_do_Nordeste_API.postman_collection.json`

### Como executar:
1. Importe o arquivo no Postman
2. Execute na ordem das pastas (Auth primeiro para obter tokens)
3. Os testes usam variáveis de coleção para propagar tokens e IDs

### Cenários cobertos (16 testes):
| ID | Cenário | Tipo |
|----|---------|------|
| T01 | Login válido (CLIENTE) | ✅ Positivo |
| T02 | Login válido (ADMIN) | ✅ Positivo |
| T03 | Login com credenciais inválidas | ❌ Negativo (401) |
| T04 | Registro com e-mail duplicado | ❌ Negativo (409) |
| T05 | Criar pedido válido | ✅ Positivo |
| T06 | Listar pedidos sem token | ❌ Negativo (401) |
| T07 | Criar pedido sem canalPedido | ❌ Negativo (422) |
| T08 | Criar pedido com estoque insuficiente | ❌ Negativo (409) |
| T09 | Listar pedidos filtrado por canal | ✅ Positivo |
| T10 | Atualizar status do pedido | ✅ Positivo |
| T11 | Processar pagamento mock | ✅ Positivo |
| T12 | Consultar estoque da unidade | ✅ Positivo |
| T13 | Movimentar estoque (ENTRADA) | ✅ Positivo |
| T14 | Consultar saldo de fidelidade | ✅ Positivo |
| T15 | Acesso sem permissão (403) | ❌ Negativo (403) |
| T16 | Pedido com produto inexistente | ❌ Negativo (404) |

---

## Fluxo Crítico

### Pedido → Pagamento Mock → Atualização de Status

```
1. POST /auth/login          → Obtém token JWT
2. POST /pedidos             → Cria pedido (valida estoque, decrementa)
3. POST /pagamentos/:id/processar → Envia ao gateway mock
   ├── APROVADO → Status do pedido muda para PAGO
   └── RECUSADO → Status permanece AGUARDANDO_PAGAMENTO
4. PATCH /pedidos/:id/status → EM_PREPARO → PRONTO → ENTREGUE
5. (Ao entregar) → Acumula pontos de fidelidade automaticamente
```

### Gateway Mock - Regras:
- Valores > R$ 500,00 → sempre RECUSADO (simula limite)
- Forma DINHEIRO → sempre APROVADO
- Demais → 90% de chance de aprovação

---

## LGPD e Segurança

### Implementado:
- ✅ **Autenticação JWT** com expiração configurável
- ✅ **Autorização por roles** (ADMIN, GERENTE, ATENDENTE, COZINHA, CLIENTE)
- ✅ **Hash de senha** com bcrypt (salt rounds: 10)
- ✅ **Rate limiting** no endpoint de login
- ✅ **Helmet** (headers de segurança)
- ✅ **Consentimento LGPD** obrigatório no cadastro
- ✅ **Consentimento de fidelidade** separado e revogável
- ✅ **Logs de auditoria** para ações sensíveis (login, pedidos, pagamentos, status)
- ✅ **Dados sensíveis não expostos** (senha_hash nunca retornada)
- ✅ **Minimização de dados** (endpoints retornam apenas campos necessários)
- ✅ **Padrão de erro consistente** (sem exposição de stack traces em produção)

### Dados pessoais coletados:
| Dado | Finalidade | Base Legal |
|------|-----------|------------|
| Nome | Identificação | Execução de contrato |
| E-mail | Autenticação | Execução de contrato |
| CPF | Identificação fiscal | Obrigação legal |
| Telefone | Contato (opcional) | Consentimento |

---

## Tecnologias

- **Runtime:** Node.js 20
- **Framework:** Express 4.19
- **ORM:** Sequelize 6.37
- **Banco:** PostgreSQL 16
- **Auth:** JWT (jsonwebtoken)
- **Hash:** bcryptjs
- **Docs:** Swagger/OpenAPI 3.0 (swagger-jsdoc + swagger-ui-express)
- **Segurança:** Helmet, CORS, Rate Limiting
- **Container:** Docker + Docker Compose
