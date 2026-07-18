import { useState, useEffect } from "react";
import {
  FiCalendar, FiClock, FiChevronLeft, FiChevronRight,
  FiLoader, FiMessageCircle, FiArrowLeft, FiMapPin
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import logoEmpresa from "../assets/logo.png";

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WHATSAPP_OWNER = '9515571964';

export default function SalonesPublic() {
  const [salones, setSalones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({ nombre: '', telefono: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const navigate = useNavigate();

  // Obtener la semana
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

  const getSlotsForDayAndSalon = (date, salonId) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(s => {
      const slotDate = new Date(s.fecha).toISOString().split('T')[0];
      const slotSalonId = typeof s.salon === 'object' ? s.salon._id : s.salon;
      return slotDate === dateStr && slotSalonId === salonId && s.estado === 'disponible';
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d < today;
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingForm({ nombre: '', telefono: '' });
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleWhatsAppBook = () => {
    const salon = selectedSlot?.salon?.nombre || 'Salón';
    const fecha = new Date(selectedSlot.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const horario = `${selectedSlot.horaInicio} a ${selectedSlot.horaFin}`;
    
    let mensaje = `¡Hola! 👋 Me interesa apartar el *${salon}* el día *${fecha}* en horario de *${horario}*.`;
    if (bookingForm.nombre) {
      mensaje += `\n\nMi nombre es: *${bookingForm.nombre}*`;
    }
    if (bookingForm.telefono) {
      mensaje += `\nMi teléfono: ${bookingForm.telefono}`;
    }
    mensaje += `\n\n¿Cuál sería el precio? 🙏`;

    const url = `https://wa.me/52${WHATSAPP_OWNER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    // Marcar como reservado en el backend (best effort)
    if (bookingForm.nombre) {
      fetch(`${API_URL}/api/salones/slots/${selectedSlot._id}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: bookingForm.nombre, telefono: bookingForm.telefono }),
      }).catch(() => {});
    }

    setBookingSuccess(true);
  };

  // Filtrar salones con disponibilidad en la semana
  const activeSalones = selectedSalon ? salones.filter(s => s._id === selectedSalon) : salones;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans">
      
      {/* HEADER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm font-bold">
              <FiArrowLeft className="w-4 h-4" /> Inicio
            </button>
            <img src={logoEmpresa} alt="Rhythm" className="w-10 h-10 rounded-full border border-white/10" />
          </div>
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
              <FiMapPin className="text-primary w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Rhythm Oaxaca</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
              Reserva tu <span className="text-primary">Salón</span>
            </h1>
            <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
              Selecciona un horario disponible y contáctanos por WhatsApp para apartar tu espacio
            </p>
          </div>
        </div>
      </header>

      {/* FILTRO DE SALONES */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedSalon(null)}
            className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
              !selectedSalon ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            Todos
          </button>
          {salones.map(s => (
            <button
              key={s._id}
              onClick={() => setSelectedSalon(s._id === selectedSalon ? null : s._id)}
              className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                selectedSalon === s._id
                  ? 'border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
              }`}
              style={selectedSalon === s._id ? { backgroundColor: s.color + '20', borderColor: s.color + '40' } : {}}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* NAVEGADOR DE SEMANA */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-3xl p-4">
          <button onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))} disabled={weekOffset === 0} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 disabled:opacity-20">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm md:text-lg font-black uppercase tracking-wider">
              {weekDates[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              Semana del {weekDates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al {weekDates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
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
      </div>

      {/* CALENDARIO */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-6">
            {activeSalones.map(salon => (
              <div key={salon._id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                {/* Salon Header */}
                <div className="flex items-center gap-3 p-5 border-b border-white/5" style={{ background: `linear-gradient(90deg, ${salon.color}08, transparent)` }}>
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: salon.color, boxShadow: `0 0 20px ${salon.color}40` }} />
                  <h3 className="text-sm font-black uppercase tracking-widest">{salon.nombre}</h3>
                  {salon.descripcion && <span className="text-[10px] text-white/30 italic">— {salon.descripcion}</span>}
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-px bg-white/5">
                  {weekDates.map((date, i) => {
                    const daySlots = getSlotsForDayAndSalon(date, salon._id);
                    const past = isPast(date);

                    return (
                      <div key={i} className={`p-3 min-h-[120px] ${past ? 'opacity-30' : ''} ${isToday(date) ? 'bg-primary/[0.05]' : 'bg-[#1A1A1A]'}`}>
                        {/* Day header */}
                        <div className="text-center mb-3">
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isToday(date) ? 'text-primary' : 'text-white/20'}`}>
                            {DIAS_CORTO[date.getDay()]}
                          </p>
                          <p className={`text-lg font-black ${isToday(date) ? 'text-primary' : 'text-white/60'}`}>
                            {date.getDate()}
                          </p>
                        </div>

                        {/* Slots */}
                        <div className="space-y-1.5">
                          {daySlots.length === 0 && !past && (
                            <p className="text-[8px] text-white/10 text-center uppercase font-bold tracking-widest py-2">Sin horarios</p>
                          )}
                          {daySlots.map(slot => (
                            <button
                              key={slot._id}
                              onClick={() => !past && handleSelectSlot(slot)}
                              disabled={past}
                              className="w-full text-left p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all disabled:cursor-not-allowed"
                            >
                              <p className="text-[10px] font-black flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {slot.horaInicio}
                              </p>
                              <p className="text-[8px] opacity-60">{slot.horaFin}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {salones.length === 0 && (
              <div className="text-center py-20">
                <FiCalendar className="w-12 h-12 mx-auto mb-4 text-white/10" />
                <p className="text-sm font-black uppercase tracking-widest text-white/20">No hay salones disponibles</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LEYENDA */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-center gap-6 text-[10px] text-white/30 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40" />
            Disponible
          </div>
          <div className="flex items-center gap-2">
            <FiMessageCircle className="text-[#25D366] w-3 h-3" />
            Toca para apartar vía WhatsApp
          </div>
        </div>
      </div>

      {/* MODAL: RESERVAR / WHATSAPP */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#161616] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
            
            {bookingSuccess ? (
              <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto border border-[#25D366]/20">
                  <FiMessageCircle className="text-[#25D366] text-4xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">¡Mensaje Enviado!</h2>
                  <p className="text-white/40 text-xs mt-3 leading-relaxed">
                    Te estamos contactando por WhatsApp. Espera la confirmación del dueño para asegurar tu horario.
                  </p>
                </div>
                <button
                  onClick={() => { setShowBookingModal(false); fetchSlots(); }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition uppercase text-[10px] tracking-widest"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Apartar Horario</p>
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">{selectedSlot.salon?.nombre}</h2>
                    </div>
                    <button onClick={() => setShowBookingModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Info del slot */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                      <FiCalendar className="text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold text-white">
                        {new Date(selectedSlot.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                      <FiClock className="text-secondary mx-auto mb-1" />
                      <p className="text-xs font-bold text-white">{selectedSlot.horaInicio} - {selectedSlot.horaFin}</p>
                    </div>
                  </div>

                  {/* Formulario de contacto */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={bookingForm.nombre}
                      onChange={(e) => setBookingForm({ ...bookingForm, nombre: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold transition placeholder:text-white/15"
                    />
                    <input
                      type="tel"
                      placeholder="Tu teléfono (opcional)"
                      value={bookingForm.telefono}
                      onChange={(e) => setBookingForm({ ...bookingForm, telefono: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold transition placeholder:text-white/15"
                    />
                  </div>

                  {/* Botón WhatsApp */}
                  <button
                    onClick={handleWhatsAppBook}
                    disabled={!bookingForm.nombre.trim()}
                    className="w-full relative overflow-hidden group bg-[#25D366] text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:shadow-[#25D366]/40 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    <div className="relative z-10 flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-xs">
                      <FiMessageCircle className="text-lg" />
                      Apartar por WhatsApp
                    </div>
                  </button>

                  <p className="text-[8px] text-center text-white/20 uppercase font-black tracking-widest">
                    Se abrirá WhatsApp con un mensaje para el dueño de Rhythm
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-8 text-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Rhythm Oaxaca</p>
      </footer>
    </div>
  );
}
