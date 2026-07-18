import { useState, useEffect } from "react";
import {
  FiCalendar, FiPlus, FiTrash2, FiCheck, FiX,
  FiClock, FiLoader, FiEdit3, FiChevronLeft, FiChevronRight,
  FiUser, FiPhone, FiCheckCircle, FiAlertCircle, FiSettings
} from "react-icons/fi";
import { API_URL } from "../api";

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = [];
for (let h = 7; h <= 22; h++) {
  HORAS.push(`${h.toString().padStart(2, '0')}:00`);
}

export default function SalonBooking() {
  const [salones, setSalones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
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
  });
  const [salonForm, setSalonForm] = useState({ nombre: '', descripcion: '', color: '#C5A473' });

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Obtener la semana actual basada en el offset
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const desde = weekDates[0].toISOString().split('T')[0];
  const hasta = weekDates[6].toISOString().split('T')[0];

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  // Fetch data
  useEffect(() => {
    fetchSalones();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [weekOffset]);

  const fetchSalones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/salones`);
      const data = await res.json();
      setSalones(data);
      if (data.length > 0 && !newSlot.salon) {
        setNewSlot(prev => ({ ...prev, salon: data[0]._id }));
      }
    } catch (err) { console.error('Error al cargar salones'); }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/salones/slots?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();
      setSlots(data);
    } catch (err) { console.error('Error al cargar slots'); }
    finally { setLoading(false); }
  };

  // CRUD Salones
  const handleSaveSalon = async () => {
    try {
      const method = editingSalon ? 'PUT' : 'POST';
      const url = editingSalon ? `${API_URL}/api/salones/${editingSalon._id}` : `${API_URL}/api/salones`;
      const res = await fetch(url, { method, headers, body: JSON.stringify(salonForm) });
      if (res.ok) {
        fetchSalones();
        setShowSalonModal(false);
        setEditingSalon(null);
        setSalonForm({ nombre: '', descripcion: '', color: '#C5A473' });
        showToast(editingSalon ? 'Salón actualizado' : 'Salón creado');
      }
    } catch (err) { showToast('Error al guardar salón', 'error'); }
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
  const getSlotsForDayAndSalon = (date, salonId) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(s => {
      const slotDate = new Date(s.fecha).toISOString().split('T')[0];
      const slotSalonId = typeof s.salon === 'object' ? s.salon._id : s.salon;
      return slotDate === dateStr && slotSalonId === salonId;
    });
  };

  const getEstadoStyle = (estado) => {
    switch(estado) {
      case 'disponible': return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'reservado': return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'confirmado': return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
      default: return 'bg-white/5 border-white/10 text-white/40';
    }
  };

  const getEstadoLabel = (estado) => {
    switch(estado) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Pendiente';
      case 'confirmado': return 'Confirmado';
      default: return estado;
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Contar pendientes
  const pendientes = slots.filter(s => s.estado === 'reservado');

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
              setSalonForm({ nombre: '', descripcion: '', color: '#C5A473' });
              setEditingSalon(null);
              setShowSalonModal(true);
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black py-3 px-5 rounded-2xl transition-all border border-white/10 uppercase text-[10px] tracking-widest"
          >
            <FiSettings className="w-4 h-4" /> Salones
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-[#00205B] text-white font-black py-3 px-5 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase text-[10px] tracking-widest"
          >
            <FiPlus className="w-4 h-4" /> Nuevo Horario
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-[95rem] mx-auto">

        {/* INDICADORES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center">
            <span className="text-2xl font-black text-white">{salones.length}</span>
            <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Salones</span>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-3xl flex flex-col items-center">
            <span className="text-2xl font-black text-emerald-400">{slots.filter(s => s.estado === 'disponible').length}</span>
            <span className="text-[8px] font-black uppercase text-emerald-400/50 tracking-widest">Disponibles</span>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-3xl flex flex-col items-center relative">
            <span className="text-2xl font-black text-amber-400">{pendientes.length}</span>
            <span className="text-[8px] font-black uppercase text-amber-400/50 tracking-widest">Pendientes</span>
            {pendientes.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-3xl flex flex-col items-center">
            <span className="text-2xl font-black text-blue-400">{slots.filter(s => s.estado === 'confirmado').length}</span>
            <span className="text-[8px] font-black uppercase text-blue-400/50 tracking-widest">Confirmados</span>
          </div>
        </div>

        {/* NAVEGADOR DE SEMANA */}
        <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-3xl p-4">
          <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm md:text-lg font-black uppercase tracking-wider">
              {weekDates[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              {weekDates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex gap-2">
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-primary/20">
                Hoy
              </button>
            )}
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RESERVACIONES PENDIENTES */}
        {pendientes.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <FiAlertCircle /> Reservaciones Pendientes ({pendientes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendientes.map(slot => (
                <div key={slot._id} className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{slot.nombreReserva || slot.reservadoPor?.nombre || 'Sin nombre'}</p>
                    <p className="text-[10px] text-white/40 font-bold">
                      {slot.salon?.nombre} • {new Date(slot.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} • {slot.horaInicio} - {slot.horaFin}
                    </p>
                    {slot.telefonoReserva && (
                      <p className="text-[10px] text-white/30 flex items-center gap-1 mt-1">
                        <FiPhone className="w-3 h-3" /> {slot.telefonoReserva}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button onClick={() => handleConfirmSlot(slot._id)} className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl transition-all active:scale-90 border border-emerald-500/20" title="Confirmar">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRejectSlot(slot._id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all active:scale-90 border border-red-500/20" title="Rechazar">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDARIO SEMANAL */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              {/* Header de días */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${salones.length > 0 ? weekDates.length : 7}, 1fr)` }}>
                <div /> {/* Spacer */}
                {weekDates.map((date, i) => (
                  <div key={i} className={`text-center py-3 rounded-2xl ${isToday(date) ? 'bg-primary/10 border border-primary/20' : 'bg-black/20 border border-white/5'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isToday(date) ? 'text-primary' : 'text-white/30'}`}>
                      {DIAS_SEMANA[date.getDay()]}
                    </p>
                    <p className={`text-lg font-black ${isToday(date) ? 'text-primary' : 'text-white'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Filas por salón */}
              {salones.map(salon => (
                <div key={salon._id} className="mt-4">
                  <div className="flex items-center gap-3 mb-2 px-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: salon.color }} />
                    <span className="text-xs font-black uppercase tracking-widest text-white/60">{salon.nombre}</span>
                    <button
                      onClick={() => {
                        setEditingSalon(salon);
                        setSalonForm({ nombre: salon.nombre, descripcion: salon.descripcion || '', color: salon.color });
                        setShowSalonModal(true);
                      }}
                      className="p-1 text-white/20 hover:text-white/60 transition-all"
                    >
                      <FiEdit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${weekDates.length}, 1fr)` }}>
                    <div className="flex flex-col justify-center items-center py-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: salon.color + '20', border: `1px solid ${salon.color}30` }}>
                        <FiClock className="w-4 h-4" style={{ color: salon.color }} />
                      </div>
                    </div>
                    {weekDates.map((date, di) => {
                      const daySlots = getSlotsForDayAndSalon(date, salon._id);
                      return (
                        <div key={di} className={`min-h-[80px] rounded-2xl p-2 space-y-1.5 ${isToday(date) ? 'bg-primary/[0.03] border border-primary/10' : 'bg-black/20 border border-white/5'}`}>
                          {daySlots.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setNewSlot({
                                    salon: salon._id,
                                    fecha: date.toISOString().split('T')[0],
                                    horaInicio: '09:00',
                                    horaFin: '10:00',
                                    notas: '',
                                  });
                                  setShowCreateModal(true);
                                }}
                                className="p-2 text-white/10 hover:text-white/30 hover:bg-white/5 rounded-xl transition-all"
                              >
                                <FiPlus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {daySlots.map(slot => (
                            <button
                              key={slot._id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`w-full text-left p-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${getEstadoStyle(slot.estado)}`}
                            >
                              <p className="text-[10px] font-black">{slot.horaInicio} - {slot.horaFin}</p>
                              <p className="text-[8px] uppercase tracking-wider opacity-70">{getEstadoLabel(slot.estado)}</p>
                              {slot.nombreReserva && (
                                <p className="text-[8px] opacity-50 truncate mt-0.5">{slot.nombreReserva}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {salones.length === 0 && (
                <div className="text-center py-20 text-white/20">
                  <FiCalendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-black uppercase tracking-widest">No hay salones registrados</p>
                  <p className="text-xs text-white/10 mt-2">Ejecuta el script de seed o crea salones manualmente</p>
                </div>
              )}
            </div>
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
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Hora Fin</label>
                  <select
                    value={newSlot.horaFin}
                    onChange={(e) => setNewSlot({ ...newSlot, horaFin: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm cursor-pointer appearance-none font-bold"
                  >
                    {HORAS.filter(h => h > newSlot.horaInicio).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Notas (Opcional)</label>
                <input
                  type="text"
                  value={newSlot.notas}
                  onChange={(e) => setNewSlot({ ...newSlot, notas: e.target.value })}
                  placeholder="Ej: Clase de salsa avanzada..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm transition placeholder:text-white/10"
                />
              </div>

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
                  <p className="text-sm text-white font-bold">{new Date(selectedSlot.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Horario</p>
                  <p className="text-sm text-white font-bold">{selectedSlot.horaInicio} - {selectedSlot.horaFin}</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${getEstadoStyle(selectedSlot.estado)} text-center`}>
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

              {selectedSlot.notas && (
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Notas</p>
                  <p className="text-sm text-white/60">{selectedSlot.notas}</p>
                </div>
              )}

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

      {/* MODAL: GESTIONAR SALÓN */}
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
              {/* Lista de salones existentes */}
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
                          setSalonForm({ nombre: s.nombre, descripcion: s.descripcion || '', color: s.color });
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
