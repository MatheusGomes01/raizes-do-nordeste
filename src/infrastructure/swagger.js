const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Raízes do Nordeste - API',
      version: '1.0.0',
      description: `
API Back-end da rede de lanchonetes **Raízes do Nordeste**.

## Funcionalidades
- Autenticação JWT com perfis/roles (ADMIN, GERENTE, ATENDENTE, COZINHA, CLIENTE)
- Gestão de unidades da rede
- Cardápio por unidade com controle de estoque
- Pedidos multicanal (APP, TOTEM, BALCAO, PICKUP, WEB)
- Fluxo de pagamento via gateway mock
- Programa de fidelidade com consentimento LGPD
- Logs de auditoria para ações sensíveis

## Autenticação
Utilize o endpoint POST /auth/login para obter o token JWT.
Envie o token no header: \`Authorization: Bearer <token>\`

## Usuários de teste (seed)
| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@raizes.com | Senha@123 | ADMIN |
| gerente@raizes.com | Senha@123 | GERENTE |
| atendente@raizes.com | Senha@123 | ATENDENTE |
| cozinha@raizes.com | Senha@123 | COZINHA |
| cliente@raizes.com | Senha@123 | CLIENTE |
      `,
      contact: {
        name: 'Raízes do Nordeste',
        email: 'contato@raizes.com'
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Servidor local (Docker)' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Erro: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'NOME_DO_ERRO' },
            message: { type: 'string', example: 'Mensagem legível para o desenvolvedor.' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  issue: { type: 'string' }
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Autenticação e registro' },
      { name: 'Usuarios', description: 'Gestão de usuários' },
      { name: 'Unidades', description: 'Unidades da rede' },
      { name: 'Produtos', description: 'Cardápio e produtos' },
      { name: 'Estoque', description: 'Controle de estoque por unidade' },
      { name: 'Pedidos', description: 'Gestão de pedidos multicanal' },
      { name: 'Pagamentos', description: 'Pagamento via gateway mock' },
      { name: 'Fidelidade', description: 'Programa de fidelidade' }
    ]
  },
  apis: ['./src/api/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
