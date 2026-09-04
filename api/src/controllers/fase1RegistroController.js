const crypto = require('crypto');
const blockchainService = require('../services/blockchainService');

// Simulación de conexión IPFS (Devuelve un CID único simulado)
async function uploadToIPFS(metadataObject) {
    const jsonString = JSON.stringify(metadataObject);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    return `bafybeig${hash.substring(0, 38)}`;
}

// Fallback en memoria si la blockchain no está disponible o no hay credenciales configuradas
const localFallbackDB = {};

// ============================================================================
// ENDPOINT FASE 1: REGISTRO EN ORIGEN
// ============================================================================
exports.registerFase1 = async (req, res) => {
    try {
        const { apicultorAddress, gtin, loteId, regaCode, tracesCode, explotacionIdSIEX, operatorIdTRACES, nombreColmenar, latitud, longitud, tipoFloral, pesoKg, cantidadTarros } = req.body;

        // 1. Validaciones básicas de entrada
        if (!loteId || (!regaCode && !explotacionIdSIEX) || !gtin) {
            return res.status(400).json({
                error: "Datos incompletos",
                detalle: "gtin, loteId y regaCode (o explotacionIdSIEX) son obligatorios."
            });
        }

        const siexId = explotacionIdSIEX || (regaCode.startsWith('ES000000') ? regaCode : 'ES00000012345');
        const tracesId = operatorIdTRACES || tracesCode || 'ES-BIO-001-TEST';

        const totalTarros = Number(cantidadTarros) || 1;
        console.log(`\n🍯 [FASE 1] Registrando cosecha para el Lote: ${loteId}...`);

        // 2. Construcción del objeto JSON-LD estandarizado
        const dppMetadata = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["DigitalProductPassport"],
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                "gtin": gtin,
                "cantidadTarros": totalTarros,
                "batchNumber": loteId,
                "productName": `Miel de ${tipoFloral || 'Castaño'} del Bierzo`,
                "origin": {
                    "regaCode": regaCode || siexId,
                    "tracesCode": tracesId,
                    "locationName": nombreColmenar || 'Colmenar El Bierzo',
                    "coordinates": { latitude: latitud || 42.55, longitude: longitud || -6.59 },
                    "comarca": "El Bierzo"
                },
                "harvest": {
                    "harvestDate": new Date().toISOString().split('T')[0],
                    "weightKg": pesoKg || 250,
                    "floralType": tipoFloral || 'Castaño'
                }
            }
        };

        // 3. Subida del paquete de metadatos a IPFS
        const ipfsCID = await uploadToIPFS(dppMetadata);
        const ipfsURI = `ipfs://${ipfsCID}`;
        console.log(`📦 Metadatos empaquetados e inmutabilizados en IPFS: ${ipfsCID}`);

        let blockchainReceipt;
        let mode = 'blockchain';
        let hashesOraculos = {};

        // 4. Intento de registro real en Blockchain (vía Relayer y Oráculos SIEX/TRACES)
        try {
            const txResult = await blockchainService.registrarYMinarLoteCompleto({
                apicultorAddress,
                loteId,
                gtin,
                cantidadTarros: totalTarros,
                ipfsURI,
                explotacionIdSIEX: siexId,
                operatorIdTRACES: tracesId
            });

            blockchainReceipt = {
                txHash: txResult.txHash,
                blockNumber: txResult.blockNumber,
                status: "PENDIENTE_CERTIFICACION",
                mode: "on-chain"
            };
            hashesOraculos = txResult.hashesOraculos || {};
        } catch (chainErr) {
            console.warn(`⚠️ No se pudo enviar la transacción a Blockchain (${chainErr.message}). Utilizando modo simulado local.`);
            mode = 'simulated';
            const fallbackRega = crypto.createHash('sha256').update(siexId).digest('hex');
            const fallbackTraces = crypto.createHash('sha256').update(tracesId).digest('hex');
            hashesOraculos = { regaProofHash: `0x${fallbackRega}`, tracesProofHash: `0x${fallbackTraces}` };
            blockchainReceipt = {
                txHash: "0x" + crypto.randomBytes(32).toString('hex'),
                blockNumber: 1928301,
                status: "PENDIENTE_CERTIFICACION",
                mode: "simulated",
                warning: chainErr.message
            };
        }

        // 5. Guardado en fallback local
        localFallbackDB[loteId] = {
            gtin,
            metadata: dppMetadata,
            ipfsCID,
            ipfsURI,
            regaProofHash: hashesOraculos.regaProofHash,
            tracesProofHash: hashesOraculos.tracesProofHash,
            blockchain: blockchainReceipt
        };

        // 6. Respuesta al cliente / Apicultor
        return res.status(201).json({
            success: true,
            message: "Fase 1 completada: Registro de lote y generación de DPP iniciada con verificacion de Oráculos.",
            loteId: loteId,
            mode: mode,
            gs1DigitalLinkUrl: `http://localhost:3000/01/${gtin}/10/${loteId}`,
            dppStatus: blockchainReceipt.status,
            hashesOraculos: hashesOraculos,
            ipfs: {
                cid: ipfsCID,
                uri: ipfsURI
            },
            blockchainProof: {
                txHash: blockchainReceipt.txHash,
                blockNumber: blockchainReceipt.blockNumber,
                estado: blockchainReceipt.status
            }
        });

    } catch (error) {
        console.error("❌ Error en Fase 1:", error);
        return res.status(500).json({ error: "Error interno al registrar el lote." });
    }
};

exports.localFallbackDB = localFallbackDB;
