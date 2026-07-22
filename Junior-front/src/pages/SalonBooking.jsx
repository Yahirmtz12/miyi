import { useState, useEffect } from "react";
import {
  FiCalendar, FiPlus, FiTrash2, FiCheck, FiX,
  FiClock, FiLoader, FiEdit3, FiChevronLeft, FiChevronRight,
  FiUser, FiPhone, FiCheckCircle, FiAlertCircle, FiSettings
} from "react-icons/fi";
import { API_URL } from "../api";

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Generar franjas horarias de 7 AM a 10 PM
const FRANJAS = [];
for (let h = 7; h <= 21; h++) {
  FRANJAS.push({
    inicio: `${h.toString().padStart(2, '0')}:00`,
    fin: `${(h + 1).toString().padStart(2, '0')}:00`,
    label: `${h > 12 ? h - 12 : h}–${h + 1 > 12 ? h + 1 - 12 : h + 1} ${h >= 12 ? 'PM' : 'AM'}`,
  });
}

const HORAS_SELECT = [];
for (let h = 7; h <= 22; h++) {
  HORAS_SELECT.push(`${h.toString().padStart(2, '0')}:00`);
}

// Colores aleatorios para bloques de notas diferentes
const SLOT_COLORS = [
  { bg: 'rgba(99,102,241,0.25)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc' },   // indigo
  { bg: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.4)', text: '#f9a8d4' },   // pink
  { bg: 'rgba(34,211,238,0.25)', border: 'rgba(34,211,238,0.4)', text: '#67e8f9' },    // cyan
  { bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.4)', text: '#fdba74' },    // orange
  { bg: 'rgba(163,230,53,0.25)', border: 'rgba(163,230,53,0.4)', text: '#bef264' },    // lime
  { bg: 'rgba(232,121,249,0.25)', border: 'rgba(232,121,249,0.4)', text: '#e879f9' },  // fuchsia
  { bg: 'rgba(250,204,21,0.25)', border: 'rgba(250,204,21,0.4)', text: '#fde047' },    // yellow
  { bg: 'rgba(45,212,191,0.25)', border: 'rgba(45,212,191,0.4)', text: '#5eead4' },    // teal
  { bg: 'rgba(248,113,113,0.25)', border: 'rgba(248,113,113,0.4)', text: '#fca5a5' },  // red
  { bg: 'rgba(96,165,250,0.25)', border: 'rgba(96,165,250,0.4)', text: '#93c5fd' },    // blue
];

// Paleta de colores predefinidos para selección rápida
const PRESET_COLORS = [
  { color: '#6366f1', label: 'Índigo' },
  { color: '#ec4899', label: 'Rosa' },
  { color: '#22d3ee', label: 'Cyan' },
  { color: '#fb923c', label: 'Naranja' },
  { color: '#a3e635', label: 'Lima' },
  { color: '#e879f9', label: 'Fucsia' },
  { color: '#facc15', label: 'Amarillo' },
  { color: '#2dd4bf', label: 'Teal' },
  { color: '#f87171', label: 'Rojo' },
  { color: '#60a5fa', label: 'Azul' },
  { color: '#c084fc', label: 'Morado' },
  { color: '#4ade80', label: 'Verde' },
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const getLocalYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function SalonBooking() {
  const [salones, setSalones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeSalonIndex, setActiveSalonIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSalonModal, setShowSalonModal] = useState(false);
  const [editingSalon, setEditingSalon] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  // Form states
  const [newSlot, setNewSlot] = useState({
    salon: '',
    fecha: '',
    horaInicio: '09:00',
    horaFin: '10:00',
    notas: '',
    color: '',
    repetirSemanalmente: false,
    repetirHasta: '',
  });
  const [salonForm, setSalonForm] = useState({ nombre: '', descripcion: '', color: '#C5A473', colorOcupado: '#ef4444' });

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Obtener la semana (empezando en Lunes)
  const getWeekDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lunes como primer día
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
  const desde = getLocalYMD(weekDates[0]);
  const hasta = getLocalYMD(weekDates[6]);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => { fetchSalones(); }, []);
  useEffect(() => { fetchSlots(); }, [weekOffset]);

  const fetchSalones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/salones`);
      const data = await res.json();
      setSalones(data);
      if (data.length > 0 && !newSlot.salon) {
        setNewSlot(prev => ({ ...prev, salon: data[0]._id }));
      }
    } catch (err) { console.error('Error al cargar salones', err); }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/salones/slots?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();
      setSlots(data);
    } catch (err) { console.error('Error al cargar slots', err); }
    finally { setLoading(false); }
  };

  // CRUD Salones
  const handleSaveSalon = async () => {
    if (!salonForm.nombre.trim()) return;
    try {
      const method = editingSalon ? 'PUT' : 'POST';
      const url = editingSalon ? `${API_URL}/api/salones/${editingSalon._id}` : `${API_URL}/api/salones`;
      const res = await fetch(url, { method, headers, body: JSON.stringify(salonForm) });
      const data = await res.json();
      if (res.ok) {
        fetchSalones();
        setShowSalonModal(false);
        setEditingSalon(null);
        setSalonForm({ nombre: '', descripcion: '', color: '#C5A473', colorOcupado: '#ef4444' });
        showToast(editingSalon ? 'Salón actualizado' : 'Salón creado');
      } else {
        showToast(data.msg || 'Error al guardar salón', 'error');
      }
    } catch (err) {
      console.error('Error al guardar salón:', err);
      showToast('Error de conexión al guardar salón', 'error');
    }
  };

  const handleDeleteSalon = async (id) => {
    if (!confirm('¿Desactivar este salón?')) return;
    try {
      await fetch(`${API_URL}/api/salones/${id}`, { method: 'DELETE', headers });
      fetchSalones();
      fetchSlots();
      showToast('Salón desactivado');
    } catch (err) { showToast('Error', 'error'); }
  };

  // CRUD Slots
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/salones/slots`, {
        method: 'POST', headers,
        body: JSON.stringify(newSlot),
      });
      const data = await res.json();
      if (res.ok) {
        fetchSlots();
        setShowCreateModal(false);
        showToast('Horario creado');
      } else {
        showToast(data.msg || 'Error al crear', 'error');
      }
    } catch (err) { showToast('Error de conexión', 'error'); }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await fetch(`${API_URL}/api/salones/slots/${id}`, { method: 'DELETE', headers });
      fetchSlots();
      setSelectedSlot(null);
      showToast('Horario eliminado');
    } catch (err) { showToast('Error', 'error'); }
  };

  const handleConfirmSlot = async (id) => {
    try {
      await fetch(`${API_URL}/api/salones/slots/${id}/confirmar`, { method: 'PUT', headers });
      fetchSlots();
      setSelectedSlot(null);
      showToast('Reservación confirmada');
    } catch (err) { showToast('Error', 'error'); }
  };

  const handleRejectSlot = async (id) => {
    try {
      await fetch(`${API_URL}/api/salones/slots/${id}/rechazar`, { method: 'PUT', headers });
      fetchSlots();
      setSelectedSlot(null);
      showToast('Reservación rechazada');
    } catch (err) { showToast('Error', 'error'); }
  };

  // Helpers
  const activeSalon = salones[activeSalonIndex] || null;

  const getSlotForCell = (date, franja) => {
    if (!activeSalon) return null;
    const dateStr = getLocalYMD(date);
    return slots.find(s => {
      // s.fecha es un ISO string de MongoDB (ej. "2026-07-19T00:00:00.000Z")
      // Extraemos solo la parte YYYY-MM-DD para evitar desplazamientos por zona horaria
      const slotDate = s.fecha.split('T')[0];
      const slotSalonId = typeof s.salon === 'object' ? s.salon._id : s.salon;
      if (slotDate !== dateStr || slotSalonId !== activeSalon._id) return false;
      // El slot cubre esta franja si horaInicio <= franja.inicio y horaFin > franja.inicio
      return s.horaInicio <= franja.inicio && s.horaFin > franja.inicio;
    });
  };

  const getSlotSpan = (slot, franjaIndex) => {
    // Calcular cuántas franjas ocupa este slot
    const startHour = parseInt(slot.horaInicio.split(':')[0]);
    const endHour = parseInt(slot.horaFin.split(':')[0]);
    return endHour - startHour;
  };

  const isSlotStart = (date, franja, slot) => {
    return slot && slot.horaInicio === franja.inicio;
  };

  const getSlotColor = (slot) => {
    // Si el slot tiene un color individual asignado, usarlo
    if (slot.color) {
      const c = slot.color;
      return { bg: c + '30', border: c + '60', text: c };
    }
    if (slot.estado === 'reservado') return { bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' };
    // Para clases fijas (confirmado) usar color basado en las notas
    const key = slot.notas || slot._id || '';
    const idx = hashString(key) % SLOT_COLORS.length;
    return SLOT_COLORS[idx];
  };

  const getEstadoLabel = (estado) => {
    switch(estado) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Pendiente';
      case 'confirmado': return 'Ocupado';
      default: return estado;
    }
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  // Contar pendientes
  const pendientes = slots.filter(s => s.estado === 'reservado');

  // Cambiar color de todos los slots con el mismo nombre (bulk)
  const handleUpdateSlotColor = async (id, newColor) => {
    try {
      const res = await fetch(`${API_URL}/api/salones/slots/bulk-color`, {
        method: 'PUT', headers,
        body: JSON.stringify({ slotId: id, color: newColor }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchSlots();
        setSelectedSlot(prev => prev ? { ...prev, color: newColor } : null);
        showToast(data.msg || 'Color actualizado');
      }
    } catch (err) { showToast('Error al cambiar color', 'error'); }
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-3 duration-300">
          <div className={`${toastType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} border backdrop-blur-xl px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl`}>
            {toastType === 'error' ? <FiAlertCircle className="shrink-0" /> : <FiCheckCircle className="shrink-0" />}
            <span className="text-xs font-bold uppercase tracking-wide">{toast}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0 shadow-lg shadow-primary/10">
            <FiCalendar className="text-secondary w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Salones</h1>
            <p className="text-white/40 text-[10px] md:text-sm italic">Gestión de horarios y disponibilidad</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSalonForm({ nombre: '', descripcion: '', color: '#C5A473', colorOcupado: '#ef4444' });
              setEditingSalon(null);
              setShowSalonModal(true);
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black py-3 px-5 rounded-2xl transition-all border border-white/10 uppercase text-[10px] tracking-widest"
          >
            <FiSettings className="w-4 h-4" /> Config
          </button>
          <button
            onClick={() => {
              if (activeSalon) setNewSlot(prev => ({ ...prev, salon: activeSalon._id }));
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-[#00205B] text-white font-black py-3 px-5 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase text-[10px] tracking-widest"
          >
            <FiPlus className="w-4 h-4" /> Nuevo Horario
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-5 max-w-[95rem] mx-auto">

        {/* TABS DE SALONES */}
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {salones.map((salon, i) => (
            <button
              key={salon._id}
              onClick={() => setActiveSalonIndex(i)}
              className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border ${
                activeSalonIndex === i
                  ? 'text-white shadow-lg'
                  : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
              style={activeSalonIndex === i ? {
                backgroundColor: salon.color + '20',
                borderColor: salon.color + '40',
                boxShadow: `0 8px 30px ${salon.color}15`,
              } : {}}
            >
              <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: salon.color }} />
              <span className="text-sm md:text-base">{salon.nombre}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSalon(salon);
                  setSalonForm({ nombre: salon.nombre, descripcion: salon.descripcion || '', color: salon.color, colorOcupado: salon.colorOcupado || '#ef4444' });
                  setShowSalonModal(true);
                }}
                className="p-1 text-white/20 hover:text-white/60 transition-all ml-1"
              >
                <FiEdit3 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>

        {/* NAVEGADOR DE SEMANA + INDICADORES */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl p-3">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-sm font-black uppercase tracking-wider">
                {weekDates[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {weekDates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="flex gap-2">
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  Hoy
                </button>
              )}
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90">
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mini indicadores */}
          <div className="flex gap-3">
            <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-2xl flex items-center gap-2">
              <span className="text-lg font-black text-emerald-400">{slots.filter(s => s.estado === 'disponible').length}</span>
              <span className="text-[8px] font-black uppercase text-emerald-400/50 tracking-widest">Disp.</span>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-2xl flex items-center gap-2 relative">
              <span className="text-lg font-black text-amber-400">{pendientes.length}</span>
              <span className="text-[8px] font-black uppercase text-amber-400/50 tracking-widest">Pend.</span>
              {pendientes.length > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />}
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-2xl flex items-center gap-2">
              <span className="text-lg font-black text-blue-400">{slots.filter(s => s.estado === 'confirmado').length}</span>
              <span className="text-[8px] font-black uppercase text-blue-400/50 tracking-widest">Conf.</span>
            </div>
          </div>
        </div>

        {/* RESERVACIONES PENDIENTES */}
        {pendientes.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <FiAlertCircle size={14} /> Pendientes ({pendientes.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {pendientes.map(slot => (
                <div key={slot._id} className="shrink-0 bg-black/40 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 min-w-[250px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{slot.nombreReserva || slot.reservadoPor?.nombre || 'Sin nombre'}</p>
                    <p className="text-[9px] text-white/40 font-bold">
                      {slot.salon?.nombre} • {new Date(slot.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} • {slot.horaInicio}-{slot.horaFin}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleConfirmSlot(slot._id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all active:scale-90" title="Confirmar">
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRejectSlot(slot._id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all active:scale-90" title="Rechazar">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRILLA HORARIA — ESTILO TABLA */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : activeSalon ? (
          <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden">
            {/* Título del salón */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3" style={{ background: `linear-gradient(90deg, ${activeSalon.color}10, transparent)` }}>
              <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: activeSalon.color, boxShadow: `0 0 15px ${activeSalon.color}60` }} />
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">{activeSalon.nombre}</h2>
              {activeSalon.descripcion && <span className="text-xs text-white/30 italic hidden md:inline">— {activeSalon.descripcion}</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                {/* Header: Días de la semana */}
                <thead>
                  <tr>
                    <th className="w-20 p-2 text-[9px] font-black uppercase tracking-widest text-white/20 border-b border-r border-white/5 bg-black/30 sticky left-0 z-10">
                      Hora
                    </th>
                    {weekDates.map((date, i) => (
                      <th key={i} className={`p-3 text-center border-b border-white/5 ${isToday(date) ? 'bg-primary/[0.06]' : ''}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isToday(date) ? 'text-primary' : 'text-white/25'}`}>
                          {DIAS_CORTO[i]}
                        </p>
                        <p className={`text-base font-black ${isToday(date) ? 'text-primary' : 'text-white/70'}`}>
                          {date.getDate()}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body: Franjas horarias */}
                <tbody>
                  {FRANJAS.map((franja, fi) => (
                    <tr key={fi} className="group">
                      {/* Hora */}
                      <td className="p-1.5 text-[9px] font-black text-white/20 uppercase tracking-wider border-r border-white/5 bg-black/30 sticky left-0 z-10 text-center whitespace-nowrap">
                        {franja.label}
                      </td>

                      {/* Celdas por día */}
                      {weekDates.map((date, di) => {
                        const slot = getSlotForCell(date, franja);
                        const isStart = slot && isSlotStart(date, franja, slot);
                        const span = slot ? getSlotSpan(slot, fi) : 1;
                        const color = slot ? getSlotColor(slot) : null;

                        // Si el slot no empieza aquí pero existe, no renderizar celda (está cubierta por rowspan)
                        if (slot && !isStart) return null;

                        if (slot && isStart) {
                          return (
                            <td
                              key={di}
                              rowSpan={span}
                              className={`p-1 border border-white/[0.03] relative ${isToday(date) ? 'bg-primary/[0.02]' : ''}`}
                            >
                              <button
                                onClick={() => setSelectedSlot(slot)}
                                className="w-full h-full rounded-xl p-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-center min-h-[40px]"
                                style={{
                                  backgroundColor: color.bg,
                                  border: `1px solid ${color.border}`,
                                }}
                              >
                                <p className="text-[10px] font-black leading-tight truncate" style={{ color: color.text }}>
                                  {slot.estado === 'reservado' ? 'Pendiente' : (slot.notas || slot.nombreReserva || 'Ocupado')}
                                </p>
                                {slot.estado === 'reservado' && (slot.nombreReserva || slot.notas) && (
                                  <p className="text-[8px] opacity-60 truncate mt-0.5" style={{ color: color.text }}>
                                    {slot.nombreReserva || slot.notas}
                                  </p>
                                )}
                                <p className="text-[7px] opacity-40 mt-0.5" style={{ color: color.text }}>
                                  {slot.horaInicio}–{slot.horaFin}
                                </p>
                              </button>
                            </td>
                          );
                        }

                        // Celda vacía
                        return (
                          <td
                            key={di}
                            className={`p-1 border border-white/[0.03] ${isToday(date) ? 'bg-primary/[0.02]' : ''}`}
                          >
                            <button
                              onClick={() => {
                                setNewSlot({
                                  salon: activeSalon._id,
                                  fecha: getLocalYMD(date),
                                  horaInicio: franja.inicio,
                                  horaFin: franja.fin,
                                  notas: '',
                                  repetirSemanalmente: false,
                                  repetirHasta: '',
                                });
                                setShowCreateModal(true);
                              }}
                              className="w-full h-full min-h-[40px] rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-white/5 flex items-center justify-center"
                            >
                              <FiPlus className="w-3 h-3 text-white/15" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div className="p-3 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-[8px] font-black uppercase tracking-widest text-white/20">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-500/25 border border-indigo-500/40" /> Clase / Ocupado
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500/25 border border-amber-500/40" /> Pendiente
              </div>
              <div className="flex items-center gap-1.5 text-white/10">
                Clic en celda vacía para agregar horario ocupado
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-white/20">
            <FiCalendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-black uppercase tracking-widest">No hay salones registrados</p>
            <p className="text-xs text-white/10 mt-2">Crea salones desde el botón "Config"</p>
          </div>
        )}
      </main>

      {/* MODAL: CREAR HORARIO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Nuevo Horario</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSlot} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Salón</label>
                <select
                  value={newSlot.salon}
                  onChange={(e) => setNewSlot({ ...newSlot, salon: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm cursor-pointer appearance-none font-bold"
                  required
                >
                  {salones.map(s => (
                    <option key={s._id} value={s._id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest flex items-center gap-2">
                  <FiCalendar className="text-primary" /> Fecha
                </label>
                <input
                  type="date"
                  value={newSlot.fecha}
                  onChange={(e) => setNewSlot({ ...newSlot, fecha: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none font-bold [color-scheme:dark]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Hora Inicio</label>
                  <select
                    value={newSlot.horaInicio}
                    onChange={(e) => setNewSlot({ ...newSlot, horaInicio: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm cursor-pointer appearance-none font-bold"
                  >
                    {HORAS_SELECT.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Hora Fin</label>
                  <select
                    value={newSlot.horaFin}
                    onChange={(e) => setNewSlot({ ...newSlot, horaFin: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm cursor-pointer appearance-none font-bold"
                  >
                    {HORAS_SELECT.filter(h => h > newSlot.horaInicio).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Nombre / Clase (Opcional)</label>
                <input
                  type="text"
                  value={newSlot.notas}
                  onChange={(e) => setNewSlot({ ...newSlot, notas: e.target.value })}
                  placeholder="Ej: SALSA, KPOP, URBANO, XV..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm transition placeholder:text-white/10 uppercase font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((pc) => (
                    <button
                      key={pc.color}
                      type="button"
                      onClick={() => setNewSlot({ ...newSlot, color: newSlot.color === pc.color ? '' : pc.color })}
                      className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${newSlot.color === pc.color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1F1F1F] scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: pc.color }}
                      title={pc.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newSlot.repetirSemanalmente}
                    onChange={(e) => setNewSlot({ ...newSlot, repetirSemanalmente: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Repetir cada semana</span>
                </label>
              </div>

              {newSlot.repetirSemanalmente && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Repetir hasta (Fecha final)</label>
                  <input
                    type="date"
                    value={newSlot.repetirHasta}
                    onChange={(e) => setNewSlot({ ...newSlot, repetirHasta: e.target.value })}
                    min={newSlot.fecha}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none font-bold [color-scheme:dark]"
                    required={newSlot.repetirSemanalmente}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(197,164,115,0.3)] hover:shadow-primary/40 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
              >
                Crear Horario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE SLOT */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Detalle del Horario</h3>
              <button onClick={() => setSelectedSlot(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedSlot.salon?.color || '#C5A473' }} />
                <span className="text-lg font-black uppercase">{selectedSlot.salon?.nombre || 'Salón'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Fecha</p>
                  <p className="text-sm text-white font-bold">{new Date(selectedSlot.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Horario</p>
                  <p className="text-sm text-white font-bold">{selectedSlot.horaInicio} - {selectedSlot.horaFin}</p>
                </div>
              </div>

              {selectedSlot.notas && (
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Clase / Notas</p>
                  <p className="text-sm text-white font-bold uppercase">{selectedSlot.notas}</p>
                </div>
              )}

              <div className={`p-3 rounded-2xl border text-center ${
                selectedSlot.estado === 'disponible' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                selectedSlot.estado === 'reservado' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                <p className="text-xs font-black uppercase tracking-widest">{getEstadoLabel(selectedSlot.estado)}</p>
              </div>

              {(selectedSlot.nombreReserva || selectedSlot.reservadoPor) && (
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Reservado por</p>
                  <div className="flex items-center gap-2">
                    <FiUser className="text-primary w-4 h-4" />
                    <span className="text-sm font-bold">{selectedSlot.nombreReserva || selectedSlot.reservadoPor?.nombre || 'N/A'}</span>
                  </div>
                  {selectedSlot.telefonoReserva && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-primary w-4 h-4" />
                      <span className="text-sm font-bold">{selectedSlot.telefonoReserva}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-2">Color del horario {selectedSlot.notas ? `(todos los "${selectedSlot.notas}")` : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((pc) => (
                    <button
                      key={pc.color}
                      onClick={() => handleUpdateSlotColor(selectedSlot._id, pc.color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 ${selectedSlot.color === pc.color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1F1F1F] scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: pc.color }}
                      title={pc.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <input
                    type="color"
                    value={selectedSlot.color || getSlotColor(selectedSlot).text}
                    onChange={(e) => handleUpdateSlotColor(selectedSlot._id, e.target.value)}
                    className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                    title="Color personalizado"
                  />
                  <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Personalizado</span>
                  {selectedSlot.color && (
                    <button
                      onClick={() => handleUpdateSlotColor(selectedSlot._id, '')}
                      className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition ml-auto"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {selectedSlot.estado === 'reservado' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleConfirmSlot(selectedSlot._id)} className="py-4 bg-emerald-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                      <FiCheck className="inline mr-2" /> Confirmar
                    </button>
                    <button onClick={() => handleRejectSlot(selectedSlot._id)} className="py-4 bg-red-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20">
                      <FiX className="inline mr-2" /> Rechazar
                    </button>
                  </div>
                )}
                <button onClick={() => handleDeleteSlot(selectedSlot._id)} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-red-500/10">
                  <FiTrash2 className="inline mr-2" /> Eliminar Horario
                </button>
                <button onClick={() => setSelectedSlot(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 font-bold rounded-2xl transition uppercase text-[10px] tracking-widest">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GESTIONAR SALONES */}
      {showSalonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                {editingSalon ? 'Editar Salón' : 'Gestionar Salones'}
              </h3>
              <button onClick={() => { setShowSalonModal(false); setEditingSalon(null); }} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {!editingSalon && (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {salones.map(s => (
                    <div key={s._id} className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-sm font-bold">{s.nombre}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingSalon(s);
                          setSalonForm({ nombre: s.nombre, descripcion: s.descripcion || '', color: s.color, colorOcupado: s.colorOcupado || '#ef4444' });
                        }} className="p-2 bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary rounded-xl transition-all">
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSalon(s._id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-white/5 pt-5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {editingSalon ? `Editando: ${editingSalon.nombre}` : 'Agregar Nuevo Salón'}
                </p>
                <input
                  type="text"
                  placeholder="Nombre del salón"
                  value={salonForm.nombre}
                  onChange={(e) => setSalonForm({ ...salonForm, nombre: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold transition placeholder:text-white/10"
                />
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={salonForm.descripcion}
                  onChange={(e) => setSalonForm({ ...salonForm, descripcion: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm transition placeholder:text-white/10"
                />
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Color</label>
                  <input
                    type="color"
                    value={salonForm.color}
                    onChange={(e) => setSalonForm({ ...salonForm, color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                  />
                  <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: salonForm.color }} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Color Ocupados</label>
                  <input
                    type="color"
                    value={salonForm.colorOcupado}
                    onChange={(e) => setSalonForm({ ...salonForm, colorOcupado: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                  />
                  <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: salonForm.colorOcupado }} />
                </div>
                <button
                  onClick={handleSaveSalon}
                  disabled={!salonForm.nombre.trim()}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] uppercase text-[10px] tracking-widest disabled:opacity-30"
                >
                  {editingSalon ? 'Guardar Cambios' : 'Agregar Salón'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
