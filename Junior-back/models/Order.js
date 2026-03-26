const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  cliente: {
    type: String, 
    required: true
  },
  // Relación opcional con el modelo de Mesas
  mesaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Table',
    default: null 
  },
  productos: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      nombre: String,
      cantidad: Number,
      precio: Number,
      notas: { type: String, default: "" },
      entregado: { type: Boolean, default: false } 
    }
  ],
  total: {
    type: Number,
    required: true,
    default: 0
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO', 'CANCELADO','FINALIZADA'],
    default: 'PENDIENTE'
  },
  tipoConsumo: {
    type: String,
    enum: ['LOCAL', 'LLEVAR'],
    default: 'LOCAL'
  },
  // IMPORTANTE: Para saber si la mesa ya pagó o si la orden sigue abierta
  pagado: {
    type: Boolean,
    default: false
  },
  efectivoRecibido: Number,
  cambio: Number
}, { timestamps: true });

// Índice para buscar rápido órdenes activas por mesa
orderSchema.index({ mesaId: 1, pagado: 1 });

module.exports = mongoose.model('Order', orderSchema);