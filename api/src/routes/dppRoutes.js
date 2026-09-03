const express = require('express');
const router = express.Router();
const dppController = require('../controllers/dppController');
const fase1RegistroController = require('../controllers/fase1RegistroController');

// ============================================================================
// RESOLVER GS1 DIGITAL LINK
// Estructura oficial: /01/:gtin/10/:lote
// ============================================================================
router.get('/01/:gtin/10/:lote', dppController.getDpp);

// ============================================================================
// CICLO DE VIDA DEL PASAPORTE DIGITAL (DPP) - FASES 1 A 4
// ============================================================================

// FASE 1: Registro en Origen y Minado ERC-1155 (Apicultor)
router.post('/api/dpp/fase1/registro', fase1RegistroController.registerFase1);

// FASE 2: Certificación D.O.P. (Consejo Regulador)
router.post('/api/dpp/fase2/certificar', dppController.certifyFase2);

// FASE 3: Transferencia de tarros al Comercio Local / Tienda (ERC-1155 safeTransferFrom)
router.post('/api/dpp/fase3/transferir', dppController.transferirFase3);

// FASE 4: Consulta de Estado y Stock On-Chain (Lectura)
router.get('/api/dpp/lote/:loteId', dppController.consultarLoteYStock);

module.exports = router;
