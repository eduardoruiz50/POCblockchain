const config = require('../config');

/**
 * Extrae de forma dinámica todos los endpoints y métodos registrados en Express
 */
function getDynamicEndpoints(expressApp) {
  const endpoints = [];
  const knownDescriptions = {
    'GET /': 'Mensaje de bienvenida con contexto del sistema y listado dinámico de endpoints.',
    'GET /api/health': 'Estado de salud del servidor, tiempo de actividad (uptime) y diagnóstico.',
    'GET /01/:gtin/10/:lote': 'Resolver de GS1 Digital Link - Consulta trazabilidad DPP y verificación inmutable en Blockchain.',
    'GET /api/v1/siex/explotacion/:id': 'Mock del Sistema de Información de Explotaciones Agrícolas en España (SIEX)',
    'GET /v1/operators/:id': 'Mock del Trade Control and Expert System New Technology (TRACES NT)'
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

exports.getIndex = (req, res) => {
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
  const prefersHtml = acceptHeader.includes('text/html') &&
    (!acceptHeader.includes('application/json') || acceptHeader.indexOf('text/html') < acceptHeader.indexOf('application/json'));

  if (prefersHtml) {
    const endpointsHtml = registeredEndpoints.map(ep => {
      let exampleUrl = ep.path;
      if (ep.path.includes(':gtin') && ep.path.includes(':lote')) {
        exampleUrl = ep.path.replace(':gtin', '08412345678905').replace(':lote', 'L-2026-CAST01');
      }
      if (ep.path.includes('/api/v1/siex/explotacion/:id')) {
        exampleUrl = ep.path.replace(':id', 'ES00000012345');
      }
      if (ep.path.includes('/v1/operators/:id')) {
        exampleUrl = ep.path.replace(':id', 'ES-BIO-001-TEST');
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
};
