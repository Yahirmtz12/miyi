const express = require('express');
const router = express.Router();

const {
  createSale,
  getSales,
  getReport,deleteSale // <-- 1. Importamos el nuevo método
} = require('../controllers/sale.controller');

const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.post('/', verifyToken, createSale);
router.get('/', verifyToken, getSales);
router.get('/report', verifyToken, isAdmin, getReport);
router.delete('/:id', verifyToken, isAdmin, deleteSale);
module.exports = router;
