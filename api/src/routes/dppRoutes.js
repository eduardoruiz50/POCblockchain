const express = require('express');
const router = express.Router();
const dppController = require('../controllers/dppController');

// GS1 DIGITAL LINK RESOLVER ENDPOINT
// Estructura URL: /01/:gtin/10/:lote
router.get('/01/:gtin/10/:lote', dppController.getDpp);

module.exports = router;
