import { useState, useEffect, useRef } from "react";
import {
  FiSearch, FiActivity,
  FiCalendar, FiLoader, 
  FiUser, FiX, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";
import { API_URL } from "../api";

export default function MembresiaStaff() {
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const lastScannedRef = useRef({ id: "", time: 0 });

  const scannerBuffer = useRef("");
  const scannerTimeout = useRef(null);

  const resetKiosk = () => {
    setMembershipId("");
    setClientData(null);
    setShowModal(false);
    setModalData(null);
  };

  // --- 1. OYENTE GLOBAL DEL ESCÁNER FÍSICO ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showModal && e.key === "Enter") {
        resetKiosk();
        return;
      }

      const activeElement = document.activeElement;
      const isInput = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";

      if (isInput || e.key === "Backspace" || e.key.length > 1 && e.key !== "Enter") {
        return;
      }

      if (e.key === "Enter") {
        if (scannerBuffer.current.length >= 5) {
          setMembershipId(scannerBuffer.current.toUpperCase());
        }
        scannerBuffer.current = "";
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scannerBuffer.current += e.key;
        clearTimeout(scannerTimeout.current);
        scannerTimeout.current = setTimeout(() => {
          scannerBuffer.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      clearTimeout(scannerTimeout.current);
    };
  }, [showModal]);

  // --- 2. BUSCAR INFORMACIÓN AL LEER CÓDIGO ---
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (membershipId.length >= 5) {
        setSearchingClient(true);
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_URL}/api/users/member/${membershipId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) { setClientData(data); } 
          else { setClientData(null); }
        } catch (error) { console.error("Error al buscar miembro"); }
        finally { setSearchingClient(false); }
      } else { setClientData(null); }
    };
    
    const timer = setTimeout(fetchClientInfo, 300);
    return () => clearTimeout(timer);
  }, [membershipId]);

  // --- 3. AUTO-REGISTRO Y AUTO-LIMPIEZA DE RECHAZOS ---
  useEffect(() => {
    if (clientData) {
      if (clientData.status === "activa" && !showModal) {
        const autoRegisterTimer = setTimeout(() => {
          handleRegisterAttendance();
        }, 1000);
        return () => clearTimeout(autoRegisterTimer);
      } else if (clientData.status !== "activa") {
        const autoClearReject = setTimeout(() => {
          resetKiosk();
        }, 6000);
        return () => clearTimeout(autoClearReject);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientData, showModal]);

  // --- 4. AUTO-CERRAR MODAL DE ÉXITO ---
  useEffect(() => {
    if (showModal) {
      const autoCloseSuccess = setTimeout(() => {
        resetKiosk();
      }, 5000);
      return () => clearTimeout(autoCloseSuccess);
    }
  }, [showModal]);

  const handleRegisterAttendance = async () => {
    if (!membershipId || !clientData) return;
    
    const now = Date.now();
    if (lastScannedRef.current.id === membershipId && now - lastScannedRef.current.time < 6000) {
       console.log("Ignorando escaneo repetido (cooldown)");
       return;
    }
    
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/register-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ membershipId, nombreClase: clientData.disciplina || "Clase General" })
      });
      const data = await res.json();
      if (res.ok) {
        lastScannedRef.current = { id: membershipId, time: now };
        setModalData({ ...data, alumno: clientData.nombre });
        setShowModal(true);
      } else { 
        alert(data.msg || "Error al registrar asistencia"); 
      }
    } catch (error) { console.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "activa": return "text-green-400 border-green-400/20 bg-green-400/10";
      case "vencida": return "text-red-400 border-red-400/20 bg-red-400/10";
      case "sin_clases": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      default: return "text-white/20 border-white/10 bg-white/5";
    }
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      
      {/* HEADER */}
      <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0 shadow-lg shadow-primary/10">
              <FiActivity className="text-secondary w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Asistencias</h1>
              <p className="text-white/40 text-[10px] md:text-sm italic">Rhythm Oaxaca </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
        
        {/* IZQUIERDA: BÚSQUEDA (sin cámara) */}
        <section className="space-y-6">
          {/* Indicador visual del lector físico */}
          <div className="bg-[#262626] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-10 flex flex-col items-center justify-center text-center min-h-[250px]">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <FiActivity size={36} className="text-primary animate-pulse" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40 mb-2">Lector QR Activo</p>
            <p className="text-[10px] text-white/20 uppercase tracking-widest max-w-[280px] leading-relaxed">
              Acerca el código QR al lector físico o busca manualmente abajo
            </p>
          </div>
          
          <div className="relative group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="BUSCAR ID MANUALMENTE..."
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value.toUpperCase())}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-primary transition-all uppercase tracking-widest"
            />
            {searchingClient && <FiLoader className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
          </div>
        </section>

        {/* DERECHA: INFO Y ACCIÓN */}
        <section>
          {clientData ? (
            <div className="bg-[#262626] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(clientData.status)}`}>
                    Membresía {clientData.status.replace('_', ' ')}
                  </span>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-3 text-white line-clamp-1">{clientData.nombre}</h3>
                  <p className="text-white/40 text-[10px] font-bold mt-1 tracking-widest uppercase">{membershipId} • {clientData.disciplina || "Sin disciplina"}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shrink-0">
                  <FiUser className="text-white/20 w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 flex items-center gap-2">
                    <FiActivity size={10} /> Disponibles
                  </p>
                  <p className={`text-3xl font-black ${clientData.clasesDisponibles > 0 ? 'text-white' : 'text-red-400'}`}>
                    {clientData.clasesDisponibles}
                  </p>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 flex items-center gap-2">
                    <FiCalendar size={10} /> Vencimiento
                  </p>
                  <p className="text-sm font-black text-white uppercase">
                    {new Date(clientData.fechaVencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>

              {clientData.status !== "activa" && (
                <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 animate-pulse">
                  <FiAlertCircle className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-[10px] font-bold uppercase italic">{clientData.mensaje}</p>
                </div>
              )}

              <button
                disabled={true} 
                className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl
                  ${clientData.status === 'activa' ? 'bg-primary text-white shadow-primary/20' : 'bg-neutral-800 text-white/20'}`}
              >
                {loading ? (
                  <><FiLoader className="animate-spin" /> Auto-registrando...</>
                ) : clientData.status === 'activa' ? (
                  "Procesando acceso..."
                ) : (
                  "Acceso Denegado"
                )}
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30">
              <FiSearch size={40} className="mb-4 text-white/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Acerca tu código QR al lector</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE ÉXITO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#262626] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-tighter italic text-secondary">Acceso Permitido</h3>
              <button onClick={() => resetKiosk()} className="text-white/40 hover:text-white transition p-2 bg-white/5 rounded-full">
                <FiX size={18} />
              </button>
            </div>
            
            <div className="p-10 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center border border-secondary/20">
                <FiCheckCircle className="text-secondary" size={40} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight">{modalData?.alumno}</h2>
                <div className="mt-4 bg-black/40 py-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase text-white/20 mb-1 tracking-widest">Te quedan</p>
                  <p className="text-3xl font-black text-white">{modalData?.clasesRestantes} <span className="text-xs uppercase italic text-secondary">clases</span></p>
                </div>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-white/30 animate-pulse">
                La pantalla se limpiará automáticamente...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}