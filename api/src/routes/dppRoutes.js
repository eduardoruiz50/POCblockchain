const express = require('express');
const router = express.Router();
const dppController = require('../controllers/dppController');
const fase1RegistroController = require('../controllers/fase1RegistroController');

// GS1 DIGITAL LINK RESOLVER ENDPOINT
// Estructura URL: /01/:gtin/10/:lote
router.get('/01/:gtin/10/:lote', dppController.getDpp);

// ENDPOINT FASE 1: REGISTRO EN ORIGEN
router.post('/api/dpp/fase1/registro', fase1RegistroController.registerFase1);

module.exports = router;
