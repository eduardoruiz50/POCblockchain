const blockchainService = require('../services/blockchainService');
const { localFallbackDB } = require('./fase1RegistroController');
const config = require('../config');

// ============================================================================
// RESOLVER GS1 DIGITAL LINK & CONSULTA DE PASAPORTE DIGITAL
// ============================================================================
exports.getDpp = async (req, res) => {
  const { gtin, lote } = req.params;
  const acceptHeader = req.headers['accept'] || '';

  let dppData = null;
  let isFromBlockchain = false;

  // 1. Intentar consulta on-chain a la función getLoteByLoteId
  try {
    const onChainResult = await blockchainService.consultarDatosLoteYStock(lote);
    if (onChainResult && onChainResult.tokenId > 0) {
      isFromBlockchain = true;
      dppData = {
        loteId: lote,
        gtin: onChainResult.gtin || gtin,
        tokenId: onChainResult.tokenId,
        cantidadTarros: onChainResult.cantidadInicialTarros,
        stockActualApicultor: onChainResult.stockActualApicultor,
        estadoCertificacion: onChainResult.estadoTexto,
        regaProofHash: onChainResult.regaProofHash,
        tracesProofHash: onChainResult.tracesProofHash,
        dopCertHash: onChainResult.dopCertHash,
        ipfsURI: onChainResult.ipfsURI,
        smartContractAddress: config.blockchain.contractAddress1155 || 'No configurado'
      };
    }
  } catch (err) {
    // Si la blockchain aún no está disponible o el contrato no tiene el lote, buscar en fallback local
  }

  // 2. Fallback a base de datos en memoria local si no está en blockchain
  if (!dppData && localFallbackDB[lote]) {
    const local = localFallbackDB[lote];
    dppData = {
      loteId: lote,
      gtin: local.gtin || gtin,
      tokenId: local.blockchain?.tokenId || 1,
      cantidadTarros: local.metadata?.credentialSubject?.cantidadTarros || 500,
      stockActualApicultor: local.metadata?.credentialSubject?.cantidadTarros || 500,
      estadoCertificacion: local.blockchain?.status || "PENDIENTE_CERTIFICACION",
      regaProofHash: local.regaProofHash,
      tracesProofHash: local.tracesProofHash,
      dopCertHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      ipfsURI: local.ipfsURI,
      smartContractAddress: config.blockchain.contractAddress1155 || 'Simulado en Memoria'
    };
  }

  // 3. Si es el lote demo predeterminado y aún no hay nada registrado
  if (!dppData && lote === 'L-2026-CAST01') {
    dppData = {
      loteId: 'L-2026-CAST01',
      gtin: gtin || '08412345678905',
      tokenId: 1,
      cantidadTarros: 600,
      stockActualApicultor: 600,
      estadoCertificacion: "CERTIFICADO_DOP_BIERZO",
      regaProofHash: "0x3e74ab89d38c11e73e990c74384a26ff48d3cb20c027bb3098319e346d0a7a44",
      tracesProofHash: "0x98a0f5a7b7410294e7734bbd82910f3c5b36486fa41e7d23e590059c11b15df1",
      dopCertHash: "0x78923a1f9e20cb647a98811d7c34b7f94b8e2cb5a87102b489a74cf4817e0411",
      ipfsURI: "ipfs://bafybeigx47xmj2l3qkm7v2y2pynfxs44u67aov3h3y33sq543wlzc5aqaq",
      smartContractAddress: config.blockchain.contractAddress1155 || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    };
  }

  if (!dppData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>DPP No Encontrado</title>
        <style>body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }</style>
      </head>
      <body>
        <h2>❌ Error 404 - DPP No Encontrado</h2>
        <p>El Lote <strong>${lote}</strong> no cuenta con un registro activo en el sistema ni en la Blockchain de la DOP Miel del Bierzo.</p>
      </body>
      </html>
    `);
  }

  // B. Negociación de Contenido (Content Negotiation)

  // CASO 1: Petición JSON / JSON-LD
  if (acceptHeader.includes('application/json') || acceptHeader.includes('application/ld+json')) {
    return res.json({
      "@context": ["https://gs1.org/voc/", "https://www.w3.org/2018/credentials/v1"],
      "type": "DigitalProductPassport",
      "gtin": gtin,
      "batchNumber": lote,
      "productDetails": {
        "name": "Miel del Bierzo DOP - Castaño",
        "origin": "El Bierzo, León, España",
        "standard": "ERC-1155 Multi-Token DPP"
      },
      "blockchainProof": {
        "source": isFromBlockchain ? "on-chain" : "cached/local",
        "contract": dppData.smartContractAddress,
        "tokenId": dppData.tokenId,
        "totalUnits": dppData.cantidadTarros,
        "currentStock": dppData.stockActualApicultor,
        "status": dppData.estadoCertificacion,
        "regaProofHash": dppData.regaProofHash,
        "tracesProofHash": dppData.tracesProofHash,
        "dopCertHash": dppData.dopCertHash,
        "ipfsURI": dppData.ipfsURI
      }
    });
  }

  // CASO 2: Visualización HTML para Consumidor o Móvil
  const isCertified = dppData.estadoCertificacion === 'CERTIFICADO_DOP_BIERZO';
  const badgeColor = isCertified ? '#10b981' : (dppData.estadoCertificacion === 'RECHAZADO' ? '#ef4444' : '#f59e0b');

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DPP - Miel del Bierzo DOP</title>
        <style>
            :root {
              --bg: #0f172a;
              --card: #1e293b;
              --border: #334155;
              --text: #f8fafc;
              --muted: #94a3b8;
              --accent: #f59e0b;
            }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: var(--bg); color: var(--text); margin: 0; padding: 20px; }
            .card { background: var(--card); border: 1px solid var(--border); max-width: 500px; margin: auto; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
            .badge { background-color: ${badgeColor}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; }
            .header { text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 18px; margin-bottom: 20px; }
            .section { margin-bottom: 18px; }
            .label { color: var(--muted); font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px; }
            .value { color: var(--text); font-size: 15px; margin-bottom: 8px; font-weight: 500; }
            .hash { font-family: monospace; background: #0b1120; border: 1px solid var(--border); color: #38bdf8; padding: 6px 8px; border-radius: 6px; word-break: break-all; font-size: 11px; display: block; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .footer { text-align: center; font-size: 11px; color: var(--muted); margin-top: 24px; border-top: 1px dashed var(--border); padding-top: 16px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h2>🍯 Pasaporte Digital de Producto</h2>
                <div style="margin-top: 8px;">
                  <span class="badge">✔ ${dppData.estadoCertificacion}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="label">Producto & Denominación</div>
                <div class="value">D.O.P. Miel del Bierzo (GTIN: <strong>${gtin}</strong>)</div>
                <div class="value">📍 Comarca del Bierzo, León, España</div>
            </div>

            <div class="section grid">
                <div>
                  <div class="label">Lote</div>
                  <div class="value">${lote}</div>
                </div>
                <div>
                  <div class="label">Token ID ERC-1155</div>
                  <div class="value">#${dppData.tokenId}</div>
                </div>
                <div>
                  <div class="label">Emisión Total</div>
                  <div class="value">${dppData.cantidadTarros} tarros</div>
                </div>
                <div>
                  <div class="label">Stock Actual Productor</div>
                  <div class="value">${dppData.stockActualApicultor} tarros</div>
                </div>
            </div>

            <div class="section" style="border-top: 1px dashed var(--border); padding-top: 15px;">
                <div class="label">Contrato Inteligente</div>
                <span class="hash">${dppData.smartContractAddress}</span>
            </div>

            <div class="section">
                <div class="label">Evidencia REGA / SIEX (Hash Criptográfico)</div>
                <span class="hash">${dppData.regaProofHash}</span>
            </div>

            <div class="section">
                <div class="label">Trazabilidad Sanitaria TRACES (Hash Criptográfico)</div>
                <span class="hash">${dppData.tracesProofHash}</span>
            </div>

            <div class="section">
                <div class="label">Análisis Certificación DOP (Laboratorio)</div>
                <span class="hash">${dppData.dopCertHash}</span>
            </div>

            <div class="section">
                <div class="label">Metadatos Descentralizados (IPFS)</div>
                <span class="hash">${dppData.ipfsURI}</span>
            </div>

            <div class="footer">
                GS1 Digital Link Resolver • D.O.P. Miel del Bierzo • Smart Contract ERC-1155
            </div>
        </div>
    </body>
    </html>
  `);
};

// ============================================================================
// FASE 2: CERTIFICACIÓN D.O.P. (Impulsada por Oráculo / Relayer)
// ============================================================================
exports.certifyFase2 = async (req, res) => {
  try {
    const { loteId, dopCertHash, aprobado } = req.body;

    if (!loteId) {
      return res.status(400).json({ error: "Datos incompletos", detalle: "loteId es obligatorio." });
    }

    const resultadoAprobado = aprobado !== undefined ? Boolean(aprobado) : true;
    const certHash = dopCertHash || "CERT-LAB-DOP-" + Date.now();

    const txResult = await blockchainService.certificarLoteViaOraculoDOP(loteId, certHash, resultadoAprobado);

    return res.json({
      success: true,
      message: `Fase 2 completada: Lote ${loteId} certificado mediante Oráculo DOP y Relayer.`,
      loteId,
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
      aprobado: resultadoAprobado
    });
  } catch (error) {
    console.error("❌ Error en Fase 2 (Oráculo):", error);
    return res.status(500).json({ error: "Error al registrar certificación del Oráculo.", detalle: error.message });
  }
};

// ============================================================================
// FASE 3: TRANSFERENCIA A COMERCIO LOCAL (Relayer safeTransferFrom)
// ============================================================================
exports.transferirFase3 = async (req, res) => {
  try {
    const { fromAddress, tiendaAddress, toAddress, tokenId, cantidad } = req.body;
    const destino = tiendaAddress || toAddress;

    if (!destino || tokenId === undefined || !cantidad) {
      return res.status(400).json({ error: "Datos incompletos", detalle: "tiendaAddress (o toAddress), tokenId y cantidad son obligatorios." });
    }

    const txResult = await blockchainService.transferirTarrosAComercio(
      fromAddress,
      destino,
      Number(tokenId),
      Number(cantidad)
    );

    return res.json({
      success: true,
      message: `Fase 3 completada: ${cantidad} tarros del Token #${tokenId} transferidos a ${destino} vía Relayer.`,
      txHash: txResult.txHash
    });
  } catch (error) {
    console.error("❌ Error en Fase 3 (Relayer):", error);
    return res.status(500).json({ error: "Error al transferir tarros vía Relayer.", detalle: error.message });
  }
};

// ============================================================================
// FASE 4: CONSULTA DIRECTA DE ESTADO Y STOCK ON-CHAIN
// ============================================================================
exports.consultarLoteYStock = async (req, res) => {
  try {
    const { loteId } = req.params;
    const { apicultorWallet } = req.query;

    if (!loteId) {
      return res.status(400).json({ error: "loteId es obligatorio en la ruta." });
    }

    const data = await blockchainService.consultarDatosLoteYStock(loteId, apicultorWallet);
    return res.json({
      success: true,
      loteId,
      data
    });
  } catch (error) {
    console.error("❌ Error al consultar lote y stock:", error);
    return res.status(500).json({ error: "Error al consultar estado en blockchain.", detalle: error.message });
  }
};
