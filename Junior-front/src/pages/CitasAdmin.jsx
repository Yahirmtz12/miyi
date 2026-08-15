import { useState, useEffect, useRef } from "react";
import {
  FiCalendar, FiCheck, FiX, FiClock, FiLoader,
  FiUser, FiPhone, FiChevronLeft, FiChevronRight,
  FiScissors, FiBell, FiCheckCircle, FiAlertCircle,
  FiSettings, FiPlus, FiTrash2, FiEdit3, FiSave, FiRefreshCw
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { API_URL } from "../api";
import io from "socket.io-client";

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_KEY = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WHATSAPP_BARBER = '9513235437';

const HORAS = [];
for (let h = 7; h <= 22; h++) HORAS.push(`${h.toString().padStart(2, '0')}:00`);

const getLocalYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatHour = (hora) => {
  const h = parseInt(hora.split(':')[0]);
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function CitasAdmin() {
  const [activeTab, setActiveTab] = useState('pendientes'); // pendientes, calendario, config
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [citasSemana, setCitasSemana] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Config: Barbero
  const [barberos, setBarberos] = useState([]);
  const [editingBarbero, setEditingBarbero] = useState(null);
  const [showBarberoModal, setShowBarberoModal] = useState(false);
  const [barberoForm, setBarberoForm] = useState({
    nombre: '', descripcion: '', telefono: '', color: '#C5A473',
    servicios: [{ nombre: 'Corte', precio: 150, duracion: 60, esExtra: false }],
    horarioSemanal: {}
  });

  const socketRef = useRef(null);
  const token = localStorage.getItem("token");

  // Socket.io para notificaciones en tiempo real
  useEffect(() => {
    socketRef.current = io(API_URL);
    socketRef.current.emit('join-admin');

    socketRef.current.on('nueva-cita', (data) => {
      setNotification({
        tipo: 'nueva',
        msg: `💈 Nueva cita de ${data.nombreCliente} — ${data.servicio} a las ${formatHour(data.horaInicio)}`,
        data
      });
      // Refrescar pendientes y calendario
      fetchPendientes();
      fetchCitasSemana();

      // Auto-ocultar notificación después de 10s
      setTimeout(() => setNotification(null), 10000);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => { fetchPendientes(); fetchBarberos(); }, []);
  useEffect(() => { fetchCitasSemana(); }, [weekOffset]);

  const fetchPendientes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/citas/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCitasPendientes(data);
    } catch (err) { console.error('Error'); }
    finally { setLoading(false); }
  };

  const fetchCitasSemana = async () => {
    const weekDates = getWeekDates();
    const desde = getLocalYMD(weekDates[0]);
    const hasta = getLocalYMD(weekDates[6]);
    try {
      const res = await fetch(`${API_URL}/api/citas?desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCitasSemana(data);
    } catch (err) { console.error('Error'); }
  };

  const fetchBarberos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/barberos`);
      const data = await res.json();
      setBarberos(data);
    } catch (err) { console.error('Error'); }
  };

  const getWeekDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const handleAceptar = async (citaId, cita) => {
    try {
      await fetch(`${API_URL}/api/citas/${citaId}/aceptar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendientes();
      fetchCitasSemana();

      // Abrir WhatsApp para confirmar al cliente
      if (cita.telefonoCliente) {
        const fecha = new Date(cita.fecha);
        const msg = encodeURIComponent(`¡Hola ${cita.nombreCliente}! 💈\n\nTu cita en *Xolos Barbershop* ha sido *CONFIRMADA* ✅\n\n📋 ${cita.servicio}${cita.extras?.length > 0 ? ' + ' + cita.extras.map(e => e.nombre).join(', ') : ''}\n📅 ${fecha.getDate()} de ${MESES[fecha.getMonth()]}\n🕐 ${formatHour(cita.horaInicio)}\n💰 $${cita.precioTotal}\n\n¡Te esperamos! 🔥`);
        window.open(`https://wa.me/52${cita.telefonoCliente}?text=${msg}`, '_blank');
      }
    } catch (err) { console.error('Error al aceptar'); }
  };

  const handleRechazar = async (citaId, cita) => {
    try {
      await fetch(`${API_URL}/api/citas/${citaId}/rechazar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'No disponible en ese horario' })
      });
      fetchPendientes();
      fetchCitasSemana();

      // Notificar al cliente
      if (cita.telefonoCliente) {
        const msg = encodeURIComponent(`Hola ${cita.nombreCliente}, lamentablemente no podemos atenderte en el horario que solicitaste. ¿Te gustaría reagendar? 📅`);
        window.open(`https://wa.me/52${cita.telefonoCliente}?text=${msg}`, '_blank');
      }
    } catch (err) { console.error('Error al rechazar'); }
  };

  const handleCompletar = async (citaId) => {
    try {
      await fetch(`${API_URL}/api/citas/${citaId}/completar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCitasSemana();
    } catch (err) { console.error('Error'); }
  };

  const handleNoAsistio = async (citaId) => {
    if(!window.confirm('¿Seguro que quieres marcar esta cita como "No Asistió"? (Se cancelará)')) return;
    try {
      await fetch(`${API_URL}/api/citas/${citaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCitasSemana();
    } catch (err) { console.error('Error'); }
  };

  // --- CONFIG: Guardar barbero ---
  const handleSaveBarbero = async () => {
    try {
      const method = editingBarbero ? 'PUT' : 'POST';
      const url = editingBarbero ? `${API_URL}/api/barberos/${editingBarbero._id}` : `${API_URL}/api/barberos`;

      await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(barberoForm)
      });

      fetchBarberos();
      setShowBarberoModal(false);
      setEditingBarbero(null);
    } catch (err) { console.error('Error'); }
  };

  const openEditBarbero = (barbero) => {
    setEditingBarbero(barbero);
    setBarberoForm({
      nombre: barbero.nombre,
      descripcion: barbero.descripcion || '',
      telefono: barbero.telefono || '',
      color: barbero.color || '#C5A473',
      servicios: barbero.servicios || [],
      horarioSemanal: barbero.horarioSemanal || {}
    });
    setShowBarberoModal(true);
  };

  const openNewBarbero = () => {
    setEditingBarbero(null);
    setBarberoForm({
      nombre: '', descripcion: '', telefono: WHATSAPP_BARBER, color: '#C5A473',
      servicios: [
        { nombre: 'Corte', precio: 150, duracion: 60, esExtra: false },
        { nombre: 'Barba', precio: 50, duracion: 60, esExtra: true },
        { nombre: 'Ceja', precio: 50, duracion: 60, esExtra: true },
      ],
      horarioSemanal: {
        lunes: { activo: true, inicio: '09:00', fin: '19:00' },
        martes: { activo: true, inicio: '09:00', fin: '19:00' },
        miercoles: { activo: true, inicio: '09:00', fin: '19:00' },
        jueves: { activo: true, inicio: '09:00', fin: '19:00' },
        viernes: { activo: true, inicio: '09:00', fin: '19:00' },
        sabado: { activo: true, inicio: '09:00', fin: '15:00' },
        domingo: { activo: false, inicio: '00:00', fin: '00:00' },
      }
    });
    setShowBarberoModal(true);
  };

  const estadoColor = {
    pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: '🟡 Pendiente' },
    confirmada: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: '✅ Confirmada' },
    rechazada: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: '❌ Rechazada' },
    completada: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: '🏁 Completada' },
    cancelada: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: '🚫 Cancelada' },
  };

  return (
    <div className="space-y-6">
      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#C5A473] text-white p-4 rounded-2xl shadow-2xl shadow-[#C5A473]/30 flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 max-w-sm">
          <FiBell className="text-2xl animate-bounce shrink-0" />
          <p className="text-sm font-bold">{notification.msg}</p>
          <button onClick={() => setNotification(null)} className="shrink-0 p-1 hover:bg-white/20 rounded-full">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white flex items-center">
            <img src="/logo.png" alt="Xolos" className="w-8 h-8 object-contain mr-3 bg-black/50 rounded-full border border-[#C5A473]/30" /> 
            Panel de Citas
          </h1>
          <p className="text-white/30 text-xs mt-1 font-bold uppercase tracking-widest">Xolos Barbershop</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { fetchPendientes(); fetchCitasSemana(); }} 
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            title="Refrescar Citas"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
          
          {citasPendientes.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-xs font-black">{citasPendientes.length} pendientes</span>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'pendientes', label: 'Pendientes', icon: <FiBell />, count: citasPendientes.length },
          { key: 'calendario', label: 'Calendario', icon: <FiCalendar /> },
          { key: 'config', label: 'Configuración', icon: <FiSettings /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${
              activeTab === tab.key
                ? 'bg-[#C5A473]/10 border-[#C5A473]/30 text-[#C5A473]'
                : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: PENDIENTES */}
      {activeTab === 'pendientes' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="animate-spin text-[#C5A473] w-8 h-8" />
            </div>
          ) : citasPendientes.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
              <FiCheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500/30" />
              <p className="text-sm font-black uppercase tracking-widest text-white/20">Sin citas pendientes</p>
              <p className="text-xs text-white/10 mt-2">Cuando un cliente agende, aparecerá aquí</p>
            </div>
          ) : (
            citasPendientes.map((cita) => {
              const fecha = new Date(cita.fecha);
              return (
                <div key={cita._id} className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <FiUser className="text-amber-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white">{cita.nombreCliente}</h3>
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <FiPhone className="text-[10px]" /> {cita.telefonoCliente || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Pendiente
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Servicio</p>
                      <p className="text-sm font-bold text-white">{cita.servicio}</p>
                      {cita.extras?.length > 0 && (
                        <p className="text-[10px] text-[#8C6A3B] font-bold mt-0.5">+ {cita.extras.map(e => e.nombre).join(', ')}</p>
                      )}
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Fecha</p>
                      <p className="text-sm font-bold text-white">{fecha.getDate()} {MESES[fecha.getMonth()]}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Hora</p>
                      <p className="text-sm font-bold text-white">{formatHour(cita.horaInicio)}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Total</p>
                      <p className="text-sm font-bold text-[#C5A473]">${cita.precioTotal}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAceptar(cita._id, cita)}
                      className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                    >
                      <FiCheck className="text-base" /> Aceptar
                    </button>
                    <button
                      onClick={() => handleRechazar(cita._id, cita)}
                      className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-black rounded-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                    >
                      <FiX className="text-base" /> Rechazar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: CALENDARIO */}
      {activeTab === 'calendario' && (
        <div className="space-y-4">
          {/* Navegador de semana */}
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-3">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xs md:text-sm font-black uppercase tracking-wider">
                {weekDates[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                Semana del {weekDates[0].getDate()} al {weekDates[6].getDate()}
              </p>
            </div>
            <div className="flex gap-2">
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="px-3 py-2.5 bg-[#C5A473]/10 text-[#C5A473] rounded-xl text-[10px] font-black uppercase border border-[#C5A473]/20">
                  Hoy
                </button>
              )}
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Citas por día */}
          <div className="space-y-3">
            {weekDates.map((date, i) => {
              const dateStr = getLocalYMD(date);
              const citasDelDia = citasSemana.filter(c => {
                const citaDate = c.fecha?.split('T')[0] || new Date(c.fecha).toISOString().split('T')[0];
                return citaDate === dateStr;
              });
              const today = isToday(date);

              return (
                <div key={i} className={`bg-white/[0.02] border rounded-2xl overflow-hidden ${today ? 'border-[#C5A473]/30' : 'border-white/5'}`}>
                  <div className={`px-4 py-3 flex items-center justify-between ${today ? 'bg-[#C5A473]/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${today ? 'text-[#C5A473]' : 'text-white/60'}`}>{date.getDate()}</span>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${today ? 'text-[#C5A473]' : 'text-white/40'}`}>
                          {DIAS_SEMANA[i]}
                        </p>
                        {today && <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A473]/60">Hoy</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white/20">
                      {citasDelDia.length} {citasDelDia.length === 1 ? 'cita' : 'citas'}
                    </span>
                  </div>

                  {citasDelDia.length > 0 && (
                    <div className="px-4 pb-3 space-y-2">
                      {citasDelDia.map((cita) => {
                        const estado = estadoColor[cita.estado] || estadoColor.pendiente;
                        return (
                          <div key={cita._id} className={`flex items-center justify-between p-3 rounded-xl ${estado.bg} border ${estado.border}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0">
                                <p className={`text-xs font-black ${estado.text}`}>{formatHour(cita.horaInicio)}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{cita.nombreCliente}</p>
                                <p className="text-[10px] text-white/40 truncate">{cita.servicio}{cita.extras?.length > 0 ? ` + ${cita.extras.map(e => e.nombre).join(', ')}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[8px] font-black uppercase tracking-widest ${estado.text}`}>{cita.estado}</span>
                              {cita.estado === 'confirmada' && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleCompletar(cita._id)} className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition" title="Marcar completada (Registrar Venta)">
                                    <FiCheckCircle className="w-3.5 h-3.5 text-blue-400" />
                                  </button>
                                  <button onClick={() => handleNoAsistio(cita._id)} className="p-1.5 bg-gray-500/10 border border-gray-500/20 rounded-lg hover:bg-gray-500/20 transition" title="No asistió (Cancelar sin venta)">
                                    <FiX className="w-3.5 h-3.5 text-gray-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: CONFIGURACIÓN */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight">Barberos y Horarios</h2>
            <button
              onClick={openNewBarbero}
              className="flex items-center gap-2 px-4 py-2 bg-[#C5A473]/10 border border-[#C5A473]/20 text-[#C5A473] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#C5A473]/20 transition"
            >
              <FiPlus /> Nuevo Barbero
            </button>
          </div>

          {barberos.map((barbero) => (
            <div key={barbero._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: barbero.color + '20', borderColor: barbero.color + '40', border: '1px solid' }}>
                    <FiScissors style={{ color: barbero.color }} />
                  </div>
                  <div>
                    <h3 className="font-black text-white">{barbero.nombre}</h3>
                    <p className="text-white/30 text-xs">{barbero.telefono}</p>
                  </div>
                </div>
                <button onClick={() => openEditBarbero(barbero)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <FiEdit3 className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {/* Servicios */}
              <div className="flex flex-wrap gap-2">
                {barbero.servicios?.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                    {s.nombre} — ${s.precio} {s.esExtra && '(extra)'}
                  </span>
                ))}
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-7 gap-1">
                {DIAS_KEY.map((dia, i) => {
                  const h = barbero.horarioSemanal?.[dia];
                  return (
                    <div key={dia} className={`text-center p-2 rounded-xl ${h?.activo ? 'bg-[#C5A473]/5 border border-[#C5A473]/20' : 'bg-white/[0.02] border border-white/5'}`}>
                      <p className={`text-[8px] font-black uppercase ${h?.activo ? 'text-[#C5A473]' : 'text-white/20'}`}>{DIAS_SEMANA[i].slice(0,3)}</p>
                      {h?.activo && <p className="text-[7px] text-white/30 mt-0.5">{h.inicio}-{h.fin}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREAR/EDITAR BARBERO */}
      {showBarberoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#161616] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex justify-between items-start sticky top-0 bg-[#161616] z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A473]">
                  {editingBarbero ? 'Editar' : 'Nuevo'} Barbero
                </p>
                <h2 className="text-lg font-black uppercase tracking-tighter">{editingBarbero ? barberoForm.nombre : 'Configuración'}</h2>
              </div>
              <button onClick={() => setShowBarberoModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info básica */}
              <div className="space-y-3">
                <input type="text" placeholder="Nombre del barbero" value={barberoForm.nombre} onChange={e => setBarberoForm({...barberoForm, nombre: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#C5A473] outline-none text-sm font-bold transition placeholder:text-white/15"
                />
                <input type="tel" placeholder="Teléfono (WhatsApp)" value={barberoForm.telefono} onChange={e => setBarberoForm({...barberoForm, telefono: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#C5A473] outline-none text-sm font-bold transition placeholder:text-white/15"
                />
              </div>

              {/* Servicios */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Servicios</p>
                {barberoForm.servicios.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={s.nombre} onChange={e => { const arr = [...barberoForm.servicios]; arr[i].nombre = e.target.value; setBarberoForm({...barberoForm, servicios: arr}); }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-bold outline-none focus:border-[#C5A473]" placeholder="Nombre" />
                    <input type="number" value={s.precio} onChange={e => { const arr = [...barberoForm.servicios]; arr[i].precio = Number(e.target.value); setBarberoForm({...barberoForm, servicios: arr}); }}
                      className="w-20 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-bold outline-none focus:border-[#C5A473]" placeholder="$" />
                    <label className="flex items-center gap-1 text-[9px] text-white/30 font-bold">
                      <input type="checkbox" checked={s.esExtra} onChange={e => { const arr = [...barberoForm.servicios]; arr[i].esExtra = e.target.checked; setBarberoForm({...barberoForm, servicios: arr}); }}
                        className="accent-[#C5A473]" /> Extra
                    </label>
                    <button onClick={() => { const arr = barberoForm.servicios.filter((_, idx) => idx !== i); setBarberoForm({...barberoForm, servicios: arr}); }}
                      className="p-2 text-red-400/50 hover:text-red-400"><FiTrash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => setBarberoForm({...barberoForm, servicios: [...barberoForm.servicios, { nombre: '', precio: 0, duracion: 60, esExtra: false }]})}
                  className="text-[#C5A473] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline mt-1">
                  <FiPlus className="w-3 h-3" /> Agregar servicio
                </button>
              </div>

              {/* Horario semanal */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Horario Semanal</p>
                {DIAS_KEY.map((dia, i) => {
                  const h = barberoForm.horarioSemanal[dia] || { activo: false, inicio: '09:00', fin: '19:00' };
                  return (
                    <div key={dia} className="flex items-center gap-3 mb-2">
                      <label className="flex items-center gap-2 w-28">
                        <input type="checkbox" checked={h.activo} onChange={e => {
                          const hs = {...barberoForm.horarioSemanal};
                          hs[dia] = { ...h, activo: e.target.checked };
                          setBarberoForm({...barberoForm, horarioSemanal: hs});
                        }} className="accent-[#C5A473]" />
                        <span className={`text-xs font-bold ${h.activo ? 'text-white' : 'text-white/20'}`}>{DIAS_SEMANA[i]}</span>
                      </label>
                      {h.activo && (
                        <div className="flex items-center gap-2">
                          <select value={h.inicio} onChange={e => { const hs = {...barberoForm.horarioSemanal}; hs[dia] = { ...h, inicio: e.target.value }; setBarberoForm({...barberoForm, horarioSemanal: hs}); }}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none">
                            {HORAS.map(hr => <option key={hr} value={hr}>{hr}</option>)}
                          </select>
                          <span className="text-white/20 text-xs">a</span>
                          <select value={h.fin} onChange={e => { const hs = {...barberoForm.horarioSemanal}; hs[dia] = { ...h, fin: e.target.value }; setBarberoForm({...barberoForm, horarioSemanal: hs}); }}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none">
                            {HORAS.map(hr => <option key={hr} value={hr}>{hr}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button onClick={handleSaveBarbero} className="w-full py-4 bg-[#C5A473] text-white font-black rounded-2xl uppercase tracking-widest text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2">
                <FiSave /> {editingBarbero ? 'Guardar Cambios' : 'Crear Barbero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
