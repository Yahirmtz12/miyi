const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  numero: { 
    type: String, 
    required: true, 
    unique: true // No puede haber dos mesas con el mismo número
  },
  estado: { 
    type: String, 
    enum: ['LIBRE', 'OCUPADA', 'SUCIA'], 
    default: 'LIBRE' 
  },
  // Almacenamos el ID de la orden activa para acceder rápido a ella
  ordenActual: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);