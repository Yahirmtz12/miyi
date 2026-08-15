const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ['admin', 'cliente'], 
    default: 'cliente'
  },
  
  // Número telefónico del usuario (para WhatsApp)
  telefono: { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);