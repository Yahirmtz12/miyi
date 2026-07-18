import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layout/DashboardLayout";
// import Inventory from "./pages/Inventory"; // CAFETERÍA DESHABILITADA
import ProtectedRoute from "./routes/ProtectedRoute";
// import Sales from "./pages/Sales"; // CAFETERÍA DESHABILITADA
// import { CartProvider } from "./context/CartContext"; // CAFETERÍA DESHABILITADA
// import Reports from "./pages/Reports"; // CAFETERÍA DESHABILITADA
import UserManagement from "./pages/UserManagement";
// import History from "./pages/History"; // CAFETERÍA DESHABILITADA
// import ExpensesView from "./pages/ExpensesView"; // CAFETERÍA DESHABILITADA
import Register from './pages/Register';
import CustomerDashboard from "./pages/CustomerDashboard";
import MembresiaStaff from "./pages/MembresiaStaff";
import LandingKFC from './pages/LandingKFC';
// import WaiterPanel from './pages/WaiterPanel'; // CAFETERÍA DESHABILITADA
// import KitchenView from './pages/KitchenView'; // CAFETERÍA DESHABILITADA
import Kios from './pages/KioskoMembresia';
import SalonBooking from './pages/SalonBooking';
import SalonesPublic from './pages/SalonesPublic';

export default function App() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Definición de Roles
  const isAdmin = user.rol === 'admin';
  const isCajero = user.rol === 'cajero';
  // const isCocinero = user.rol === 'cocinero'; // CAFETERÍA DESHABILITADA
  // const isMesero = user.rol === 'mesero'; // CAFETERÍA DESHABILITADA
  const isCliente = user.rol === 'cliente';
  const iskiosko = user.rol === 'kiosko';


  // Helper para redirección inicial según el rol
  const getHomePath = () => {
    // if (isCocinero) return "/dashboard/kitchen"; // CAFETERÍA DESHABILITADA
    // if (isMesero) return "/dashboard/mesero"; // CAFETERÍA DESHABILITADA
    if (isCliente) return "/mi-membresia";
    if (iskiosko) return "/dashboard/kiosko";
    return "/dashboard/users"; // Admin y Cajero → ahora van a Usuarios
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<LandingKFC />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/salones" element={<SalonesPublic />} />

        {/* RUTA EXCLUSIVA PARA CLIENTES (LOYALTY) */}
        <Route 
          path="/mi-membresia" 
          element={
            <ProtectedRoute>
              {isCliente || isAdmin ? <CustomerDashboard /> : <Navigate to={getHomePath()} replace />}
            </ProtectedRoute>
          } 
        />

        {/* PANEL DASHBOARD (CONTENEDOR PRINCIPAL) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {isCliente ? <Navigate to="/mi-membresia" replace /> : <DashboardLayout />}
            </ProtectedRoute>
          }
        >
          {/* Redirección inteligente al entrar a /dashboard según el rol */}
          <Route index element={<Navigate to={getHomePath().replace('/dashboard/', '')} replace />} />
          
          {/* --- RUTAS POR ROL --- */}

          {/* COCINA: Solo Admin y Cocinero — CAFETERÍA DESHABILITADA */}
          {/* <Route 
            path="kitchen" 
            element={isAdmin || isCocinero ? <KitchenView /> : <Navigate to={getHomePath()} replace />} 
          /> */}
          <Route 
            path="kiosko" 
            element={isAdmin || iskiosko || isCajero ? <Kios /> : <Navigate to={getHomePath()} replace />} 
          />

          {/* MESERO: Solo Admin y Mesero — CAFETERÍA DESHABILITADA */}
          {/* <Route 
            path="mesero" 
            element={isAdmin || isMesero || isCajero ? <WaiterPanel /> : <Navigate to={getHomePath()} replace />} 
          /> */}

          {/* VENTAS Y GASTOS: Admin y Cajero — CAFETERÍA DESHABILITADA */}
          {/* <Route 
            path="sales" 
            element={isAdmin || isCajero ? <CartProvider><Sales /></CartProvider> : <Navigate to={getHomePath()} replace />} 
          />
          <Route 
            path="expenses" 
            element={isAdmin || isCajero ? <ExpensesView /> : <Navigate to={getHomePath()} replace />} 
          />
          <Route 
            path="history" 
            element={isAdmin || isCajero ? <History /> : <Navigate to={getHomePath()} replace />} 
          /> */}
          <Route 
            path="loyalty" 
            element={isAdmin || isCajero ? <MembresiaStaff /> : <Navigate to={getHomePath()} replace />} 
          />

          {/* EXCLUSIVO ADMIN: Usuarios y Salones */}
          {/* <Route 
            path="inventory" 
            element={isAdmin ? <Inventory /> : <Navigate to={getHomePath()} replace />} 
          />
          <Route 
            path="reports" 
            element={isAdmin ? <Reports /> : <Navigate to={getHomePath()} replace />} 
          /> */}
          <Route 
            path="users" 
            element={isAdmin ? <UserManagement /> : <Navigate to={getHomePath()} replace />} 
          />
          <Route 
            path="salones" 
            element={isAdmin ? <SalonBooking /> : <Navigate to={getHomePath()} replace />} 
          />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}