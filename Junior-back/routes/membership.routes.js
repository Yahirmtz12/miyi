const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membership.controller');
// Importa tu middleware de autenticación si quieres que solo el cajero/admin escanee
// const { verifyToken } = require('../middlewares/auth'); 

router.post('/check-in', membershipController.registrarVisita);
router.get('/customer/:id', membershipController.obtenerClientePorId);

module.exports = router;