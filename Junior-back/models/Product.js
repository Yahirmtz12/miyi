const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true // pollo, refresco
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
