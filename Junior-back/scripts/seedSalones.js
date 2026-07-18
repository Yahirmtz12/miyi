/**
 * Script para crear los 3 salones iniciales de Rhythm Oaxaca.
 * 
 * Ejecutar con: node scripts/seedSalones.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Salon = require('../models/Salon');

const salones = [
  {
    nombre: 'Salón 1',
    descripcion: 'Salón principal de la academia',
    color: '#C5A473', // primary / dorado
  },
  {
    nombre: 'Salón 2',
    descripcion: 'Salón secundario',
    color: '#8C6A3B', // secondary / bronce
  },
  {
    nombre: 'Salón 3',
    descripcion: 'Salón de práctica',
    color: '#6366F1', // indigo para contraste
  },
];

const seed = async () => {
  try {
    await connectDB();
    
    const existentes = await Salon.countDocuments();
    if (existentes > 0) {
      console.log(`⚠️  Ya existen ${existentes} salones en la base de datos. No se crearon duplicados.`);
      process.exit(0);
    }

    await Salon.insertMany(salones);
    console.log('✅ 3 Salones creados exitosamente:');
    salones.forEach((s, i) => console.log(`   ${i + 1}. ${s.nombre} — ${s.descripcion}`));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear salones:', error.message);
    process.exit(1);
  }
};

seed();
