const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const salonCtrl = require('../controllers/salon.controller');

// --- SALONES (CRUD) ---
router.get('/', salonCtrl.getSalones);                           // Público: listar salones
router.post('/', verifyToken, isAdmin, salonCtrl.createSalon);   // Admin: crear salón
router.put('/:id', verifyToken, isAdmin, salonCtrl.updateSalon); // Admin: editar salón
router.delete('/:id', verifyToken, isAdmin, salonCtrl.deleteSalon); // Admin: desactivar salón

// --- SLOTS DE DISPONIBILIDAD ---
router.get('/slots', salonCtrl.getSlots);                                    // Público: ver disponibilidad
router.post('/slots', verifyToken, isAdmin, salonCtrl.createSlot);           // Admin: crear bloque
router.put('/slots/:id', verifyToken, isAdmin, salonCtrl.updateSlot);        // Admin: editar bloque
router.delete('/slots/:id', verifyToken, isAdmin, salonCtrl.deleteSlot);     // Admin: eliminar bloque
router.post('/slots/:id/reservar', salonCtrl.reserveSlot);                   // Público: reservar slot
router.post('/reservar-publico', salonCtrl.publicReserveSlots);              // Público: solicitar múltiples horarios
router.put('/slots/:id/confirmar', verifyToken, isAdmin, salonCtrl.confirmSlot);  // Admin: confirmar
router.put('/slots/:id/rechazar', verifyToken, isAdmin, salonCtrl.rejectSlot);    // Admin: rechazar

module.exports = router;
