const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userCtrl = require('../controllers/user.controller');

// Público (registro desde frontend)
router.post('/register', userCtrl.register);

// Protegidas (autenticado)
router.get('/perfil', verifyToken, userCtrl.getProfile);
router.put('/telefono', verifyToken, userCtrl.updatePhone);

// Admin
router.get('/', verifyToken, isAdmin, userCtrl.getUsers);
router.put('/:id/rol', verifyToken, isAdmin, userCtrl.updateUserRol);
router.put('/:id/password', verifyToken, isAdmin, userCtrl.updatePassword);
router.delete('/:id', verifyToken, isAdmin, userCtrl.deleteUser);

module.exports = router;