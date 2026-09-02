const blockchainService = require('../services/blockchainService');

exports.getDpp = async (req, res) => {
  const { gtin, lote } = req.params;
  const acceptHeader = req.headers['accept'] || '';

  // A. Consulta a la capa Blockchain mediante la ID de Lote
  const blockchainResult = await blockchainService.consultarSmartContract(lote);

  if (!blockchainResult.success) {
    return res.status(404).send(`
            <h2>Error 404 - DPP No Encontrado</h2>
            <p>El Lote <strong>${lote}</strong> no cuenta con un registro activo en la Blockchain de la DOP Miel del Bierzo.</p>
        `);
  }

  const dppData = blockchainResult.data;

  // B. Lógica de Negociación de Contenido (Content Negotiation)

  // CASO 1: Petición desde Sistema/Inspector/API buscando datos estructurados (JSON / JSON-LD)
  if (acceptHeader.includes('application/json') || acceptHeader.includes('application/ld+json')) {
    return res.json({
      "@context": "https://gs1.org/voc/",
      "type": "DigitalProductPassport",
      "gtin": gtin,
      "batchNumber": lote,
      "productDetails": {
        "name": "Miel del Bierzo DOP - Castaño 500g",
        "origin": dppData.ubicacionColmenar,
        "harvestDate": dppData.fechaCosecha
      },
      "blockchainProof": {
        "contract": dppData.smartContractAddress,
        "status": dppData.estadoCertificacion,
        "qualityCertHash": dppData.ipfsQualityHash,
        "txHash": dppData.txHash,
        "authoritySignature": dppData.crdopSignature
      }
    });
  }

  // CASO 2: Petición desde Smartphone/Navegador (HTML Visual para el Consumidor)
  // Redirige o renderiza la WebApp del Pasaporte Digital
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DPP - Miel del Bierzo</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
            .card { background: white; max-width: 480px; margin: auto; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .badge { background-color: #27ae60; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
            .header { text-align: center; border-bottom: 2px solid #f1f1f1; padding-bottom: 15px; }
            .section { margin-top: 20px; }
            .label { color: #7f8c8d; font-size: 12px; text-transform: uppercase; font-weight: bold; }
            .value { color: #2c3e50; font-size: 15px; margin-bottom: 10px; font-weight: 500; }
            .hash { font-family: monospace; background: #eaeded; padding: 4px; border-radius: 4px; word-break: break-all; font-size: 11px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h2>🍯 Pasaporte Digital de Producto</h2>
                <span class="badge">✔ ${dppData.estadoCertificacion}</span>
            </div>
            
            <div class="section">
                <div class="label">Producto & Origen</div>
                <div class="value">${dppData.varietal} (GTIN: ${gtin})</div>
                <div class="value">📍 ${dppData.ubicacionColmenar}</div>
                <div class="value">👨‍🌾 ${dppData.apicultor}</div>
            </div>

            <div class="section">
                <div class="label">Trazabilidad de Lote</div>
                <div class="value">Lote ID: <strong>${lote}</strong></div>
                <div class="value">Fecha Cosecha: ${dppData.fechaCosecha}</div>
            </div>

            <div class="section" style="border-top: 1px dashed #ccc; padding-top: 15px;">
                <div class="label">Verificación Blockchain (Inmutable)</div>
                <div class="value">Smart Contract: <span class="hash">${dppData.smartContractAddress}</span></div>
                <div class="value">Firma DOP Bierzo: <span class="hash">${dppData.crdopSignature}</span></div>
                <div class="value">Certificado Calidad (IPFS): <br><span class="hash">${dppData.ipfsQualityHash}</span></div>
            </div>
        </div>
    </body>
    </html>
    `);
};
