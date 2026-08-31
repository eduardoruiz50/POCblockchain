const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN DE DATOS DEL PRODUCTO (GS1 DIGITAL LINK)
// ============================================================================
const DOMAIN = 'http://localhost:3000'; // Cambiar por el dominio de producción
const GTIN = '08412345678905';           // Código de producto
const BATCH = 'L-2026-CAST01';          // Lote de la Miel del Bierzo

// URL estandarizada GS1 Digital Link
const gs1DigitalLinkUrl = `${DOMAIN}/01/${GTIN}/10/${BATCH}`;

// Directorio de salida
const outputDir = path.join(__dirname, 'qr_outputs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Opciones de renderizado del QR
const qrOptions = {
    errorCorrectionLevel: 'Q', // ~25% de capacidad de recuperación ante daños/suciedad
    type: 'image/png',
    quality: 0.95,
    margin: 2,                 // Margen blanco alrededor del QR
    color: {
        dark: '#2c3e50',       // Color de los módulos (Gris oscuro profesional)
        light: '#ffffff'       // Fondo blanco
    },
    width: 600                 // Resolución en píxeles (alta definición)
};

// ============================================================================
// FUNCIONES DE GENERACIÓN
// ============================================================================

async function generarQRCodigos() {
    console.log(`🔗 Generando QR para URL GS1: ${gs1DigitalLinkUrl}\n`);

    try {
        // 1. Generar versión PNG (Ideal para presentaciones, la web y pruebas)
        const pngPath = path.join(outputDir, `QR_MielBierzo_${BATCH}.png`);
        await QRCode.toFile(pngPath, gs1DigitalLinkUrl, qrOptions);
        console.log(`✅ Archivo PNG generado con éxito: ${pngPath}`);

        // 2. Generar versión SVG (Ideal para diseño gráfico e impresión vectorial de etiquetas)
        const svgPath = path.join(outputDir, `QR_MielBierzo_${BATCH}.svg`);
        await QRCode.toFile(svgPath, gs1DigitalLinkUrl, {
            ...qrOptions,
            type: 'svg'
        });
        console.log(`✅ Archivo SVG generado con éxito: ${svgPath}`);

        // 3. Imprimir QR en la terminal para verificación rápida en desarrollo
        console.log('\n📱 Escanea este código directamente desde tu consola:\n');
        const terminalQr = await QRCode.toString(gs1DigitalLinkUrl, { type: 'terminal', small: true });
        console.log(terminalQr);

    } catch (err) {
        console.error('❌ Error al generar el código QR:', err);
    }
}

generarQRCodigos();
