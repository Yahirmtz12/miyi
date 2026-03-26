const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['admin', 'cajero', 'cliente','cocinero','mesero'], // Añadimos 'cliente'
    default: 'cliente' 
  },
  // NUEVOS CAMPOS PARA MEMBRESÍA
  membershipId: { type: String, unique: true, sparse: true,default: undefined }, 
  puntos: { type: Number, default: 0 },
  // Guardaremos las fechas como Strings "YYYY-MM-DD" para facilitar la validación
  visitas: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);