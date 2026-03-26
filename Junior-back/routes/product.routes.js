// routes/product.routes.js
const express = require('express');
const router = express.Router();
// IMPORTAMOS EL CONTROLADOR (Asegúrate de que la ruta sea correcta)
const productController = require('../controllers/product.controller'); 
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Crear producto - Ahora usa la lógica de Cloudinary
router.post('/', verifyToken, isAdmin, productController.createProduct);

// Obtener productos
router.get('/', verifyToken, productController.getProducts);

// Actualizar producto - Ahora usa la lógica de limpieza de Cloudinary
router.put('/:id', verifyToken, isAdmin, productController.updateProduct);

// Eliminar producto - Ahora borra también de Cloudinary
router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);

module.exports = router;