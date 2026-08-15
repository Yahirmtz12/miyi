const mongoose = require('mongoose');
// Esto es lo que lee el archivo .env automáticamente
require('dotenv').config(); 

const connectDB = async () => {
  try {
    // Ahora usamos la variable de entorno con nombres alternativos por si acaso
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL; 

    await mongoose.connect(uri);
    console.log('MongoDB Atlas conectado ✔');
  } catch (error) {
    console.error('Error al conectar MongoDB ❌', error);
    process.exit(1);
  }
};

module.exports = connectDB;