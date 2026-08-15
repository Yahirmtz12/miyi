import { useState, useEffect } from "react";
import {
  FiCalendar, FiClock, FiChevronLeft, FiChevronRight,
  FiLoader, FiArrowLeft, FiCheck, FiScissors,
  FiUser, FiPhone, FiMessageCircle, FiX, FiChevronDown
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

const DIAS_NOMBRE = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WHATSAPP_BARBER = '9513235437';

export default function AgendarCita() {
  const navigate = useNavigate();

  // Estado principal
  const [barberos, setBarberos] = useState([]);
  const [selectedBarbero, setSelectedBarbero] = useState(null);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  // Formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // UI
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1=servicio, 2=fecha, 3=hora, 4=datos, 5=confirmación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => { fetchBarberos(); }, []);

  const fetchBarberos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/barberos`);
      const data = await res.json();
      setBarberos(data);
      // Como solo hay un barbero, lo seleccionamos automáticamente
      if (data.length > 0) {
        setSelectedBarbero(data[0]);
      }
    } catch (err) { console.error('Error cargando barberos'); }
    finally { setLoading(false); }
  };

  const fetchSlots = async (date) => {
    if (!selectedBarbero) return;
    setSlotsLoading(true);
    try {
      const dateStr = formatDate(date);
      const res = await fetch(`${API_URL}/api/barberos/${selectedBarbero._id}/disponibilidad?fecha=${dateStr}`);
      const data = await res.json();
      setSlots(data.disponible ? data.slots : []);
    } catch (err) { 
      console.error('Error cargando slots');
      setSlots([]);
    }
    finally { setSlotsLoading(false); }
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatHour = (hora) => {
    const h = parseInt(hora.split(':')[0]);
    return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date);
    setStep(3);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const calcularPrecioTotal = () => {
    let total = selectedServicio ? selectedServicio.precio : 0;
    selectedExtras.forEach(e => { total += e.precio; });
    return total;
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    setIsSubmitting(true);

    try {
      // 1. Registrar la cita en el backend
      const citaData = {
        barberoId: selectedBarbero._id,
        fecha: formatDate(selectedDate),
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
        servicio: selectedServicio.nombre,
        extras: selectedExtras.map(e => ({ nombre: e.nombre, precio: e.precio })),
        precioTotal: calcularPrecioTotal(),
        nombreCliente: nombre,
        telefonoCliente: telefono,
      };

      await fetch(`${API_URL}/api/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaData),
      });

      setSuccess(true);
      setStep(5);
    } catch (err) {
      console.error('Error al agendar', err);
    }
    finally { setIsSubmitting(false); }
  };

  // Generar calendario del mes
  const generateCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];
    
    // Días vacíos del inicio
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Días del mes
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const isDatePast = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isDateAvailable = (date) => {
    if (!date || !selectedBarbero) return false;
    const diasMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia = diasMap[date.getDay()];
    const horario = selectedBarbero.horarioSemanal?.[dia];
    return horario && horario.activo;
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const servicioPrincipal = selectedBarbero?.servicios?.filter(s => !s.esExtra) || [];
  const serviciosExtra = selectedBarbero?.servicios?.filter(s => s.esExtra) || [];

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
          <button onClick={() => step > 1 && !success ? setStep(step - 1) : navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm font-bold">
            <FiArrowLeft className="w-4 h-4" /> {step > 1 && !success ? 'Atrás' : 'Inicio'}
          </button>
          <div className="flex items-center gap-2">
            <FiScissors className="text-[#C5A473]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Xolos Barber</span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      {!success && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="flex gap-2">
            {[1,2,3,4].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#C5A473]' : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#C5A473]' : 'text-white/20'}`}>Servicio</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 2 ? 'text-[#C5A473]' : 'text-white/20'}`}>Fecha</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 3 ? 'text-[#C5A473]' : 'text-white/20'}`}>Hora</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 4 ? 'text-[#C5A473]' : 'text-white/20'}`}>Datos</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ===== STEP 1: SERVICIO ===== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Elige tu <span className="text-[#C5A473]">servicio</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">Selecciona el corte y agrega extras si lo deseas</p>
            </div>

            {/* Servicio principal */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A473]">Servicio principal</p>
              {servicioPrincipal.map((serv, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedServicio(serv)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                    selectedServicio?.nombre === serv.nombre
                      ? 'bg-[#C5A473]/10 border-[#C5A473] shadow-lg shadow-[#C5A473]/10'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      selectedServicio?.nombre === serv.nombre ? 'bg-[#C5A473]/20' : 'bg-white/5'
                    }`}>
                      ✂️
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">{serv.nombre}</h3>
                      <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                        <FiClock className="text-[10px]" /> {serv.duracion} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#C5A473]">${serv.precio}</span>
                    {selectedServicio?.nombre === serv.nombre && (
                      <div className="bg-[#C5A473] text-white rounded-full p-1 mt-1 ml-auto w-fit">
                        <FiCheck className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Extras */}
            {serviciosExtra.length > 0 && selectedServicio && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Extras opcionales</p>
                {serviciosExtra.map((extra, i) => {
                  const isSelected = selectedExtras.some(e => e.nombre === extra.nombre);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedExtras(prev => prev.filter(e => e.nombre !== extra.nombre));
                        } else {
                          setSelectedExtras(prev => [...prev, extra]);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#8C6A3B]/10 border-[#8C6A3B] shadow-lg'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isSelected ? 'bg-[#8C6A3B]/20' : 'bg-white/5'}`}>
                          {extra.nombre === 'Barba' ? '🪒' : '👁️'}
                        </div>
                        <span className="font-black uppercase tracking-tight">{extra.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#8C6A3B]">+${extra.precio}</span>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#8C6A3B] border-[#8C6A3B]' : 'border-white/20'
                        }`}>
                          {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Total y botón */}
            {selectedServicio && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-[#C5A473]">${calcularPrecioTotal()}</span>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-[#C5A473] text-white font-black rounded-2xl uppercase tracking-widest text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-[#C5A473]/20"
                >
                  Continuar → Elegir Fecha
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 2: FECHA ===== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Elige la <span className="text-[#C5A473]">fecha</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">Selecciona un día disponible en el calendario</p>
            </div>

            {/* Calendario */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-black uppercase tracking-wider">
                  {MESES[calendarMonth.getMonth()]} <span className="text-[#C5A473]">{calendarMonth.getFullYear()}</span>
                </h3>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Encabezados de día */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_NOMBRE.map(d => (
                  <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-white/20 py-2">{d}</div>
                ))}
              </div>

              {/* Días */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendar().map((date, i) => {
                  if (!date) return <div key={i} />;
                  const past = isDatePast(date);
                  const available = isDateAvailable(date);
                  const today = isToday(date);
                  const selected = selectedDate && date.toDateString() === selectedDate.toDateString();

                  return (
                    <button
                      key={i}
                      onClick={() => !past && available && handleDateSelect(date)}
                      disabled={past || !available}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-black transition-all relative ${
                        selected
                          ? 'bg-[#C5A473] text-white shadow-lg shadow-[#C5A473]/30 scale-105'
                          : today
                            ? 'bg-[#C5A473]/10 text-[#C5A473] border border-[#C5A473]/30'
                            : past || !available
                              ? 'text-white/10 cursor-not-allowed'
                              : 'text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                      }`}
                    >
                      {date.getDate()}
                      {today && !selected && <div className="w-1 h-1 rounded-full bg-[#C5A473] mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5 text-[8px] font-black uppercase tracking-widest text-white/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-white/10" /> No disponible
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#C5A473]/20 border border-[#C5A473]/30" /> Hoy
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#C5A473]" /> Seleccionado
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3: HORA ===== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Elige la <span className="text-[#C5A473]">hora</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">
                {selectedDate && `${DIAS_COMPLETO[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`}
              </p>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-16">
                <FiLoader className="animate-spin text-[#C5A473] w-8 h-8" />
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot, i) => {
                  const isSelected = selectedSlot?.horaInicio === slot.horaInicio;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-[#C5A473]/10 border-[#C5A473] shadow-lg shadow-[#C5A473]/10 scale-[1.02]'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FiClock className={`text-sm ${isSelected ? 'text-[#C5A473]' : 'text-white/30'}`} />
                        <span className={`text-lg font-black ${isSelected ? 'text-[#C5A473]' : 'text-white/70'}`}>
                          {formatHour(slot.horaInicio)}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1 font-bold">
                        {slot.horaInicio} - {slot.horaFin}
                      </p>
                      {isSelected && (
                        <div className="bg-[#C5A473] text-white rounded-full p-0.5 w-fit mx-auto mt-2">
                          <FiCheck className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/5">
                <FiCalendar className="w-12 h-12 mx-auto mb-4 text-white/10" />
                <p className="text-sm font-black uppercase tracking-widest text-white/20">No hay horarios disponibles</p>
                <p className="text-xs text-white/10 mt-2">Intenta seleccionar otro día</p>
                <button onClick={() => setStep(2)} className="mt-4 text-[#C5A473] text-xs font-black uppercase tracking-widest hover:underline">
                  ← Cambiar fecha
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: DATOS ===== */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Tus <span className="text-[#C5A473]">datos</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">Para confirmar tu cita necesitamos tu información</p>
            </div>

            {/* Resumen */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A473]">Resumen de tu cita</p>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Servicio</span>
                <span className="font-bold">{selectedServicio?.nombre}</span>
              </div>
              {selectedExtras.map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/40">+ {e.nombre}</span>
                  <span className="font-bold text-[#8C6A3B]">+${e.precio}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Fecha</span>
                <span className="font-bold">
                  {selectedDate && `${DIAS_COMPLETO[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Hora</span>
                <span className="font-bold">{selectedSlot && `${formatHour(selectedSlot.horaInicio)} - ${formatHour(selectedSlot.horaFin)}`}</span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between">
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-[#C5A473]">${calcularPrecioTotal()}</span>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white focus:border-[#C5A473] outline-none text-sm font-bold transition placeholder:text-white/15"
                />
              </div>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="tel"
                  placeholder="Tu teléfono (WhatsApp)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white focus:border-[#C5A473] outline-none text-sm font-bold transition placeholder:text-white/15"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!nombre.trim() || isSubmitting}
              className="w-full py-5 bg-[#C5A473] text-white font-black rounded-2xl uppercase tracking-widest text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-[#C5A473]/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <><FiLoader className="animate-spin text-lg" /> Agendando...</>
              ) : (
                <><FiCalendar className="text-lg" /> Confirmar Cita</>
              )}
            </button>
          </div>
        )}

        {/* ===== STEP 5: CONFIRMACIÓN ===== */}
        {step === 5 && success && (
          <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500 py-10">
            <div className="w-24 h-24 bg-[#C5A473]/10 rounded-full flex items-center justify-center mx-auto border border-[#C5A473]/20">
              <FiCheck className="text-[#C5A473] text-5xl" />
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">¡Cita Solicitada!</h2>
              <p className="text-white/40 text-sm mt-3 max-w-sm mx-auto">
                Tu cita ha sido registrada. El barbero la revisará y te confirmará por WhatsApp.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 max-w-sm mx-auto text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Servicio</span>
                <span className="font-bold">{selectedServicio?.nombre}</span>
              </div>
              {selectedExtras.map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/40">+ {e.nombre}</span>
                  <span className="font-bold">+${e.precio}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Fecha</span>
                <span className="font-bold">
                  {selectedDate && `${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Hora</span>
                <span className="font-bold">{selectedSlot && formatHour(selectedSlot.horaInicio)}</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between">
                <span className="font-bold text-white/60">Total</span>
                <span className="font-black text-[#C5A473]">${calcularPrecioTotal()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <a
                href={`https://wa.me/52${WHATSAPP_BARBER}?text=${encodeURIComponent(`¡Hola! Acabo de agendar una cita:\n\n📋 ${selectedServicio?.nombre}${selectedExtras.length > 0 ? ' + ' + selectedExtras.map(e => e.nombre).join(', ') : ''}\n📅 ${selectedDate ? `${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}` : ''}\n🕐 ${selectedSlot ? formatHour(selectedSlot.horaInicio) : ''}\n💰 $${calcularPrecioTotal()}\n\nMi nombre es ${nombre}. ¡Quedo al pendiente de la confirmación!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#25D366] text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-[#25D366]/20"
              >
                <FaWhatsapp className="text-xl" /> Enviar confirmación por WhatsApp
              </a>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition uppercase text-[10px] tracking-widest"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
