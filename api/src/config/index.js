require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    contractAddress1155: process.env.CONTRACT_ADDRESS_1155 || process.env.CONTRACT_ADDRESS || '',
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || process.env.APICULTOR_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
    apicultorPrivateKey: process.env.APICULTOR_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
    consejoPrivateKey: process.env.CONSEJO_PRIVATE_KEY || ''
  }
};
