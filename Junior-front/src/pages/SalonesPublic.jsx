import { useState, useEffect } from "react";
import {
  FiCalendar, FiClock, FiChevronLeft, FiChevronRight,
  FiLoader, FiMessageCircle, FiArrowLeft, FiMapPin, FiX, FiCheck, FiShoppingCart, FiAlertCircle
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import logoEmpresa from "../assets/logo.png";

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WHATSAPP_OWNER = '9515571964';

// Franjas horarias
const FRANJAS = [];
for (let h = 7; h <= 21; h++) {
  FRANJAS.push({
    inicio: `${h.toString().padStart(2, '0')}:00`,
    fin: `${(h + 1).toString().padStart(2, '0')}:00`,
    label: `${h > 12 ? h - 12 : h}–${h + 1 > 12 ? h + 1 - 12 : h + 1} ${h >= 12 ? 'PM' : 'AM'}`,
  });
}

const SLOT_COLORS = [
  { bg: 'rgba(99,102,241,0.25)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc' },
  { bg: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.4)', text: '#f9a8d4' },
  { bg: 'rgba(34,211,238,0.25)', border: 'rgba(34,211,238,0.4)', text: '#67e8f9' },
  { bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.4)', text: '#fdba74' },
  { bg: 'rgba(163,230,53,0.25)', border: 'rgba(163,230,53,0.4)', text: '#bef264' },
  { bg: 'rgba(232,121,249,0.25)', border: 'rgba(232,121,249,0.4)', text: '#e879f9' },
  { bg: 'rgba(250,204,21,0.25)', border: 'rgba(250,204,21,0.4)', text: '#fde047' },
  { bg: 'rgba(45,212,191,0.25)', border: 'rgba(45,212,191,0.4)', text: '#5eead4' },
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

export default function SalonesPublic() {
  const [salones, setSalones] = useState([]);
  const [slots, setSlots] = useState([]); // Estos ahora representan los OCUPADOS (creados por admin o apartados)
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeSalonIndex, setActiveSalonIndex] = useState(0);
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ nombre: '', telefono: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const navigate = useNavigate();

  // Semana empezando en Lunes
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
  const desde = getLocalYMD(weekDates[0]);
  const hasta = getLocalYMD(weekDates[6]);

  useEffect(() => { fetchSalones(); }, []);
  useEffect(() => { fetchSlots(); }, [weekOffset]);

  const fetchSalones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/salones`);
      const data = await res.json();
      setSalones(data);
    } catch (err) { console.error('Error'); }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/salones/slots?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();
      setSlots(data);
    } catch (err) { console.error('Error'); }
    finally { setLoading(false); }
  };

  const activeSalon = salones[activeSalonIndex] || null;

  const getSlotForCell = (date, franja) => {
    if (!activeSalon) return null;
    const dateStr = getLocalYMD(date);
    return slots.find(s => {
      const slotDate = getLocalYMD(new Date(s.fecha));
      const slotSalonId = typeof s.salon === 'object' ? s.salon._id : s.salon;
      if (slotDate !== dateStr || slotSalonId !== activeSalon._id) return false;
      return s.horaInicio <= franja.inicio && s.horaFin > franja.inicio;
    });
  };

  const isSlotStart = (slot, franja) => slot && slot.horaInicio === franja.inicio;
  const getSlotSpan = (slot) => {
    const startH = parseInt(slot.horaInicio.split(':')[0]);
    const endH = parseInt(slot.horaFin.split(':')[0]);
    return endH - startH;
  };

  const getSlotColor = (slot) => {
    const key = slot.notas || slot._id || '';
    const idx = hashString(key) % SLOT_COLORS.length;
    return SLOT_COLORS[idx];
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isPast = (date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(date); d.setHours(0,0,0,0);
    return d < today;
  };

  const toggleCartSlot = (date, franja) => {
    const dateStr = getLocalYMD(date);
    const slotId = `${dateStr}-${franja.inicio}`;
    const slotData = {
      _id: slotId,
      salonId: activeSalon._id,
      salon: activeSalon,
      fecha: dateStr,
      horaInicio: franja.inicio,
      horaFin: franja.fin,
    };

    setCart(prev => {
      const exists = prev.find(s => s._id === slotId);
      if (exists) {
        return prev.filter(s => s._id !== slotId);
      } else {
        return [...prev, slotData];
      }
    });
  };

  const isSlotInCart = (date, franja) => {
    const dateStr = getLocalYMD(date);
    const slotId = `${dateStr}-${franja.inicio}`;
    return cart.some(s => s._id === slotId);
  };

  const handleWhatsAppBook = async () => {
    if (cart.length === 0) return;

    let mensaje = `¡Hola! 👋 Me interesa rentar los siguientes horarios:\n\n`;
    
    cart.forEach((slot, index) => {
      const salon = slot.salon?.nombre || 'Salón';
      const fecha = new Date(slot.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      mensaje += `*${index + 1}. ${salon}* - ${fecha} de *${slot.horaInicio} a ${slot.horaFin}*\n`;
    });

    if (bookingForm.nombre) mensaje += `\nMi nombre es: *${bookingForm.nombre}*`;
    if (bookingForm.telefono) mensaje += `\nMi teléfono: ${bookingForm.telefono}`;
    mensaje += `\n\n¿Cuál sería el precio total para apartar? 🙏`;

    window.open(`https://wa.me/52${WHATSAPP_OWNER}?text=${encodeURIComponent(mensaje)}`, '_blank');

    if (bookingForm.nombre) {
      try {
        await fetch(`${API_URL}/api/salones/reservar-publico`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slots: cart,
            nombre: bookingForm.nombre,
            telefono: bookingForm.telefono
          }),
        });
      } catch (err) {
        console.error('Error al reservar', err);
      }
    }

    setBookingSuccess(true);
    setCart([]); 
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans pb-32">

      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm font-bold">
              <FiArrowLeft className="w-4 h-4" /> Inicio
            </button>
            <img src={logoEmpresa} alt="Rhythm" className="w-10 h-10 rounded-full border border-white/10" />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
              <FiMapPin className="text-primary w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Rhythm Oaxaca</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">
              Renta tu <span className="text-primary">Salón</span>
            </h1>
            <p className="text-white/40 text-xs max-w-md mx-auto">
              Selecciona los horarios disponibles en la cuadrícula y cotiza por WhatsApp
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-4">

        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {salones.map((salon, i) => (
            <button
              key={salon._id}
              onClick={() => setActiveSalonIndex(i)}
              className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border ${
                activeSalonIndex === i ? 'text-white' : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60'
              }`}
              style={activeSalonIndex === i ? {
                backgroundColor: salon.color + '20',
                borderColor: salon.color + '40',
              } : {}}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: salon.color }} />
              {salon.nombre}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-3">
          <button onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))} disabled={weekOffset === 0} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20">
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
              <button onClick={() => setWeekOffset(0)} className="px-3 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase border border-primary/20">
                Hoy
              </button>
            )}
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : activeSalon ? (
          <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative">
            <div className="p-4 border-b border-white/5 flex items-center gap-3" style={{ background: `linear-gradient(90deg, ${activeSalon.color}10, transparent)` }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeSalon.color }} />
              <h2 className="text-base md:text-xl font-black uppercase tracking-tight">{activeSalon.nombre}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 p-2 text-[8px] font-black uppercase tracking-widest text-white/20 border-b border-r border-white/5 bg-black/30 sticky left-0 z-10">
                      Hora
                    </th>
                    {weekDates.map((date, i) => (
                      <th key={i} className={`p-2 text-center border-b border-white/5 ${isToday(date) ? 'bg-primary/[0.06]' : ''} ${isPast(date) ? 'opacity-30' : ''}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isToday(date) ? 'text-primary' : 'text-white/20'}`}>
                          {DIAS_CORTO[i]}
                        </p>
                        <p className={`text-base font-black ${isToday(date) ? 'text-primary' : 'text-white/60'}`}>
                          {date.getDate()}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FRANJAS.map((franja, fi) => (
                    <tr key={fi}>
                      <td className="p-1 text-[8px] font-black text-white/15 uppercase tracking-wider border-r border-white/5 bg-black/30 sticky left-0 z-10 text-center whitespace-nowrap">
                        {franja.label}
                      </td>
                      {weekDates.map((date, di) => {
                        const past = isPast(date);
                        const slot = getSlotForCell(date, franja);
                        const isStart = slot && isSlotStart(slot, franja);
                        const span = slot ? getSlotSpan(slot) : 1;
                        const inCart = isSlotInCart(date, franja);

                        // Si hay un slot de base de datos ocupando espacio y no es el inicio, saltarlo
                        if (slot && !isStart) return null;

                        // Si HAY un slot en BD, significa que está OCUPADO
                        if (slot && isStart) {
                          const color = getSlotColor(slot);
                          return (
                            <td key={di} rowSpan={span} className={`p-1 border border-white/[0.03] ${isToday(date) ? 'bg-primary/[0.02]' : ''} ${past ? 'opacity-30' : ''}`}>
                              <div
                                className="w-full h-full rounded-xl p-2 flex flex-col justify-center min-h-[36px] opacity-70 cursor-not-allowed"
                                style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                              >
                                <p className="text-[9px] font-black leading-tight truncate flex items-center gap-1" style={{ color: color.text }}>
                                  <FiAlertCircle className="w-3 h-3 shrink-0" /> {slot.notas || 'Ocupado'}
                                </p>
                                <p className="text-[7px] opacity-40 mt-0.5" style={{ color: color.text }}>
                                  {slot.horaInicio}–{slot.horaFin}
                                </p>
                              </div>
                            </td>
                          );
                        }

                        // Si NO hay slot en BD, significa que está LIBRE
                        return (
                          <td key={di} className={`p-1 border border-white/[0.03] ${isToday(date) ? 'bg-primary/[0.02]' : ''} ${past ? 'opacity-30' : ''}`}>
                            <button
                              onClick={() => !past && toggleCartSlot(date, franja)}
                              disabled={past}
                              className={`w-full h-full min-h-[36px] rounded-xl p-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-center disabled:cursor-not-allowed border ${
                                inCart 
                                  ? 'bg-primary/20 border-primary shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-[#1A1A1A] scale-[0.98]' 
                                  : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                              }`}
                            >
                              {inCart ? (
                                <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                                  <FiCheck className="w-3 h-3" />
                                </div>
                              ) : null}
                              <p className={`text-[9px] font-black leading-tight truncate pr-4 ${inCart ? 'text-primary' : 'text-white/20'}`}>
                                {inCart ? 'Seleccionado' : 'Disponible'}
                              </p>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-white/5 flex items-center justify-center gap-4 text-[8px] font-black uppercase tracking-widest text-white/20">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-white/5 border border-white/10" /> Libre
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary" /> Seleccionado
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> Ocupado
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <FiCalendar className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-sm font-black uppercase tracking-widest text-white/20">No hay salones registrados</p>
          </div>
        )}
      </div>

      {/* CARRITO FLOTANTE */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-40 animate-in slide-in-from-bottom-10 flex justify-center pointer-events-none">
          <div className="bg-[#1F1F1F]/90 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-3xl shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto max-w-2xl w-full">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <FiShoppingCart /> {cart.length} {cart.length === 1 ? 'Horario Seleccionado' : 'Horarios Seleccionados'}
              </p>
              <div className="text-xs text-white/50 truncate flex gap-2 mt-1">
                {cart.map((s, i) => (
                  <span key={i} className="bg-white/5 px-2 py-0.5 rounded-md text-[9px] font-bold border border-white/5 shrink-0">
                    {DIAS_CORTO[new Date(s.fecha).getDay() === 0 ? 6 : new Date(s.fecha).getDay() - 1]} {s.horaInicio}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setBookingForm({ nombre: '', telefono: '' });
                setBookingSuccess(false);
                setShowBookingModal(true);
              }}
              className="bg-[#25D366] text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20 shrink-0"
            >
              <FiMessageCircle className="text-base" /> Cotizar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: FORMULARIO DE COTIZACIÓN */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#161616] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">

            {bookingSuccess ? (
              <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto border border-[#25D366]/20">
                  <FiMessageCircle className="text-[#25D366] text-4xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">¡Mensaje Enviado!</h2>
                  <p className="text-white/40 text-xs mt-3">Espera la confirmación del dueño.</p>
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
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Cotizar {cart.length} Horarios</p>
                      <h2 className="text-lg font-black uppercase tracking-tighter italic">Ingresa tus datos</h2>
                    </div>
                    <button onClick={() => setShowBookingModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition shrink-0 ml-4">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                    {cart.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slot.salon?.color || '#C5A473' }} />
                          <span className="font-bold">{slot.salon?.nombre}</span>
                        </div>
                        <span className="text-white/50 font-black">
                          {new Date(slot.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} • {slot.horaInicio}
                        </span>
                      </div>
                    ))}
                  </div>

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

                  <button
                    onClick={handleWhatsAppBook}
                    disabled={!bookingForm.nombre.trim()}
                    className="w-full relative overflow-hidden group bg-[#25D366] text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition-all active:scale-[0.98] disabled:opacity-30"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    <div className="relative z-10 flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-xs">
                      <FiMessageCircle className="text-lg" /> Solicitar por WhatsApp
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Rhythm Oaxaca</p>
      </footer>
    </div>
  );
}
