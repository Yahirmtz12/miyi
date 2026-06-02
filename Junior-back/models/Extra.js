const mongoose = require('mongoose');

const extraSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  precio: {
    type: Number,
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Índice compuesto para consultas óptimas: "dame los extras activos de esta categoría"
extraSchema.index({ categoryId: 1, activo: 1 });

module.exports = mongoose.model('Extra', extraSchema);
