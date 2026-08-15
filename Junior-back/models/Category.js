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

// Índice implícito creado por unique: true

module.exports = mongoose.model('Category', categorySchema);
