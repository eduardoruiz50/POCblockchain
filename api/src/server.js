const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

// Importar rutas
const healthRoutes = require('./routes/healthRoutes');
const indexRoutes = require('./routes/indexRoutes');
const dppRoutes = require('./routes/dppRoutes');
const mockRoutes = require('./routes/mockRoutes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api', healthRoutes);
app.use('/', indexRoutes);
app.use('/', dppRoutes);
app.use('/', mockRoutes);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(` Servidor API escuchando en el puerto ${config.port}`);
  console.log(` Modo: ${config.nodeEnv}`);
  console.log(`🚀 GS1 Digital Link Resolver ejecutándose en http://localhost:${config.port}`);
  console.log(`📌 Prueba el QR accediendo a: http://localhost:${config.port}/01/08412345678905/10/L-2026-CAST01`);
});

module.exports = app;
