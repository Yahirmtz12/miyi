const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#C5A473', // primary color por defecto
  },
  activo: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Salon', salonSchema);
