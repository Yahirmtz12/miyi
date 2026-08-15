import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiMenu, FiLogOut, FiX, FiScissors } from "react-icons/fi";
import { API_URL } from "../api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = user.rol;

  if (rol === 'cliente') {
    return <Navigate to="/mis-citas" replace />;
  }

  const [notificationStatus, setNotificationStatus] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const subscribeUser = async () => {
    try {
      const swReg = await navigator.serviceWorker.register('/sw.js');
      let subscription = await swReg.pushManager.getSubscription();
      if (!subscription) {
        const res = await fetch(`${API_URL}/api/push/vapidPublicKey`);
        const { publicKey } = await res.json();
        
        subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // Siempre enviamos la suscripción al backend para asegurar que Mongo la tenga
      await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Suscripción sincronizada con el servidor');
    } catch (error) {
      console.error('Push Setup Error:', error);
    }
  };

  const handleEnablePush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        setNotificationStatus(perm);
        if (perm === 'granted') subscribeUser();
      });
    }
  };

  // --- WEB PUSH SETUP ---
  useEffect(() => {
    if (rol === 'admin' && 'serviceWorker' in navigator && 'PushManager' in window && notificationStatus === 'granted') {
      subscribeUser();
    }
  }, [rol, notificationStatus]);

  const allNavItems = [
    { to: "/dashboard/citas", label: "Citas", icon: "calendar_month", roles: ['admin'] },
    { to: "/dashboard/reportes", label: "Análisis", icon: "monitoring", roles: ['admin'] },
    { to: "/dashboard/users", label: "Usuarios", icon: "group", roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(rol));

  return (
    <div className="flex h-screen overflow-hidden bg-[#1F1F1F]">

      {/* OVERLAY */}
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
        {/* HEADER */}
        <div className="shrink-0 transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#C5A473]/30 overflow-hidden bg-black/50">
                <img src="/logo.png" alt="Xolos" className="w-full h-full object-cover" />
              </div>

              <div className={`flex flex-col transition-opacity duration-300 ${(sidebarOpen || hovered) ? "opacity-100" : "lg:opacity-0 pointer-events-none"}`}>
                <h1 className="text-white text-sm font-black uppercase leading-tight">Xolos</h1>
                <p className="text-[9px] text-[#C5A473] font-bold uppercase tracking-wider">{rol}</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-2 no-scrollbar scroll-smooth">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3.5 rounded-2xl text-sm font-bold transition-all group
          ${isActive
                  ? "bg-[#C5A473] text-white shadow-lg shadow-[#C5A473]/20"
                  : "text-white/40 hover:bg-white/5 hover:text-[#C5A473]"}`
              }
            >
              <span className="material-symbols-outlined text-2xl shrink-0">{icon}</span>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${(sidebarOpen || hovered) ? "opacity-100" : "lg:opacity-0 pointer-events-none"}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* BOTON NOTIFICACIONES */}
        {rol === 'admin' && notificationStatus !== 'granted' && (
          <div className="px-4 mb-4">
            <button
              onClick={handleEnablePush}
              className="w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition animate-pulse"
            >
              🔔 Activar Alertas
            </button>
          </div>
        )}

        {/* LOGOUT */}
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
        <header className="flex items-center justify-between px-6 py-4 bg-[#1F1F1F] lg:hidden border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-[#C5A473]/30 bg-black/50">
              <img src="/logo.png" alt="Xolos" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-black uppercase text-xs">Xolos Barber</span>
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