const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ['admin', 'cajero', 'cliente', 'cocinero', 'mesero','kiosko'], // Añadimos 'cliente'
    default: 'cliente'
  },
  // NUEVOS CAMPOS PARA MEMBRESÍA
  membershipId: { type: String, unique: true, sparse: true, default: undefined },

  // Control de vigencia y saldo
  clasesDisponibles: { type: Number, default: 0 },
  fechaVencimiento: { type: Date, default: null },

  // Historial para saber qué días y a qué clases entraron
  asistencias: [{
    fecha: { type: Date, default: Date.now }, // Ej: "Salsa", "Electro", "Ensayo XV"
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);