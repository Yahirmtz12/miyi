import { useState, useEffect, useRef } from "react"; // <-- Agregamos useRef
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FiCamera, FiSearch, FiDollarSign,
  FiCalendar, FiHash, FiCreditCard,
  FiLoader, FiUser, FiCheckCircle, FiX, FiPlus, FiEdit3
} from "react-icons/fi";
import { API_URL } from "../api";

export default function MembresiaCaja() {
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [cantidadClases, setCantidadClases] = useState(8);
  const [montoCobrado, setMontoCobrado] = useState("");
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState("");
  const [disciplina, setDisciplina] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // --- REFERENCIAS PARA EL ESCÁNER FÍSICO ---
  const scannerBuffer = useRef("");
  const scannerTimeout = useRef(null);

  const calcularFechaDefault = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  // --- OYENTE GLOBAL PARA EL ESCÁNER FÍSICO ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // 1. Si el usuario está escribiendo manualmente en los inputs (Monto, Disciplina, etc),
      // ignoramos el evento global para no interrumpirlo.
      const activeTag = document.activeElement.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        return;
      }

      // 2. Si el escáner manda un "Enter" (finalizó de leer el código)
      if (e.key === "Enter") {
        if (scannerBuffer.current.length >= 5) {
          // Guardamos lo capturado y disparamos la búsqueda
          setMembershipId(scannerBuffer.current.toUpperCase());
        }
        scannerBuffer.current = ""; // Limpiamos el buffer
        return;
      }

      // 3. Si es una letra o número, lo acumulamos
      if (e.key.length === 1) {
        scannerBuffer.current += e.key;

        // Los escáneres escriben rapidísimo. Si pasan más de 100ms sin teclear,
        // asumimos que fue un humano tocando teclas por error y limpiamos el buffer.
        clearTimeout(scannerTimeout.current);
        scannerTimeout.current = setTimeout(() => {
          scannerBuffer.current = "";
        }, 150);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);
  // ---------------------------------------------

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
          if (res.ok) {
            setClientData(data);
            setNuevaFechaVencimiento(calcularFechaDefault());
            setDisciplina(data.disciplina || ""); 
          } else { 
            setClientData(null); 
            setDisciplina("");
          }
        } catch (error) { 
          console.error("Error"); 
        } finally { 
          setSearchingClient(false); 
        }
      } else { 
        setClientData(null); 
        setDisciplina("");
      }
    };
    const timer = setTimeout(fetchClientInfo, 500);
    return () => clearTimeout(timer);
  }, [membershipId]);

  // Efecto para el escáner de cámara (Html5QrcodeScanner)
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader-caja", {
      fps: 10, qrbox: { width: 250, height: 250 },
    });
    scanner.render((result) => setMembershipId(result.toUpperCase()), () => { });
    return () => scanner.clear().catch(err => console.error(err));
  }, []);

  const handleRenewMembership = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/renew-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          membershipId, 
          cantidadClases, 
          nuevaFechaVencimiento, 
          monto: montoCobrado,
          disciplina 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setModalData({ ...data, alumno: clientData.nombre });
        setShowModal(true);
        setMembershipId("");
        setClientData(null);
        setDisciplina(""); 
      }
    } catch (error) { alert("Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">

      <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0 shadow-lg shadow-primary/10">
              <FiCreditCard className="text-secondary w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Gestion de membresia</h1>
              <p className="text-white/40 text-[10px] md:text-sm italic">Rhythm Oaxaca</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* SECCIÓN SCANNER (IZQUIERDA) */}
          <section className="space-y-6">
            <div className="bg-[#262626] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
              <div id="reader-caja" className="w-full"></div>
            </div>

            <div className="relative group">
              <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                placeholder="ID DE MEMBRESÍA MANUAL..."
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value.toUpperCase())}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-primary transition-all uppercase"
              />
              {searchingClient && <FiLoader className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
            </div>
          </section>

          {/* SECCIÓN FORMULARIO (DERECHA) */}
          <section>
            {clientData ? (
              <form
                onSubmit={handleRenewMembership}
                className="relative bg-[#1A1A1A] p-8 rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 animate-in fade-in zoom-in duration-500 overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative flex justify-between items-start border-b border-white/5 pb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-1 block">Renovación de Cuenta</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">
                      {clientData.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        Actual: {clientData.clasesDisponibles} Clases disponibles
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <FiDollarSign className="text-primary" size={20} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 flex items-center gap-2">
                    <FiEdit3 className="text-primary" /> Disciplina Inscrita
                  </label>
                  <input
                    type="text"
                    placeholder="EJ: SALSA, URBANO, RITMOS LATINOS..."
                    value={disciplina}
                    onChange={(e) => setDisciplina(e.target.value.toUpperCase())}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold transition-all placeholder:text-white/10 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 flex items-center gap-2">
                      <FiPlus className="text-primary" /> Nuevas Clases
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        required
                        value={cantidadClases}
                        onChange={(e) => setCantidadClases(e.target.value)}
                        placeholder="0"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 flex items-center gap-2">
                      <FiDollarSign className="text-primary" /> Monto Total
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        required 
                        placeholder="0.00"
                        value={montoCobrado}
                        onChange={(e) => setMontoCobrado(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold transition-all placeholder:text-white/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase">MXN</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 flex items-center gap-2">
                    <FiCalendar className="text-primary" /> Nueva Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaFechaVencimiento}
                    onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold [color-scheme:dark] transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative overflow-hidden group bg-primary text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(197,164,115,0.3)] hover:shadow-primary/40 transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />

                    <div className="relative z-10 flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-xs">
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        <>
                          <FiCheckCircle className="text-lg" />
                          Procesar Pago
                        </>
                      )}
                    </div>
                  </button>

                  <p className="text-[8px] text-center text-white/20 uppercase font-black tracking-widest mt-4">
                    Esta acción actualizará clases disponibles, disciplina y vigencia del socio inmediatamente
                  </p>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/[0.02] transition-opacity duration-500">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <FiDollarSign size={32} className="text-white/20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40 max-w-[200px] leading-relaxed">
                  Esperando escaneo de membresía para habilitar cobro
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODAL DE ÉXITO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#262626] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black uppercase tracking-tighter italic text-secondary">Pago Registrado</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition p-2 bg-white/5 rounded-full">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-10 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center border border-secondary/20">
                <FiCheckCircle className="text-secondary" size={40} />
              </div>
              <p className="text-white/60 font-bold italic uppercase">Membresía de <span className="text-white">"{modalData?.alumno}"</span> actualizada con éxito.</p>
              <button onClick={() => setShowModal(false)} className="w-full bg-primary text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}