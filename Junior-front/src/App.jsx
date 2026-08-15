import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Register from './pages/Register';
import CustomerDashboard from "./pages/CustomerDashboard";
import LandingXolos from './pages/LandingKFC';
import AgendarCita from './pages/AgendarCita';
import CitasAdmin from './pages/CitasAdmin';
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";

export default function App() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const isAdmin = user.rol === 'admin';
  const isCliente = user.rol === 'cliente';

  const getHomePath = () => {
    if (isCliente) return "/mis-citas";
    return "/dashboard/citas";
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<LandingXolos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/agendar" element={<AgendarCita />} />

        {/* RUTA PARA CLIENTES AUTENTICADOS */}
        <Route 
          path="/mis-citas" 
          element={
            <ProtectedRoute>
              {isCliente || isAdmin ? <CustomerDashboard /> : <Navigate to={getHomePath()} replace />}
            </ProtectedRoute>
          } 
        />

        {/* PANEL DASHBOARD (ADMIN/BARBERO) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {isCliente ? <Navigate to="/mis-citas" replace /> : <DashboardLayout />}
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="citas" replace />} />
          
          {/* Citas - Admin */}
          <Route 
            path="citas" 
            element={isAdmin ? <CitasAdmin /> : <Navigate to={getHomePath()} replace />} 
          />

          {/* Usuarios - Admin */}
          <Route 
            path="users" 
            element={isAdmin ? <UserManagement /> : <Navigate to={getHomePath()} replace />} 
          />



          <Route 
            path="reportes" 
            element={isAdmin ? <Reports /> : <Navigate to={getHomePath()} replace />} 
          />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}