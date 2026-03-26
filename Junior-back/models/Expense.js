const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  monto: { type: Number, required: true },
  categoria: { 
    type: String, 
    enum: ['Insumos', 'Servicios', 'Nómina', 'Mantenimiento', 'Otros'], 
    default: 'Otros' 
  },
  fecha: { type: Date, default: Date.now },
  usuario: { type: String, required: true } // Quién registró el gasto
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);