const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const checkCloudinary = async () => {
  console.log('-------------------------------------------');
  console.log('☁️  Probando conexión con Cloudinary...');

  // 1. Verificar si las variables existen
  if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Error: No se detectaron variables de Cloudinary en .env');
    return;
  }

  try {
    // 2. Intentar obtener los detalles de la cuenta (esto valida las API Keys)
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('Cloudinary Atlas conectado ✔');
      console.log('Cloud Name:', cloudinary.config().cloud_name);
    }
  } catch (error) {
    console.error('Error al conectar Cloudinary ❌');
    console.error('Detalle:', error.message);
    
    // Si el error es "Must supply cloud_name", es que no está leyendo el .env
    if (error.message.includes('Must supply')) {
        console.log('👉 Tip: Asegúrate de que require("dotenv").config() esté al inicio de server.js');
    }
  }
  console.log('-------------------------------------------');
};

module.exports = checkCloudinary;