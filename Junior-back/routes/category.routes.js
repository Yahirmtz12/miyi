const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const {
  createExtra,
  getAllExtras,
  updateExtra,
  deleteExtra
} = require('../controllers/extra.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// --- RUTAS DE CATEGORÍAS ---
router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, isAdmin, createCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

// --- RUTAS DE EXTRAS (bajo /categories) ---
router.get('/extras', verifyToken, getAllExtras);
router.post('/extras', verifyToken, isAdmin, createExtra);
router.put('/extras/:id', verifyToken, isAdmin, updateExtra);
router.delete('/extras/:id', verifyToken, isAdmin, deleteExtra);

module.exports = router;
