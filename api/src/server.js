const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// 1. SIMULACIÓN DEL SMART CONTRACT / BLOCKCHAIN (MOCK PROVIDER)
// ============================================================================
// En producción, esto utilizaría 'ethers' o 'web3' conectándose a RPC (Ethereum/Polygon)
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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/**
 * Extrae de forma dinámica todos los endpoints y métodos registrados en Express
 */
function getDynamicEndpoints(expressApp) {
  const endpoints = [];
  const knownDescriptions = {
    'GET /': 'Mensaje de bienvenida con contexto del sistema y listado dinámico de endpoints.',
    'GET /api/health': 'Estado de salud del servidor, tiempo de actividad (uptime) y diagnóstico.',
    'GET /01/:gtin/10/:lote': 'Resolver de GS1 Digital Link - Consulta trazabilidad DPP y verificación inmutable en Blockchain.'
  };

  function extractRoutes(stack, prefix = '') {
    if (!stack) return;
    for (const layer of stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());
        let path = (prefix + (layer.route.path === '/' && prefix ? '' : layer.route.path)).replace(/\/+/g, '/');
        if (!path) path = '/';

        methods.forEach((method) => {
          const key = `${method} ${path}`;
          endpoints.push({
            method,
            path,
            description: knownDescriptions[key] || 'Endpoint activo del servicio REST'
          });
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        let routePrefix = '';
        if (layer.regexp && layer.regexp.source) {
          const match = layer.regexp.source
            .replace('^\\/', '')
            .replace('\\/?(?=\\/|$)', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          if (match && match !== '^/' && match !== '/') {
            routePrefix = '/' + match;
          }
        }
        extractRoutes(layer.handle.stack, prefix + routePrefix);
      }
    }
  }

  if (expressApp._router && expressApp._router.stack) {
    extractRoutes(expressApp._router.stack);
  }

  return endpoints;
}

// Rutas
app.use('/api', healthRoutes);

app.get('/', (req, res) => {
  const registeredEndpoints = getDynamicEndpoints(req.app);
  const acceptHeader = req.headers['accept'] || '';

  const payload = {
    name: 'POCblockchain API & GS1 Digital Link Resolver',
    version: '1.0.0',
    description: 'API REST que integra resolución de Pasaportes Digitales de Producto (DPP) bajo el estándar GS1 Digital Link con verificación inmutable en Smart Contracts de Blockchain.',
    status: 'online',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    context: {
      standard: 'GS1 Digital Link v1.2 / EU Digital Product Passport (DPP)',
      blockchain: 'Ethereum / Hardhat RPC Node (Ethers.js v6)',
      useCase: 'Trazabilidad y Certificación DOP Miel del Bierzo'
    },
    endpointsCount: registeredEndpoints.length,
    endpoints: registeredEndpoints
  };

  // Lógica de Negociación de Contenido (Content Negotiation)
  // Si la petición viene de un navegador web solicitando HTML
  const prefersHtml = acceptHeader.includes('text/html') &&
    (!acceptHeader.includes('application/json') || acceptHeader.indexOf('text/html') < acceptHeader.indexOf('application/json'));

  if (prefersHtml) {
    const endpointsHtml = registeredEndpoints.map(ep => {
      let exampleUrl = ep.path;
      if (ep.path.includes(':gtin') && ep.path.includes(':lote')) {
        exampleUrl = ep.path.replace(':gtin', '08412345678905').replace(':lote', 'L-2026-CAST01');
      }
      return `
        <div class="endpoint-card">
          <div class="endpoint-header">
            <span class="method-badge method-${ep.method.toLowerCase()}">${ep.method}</span>
            <a href="${exampleUrl}" class="endpoint-path" target="_blank">${ep.path}</a>
          </div>
          <p class="endpoint-desc">${ep.description}</p>
          ${ep.path.includes(':') ? `<div class="endpoint-example">Ejemplo de consulta: <a href="${exampleUrl}" target="_blank">${exampleUrl}</a></div>` : ''}
        </div>
      `;
    }).join('');

    return res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${payload.name}</title>
        <style>
            :root {
              --primary: #2563eb;
              --primary-hover: #1d4ed8;
              --bg: #0f172a;
              --card-bg: #1e293b;
              --card-border: #334155;
              --text-main: #f8fafc;
              --text-muted: #94a3b8;
              --accent-green: #10b981;
              --accent-blue: #38bdf8;
              --accent-purple: #a855f7;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: var(--bg); color: var(--text-main); line-height: 1.6; padding: 30px 20px; }
            .container { max-width: 900px; margin: 0 auto; }
            .header-banner { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid var(--card-border); border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
            .header-title { font-size: 24px; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
            .badges-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
            .status-badge { background-color: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-badge { background-color: rgba(56, 189, 248, 0.15); color: var(--accent-blue); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .description { color: var(--text-muted); font-size: 15px; margin-top: 10px; }
            
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }
            .card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 20px; }
            .card-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent-blue); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
            .info-item { margin-bottom: 10px; }
            .info-item:last-child { margin-bottom: 0; }
            .info-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
            .info-value { font-size: 14px; color: var(--text-main); font-weight: 500; word-break: break-all; }
            
            .section-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
            .endpoint-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; margin-bottom: 12px; transition: transform 0.2s, border-color 0.2s; }
            .endpoint-card:hover { border-color: var(--primary); transform: translateY(-2px); }
            .endpoint-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
            .method-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
            .method-get { background-color: rgba(37, 99, 235, 0.2); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.4); }
            .method-post { background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
            .endpoint-path { font-family: monospace; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; }
            .endpoint-path:hover { color: var(--accent-blue); text-decoration: underline; }
            .endpoint-desc { font-size: 13px; color: var(--text-muted); }
            .endpoint-example { font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--card-border); color: var(--text-muted); }
            .endpoint-example a { color: var(--accent-blue); text-decoration: none; font-family: monospace; }
            .endpoint-example a:hover { text-decoration: underline; }
            
            footer { text-align: center; margin-top: 40px; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--card-border); padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-banner">
                <div class="header-title">
                    <span>🚀 ${payload.name}</span>
                </div>
                <div class="badges-row">
                    <span class="status-badge">✔ ${payload.status}</span>
                    <span class="info-badge">v${payload.version}</span>
                    <span class="info-badge">ENV: ${payload.environment}</span>
                </div>
                <p class="description">${payload.description}</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-title">📌 Contexto del Sistema</div>
                    <div class="info-item">
                        <div class="info-label">Estándar DPP</div>
                        <div class="info-value">${payload.context.standard}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Capa Blockchain</div>
                        <div class="info-value">${payload.context.blockchain}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Caso de Uso</div>
                        <div class="info-value">${payload.context.useCase}</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">⚡ Diagnóstico & Estado</div>
                    <div class="info-item">
                        <div class="info-label">Uptime Servidor</div>
                        <div class="info-value">${payload.uptime}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Timestamp Servidor</div>
                        <div class="info-value">${payload.timestamp}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Endpoints Activos</div>
                        <div class="info-value">${payload.endpointsCount} endpoints dinámicos</div>
                    </div>
                </div>
            </div>

            <div class="section-title">
                <span>🌐 Directorio Dinámico de Endpoints REST</span>
                <span class="info-badge">${payload.endpointsCount} registrados</span>
            </div>

            <div class="endpoints-list">
                ${endpointsHtml}
            </div>

            <footer>
                POCblockchain • Maestría Blockchain • Solución DPP con GS1 Digital Link & Smart Contracts
            </footer>
        </div>
    </body>
    </html>
    `);
  }

  // Respuesta JSON por defecto para clientes API / Programáticos
  res.json(payload);
});

async function consultarSmartContract(loteId) {
  // Simula la latencia de red de una lectura a la Blockchain (RPC read-only)
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

// ============================================================================
// 2. GS1 DIGITAL LINK RESOLVER ENDPOINT
// Estructura URL: /01/:gtin/10/:lote
// ============================================================================
app.get('/01/:gtin/10/:lote', async (req, res) => {
  const { gtin, lote } = req.params;
  const acceptHeader = req.headers['accept'] || '';

  // A. Consulta a la capa Blockchain mediante la ID de Lote
  const blockchainResult = await consultarSmartContract(lote);

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
});

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(` Servidor API escuchando en el puerto ${config.port}`);
  console.log(` Modo: ${config.nodeEnv}`);
  console.log(`🚀 GS1 Digital Link Resolver ejecutándose en http://localhost:${config.port}`);
  console.log(`📌 Prueba el QR accediendo a: http://localhost:${config.port}/01/08412345678905/10/L-2026-CAST01`);
});

module.exports = app;
