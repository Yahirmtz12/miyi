require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Requerido para Socket.io
const socketIo = require('socket.io'); // Requerido para tiempo real
const connectDB = require('./config/db');
const checkCloudinary = require('./config/cloudinaryCheck');

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP

// Configuración de Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*", // En producción, cámbialo por tu URL de frontend
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Guardamos la instancia de IO en el objeto app para usarlo en los controladores
app.set('socketio', io);

// Conectar DB y Check Cloudinary
connectDB();
checkCloudinary();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth.routes');
const saleRoutes = require('./routes/sale.routes');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const expenseRoutes = require('./routes/expense.routes');
const membershipRoutes = require('./routes/membership.routes');
const orderRoutes = require('./routes/order.routes'); // <-- ¡No olvides esta!
const tableRoutes = require('./routes/table.routes'); // <-- Ruta de mesas

// --- REGISTRO DE RUTAS ---
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/orders', orderRoutes); // Ruta para Comandas/Cocina
app.use('/api/tables', tableRoutes); // Ruta para Gestión de Mesas

// Ruta prueba
app.get('/', (req, res) => {
  res.send('API Rhythm funcionando con Sockets 🔥');
});

// Escuchar conexiones de Sockets (Opcional, para debug)
io.on('connection', (socket) => {
  console.log('Nuevo dispositivo conectado al sistema de cocina:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado');
  });
});

// USAR server.listen EN LUGAR DE app.listen PARA QUE SOCKETS FUNCIONE
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor y Sockets corriendo en el puerto ${PORT}`);
});