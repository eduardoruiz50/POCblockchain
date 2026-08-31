/**
 * Controlador para verificar el estado de la API
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'POCblockchain Express API'
  });
};

module.exports = {
  getHealth
};
