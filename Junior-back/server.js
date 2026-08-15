require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Guardamos la instancia de IO en el objeto app
app.set('socketio', io);

// Conectar DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const barberoRoutes = require('./routes/barbero.routes');
const citaRoutes = require('./routes/cita.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const expenseRoutes = require('./routes/expense.routes');
const saleRoutes = require('./routes/sale.routes');

// --- REGISTRO DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/barberos', barberoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sales', saleRoutes);

// Ruta prueba
app.get('/', (req, res) => {
  res.send('API Xolos Barbershop funcionando 💈🔥');
});

// Socket.io — Conexiones
io.on('connection', (socket) => {
  console.log('💈 Cliente conectado:', socket.id);
  
  // El admin se une a su room
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('Admin conectado al panel de citas');
  });

  // Clientes se unen a su room personal
  socket.on('join-cliente', (userId) => {
    socket.join(`cliente:${userId}`);
    console.log(`Cliente ${userId} conectado`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`💈 Xolos Barbershop API corriendo en el puerto ${PORT}`);
});