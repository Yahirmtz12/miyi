const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Índice para búsquedas rápidas por nombre
categorySchema.index({ nombre: 1 });

module.exports = mongoose.model('Category', categorySchema);
