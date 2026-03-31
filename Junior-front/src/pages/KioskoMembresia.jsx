import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FiCamera, FiSearch, FiActivity,
  FiCalendar, FiClock, FiLoader, 
  FiUser, FiX, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";
import { API_URL } from "../api";

export default function MembresiaStaff() {
  // --- LÓGICA INTACTA ---
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showModal && e.key === "Enter") setShowModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

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
        } catch (error) { console.error("Error"); }
        finally { setSearchingClient(false); }
      } else { setClientData(null); }
    };
    const timer = setTimeout(fetchClientInfo, 500);
    return () => clearTimeout(timer);
  }, [membershipId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10, qrbox: { width: 250, height: 250 },
    });
    scanner.render((result) => setMembershipId(result.toUpperCase()), () => {});
    return () => scanner.clear().catch(err => console.error(err));
  }, []);

  const handleRegisterAttendance = async () => {
    if (!membershipId || !clientData) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/register-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ membershipId, nombreClase: "Clase General" })
      });
      const data = await res.json();
      if (res.ok) {
        setModalData({ ...data, alumno: clientData.nombre });
        setShowModal(true);
        setMembershipId("");
        setClientData(null);
      } else { alert(data.msg || "Error"); }
    } catch (error) { alert("Error de conexión"); }
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
      
      {/* HEADER ESTILO INVENTARIO */}
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
        
        {/* IZQUIERDA: SCANNER */}
        <section className="space-y-6">
          <div className="bg-[#262626] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
            <div id="reader" className="w-full"></div>
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
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-3 text-white">{clientData.nombre}</h3>
                  <p className="text-white/40 text-[10px] font-bold mt-1 tracking-widest uppercase">{membershipId}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
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
                <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3">
                  <FiAlertCircle className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-[10px] font-bold uppercase italic">{clientData.mensaje}</p>
                </div>
              )}

              <button
                onClick={handleRegisterAttendance}
                disabled={loading || clientData.status !== "activa"}
                className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl disabled:opacity-20
                  ${clientData.status === 'activa' ? 'bg-primary text-white shadow-primary/20' : 'bg-neutral-800 text-white/40'}`}
              >
                {loading ? <FiLoader className="animate-spin" /> : "Registrar Entrada"}
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30">
              <FiCamera size={40} className="mb-4 text-white/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Esperando escaneo de pase</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE ÉXITO ESTILO INVENTARIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#262626] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-tighter italic text-secondary">Acceso Permitido</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition p-2 bg-white/5 rounded-full">
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
                  <p className="text-[10px] font-black uppercase text-white/20 mb-1 tracking-widest">Quedan</p>
                  <p className="text-3xl font-black text-white">{modalData?.clasesRestantes} <span className="text-xs uppercase italic text-secondary">clases</span></p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-full bg-primary text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95">
                Listo (Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}