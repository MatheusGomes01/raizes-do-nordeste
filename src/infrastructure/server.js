require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { errorHandler } = require('../api/middlewares/errorHandler');
const { sequelize } = require('./database/models');

const app = express();

// === MIDDLEWARES GLOBAIS ===
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting (proteção contra abuso)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'RATE_LIMIT_EXCEDIDO',
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    details: [],
    timestamp: new Date().toISOString()
  }
});
app.use('/auth/login', limiter);

// === SWAGGER/OPENAPI ===
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Raízes do Nordeste - API Docs'
}));

// Endpoint para obter o JSON do Swagger
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// === ROTAS ===
app.use('/auth', require('../api/routes/authRoutes'));
app.use('/usuarios', require('../api/routes/usuarioRoutes'));
app.use('/unidades', require('../api/routes/unidadeRoutes'));
app.use('/produtos', require('../api/routes/produtoRoutes'));
app.use('/estoque', require('../api/routes/estoqueRoutes'));
app.use('/pedidos', require('../api/routes/pedidoRoutes'));
app.use('/pagamentos', require('../api/routes/pagamentoRoutes'));
app.use('/fidelidade', require('../api/routes/fidelidadeRoutes'));

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Raízes do Nordeste API'
  });
});

// === ROTA 404 ===
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'ROTA_NAO_ENCONTRADA',
    message: `A rota ${req.method} ${req.originalUrl} não existe.`,
    details: [],
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// === ERROR HANDLER GLOBAL ===
app.use(errorHandler);

// === INICIALIZAÇÃO ===
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Conexão com PostgreSQL estabelecida.');

    app.listen(PORT, () => {
      console.log(`[SERVER] API rodando na porta ${PORT}`);
      console.log(`[SWAGGER] Documentação disponível em http://localhost:${PORT}/docs`);
      console.log(`[HEALTH] Health check em http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[SERVER] Erro ao iniciar:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
