const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  // Referencia a la colección de categorías (Café, Té, Infusión, etc.)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // Tipo de producto: para la lógica de filtrado Inventario vs Punto de Venta
  tipo: {
    type: String,
    enum: ['Venta', 'Ingrediente'],
    default: 'Venta'
  },
  // BACKWARD COMPATIBILITY: se mantiene 'categoria' para no romper datos existentes
  // Los productos viejos seguirán teniendo este campo hasta que se migren
  categoria: {
    type: String
  },
  precio: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  imagen: {
    type: String // URL o nombre de archivo
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
