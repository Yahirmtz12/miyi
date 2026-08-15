const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  barbero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barbero',
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  horaInicio: {
    type: String, // "10:00"
    required: true,
  },
  horaFin: {
    type: String, // "11:00"
    required: true,
  },
  // Servicio principal
  servicio: {
    type: String,
    required: true,
  },
  // Extras seleccionados (barba, ceja, etc.)
  extras: [{
    nombre: String,
    precio: Number,
  }],
  precioTotal: {
    type: Number,
    default: 0,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'rechazada', 'completada', 'cancelada'],
    default: 'pendiente',
  },
  // Datos del cliente
  reservadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  nombreCliente: {
    type: String,
    default: '',
  },
  telefonoCliente: {
    type: String,
    default: '',
  },
  notas: {
    type: String,
    default: '',
  },
  // Motivo de rechazo (opcional)
  motivoRechazo: {
    type: String,
    default: '',
  }
}, { timestamps: true });

// Índice para búsquedas eficientes
citaSchema.index({ barbero: 1, fecha: 1 });
citaSchema.index({ estado: 1 });
citaSchema.index({ reservadoPor: 1 });

module.exports = mongoose.model('Cita', citaSchema);
