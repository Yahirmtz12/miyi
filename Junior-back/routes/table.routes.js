const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { verifyToken } = require('../middleware/auth.middleware'); // <--- Nombre correcto
router.get('/', verifyToken, tableController.getTables);
router.post('/', verifyToken, tableController.createTable);
router.patch('/:id', verifyToken, tableController.updateTableStatus);
router.delete('/:id', verifyToken, tableController.deleteTable);

module.exports = router;