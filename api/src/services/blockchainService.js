const { ethers } = require('ethers');
const config = require('../config');

// ============================================================================
// SIMULACIÓN DEL SMART CONTRACT / BLOCKCHAIN (MOCK PROVIDER)
// ============================================================================
// En producción, los datos reales vendrían de 'ethers' o 'web3' conectándose a RPC
const mockBlockchainDatabase = {
  'L-2026-CAST01': {
    tokenId: 1042,
    smartContractAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    apicultor: "Apicultura El Bierzo Alto S.L.",
    ubicacionColmenar: "Ponferrada / Los Barrios (El Bierzo)",
    varietal: "Miel de Castaño",
    fechaCosecha: "2026-07-15",
    estadoCertificacion: "CERTIFICADO_DOP_BIERZO",
    crdopSignature: "0x8f2d3a9...51a",
    ipfsQualityHash: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    blockTimestamp: 1786800000,
    txHash: "0x3a12908f...991a"
  }
};

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

  /**
   * Simula la latencia de red de una lectura a la Blockchain (RPC read-only)
   * @param {string} loteId 
   */
  async consultarSmartContract(loteId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = mockBlockchainDatabase[loteId];
        if (data) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, message: "Lote no registrado en la blockchain" });
        }
      }, 100);
    });
  }
}

module.exports = new BlockchainService();
