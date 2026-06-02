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
      precio: Number,
      // Extras seleccionados para este producto en esta venta
      extras: [
        {
          extraId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Extra'
          },
          nombre: String,
          precio: Number
        }
      ],
      // Subtotal = (precio + suma de extras) * cantidad
      subtotal: Number
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
