const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const citaCtrl = require('../controllers/cita.controller');

// --- CITAS ---
router.post('/', citaCtrl.solicitarCita);                                    // Público: solicitar cita
router.get('/', verifyToken, isAdmin, citaCtrl.getCitas);                    // Admin: todas las citas
router.get('/pendientes', verifyToken, isAdmin, citaCtrl.getCitasPendientes);// Admin: citas pendientes
router.get('/mis-citas', verifyToken, citaCtrl.getMisCitas);                 // Cliente: mis citas
router.put('/:id/aceptar', verifyToken, isAdmin, citaCtrl.aceptarCita);      // Admin: aceptar
router.put('/:id/rechazar', verifyToken, isAdmin, citaCtrl.rechazarCita);    // Admin: rechazar
router.put('/:id/completar', verifyToken, isAdmin, citaCtrl.completarCita);  // Admin: completar
router.delete('/:id', verifyToken, citaCtrl.cancelarCita);                   // Cancelar cita

module.exports = router;
