const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// --- RUNTAS PÚBLICAS ---
router.post('/register', userController.register);

// --- RUTAS DE PERFIL / ALUMNO ---
router.get('/perfil', verifyToken, userController.getProfile);
router.put('/update-phone', verifyToken, userController.updatePhone);
// Obtener info del alumno al escanear QR (la que ya corregimos)
router.get('/member/:membershipId', verifyToken, userController.getMemberById);

// --- RUTAS DE OPERACIÓN (Staff / Admin) ---
// Registrar entrada a clase (Descuenta 1 clase)
router.post('/register-attendance', verifyToken, userController.registerAttendance);

// Renovar o agregar clases/mes (Sustituye a add-points)
router.post('/renew-membership', verifyToken, isAdmin, userController.renewMembership);

// --- RUTAS DE ADMINISTRACIÓN (Solo Admins) ---
router.get('/', verifyToken, isAdmin, userController.getUsers);
router.put('/:id/rol', verifyToken, isAdmin, userController.updateUserRol);
router.put('/:id/password', verifyToken, isAdmin, userController.updatePassword);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;