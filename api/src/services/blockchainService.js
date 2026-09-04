const { ethers } = require('ethers');
const axios = require('axios'); // Para consultar los Mocks de SIEX y TRACES NT
const config = require('../config');

// ============================================================================
// CONFIGURACIÓN Y PROVEEDOR WEB3
// ============================================================================
const RPC_URL = config.blockchain.rpcUrl;
const CONTRACT_ADDRESS = config.blockchain.contractAddress1155;
const API_BASE_URL = config.apiBaseUrl;

const provider = new ethers.JsonRpcProvider(RPC_URL);

// ABI del Smart Contract ERC-1155
const abi1155 = [
    "function mintDPPBatch(address apicultor, string calldata loteId, string calldata gtin, uint256 cantidadTarros, string calldata ipfsURI, bytes32 regaProofHash, bytes32 tracesProofHash) external returns (uint256)",
    "function certifyLot(string calldata loteId, bytes32 dopCertHash, bool aprobado) external",
    "function relayerTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external",
    "function getLoteByLoteId(string calldata loteId) external view returns (uint256 tokenId, string memory gtin, uint256 cantidadTarros, bytes32 regaProofHash, bytes32 tracesProofHash, bytes32 dopCertHash, uint8 estado, string memory ipfsURI)",
    "function balanceOf(address account, uint256 id) external view returns (uint256)"
];

// Helper para inicialización perezosa / segura del Relayer
function getRelayerWallet() {
    const key = config.blockchain.relayerPrivateKey;
    if (!key) {
        throw new Error("Clave privada del Relayer no configurada en .env (RELAYER_PRIVATE_KEY)");
    }
    return new ethers.Wallet(key, provider);
}

function getContractWithSigner() {
    const address = config.blockchain.contractAddress1155;
    if (!address) {
        throw new Error("Dirección del contrato ERC-1155 no configurada en .env (CONTRACT_ADDRESS_1155)");
    }
    const wallet = getRelayerWallet();
    return new ethers.Contract(address, abi1155, wallet);
}

function getContractReadOnly() {
    const address = config.blockchain.contractAddress1155;
    if (!address) {
        throw new Error("Dirección del contrato ERC-1155 no configurada en .env (CONTRACT_ADDRESS_1155)");
    }
    return new ethers.Contract(address, abi1155, provider);
}

// ============================================================================
// FUNCIONES INTEGRADAS CON LOS ORÁCULOS SIEX Y TRACES NT
// ============================================================================

/**
 * 🔮 ORÁCULO 1: Consulta al Servicio Oficial SIEX (España)
 * Obtiene los datos oficiales de la explotación apícola (REGA) y genera su Hash criptográfico.
 */
async function obtenerHashOraculoSIEX(explotacionId) {
    try {
        console.log(`📡 [Oráculo SIEX] Consultando Mock SIEX: /api/v1/siex/explotacion/${explotacionId}`);
        const response = await axios.get(`${API_BASE_URL}/api/v1/siex/explotacion/${explotacionId}`);
        
        const datosExplotacion = response.data;
        // Genera un Hash Keccak-256 inmutable de la respuesta oficial de SIEX
        const proofHash = ethers.id(JSON.stringify(datosExplotacion));
        
        console.log(`✅ [Oráculo SIEX] Validación correcta. REGA: ${datosExplotacion.codigoREGA || explotacionId} | Hash: ${proofHash}`);
        return proofHash;
    } catch (error) {
        console.warn(`⚠️ [Oráculo SIEX] Consulta HTTP no completada (${error.message}). Aplicando hash determinista.`);
        return ethers.id(`MOCK_SIEX_FALLBACK_${explotacionId}`);
    }
}

/**
 * 🔮 ORÁCULO 2: Consulta al Servicio Oficial TRACES NT (Unión Europea)
 * Obtiene los datos de autorización del operador sanitario y genera su Hash criptográfico.
 */
async function obtenerHashOraculoTRACES(operatorId) {
    try {
        console.log(`📡 [Oráculo TRACES NT] Consultando Mock TRACES: /v1/operators/${operatorId}`);
        const response = await axios.get(`${API_BASE_URL}/v1/operators/${operatorId}`);
        
        const datosOperador = response.data;
        // Genera un Hash Keccak-256 inmutable de la respuesta oficial de TRACES NT
        const proofHash = ethers.id(JSON.stringify(datosOperador));
        
        console.log(`✅ [Oráculo TRACES NT] Operador verificado: ${operatorId} | Hash: ${proofHash}`);
        return proofHash;
    } catch (error) {
        console.warn(`⚠️ [Oráculo TRACES NT] Consulta HTTP no completada (${error.message}). Aplicando hash determinista.`);
        return ethers.id(`MOCK_TRACES_FALLBACK_${operatorId}`);
    }
}

// ============================================================================
// FUNCIONALIDADES PRINCIPALES DEL SERVICIO WEB3
// ============================================================================

/**
 * FASE 1: Registro del Lote invocado por el Apicultor.
 * Consulta automáticamente los Oráculos SIEX y TRACES NT antes de minar en Blockchain.
 */
async function registrarYMinarLoteCompleto({ apicultorAddress, loteId, gtin, cantidadTarros, ipfsURI, explotacionIdSIEX, operatorIdTRACES }) {
    try {
        console.log(`\n==================================================================`);
        console.log(`🚀 INICIANDO REGISTRO DE LOTE ${loteId} CON ORÁCULOS OFICIALES`);
        console.log(`==================================================================`);

        // 1. Consulta a los Oráculos Off-Chain
        const regaProofHash = await obtenerHashOraculoSIEX(explotacionIdSIEX);
        const tracesProofHash = await obtenerHashOraculoTRACES(operatorIdTRACES);

        console.log(`\n📦 [Relayer Node] Enviando transacción mintDPPBatch a la Blockchain...`);

        const contractWithSigner = getContractWithSigner();
        const relayerWallet = getRelayerWallet();
        const targetApicultor = apicultorAddress || relayerWallet.address;

        // 2. Envío de la transacción en la cadena con los Hashes de los Oráculos
        const tx = await contractWithSigner.mintDPPBatch(
            targetApicultor,
            loteId,
            gtin,
            cantidadTarros,
            ipfsURI,
            regaProofHash,
            tracesProofHash
        );

        console.log(`⏳ Transacción enviada: ${tx.hash}. Esperando confirmación de bloque...`);
        const receipt = await tx.wait();

        console.log(`✅ Lote registrado exitosamente en el Bloque #${receipt.blockNumber}`);
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            hashesOraculos: { regaProofHash, tracesProofHash }
        };
    } catch (error) {
        console.error("❌ Error durante la orquestación del minado con Oráculos:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 2: Certificación DOP por Oráculo del Consejo Regulador
 */
async function certificarLoteViaOraculoDOP(loteId, dopCertHashRaw, aprobado) {
    try {
        console.log(`\n🔮 [Oráculo DOP] Registrando dictamen de análisis para lote: ${loteId}...`);

        const contractWithSigner = getContractWithSigner();
        const dopCertHash = ethers.isHexString(dopCertHashRaw) ? dopCertHashRaw : ethers.id(dopCertHashRaw);

        const tx = await contractWithSigner.certifyLot(loteId, dopCertHash, aprobado);
        const receipt = await tx.wait();

        console.log(`✅ Estado de Certificación escrito en la cadena (Bloque #${receipt.blockNumber})`);
        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        console.error("❌ Error en certificación DOP:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 3: Transferencia ERC-1155 a Comercio Local
 */
async function transferirTarrosAComercio(fromAddress, toAddress, tokenId, cantidad) {
    try {
        const contractWithSigner = getContractWithSigner();
        const relayerWallet = getRelayerWallet();
        const origin = fromAddress || relayerWallet.address;

        let tx;
        try {
            tx = await contractWithSigner.relayerTransferFrom(origin, toAddress, tokenId, cantidad, "0x");
        } catch (e) {
            tx = await contractWithSigner.safeTransferFrom(origin, toAddress, tokenId, cantidad, "0x");
        }

        const receipt = await tx.wait();
        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        console.error("❌ Error en transferencia:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 4: Consulta On-Chain (GS1 Resolver)
 */
async function consultarDatosLoteYStock(loteId, apicultorWallet) {
    try {
        const contractReadOnly = getContractReadOnly();
        const result = await contractReadOnly.getLoteByLoteId(loteId);
        const tokenId = Number(result[0]);

        let stockActualApicultor = 0;
        const targetWallet = apicultorWallet || (config.blockchain.relayerPrivateKey ? new ethers.Wallet(config.blockchain.relayerPrivateKey).address : null);
        if (targetWallet) {
            stockActualApicultor = Number(await contractReadOnly.balanceOf(targetWallet, tokenId));
        }

        const estados = ["PENDIENTE_CERTIFICACION", "CERTIFICADO_DOP_BIERZO", "RECHAZADO"];

        return {
            tokenId: tokenId,
            gtin: result[1],
            cantidadInicialTarros: Number(result[2]),
            stockActualApicultor: stockActualApicultor,
            regaProofHash: result[3],
            tracesProofHash: result[4],
            dopCertHash: result[5],
            estadoCodigo: Number(result[6]),
            estadoTexto: estados[Number(result[6])],
            ipfsURI: result[7]
        };
    } catch (error) {
        console.error("❌ Error en consulta on-chain:", error.reason || error.message);
        throw error;
    }
}

module.exports = {
    obtenerHashOraculoSIEX,
    obtenerHashOraculoTRACES,
    registrarYMinarLoteCompleto,
    certificarLoteViaOraculoDOP,
    transferirTarrosAComercio,
    consultarDatosLoteYStock
};
