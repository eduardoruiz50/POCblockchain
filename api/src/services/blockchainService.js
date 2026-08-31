const { ethers } = require('ethers');
const config = require('../config');

/**
 * Servicio base para interactuar con la red Blockchain y Smart Contracts
 */
class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.signer = config.blockchain.privateKey
      ? new ethers.Wallet(config.blockchain.privateKey, this.provider)
      : null;
  }

  /**
   * Obtiene el número de bloque actual en la red
   */
  async getCurrentBlock() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Obtiene el balance de una cuenta en Ether
   */
  async getBalance(address) {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }
}

module.exports = new BlockchainService();
