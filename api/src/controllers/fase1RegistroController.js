const crypto = require('crypto');
// ============================================================================
// BASE DE DATOS LOCAL / MOCK BLOCKCHAIN (Para desarrollo local)
// ============================================================================
const dppRegistryDB = {};

// Simulación de conexión IPFS (Devuelve un CID único simulado)
async function uploadToIPFS(metadataObject) {
    const jsonString = JSON.stringify(metadataObject);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    // Formato simulación CIDv1 IPFS
    return `bafybeig${hash.substring(0, 38)}`;
}

// Simulación de interacción con Smart Contract (Transacción Write)
async function mintDPPOnBlockchain(loteId, ipfsCID, regaCode) {
    // Calcula hash de evidencia para privacidad en blockchain
    const regaHash = crypto.createHash('sha256').update(regaCode).digest('hex');

    return {
        txHash: "0x" + crypto.randomBytes(32).toString('hex'),
        tokenId: Math.floor(1000 + Math.random() * 9000),
        blockNumber: 1928301,
        status: "PENDIENTE_CERTIFICACION", // Estado inicial de la Fase 1
        regaHashProof: `0x${regaHash}`,
        ipfsCID: ipfsCID
    };
}

// ============================================================================
// ENDPOINT FASE 1: REGISTRO EN ORIGEN
// ============================================================================
exports.registerFase1 = async (req, res) => {
    try {
        const { gtin, loteId, regaCode, nombreColmenar, latitud, longitud, tipoFloral, pesoKg, cantidadTarros } = req.body;

        // 1. Validaciones básicas de entrada
        if (!loteId || !regaCode || !gtin) {
            return res.status(400).json({
                error: "Datos incompletos",
                detalle: "gtin, loteId y regaCode son obligatorios."
            });
        }

        console.log(`\n🍯 [FASE 1] Registrando cosecha para el Lote: ${loteId}...`);

        // 2. Construcción del objeto JSON-LD estandarizado
        const dppMetadata = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["DigitalProductPassport"],
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                "gtin": gtin,
                "cantidadTarros": cantidadTarros, // Ej: 500 tarros
                "batchNumber": loteId,
                "productName": `Miel de ${tipoFloral} del Bierzo`,
                "origin": {
                    "regaCode": regaCode,
                    "locationName": nombreColmenar,
                    "coordinates": { latitude: latitud, longitude: longitud },
                    "comarca": "El Bierzo"
                },
                "harvest": {
                    "harvestDate": new Date().toISOString().split('T')[0],
                    "weightKg": pesoKg,
                    "floralType": tipoFloral
                }
            }
        };

        // 3. Subida del paquete de metadatos a IPFS
        const ipfsCID = await uploadToIPFS(dppMetadata);
        console.log(`📦 Metadatos empaquetados e inmutabilizados en IPFS: ${ipfsCID}`);

        // 4. Registro/Minting en el Smart Contract
        const blockchainReceipt = await mintDPPOnBlockchain(loteId, ipfsCID, regaCode);
        console.log(`⛓️ Pasaporte Digital de Producto minado en Blockchain (Token ID: ${blockchainReceipt.tokenId})`);

        // 5. Guardado en estado local (para posterior consulta del Resolver)
        dppRegistryDB[loteId] = {
            metadata: dppMetadata,
            ipfsCID: ipfsCID,
            blockchain: blockchainReceipt
        };

        // 6. Respuesta al cliente / Apicultor
        return res.status(201).json({
            success: true,
            message: "Fase 1 completada: Registro de lote y generación de DPP iniciada.",
            loteId: loteId,
            gs1DigitalLinkUrl: `http://localhost:3000/01/${gtin}/10/${loteId}`,
            dppStatus: blockchainReceipt.status,
            ipfs: {
                cid: ipfsCID,
                uri: `ipfs://${ipfsCID}`
            },
            blockchainProof: {
                tokenId: blockchainReceipt.tokenId,
                txHash: blockchainReceipt.txHash,
                estado: blockchainReceipt.status
            }
        });

    } catch (error) {
        console.error("❌ Error en Fase 1:", error);
        return res.status(500).json({ error: "Error interno al registrar el lote." });
    }
};

// app.listen(3000, () => console.log('🚀 Backend Fase 1 escuchando en http://localhost:3000'));
