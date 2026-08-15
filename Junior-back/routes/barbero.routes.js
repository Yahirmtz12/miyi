const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const barberoCtrl = require('../controllers/barbero.controller');

// --- BARBEROS (CRUD) ---
router.get('/', barberoCtrl.getBarberos);                              // Público: listar barberos
router.post('/', verifyToken, isAdmin, barberoCtrl.createBarbero);     // Admin: crear barbero
router.put('/:id', verifyToken, isAdmin, barberoCtrl.updateBarbero);   // Admin: editar barbero
router.delete('/:id', verifyToken, isAdmin, barberoCtrl.deleteBarbero);// Admin: desactivar barbero

// --- DISPONIBILIDAD ---
router.get('/:id/disponibilidad', barberoCtrl.getDisponibilidad);            // Público: slots libres de un día
router.get('/:id/disponibilidad-semana', barberoCtrl.getDisponibilidadSemana); // Público: slots libres de la semana

module.exports = router;
