import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FiCamera, FiSearch, FiAward,
  FiMinusCircle, FiPlusCircle,
  FiLoader, FiUser, FiX, FiCheckCircle
} from "react-icons/fi";
import { API_URL } from "../api";

export default function MembresiaStaff() {
  const [membershipId, setMembershipId] = useState("");
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [actionType, setActionType] = useState("add");

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // ESCUCHAR TECLA ENTER PARA CERRAR MODAL
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showModal && e.key === "Enter") {
        setShowModal(false);
      }
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
          if (res.ok) {
            setClientData(data);
          } else {
            setClientData(null);
          }
        } catch (error) {
          console.error("Error buscando cliente");
        } finally {
          setSearchingClient(false);
        }
      } else {
        setClientData(null);
      }
    };

    const timer = setTimeout(fetchClientInfo, 500);
    return () => clearTimeout(timer);
  }, [membershipId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 220, height: 220 },
    });

    scanner.render((result) => {
      setMembershipId(result.toUpperCase());
    }, (error) => { /* ignore */ });

    return () => scanner.clear().catch(err => console.error(err));
  }, []);

  const handleProcessPoints = async (e) => {
    if (e) e.preventDefault();
    if (!membershipId || !monto) return alert("Completa todos los campos");
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/users/add-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          membershipId,
          montoCompra: parseFloat(monto),
          tipoAccion: actionType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || "Error");
      } else {
        setModalData(data);
        setShowModal(true);
        setMembershipId("");
        setMonto("");
        setClientData(null);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans relative">

      {/* MODAL DE ÉXITO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161616] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
              <FiCheckCircle className="text-green-500" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tight">¡Puntos Registrados!</h2>
              <p className="text-white/40 text-xs mt-2 uppercase tracking-widest font-bold">{modalData?.cliente}</p>
            </div>
            <div className="bg-black/40 py-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-white/20 mb-1">Nuevo Balance</p>
              {/* CAMBIO: Math.floor para redondear siempre hacia abajo */}
              <p className="text-3xl font-black text-secondary">{Math.floor(modalData?.puntosActuales || 0)} <span className="text-xs uppercase italic">pts</span></p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <button
                type="submit"
                autoFocus
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-lg"
              >
                Cerrar (Enter)
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
              <FiAward className="text-secondary w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Membresia</h1>
              <p className="text-white/40 text-[10px] md:text-sm italic">San Sebastian - Zaachila</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <FiCamera className="text-primary w-5 h-5" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 italic">Escanear Código QR</h2>
          </div>
          <div className="bg-black/40 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
            <div id="reader" className="w-full overflow-hidden"></div>
          </div>

          {clientData && (
            <div className="relative group animate-in slide-in-from-bottom-4 duration-500">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#161616] p-8 rounded-[2rem] border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-secondary text-[9px] font-black uppercase tracking-[0.2em]">Cliente Verificado</p>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{clientData.nombre}</h3>
                    <div className="flex items-center gap-2 text-white/40 pt-2">
                      <FiCheckCircle className="text-green-500" />
                      <span className="text-xs font-mono">{membershipId}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Balance</p>
                    <div className="flex items-baseline justify-end gap-1">
                      {/* CAMBIO: Math.floor para redondear siempre hacia abajo */}
                      <span className="text-4xl font-black text-white leading-none">{Math.floor(clientData.puntos)}</span>
                      <span className="text-secondary font-black text-xs uppercase italic">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="bg-[#161616] p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">

            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-10">
              <button
                type="button"
                onClick={() => setActionType("add")}
                className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${actionType === 'add' ? 'bg-primary text-white' : 'text-white/20'}`}
              >
                <FiPlusCircle size={16} /> Sumar
              </button>
              <button
                type="button"
                onClick={() => setActionType("redeem")}
                className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${actionType === 'redeem' ? 'bg-secondary text-black' : 'text-white/20'}`}
              >
                <FiMinusCircle size={16} /> Canjear
              </button>
            </div>

            <form onSubmit={handleProcessPoints} className="space-y-8">
              <div className="group">
                <label className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] ml-4">Membresía</label>
                <div className="relative mt-2">
                  <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={membershipId}
                    onChange={(e) => setMembershipId(e.target.value.toUpperCase())}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-sm font-bold text-white focus:border-white/20 outline-none transition-all"
                    placeholder="PJ-000000"
                  />
                  {searchingClient && <FiLoader className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-secondary" />}
                </div>
              </div>

              <div className="group">
                <label className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] ml-4">
                  {actionType === 'add' ? 'Monto de compra' : 'Puntos a descontar'}
                </label>
                <div className="relative mt-2 bg-black/40 rounded-3xl p-6 border border-white/5 group-focus-within:border-white/10 transition-all text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-black text-white/20">
                      {actionType === 'add' ? '$' : 'PTS'}
                    </span>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="bg-transparent text-5xl font-black outline-none w-full text-center placeholder:text-white/5"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !membershipId || !monto}
                className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-20 ${actionType === 'add' ? 'bg-primary text-white shadow-[0_10px_40px_rgba(0,51,160,0.2)]' : 'bg-secondary text-black shadow-[0_10px_40px_rgba(245,130,32,0.2)]'}`}
              >
                {loading ? <FiLoader className="animate-spin" size={20} /> : actionType === 'add' ? "Registrar Visita" : "Confirmar Canje"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}