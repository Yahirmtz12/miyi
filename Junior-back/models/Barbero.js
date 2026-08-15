const mongoose = require('mongoose');

const barberoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    default: '',
  },
  telefono: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#C5A473',
  },
  servicios: [{
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    duracion: { type: Number, default: 60 }, // en minutos
    esExtra: { type: Boolean, default: false }, // extras como barba, ceja
  }],
  horarioSemanal: {
    lunes:    { activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '19:00' } },
    martes:   { activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '19:00' } },
    miercoles:{ activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '19:00' } },
    jueves:   { activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '19:00' } },
    viernes:  { activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '19:00' } },
    sabado:   { activo: { type: Boolean, default: false }, inicio: { type: String, default: '09:00' }, fin: { type: String, default: '15:00' } },
    domingo:  { activo: { type: Boolean, default: false }, inicio: { type: String, default: '00:00' }, fin: { type: String, default: '00:00' } },
  },
  activo: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Barbero', barberoSchema);
