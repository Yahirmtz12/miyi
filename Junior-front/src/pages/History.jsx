import { useEffect, useState } from "react";
import { 
  FiClock, 
  FiCalendar, 
  FiEye, 
  FiX, 
  FiHash, FiTrash2,
  FiShoppingBag,
  FiTrendingUp 
} from "react-icons/fi";
import { API_URL } from "../api";

export default function History() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin"; // Cambia a "ADMIN" si en tu BD se guarda en mayúsculas
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); 
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const filtered = sales.filter(sale => {
      const d = new Date(sale.fecha);
      const saleDateLocal = d.toLocaleDateString('en-CA'); 
      return saleDateLocal === selectedDate;
    });
    setFilteredSales(filtered);
  }, [selectedDate, sales]);

  const fetchSales = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSales(data);
      }
    } catch (err) {
      console.error("Error al cargar ventas:", err);
    }
  };
  const handleDeleteSale = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSales(sales.filter(sale => sale._id !== id));
        if (selectedSale && selectedSale._id === id) {
          setShowModal(false);
          setSelectedSale(null);
        }
      } else {
        const data = await res.json();
        alert(`Error al eliminar: ${data.msg || 'Desconocido'}`);
      }
    } catch (err) {
      console.error("Error en la petición de eliminación:", err);
      alert("Hubo un problema de conexión al intentar eliminar la venta.");
    }
  };
  const totalDia = filteredSales.reduce((acc, sale) => acc + sale.total, 0);

  const countItems = (productos) => {
    return productos.reduce((acc, p) => acc + p.cantidad, 0);
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      
      {/* HEADER UNIFICADO (FIX DE CALENDARIO APLICADO) */}
      <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
            <FiClock className="text-secondary w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Historial</h1>
                <p className="text-white/40 text-[10px] md:text-sm italic">San Sebastian - Zaachila</p>
          </div>
        </div>

        {/* CONTENEDOR DE FECHA CORREGIDO */}
        <div className="flex items-center bg-black/40 rounded-2xl border border-white/10 w-full sm:w-auto shadow-xl overflow-hidden group focus-within:border-secondary transition-all">
          <div className="pl-5 pr-2">
            <FiCalendar className="text-secondary w-5 h-5" />
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white outline-none text-xs md:text-sm font-black cursor-pointer uppercase tracking-widest py-3 md:py-4 pr-5 [color-scheme:dark]"
          />
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        
        {/* KPI CARDS (RESUMEN RÁPIDO) */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-black/40 p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-xl border-l-4 border-l-primary">
            <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">Corte de Caja</p>
            <h2 className="text-2xl md:text-4xl font-black text-white mt-1">${totalDia.toLocaleString()}</h2>
          </div>
          <div className="bg-black/40 p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-xl border-l-4 border-l-secondary">
            <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">Tickets Totales</p>
            <h2 className="text-2xl md:text-4xl font-black text-white mt-1">{filteredSales.length}</h2>
          </div>
        </div>

        {/* TÍTULO DE SECCIÓN ESTILO VENTA */}
        <div className="flex items-center gap-3 px-2">
          <FiHash className="text-blue-400 w-5 h-5" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 italic">Registros del Día</h2>
        </div>

        {/* VISTA TABLET/PC: TABLA PULIDA */}
        <div className="hidden md:block bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Hora</th>
                <th className="px-8 py-5 text-center">Folio</th>
                <th className="px-8 py-5 text-center">Artículos</th>
                <th className="px-8 py-5 text-center">Total</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-white/10 font-black uppercase tracking-[0.4em] text-xs italic">
                    Sin movimientos registrados
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-white font-bold font-mono text-sm uppercase">
                        {new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-1 text-white/20 text-[10px] font-mono group-hover:text-white/50 transition-colors uppercase">
                        <FiHash className="text-primary" />
                        <span>{sale._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-white/60">
                        <FiShoppingBag className="text-blue-400 w-3 h-3" />
                        <span className="text-xs font-bold uppercase italic">{countItems(sale.productos)} ítems</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-white font-black text-xl tracking-tighter">${sale.total}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => { setSelectedSale(sale); setShowModal(true); }}
                        className="p-3 bg-white/5 hover:bg-primary text-white rounded-xl transition-all active:scale-90 border border-white/5"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      {/* CONDICIONAL: Solo se muestra si isAdmin es true */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSale(sale._id)}
                            className="p-3 bg-white/5 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all active:scale-90 border border-white/5"
                            title="Eliminar venta"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL: CARDS REDONDEADAS */}
        <div className="grid grid-cols-1 gap-4 md:hidden pb-20">
          {filteredSales.length === 0 ? (
            <div className="py-20 text-center text-white/10 font-black uppercase tracking-[0.2em] text-[10px] italic">
              Sin movimientos hoy
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale._id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest">
                      <FiHash />
                      <span>Folio: {sale._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="text-2xl font-black text-white tracking-tighter">
                      ${sale.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <span className="text-white/60 font-black text-[10px] font-mono">
                      {new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase">
                    <FiShoppingBag className="text-blue-400" />
                    <span>{countItems(sale.productos)} productos</span>
                  </div>
                  <div className="flex items-center gap-2">
                     {/* CONDICIONAL MÓVIL: Solo se muestra si isAdmin es true */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSale(sale._id)}
                        className="p-3 bg-white/5 hover:bg-red-600 text-red-400 hover:text-white rounded-[1.2rem] border border-white/10 transition-all active:scale-90"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedSale(sale); setShowModal(true); }}
                      className="flex items-center gap-2 py-3 px-5 bg-white/5 hover:bg-primary text-white rounded-[1.2rem] border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all active:scale-90"
                    >
                      <FiEye /> Detalle
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL DETALLE */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Ticket Digital</h3>
                <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest mt-1">ID: {selectedSale._id}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {selectedSale.productos.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex gap-4 items-center">
                      <span className="w-10 h-10 flex items-center justify-center bg-black/40 rounded-xl text-secondary font-black text-xs border border-white/5">{item.cantidad}</span>
                      <span className="text-white/70 font-bold text-xs uppercase tracking-wide italic">{item.nombre}</span>
                    </div>
                    <span className="text-white font-black text-sm tracking-tighter">${(item.cantidad * item.precio).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] italic">Gran Total</span>
                  <span className="text-4xl font-black text-secondary tracking-tighter">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-6 bg-primary hover:bg-[#00205B] text-white font-black uppercase tracking-[0.3em] text-[10px] transition-colors italic"
            >
              Cerrar Revisión
            </button>
          </div>
        </div>
      )}

      <footer className="mt-10 p-10 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">History Logs - San Sebastian</p>
      </footer>
    </div>
  );
}
