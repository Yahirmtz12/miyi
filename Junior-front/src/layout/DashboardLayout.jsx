import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiLogOut, FiX } from "react-icons/fi";
import logoEmpresa from "../assets/logo.png";
import AttendanceListener from "../components/AttendanceListener";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Iniciamos cerrado
  const [hovered, setHovered] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = user.rol;

  if (rol === 'cliente') {
    return <Navigate to="/mi-membresia" replace />;
  }

  const allNavItems = [
    // { to: "/dashboard/sales", label: "Ventas", icon: "shopping_bag", roles: ['admin', 'cajero'] }, // CAFETERÍA DESHABILITADA
    { to: "/dashboard/users", label: "Usuarios", icon: "group", roles: ['admin'] },
    { to: "/dashboard/loyalty", label: "Membresía", icon: "redeem", roles: ['admin', 'cajero'] },
    { to: "/dashboard/kiosko", label: "Kiosko", icon: "backpack", roles: ['admin', 'kiosko', 'cajero'] },
    { to: "/dashboard/salones", label: "Salones", icon: "event", roles: ['admin'] },
    // { to: "/dashboard/inventory", label: "Inventario", icon: "inventory_2", roles: ['admin'] }, // CAFETERÍA DESHABILITADA
    // { to: "/dashboard/reports", label: "Análisis", icon: "analytics", roles: ['admin'] }, // CAFETERÍA DESHABILITADA
    // { to: "/dashboard/history", label: "Historial", icon: "history", roles: ['admin', 'cajero'] }, // CAFETERÍA DESHABILITADA
    // { to: "/dashboard/expenses", label: "Gastos", icon: "receipt_long", roles: ['admin', 'cajero'] }, // CAFETERÍA DESHABILITADA
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(rol));

  return (
    <div className="flex h-screen overflow-hidden bg-[#1F1F1F]">

      {/* Listener global de asistencias — siempre escuchando el lector QR */}
      <AttendanceListener />

      {/* OVERLAY: Fondo oscuro cuando el menú está abierto en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
    fixed inset-y-0 left-0 z-50 lg:relative
    flex flex-col
    bg-[#262626] border-r border-white/10
    transition-all duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
    ${hovered && !sidebarOpen ? "lg:w-64" : "lg:w-20"}
  `}
      >
        {/* 1. HEADER: Fijo arriba */}
        <div className="shrink-0 transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-3">
              {/* Logo Circular con Recorte Correcto */}
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                <img
                  src={logoEmpresa}
                  alt="Logo"
                  className="h-full w-full object-contain transform scale-124 transition-transform"
                />
              </div>

              {/* Texto del Logo (Ocultable) */}
              <div className={`flex flex-col transition-opacity duration-300 ${(sidebarOpen || hovered) ? "opacity-100" : "lg:opacity-0 pointer-events-none"}`}>
                <h1 className="text-white text-sm font-black uppercase leading-tight">Rhythm</h1>
                <p className="text-[9px] text-secondary font-bold uppercase tracking-wider">{rol}</p>
              </div>
            </div>

            {/* Botón cerrar (Solo Móvil) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* 2. NAVEGACIÓN: Con Scroll Independiente */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-2 no-scrollbar scroll-smooth">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)} // Cierra el menú al navegar en móvil
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3.5 rounded-2xl text-sm font-bold transition-all group
          ${isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-white/40 hover:bg-white/5 hover:text-secondary"}`
              }
            >
              <span className="material-symbols-outlined text-2xl shrink-0">{icon}</span>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${(sidebarOpen || hovered) ? "opacity-100" : "lg:opacity-0 pointer-events-none"}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* 3. FOOTER / LOGOUT: Fijo abajo */}
        <div className="p-4 shrink-0 border-t border-white/5 bg-[#262626]">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className={`
        flex items-center justify-center gap-3 transition-all group
        ${(sidebarOpen || hovered)
                ? "w-full py-4 rounded-2xl bg-white/5 hover:bg-red-600/10 text-white/40 hover:text-red-500"
                : "w-12 h-12 rounded-full mx-auto bg-white/5 text-white/40 hover:bg-red-600/10 hover:text-red-500"
              }
      `}
          >
            <FiLogOut size={20} className="shrink-0" />
            {(sidebarOpen || hovered) && (
              <span className="text-[10px] font-black uppercase tracking-widest">
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* BARRA SUPERIOR (Solo visible en móvil o cuando el sidebar está cerrado) */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#1F1F1F] lg:hidden border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src={logoEmpresa} className="w-8 h-8 rounded-full" alt="logo" />
            <span className="text-white font-black uppercase text-xs">Rhythm</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white/5 rounded-xl text-white"
          >
            <FiMenu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}