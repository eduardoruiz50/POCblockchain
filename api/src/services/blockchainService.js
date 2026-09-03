const { ethers } = require('ethers');
require('dotenv').config();

// ============================================================================
// CONFIGURACIÓN Y PROVEEDOR (Ethers.js v6)
// ============================================================================
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // Hardhat Local / Sepolia
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS_1155;

// Proveedor de conexión con la red Blockchain
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ABI del Contrato MielBierzoDPP1155
const abi1155 = [
    "function mintDPPBatch(address apicultor, string calldata loteId, string calldata gtin, uint256 cantidadTarros, string calldata ipfsURI, bytes32 regaProofHash, bytes32 tracesProofHash) external returns (uint256)",
    "function certifyLot(string calldata loteId, bytes32 dopCertHash, bool aprobado) external",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external",
    "function getLoteByLoteId(string calldata loteId) external view returns (uint256 tokenId, string memory gtin, uint256 cantidadTarros, bytes32 regaProofHash, bytes32 tracesProofHash, bytes32 dopCertHash, uint8 estado, string memory ipfsURI)",
    "function balanceOf(address account, uint256 id) external view returns (uint256)"
];

// Instancias de ayuda para inicialización perezosa / segura
function getApicultorWallet() {
    const key = process.env.APICULTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!key) {
        throw new Error("Clave privada del Apicultor no configurada (APICULTOR_PRIVATE_KEY)");
    }
    return new ethers.Wallet(key, provider);
}

function getConsejoWallet() {
    const key = process.env.CONSEJO_PRIVATE_KEY;
    if (!key) {
        throw new Error("Clave privada del Consejo Regulador no configurada (CONSEJO_PRIVATE_KEY)");
    }
    return new ethers.Wallet(key, provider);
}

function getContractWithSigner(wallet) {
    const address = process.env.CONTRACT_ADDRESS_1155 || process.env.CONTRACT_ADDRESS;
    if (!address) {
        throw new Error("Dirección del contrato ERC-1155 no configurada (CONTRACT_ADDRESS_1155)");
    }
    return new ethers.Contract(address, abi1155, wallet);
}

function getReadOnlyContract() {
    const address = process.env.CONTRACT_ADDRESS_1155 || process.env.CONTRACT_ADDRESS;
    if (!address) {
        throw new Error("Dirección del contrato ERC-1155 no configurada (CONTRACT_ADDRESS_1155)");
    }
    return new ethers.Contract(address, abi1155, provider);
}

// ============================================================================
// FUNCIONALIDADES DE LA API (ESCRITURA Y LECTURA)
// ============================================================================

/**
 * FASE 1: Registro y Minado Masivo del Lote (Ejecutado por el Apicultor)
 */
async function registrarYMinarLote({ loteId, gtin, cantidadTarros, ipfsURI, regaProofHash, tracesProofHash }) {
    try {
        console.log(`\n📦 Enviando transacción mintDPPBatch para el lote: ${loteId}...`);

        const walletApicultor = getApicultorWallet();
        const contractApicultor = getContractWithSigner(walletApicultor);

        // Convertir hashes de texto a bytes32 si no vienen formateados
        const regaBytes32 = ethers.isHexString(regaProofHash) ? regaProofHash : ethers.id(regaProofHash);
        const tracesBytes32 = ethers.isHexString(tracesProofHash) ? tracesProofHash : ethers.id(tracesProofHash);

        // Envío de la transacción firmada por el Apicultor
        const tx = await contractApicultor.mintDPPBatch(
            walletApicultor.address,
            loteId,
            gtin,
            cantidadTarros,
            ipfsURI,
            regaBytes32,
            tracesBytes32
        );

        console.log(`⏳ Transacción enviada. Hash: ${tx.hash}. Esperando confirmación...`);
        const receipt = await tx.wait(); // Espera la inclusión en el bloque

        console.log(`✅ Lote minado con éxito en el bloque: ${receipt.blockNumber}`);
        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        console.error("❌ Error en mintDPPBatch:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 2: Certificación D.O.P. (Ejecutado por el Consejo Regulador)
 */
async function certificarLoteDOP(loteId, dopCertHashRaw, aprobado) {
    try {
        console.log(`\n📜 Enviando transacción certifyLot para el lote: ${loteId}...`);

        const walletConsejo = getConsejoWallet();
        const contractConsejo = getContractWithSigner(walletConsejo);

        const dopCertHash = ethers.isHexString(dopCertHashRaw) ? dopCertHashRaw : ethers.id(dopCertHashRaw);

        // Envío de la transacción firmada por el Consejo Regulador
        const tx = await contractConsejo.certifyLot(loteId, dopCertHash, aprobado);
        
        console.log(`⏳ Transacción enviada. Hash: ${tx.hash}. Esperando confirmación...`);
        const receipt = await tx.wait();

        console.log(`✅ Certificación registrada en el bloque: ${receipt.blockNumber}`);
        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        console.error("❌ Error en certifyLot:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 3: Transferencia ERC-1155 a Comercio Local / Tienda
 */
async function transferirTarrosAComercio(tiendaAddress, tokenId, cantidad) {
    try {
        console.log(`\n🚚 Transfiriendo ${cantidad} tarros (Token ID #${tokenId}) a ${tiendaAddress}...`);

        const walletApicultor = getApicultorWallet();
        const contractApicultor = getContractWithSigner(walletApicultor);

        const tx = await contractApicultor.safeTransferFrom(
            walletApicultor.address,
            tiendaAddress,
            tokenId,
            cantidad,
            "0x" // bytes vacíos para data opcional
        );

        const receipt = await tx.wait();
        console.log(`✅ Transferencia completada en el bloque: ${receipt.blockNumber}`);
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error("❌ Error en safeTransferFrom:", error.reason || error.message);
        throw error;
    }
}

/**
 * FASE 4: Consulta de Estado y Stock On-Chain (Lectura Sin Gas)
 */
async function consultarDatosLoteYStock(loteId, apicultorWallet) {
    try {
        const contractReadOnly = getReadOnlyContract();

        // Consulta multi-valor devuelta por getLoteByLoteId
        const result = await contractReadOnly.getLoteByLoteId(loteId);

        const tokenId = Number(result[0]);
        let stockActualApicultor = 0;
        
        // Si se provee wallet del apicultor, se consulta su balance; sino intentamos con la wallet configurada
        const targetWallet = apicultorWallet || (process.env.APICULTOR_PRIVATE_KEY ? new ethers.Wallet(process.env.APICULTOR_PRIVATE_KEY).address : null);
        if (targetWallet) {
            stockActualApicultor = Number(await contractReadOnly.balanceOf(targetWallet, tokenId));
        }

        // Mapeo del estado enumerado
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
        console.error("❌ Error al consultar lote en blockchain:", error.reason || error.message);
        throw error;
    }
}

module.exports = {
    registrarYMinarLote,
    certificarLoteDOP,
    transferirTarrosAComercio,
    consultarDatosLoteYStock
};
