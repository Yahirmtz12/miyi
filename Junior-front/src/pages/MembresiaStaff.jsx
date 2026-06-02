import { useState, useEffect, useRef } from "react";
import {
  FiSearch, FiDollarSign,
  FiCalendar, FiHash, FiCreditCard,
  FiLoader, FiUser, FiCheckCircle, FiX, FiPlus, FiEdit3, FiPrinter
} from "react-icons/fi";
import { API_URL } from "../api";
import qz from "qz-tray"; 

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

  const scannerBuffer = useRef("");
  const scannerTimeout = useRef(null);

  const esMovil = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const calcularFechaDefault = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  // --- 1. OYENTE GLOBAL REFINADO PARA ESCÁNER FÍSICO ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInput = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";

      // Permitir borrar, navegar o si está escribiendo en un input, no interferir
      if (isInput || e.key === "Backspace" || e.key.length > 1 && e.key !== "Enter") {
        return;
      }

      if (e.key === "Enter") {
        if (scannerBuffer.current.length >= 5) {
          // Actualizamos el estado con lo que leyó la pistola
          setMembershipId(scannerBuffer.current.toUpperCase());
        }
        scannerBuffer.current = ""; 
        return;
      }

      // Evitamos capturar comandos raros
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scannerBuffer.current += e.key;
        clearTimeout(scannerTimeout.current);
        scannerTimeout.current = setTimeout(() => {
          scannerBuffer.current = "";
        }, 100); // 100ms es muy estricto, ideal para pistolas láser
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      clearTimeout(scannerTimeout.current);
    };
  }, []);

  // --- 2. BÚSQUEDA DEL CLIENTE AL CAMBIAR membershipId ---
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
          console.error("Error al buscar cliente"); 
        } finally { 
          setSearchingClient(false); 
        }
      } else { 
        setClientData(null); 
        setDisciplina("");
      }
    };
    
    // Pequeño debounce para no saturar el servidor si escriben a mano
    const timer = setTimeout(fetchClientInfo, 300);
    return () => clearTimeout(timer);
  }, [membershipId]);

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
        setModalData({ 
          ...data, 
          alumno: clientData.nombre,
          montoTicket: montoCobrado,
          clasesTicket: cantidadClases,
          disciplinaTicket: disciplina,
          vencimientoTicket: nuevaFechaVencimiento
        });
        setShowModal(true);
        
        setMembershipId("");
        setClientData(null);
        setDisciplina(""); 
        setMontoCobrado("");
      } else {
        // Mostrar mensaje si el backend devuelve error (ej. 403)
        alert(data.msg || "Error al procesar pago");
      }
    } catch (error) { 
      alert("Error de conexión al procesar el pago"); 
    }
    finally { setLoading(false); }
  };

  const imprimirTicket = async () => {
    if (!modalData) return;

    const { alumno, montoTicket, clasesTicket, disciplinaTicket, vencimientoTicket } = modalData;
    const totalNum = parseFloat(montoTicket || 0);

    const datosMembresia = 
      `ALUMNO: ${alumno.substring(0, 22)}\n` +
      `DISCIPLINA: ${disciplinaTicket || 'General'}\n` +
      `NUEVAS CLASES: ${clasesTicket}\n` +
      `VENCE: ${new Date(vencimientoTicket).toLocaleDateString('es-MX')}\n`;

    if (esMovil()) {
      const comandoApertura = "\u001b\u0070\u0000\u0019\u00fa";
      const textoRawBT = 
        comandoApertura + 
        `[C]Rhythm Oaxaca\n` + 
        `[C]SUCURSAL CENTRO\n` +
        `--------------------------------\n` +
        `[C]PAGO DE MEMBRESIA\n` +
        `--------------------------------\n` +
        `${datosMembresia}` +
        `--------------------------------\n` +
        `TOTAL PAGADO:   $${totalNum.toFixed(2).padStart(10)}\n` +
        `--------------------------------\n` +
        `[C]¡GRACIAS POR TU PREFERENCIA!\n` +
        `[C]${new Date().toLocaleString()}\n\n`;

      const intentURL = `intent:${encodeURIComponent(textoRawBT)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      
      try {
        window.location.href = intentURL;
      } catch (e) {
        alert("Asegúrate de tener instalada la app RawBT Printer en tu tablet.");
      }
    } else {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }

        const config = qz.configs.create("POS-58"); 

        const textoQZ = 
          `          Rhythm Oaxaca\n` + 
          `         SUCURSAL CENTRO\n` +
          `--------------------------------\n` +
          `       PAGO DE MEMBRESIA\n` +
          `--------------------------------\n` +
          `${datosMembresia}` +
          `--------------------------------\n` +
          `TOTAL PAGADO:   $${totalNum.toFixed(2).padStart(10)}\n` +
          `--------------------------------\n` +
          `   ¡GRACIAS POR TU PREFERENCIA!\n` +
          `   ${new Date().toLocaleString()}\n\n\n`;

        const data = [
          { type: 'raw', format: 'hex', data: '1B700019FA' }, 
          { type: 'raw', format: 'plain', data: textoQZ }
        ];

        await qz.print(config, data);

      } catch (err) {
        console.error("Error con QZ Tray:", err);
        alert("Error al imprimir. Revisa que QZ Tray esté abierto y la impresora conectada.");
      }
    }
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

          {/* SECCIÓN SCANNER (sin cámara — solo lector físico) */}
          <section className="space-y-6">
            <div className="bg-[#262626] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                <FiSearch size={28} className="text-primary animate-pulse" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Lector QR Activo</p>
              <p className="text-[9px] text-white/20 uppercase tracking-widest">Escanea la membresía del alumno</p>
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

      {/* MODAL DE ÉXITO CON BOTÓN DE IMPRESIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#262626] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black uppercase tracking-tighter italic text-secondary">Pago Registrado</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition p-2 bg-white/5 rounded-full">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center border border-secondary/20">
                <FiCheckCircle className="text-secondary" size={40} />
              </div>
              <p className="text-white/60 font-bold italic uppercase">
                Membresía de <span className="text-white">"{modalData?.alumno}"</span> actualizada con éxito.
              </p>
              
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={imprimirTicket} 
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-secondary/20 transition-all active:scale-95 hover:bg-[#D97018]"
                >
                  <FiPrinter size={18} />
                  Imprimir Ticket
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  Cerrar y Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}