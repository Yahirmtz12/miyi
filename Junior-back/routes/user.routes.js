const express = require('express');
const router = express.Router();
// Asegúrate de que la ruta al middleware sea correcta
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// 1. RUTA PÚBLICA: Registro de usuarios (Clientes o Staff)
// Se deja pública para que el formulario de "Registro de Cliente" funcione
router.post('/register', userController.register);
router.put('/:id/password', verifyToken, isAdmin, userController.updatePassword);// 2. RUTA PROTEGIDA: Obtener perfil del usuario logueado
// Usamos verifyToken para saber quién es el usuario a través del JWT
router.get('/perfil', verifyToken, userController.getProfile);
router.post('/add-points', verifyToken, userController.addPoints);
// 3. RUTAS DE ADMINISTRACIÓN: Solo accesibles por Admins
// Obtener lista de todos los usuarios
router.get('/', verifyToken, isAdmin, userController.getUsers);

// Cambiar rango/rol de un usuario
router.put('/:id/rol', verifyToken, isAdmin, userController.updateUserRol);
router.get('/member/:membershipId', verifyToken, userController.getMemberById);// Eliminar un usuario
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;