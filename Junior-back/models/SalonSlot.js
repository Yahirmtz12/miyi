const mongoose = require('mongoose');

const salonSlotSchema = new mongoose.Schema({
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
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
    type: String, // "12:00"
    required: true,
  },
  estado: {
    type: String,
    enum: ['disponible', 'reservado', 'confirmado'],
    default: 'disponible',
  },
  reservadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  nombreReserva: {
    type: String,
    default: '',
  },
  telefonoReserva: {
    type: String,
    default: '',
  },
  notas: {
    type: String,
    default: '',
  }
}, { timestamps: true });

// Índice compuesto para búsquedas eficientes por salón y fecha
salonSlotSchema.index({ salon: 1, fecha: 1 });

module.exports = mongoose.model('SalonSlot', salonSlotSchema);
