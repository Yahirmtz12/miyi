import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FiStar, FiCalendar, FiLogOut, FiInfo, FiActivity, FiClock, FiPhone, FiCheckCircle, FiLoader } from "react-icons/fi";
import { GiChickenLeg } from "react-icons/gi";
import logoEmpresa from "../assets/logo.png";
import { API_URL } from "../api";

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

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
      } catch (err) {
        console.log("Error actualizando datos.");
      }
    };
    fetchData();
  }, []);

  const totalVisitas = user?.visitas?.length || 0;
  const patitasActivas = totalVisitas % 7 === 0 && totalVisitas > 0 ? 7 : totalVisitas % 7;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Formateo visual del teléfono
  const handlePhoneInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) {
      setPhoneNumber(digits);
    } else if (digits.length <= 6) {
      setPhoneNumber(`${digits.slice(0, 3)} ${digits.slice(3)}`);
    } else {
      setPhoneNumber(`${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`);
    }
  };

  const handleSavePhone = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneError("Ingresa un número de 10 dígitos");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/update-phone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ telefono: cleanPhone }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, telefono: cleanPhone };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setPhoneSaved(true);
        setTimeout(() => {
          setShowPhoneModal(false);
          setPhoneSaved(false);
          setPhoneNumber("");
        }, 2000);
      } else {
        setPhoneError(data.msg || "Error al guardar");
      }
    } catch (err) {
      setPhoneError("Error de conexión");
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!user) return null;

  const needsPhone = !user.telefono;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-6 pb-12 flex flex-col items-center font-sans">
      
      {/* BANNER PARA REGISTRAR TELÉFONO */}
      {needsPhone && (
        <div 
          onClick={() => setShowPhoneModal(true)}
          className="w-full max-w-md mb-4 bg-[#25D366]/10 border border-[#25D366]/20 p-4 rounded-[2rem] flex gap-3 items-center cursor-pointer hover:bg-[#25D366]/15 transition-all active:scale-[0.98] animate-in slide-in-from-top-3 duration-500"
        >
          <div className="w-10 h-10 bg-[#25D366]/20 rounded-full flex items-center justify-center shrink-0">
            <FiPhone className="text-[#25D366]" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-[#25D366] uppercase tracking-widest">Acción requerida</p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5 leading-tight">Registra tu número de WhatsApp para recibir notificaciones</p>
          </div>
          <div className="text-[#25D366]/40 text-xl">›</div>
        </div>
      )}

      {/* MODAL REGISTRAR TELÉFONO */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowPhoneModal(false)} />
          <div className="relative bg-[#161616] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
            {phoneSaved ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center border border-[#25D366]/20">
                    <FiCheckCircle className="text-[#25D366] text-4xl animate-bounce" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">¡Listo!</h2>
                <p className="text-white/40 text-sm mt-3 font-medium">Tu número ha sido registrado.</p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <FiPhone className="text-primary text-3xl" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Registra tu Número</h2>
                <p className="text-white/40 text-xs mt-3 font-medium leading-relaxed">
                  Agrega tu número de WhatsApp para recibir notificaciones sobre tu membresía.
                </p>
                <div className="mt-6 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-black">+52</div>
                  <input
                    type="tel"
                    placeholder="000 000 0000"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-center text-lg font-bold tracking-[0.15em] focus:border-primary outline-none transition-all placeholder:text-white/10"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-red-400 text-[10px] font-bold uppercase mt-3 tracking-wider">{phoneError}</p>
                )}
                <button
                  onClick={handleSavePhone}
                  disabled={phoneLoading}
                  className="w-full h-14 bg-primary text-white font-black rounded-2xl mt-6 shadow-[0_10px_20px_rgba(0,51,160,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                >
                  {phoneLoading ? <FiLoader className="animate-spin mx-auto" /> : "Guardar Número"}
                </button>
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="w-full py-3 mt-3 text-white/20 hover:text-white/40 text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="w-full max-w-md mb-8 relative">
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/10 blur-[40px] rounded-full" />
        <div className="relative flex justify-between items-center bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-[#00205B] to-black flex items-center justify-center font-black text-2xl shadow-2xl border border-white/20">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter">{user.nombre.split(' ')[0]}</h1>
              <span className="text-secondary text-[9px] font-black uppercase tracking-[0.2em] bg-secondary/10 px-2 py-0.5 rounded-md border border-secondary/20 w-fit">Miembro</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 hover:bg-red-500/10 transition-all">
            <FiLogOut className="text-white/40 group-hover:text-red-500 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TARJETA QR PRINCIPAL */}
      <div className="w-full max-w-md bg-[#0f0f0f] rounded-[3.5rem] p-1 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,51,160,0.1),transparent_70%)]" />
        
        <div className="w-full h-full bg-[#161616]/80 backdrop-blur-xl rounded-[3.3rem] p-8 flex flex-col items-center border border-white/5">
          
          {/* QR SECTION */}
          <div className="relative mt-4">
            <div className="absolute -top-4 -left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-50" />
            <div className="absolute -bottom-4 -right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-50" />
            <div className="bg-white p-4 rounded-[2rem] shadow-2xl relative z-10 border-[6px] border-black">
              <QRCodeCanvas value={user.membershipId} size={170} level={"H"} imageSettings={{ src: logoEmpresa, height: 40, width: 40, excavate: true }} />
            </div>
          </div>

          {/* NUEVA SECCIÓN: ESTADO DE MENSUALIDAD (POST-QR) */}
          <div className="mt-10 w-full space-y-4">
            <div className="flex justify-center">
              <div className="bg-white/[0.03] border border-white/10 px-5 py-1.5 rounded-xl">
                <span className="text-xs font-mono font-black text-primary tracking-[0.3em]">{user.membershipId}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">{user.nombre}</h2>
               <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mb-4">Socio Activo</p>
               
               {/* INDICADORES DINÁMICOS */}
               <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group/item">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <FiActivity className="text-primary mb-1" size={16} />
                    <span className="text-lg font-black tracking-tighter text-white">{user.clasesDisponibles || 0}</span>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Clases disponibles</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group/item">
                    <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <FiClock className="text-secondary mb-1" size={16} />
                    <span className="text-lg font-black tracking-tighter text-white uppercase">
                      {user.fechaVencimiento ? new Date(user.fechaVencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '--'}
                    </span>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Vencimiento</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>


      {/* FOOTER INFO */}
      <div className="w-full max-w-md mt-6 bg-primary/5 border border-primary/20 p-4 rounded-[2rem] flex gap-3 items-center">
        <FiInfo className="text-primary shrink-0" size={18} />
        <p className="text-[9px] text-white/40 leading-tight font-medium">
          Muestra tu QR en recepción para registrar tu asistencia. Las clases vencen el día indicado arriba.
        </p>
      </div>
    </div>
  );
}