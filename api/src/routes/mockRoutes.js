const express = require('express');
const router = express.Router();
const mockController = require('../controllers/mockController');

// MOCK SIEX (Sistema de Información de Explotaciones Agrícolas en España)
router.get('/api/v1/siex/explotacion/:id', mockController.getSiexExplotacion);

// MOCK TRACES NT (Trade Control and Expert System New Technology)
router.get('/v1/operators/:id', mockController.getTracesOperator);

module.exports = router;
