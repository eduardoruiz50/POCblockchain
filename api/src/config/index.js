const path = require('path');

// Carga las variables de entorno desde api/.env de forma determinista
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  domain: process.env.DOMAIN || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    contractAddress1155: process.env.CONTRACT_ADDRESS_1155 || '',
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '',
    apicultorPrivateKey: process.env.APICULTOR_PRIVATE_KEY || '',
    consejoPrivateKey: process.env.CONSEJO_PRIVATE_KEY || ''
  }
};
