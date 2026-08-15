import { useState, useEffect } from "react";
import {
  FiCalendar, FiClock, FiLogOut, FiScissors, FiLoader,
  FiCheckCircle, FiAlertCircle, FiXCircle, FiPhone,
  FiChevronRight, FiPlus
} from "react-icons/fi";
import { API_URL } from "../api";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatHour = (hora) => {
  if (!hora) return '';
  const h = parseInt(hora.split(':')[0]);
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todas'); // todas, proximas, pasadas

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      if (!storedUser) return;
      setUser(storedUser);

      try {
        const res = await fetch(`${API_URL}/api/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) { console.log("Error actualizando datos."); }

      // Cargar citas
      try {
        const citasRes = await fetch(`${API_URL}/api/citas/mis-citas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const citasData = await citasRes.json();
        if (citasRes.ok) setCitas(citasData);
      } catch (err) { console.log("Error cargando citas."); }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const citasFiltradas = citas.filter(c => {
    const fechaCita = new Date(c.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    
    if (activeFilter === 'proximas') return fechaCita >= hoy && (c.estado === 'pendiente' || c.estado === 'confirmada');
    if (activeFilter === 'pasadas') return fechaCita < hoy || c.estado === 'completada' || c.estado === 'rechazada' || c.estado === 'cancelada';
    return true;
  });

  const proximaCita = citas.find(c => {
    const fechaCita = new Date(c.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    return fechaCita >= hoy && (c.estado === 'pendiente' || c.estado === 'confirmada');
  });

  const estadoConfig = {
    pendiente: { icon: <FiAlertCircle />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Pendiente' },
    confirmada: { icon: <FiCheckCircle />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Confirmada' },
    rechazada: { icon: <FiXCircle />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Rechazada' },
    completada: { icon: <FiCheckCircle />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Completada' },
    cancelada: { icon: <FiXCircle />, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Cancelada' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <FiLoader className="animate-spin text-[#C5A473] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C5A473]/10 rounded-xl flex items-center justify-center border border-[#C5A473]/20">
              <FiScissors className="text-[#C5A473]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider">Xolos Barber</h1>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Mi cuenta</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition">
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* BIENVENIDA */}
        <div className="bg-gradient-to-br from-[#C5A473]/10 via-transparent to-transparent border border-[#C5A473]/10 rounded-3xl p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A473] mb-1">Bienvenido</p>
          <h2 className="text-2xl font-black uppercase tracking-tighter">{user?.nombre || 'Cliente'}</h2>
          {user?.telefono && (
            <p className="text-white/30 text-xs flex items-center gap-1 mt-1">
              <FiPhone className="text-[10px]" /> {user.telefono}
            </p>
          )}
        </div>

        {/* PRÓXIMA CITA */}
        {proximaCita && (
          <div className="bg-white/[0.03] border border-[#C5A473]/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A473]">Próxima cita</p>
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${estadoConfig[proximaCita.estado]?.bg} ${estadoConfig[proximaCita.estado]?.border} border ${estadoConfig[proximaCita.estado]?.color}`}>
                {estadoConfig[proximaCita.estado]?.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#C5A473]/10 rounded-2xl flex flex-col items-center justify-center border border-[#C5A473]/20">
                <span className="text-xl font-black text-[#C5A473]">{new Date(proximaCita.fecha).getDate()}</span>
                <span className="text-[7px] font-black uppercase text-[#C5A473]/60">{MESES[new Date(proximaCita.fecha).getMonth()]?.slice(0,3)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-white">{proximaCita.servicio}</h3>
                {proximaCita.extras?.length > 0 && (
                  <p className="text-[10px] text-[#8C6A3B] font-bold">+ {proximaCita.extras.map(e => e.nombre).join(', ')}</p>
                )}
                <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                  <FiClock className="text-[10px]" /> {formatHour(proximaCita.horaInicio)} — ${proximaCita.precioTotal}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN AGENDAR */}
        <button
          onClick={() => window.location.href = '/agendar'}
          className="w-full py-4 bg-[#C5A473] text-white font-black rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-[#C5A473]/20"
        >
          <FiPlus className="text-lg" /> Agendar Nueva Cita
        </button>

        {/* FILTROS */}
        <div className="flex gap-2">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'proximas', label: 'Próximas' },
            { key: 'pasadas', label: 'Pasadas' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeFilter === f.key
                  ? 'bg-[#C5A473]/10 border-[#C5A473]/20 text-[#C5A473]'
                  : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* LISTA DE CITAS */}
        <div className="space-y-3">
          {citasFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/5">
              <FiCalendar className="w-12 h-12 mx-auto mb-4 text-white/10" />
              <p className="text-sm font-black uppercase tracking-widest text-white/20">No tienes citas</p>
              <p className="text-xs text-white/10 mt-2">Agenda tu primera cita y aparecerá aquí</p>
            </div>
          ) : (
            citasFiltradas.map((cita) => {
              const fecha = new Date(cita.fecha);
              const estado = estadoConfig[cita.estado] || estadoConfig.pendiente;
              return (
                <div key={cita._id} className={`${estado.bg} border ${estado.border} rounded-2xl p-4 flex items-center gap-4`}>
                  <div className="w-12 h-12 bg-black/20 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg font-black">{fecha.getDate()}</span>
                    <span className="text-[7px] font-bold uppercase text-white/40">{MESES[fecha.getMonth()]?.slice(0,3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">{cita.servicio}</h3>
                      {cita.extras?.length > 0 && <span className="text-[9px] text-[#8C6A3B] font-bold">+{cita.extras.length}</span>}
                    </div>
                    <p className="text-white/30 text-[10px] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5"><FiClock className="text-[8px]" /> {formatHour(cita.horaInicio)}</span>
                      <span>•</span>
                      <span>${cita.precioTotal}</span>
                    </p>
                  </div>
                  <span className={`text-lg ${estado.color}`}>{estado.icon}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}