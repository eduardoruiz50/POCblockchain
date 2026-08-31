const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API POCblockchain',
    endpoints: {
      health: '/api/health'
    }
  });
});

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(` Servidor API escuchando en el puerto ${config.port}`);
  console.log(` Modo: ${config.nodeEnv}`);
});

module.exports = app;
