import { useState, useEffect } from "react";
import { FiPlus, FiDollarSign, FiTag, FiCalendar, FiTrash2, FiPieChart, FiFilter, FiX } from "react-icons/fi";
import { API_URL } from "../api";

export default function ExpensesView() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ descripcion: "", monto: "", categoria: "Insumos" });
  
  // CORRECCIÓN 1: Obtener fecha local actual en formato YYYY-MM-DD sin desfase UTC
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  };

  const [filterDate, setFilterDate] = useState(getLocalDate());

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // CORRECCIÓN 2: Enviar la fecha explícitamente para evitar que el servidor use UTC
    const bodyData = { 
      ...form, 
      monto: Number(form.monto), 
      usuario: "Usuario",
      fecha: new Date() // El servidor recibirá la fecha completa
    };

    const res = await fetch(`${API_URL}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      setShowModal(false);
      setForm({ descripcion: "", monto: "", categoria: "Insumos" });
      fetchExpenses();
    } else {
      const errorLog = await res.json();
      alert("Error al guardar: " + errorLog.message);
    }
  };

  const filteredExpenses = expenses.filter(gasto => {
    // CORRECCIÓN 3: Comparar fechas usando la hora local para el filtrado
    const fechaObj = new Date(gasto.fecha);
    const gastoFechaLocal = new Date(fechaObj.getTime() - (fechaObj.getTimezoneOffset() * 60000))
                             .toISOString().split('T')[0];
    return gastoFechaLocal === filterDate;
  });

  const totalGastosDia = filteredExpenses.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      
      <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
            <FiPieChart className="text-secondary w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Gastos</h1>
            <p className="text-white/40 text-[10px] md:text-sm italic">Rhythm - Oaxaca</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-black/40 rounded-2xl border border-white/10 w-full sm:w-auto shadow-xl overflow-hidden group focus-within:border-secondary transition-all">
            <div className="pl-5 pr-2">
              <FiCalendar className="text-secondary w-5 h-5" />
            </div>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-white outline-none text-xs md:text-sm font-black cursor-pointer uppercase tracking-widest py-3 md:py-4 pr-5 [color-scheme:dark]"
            />
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase text-xs tracking-widest w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            Registrar Gasto
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/40 p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-xl border-l-4 border-l-secondary">
            <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">Egresos del Día</p>
            <h2 className="text-2xl md:text-4xl font-black text-secondary mt-1">${totalGastosDia.toLocaleString()}</h2>
          </div>
          <div className="bg-black/40 p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-xl border-l-4 border-l-primary">
            <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">Movimientos</p>
            <h2 className="text-2xl md:text-4xl font-black text-white mt-1">{filteredExpenses.length} <span className="text-[10px] text-white/20">TICKETS</span></h2>
          </div>
          <div className="hidden lg:block bg-black/40 p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-xl">
             <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">Acumulado Histórico</p>
             <h2 className="text-2xl md:text-3xl font-black text-white/40 mt-1">
               ${expenses.reduce((acc, curr) => acc + curr.monto, 0).toLocaleString()}
             </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <FiTag className="text-secondary w-5 h-5" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 italic">Lista de Movimientos</h2>
        </div>

        {/* TABLA ESCRITORIO */}
        <div className="hidden md:block bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5 text-center">Categoría</th>
                <th className="px-8 py-5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((gasto) => (
                  <tr key={gasto._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5 font-bold uppercase text-sm tracking-tight text-white/80 italic">{gasto.descripcion}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest group-hover:border-secondary/40 transition-colors">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-secondary text-xl tracking-tighter">
                      -${gasto.monto.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-8 py-20 text-center text-white/10 font-black uppercase tracking-[0.4em] text-xs italic">
                    Sin registros para esta fecha
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MÓVIL */}
        <div className="grid grid-cols-1 gap-4 md:hidden pb-20">
          {filteredExpenses.map((gasto) => (
            <div key={gasto._id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {gasto.categoria}
                  </span>
                  <span className="text-secondary font-black text-xl">-${gasto.monto.toLocaleString()}</span>
               </div>
               <h3 className="text-white font-bold text-sm uppercase tracking-tight italic">{gasto.descripcion}</h3>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleAddExpense} 
            className="bg-[#1F1F1F] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Registrar Salida</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 italic">Descripción</label>
                <input 
                  required type="text" value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm transition"
                  placeholder="Ej. Insumos de limpieza"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 italic">Monto ($)</label>
                  <input 
                    required type="number" value={form.monto}
                    onChange={(e) => setForm({...form, monto: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-secondary font-black focus:border-primary outline-none text-lg transition"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2 italic">Categoría</label>
                  <select 
                    value={form.categoria}
                    onChange={(e) => setForm({...form, categoria: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-secondary outline-none text-[10px] font-black uppercase cursor-pointer appearance-none transition"
                  >
                    <option value="Insumos">Insumos</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Nómina">Nómina</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-[#00205B] text-white font-black py-5 rounded-[1.5rem] transition shadow-xl shadow-primary/20 mt-4 tracking-widest uppercase text-xs"
              >
                Guardar Gasto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}