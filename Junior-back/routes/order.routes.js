const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// TUS RUTAS ORIGINALES (Se mantienen igual)
router.post('/', orderController.createOrder); 
router.get('/active', verifyToken, orderController.getActiveOrders);
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);

// NUEVA RUTA PARA EL MESERO: Obtener la orden de una mesa específica
// Asegúrate de agregar esta función "getOrderByTable" en tu controlador después
router.get('/table/:id', verifyToken, orderController.getOrderByTable);
router.put('/table/:id', verifyToken, orderController.updateOrderByTable);
router.post('/table/:id/finish', verifyToken, orderController.finishOrder);
router.patch('/:id/product/:index', verifyToken, orderController.updateProductInOrder);
router.delete('/table/:mesaId/product/:productoId', orderController.removeProductFromOrder);
module.exports = router;