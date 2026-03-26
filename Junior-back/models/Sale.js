const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productos: [
    {
      productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      nombre: String,
      cantidad: Number,
      precio: Number
    }
  ],
  total: {
    type: Number,
    required: true
  },
  efectivoRecibido: {
    type: Number,
    required: true
  },
  cambio: {
    type: Number,
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);
