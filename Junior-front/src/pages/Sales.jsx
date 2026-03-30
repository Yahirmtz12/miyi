import { useEffect, useState } from "react";
import {
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiDollarSign,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiLoader,
  FiMessageCircle,
  FiSearch,
  FiPrinter,
  FiX
} from "react-icons/fi";
import { API_URL } from "../api";
import qz from "qz-tray"; // Importa la librería al inicio de tu archivo

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState([]);
  const [efectivo, setEfectivo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ open: false, message: "", tipo: "info" });
  const [lastSale, setLastSale] = useState(null);
  const [phone, setPhone] = useState("");
  const [showOrderMobile, setShowOrderMobile] = useState(false);
  const esMovil = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const quickFilters = ["COMBO","BOTANA","BEBIDA","GUARNICION","KENTUCKY", "ASADO", "ROSTIZADO", "RANCHERO", "BARBACOA","BBQ", "AGRIDULCE","HAMBURGUESA","HELADO","CREPA"];
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const productosVenta = data.filter(p => p.categoria === "Venta");
        setProducts(productosVenta);
      })
      .catch(() => showModal("Error al cargar productos", "error"));
  }, []);

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showModal = (message, tipo = "info") => {
    setModal({ open: true, message, tipo });
    if (tipo !== "success") {
      setTimeout(() => setModal({ open: false, message: "", tipo: "info" }), 3000);
    }
  };

  // Función unificada para cerrar el modal y resetear estado
  const handleCloseModal = () => {
    if (modal.tipo === "success") {
      setOrder([]);
      setPhone("");
      setSearchTerm("");
    }
    setModal({ ...modal, open: false });
  };

  const addToOrder = (product) => {
    setOrder(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) {
        return prev.map(p =>
          p._id === product._id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const decreaseQty = id => {
    setOrder(prev =>
      prev.map(i => i._id === id ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    );
  };

  const increaseQty = id => {
    setOrder(prev =>
      prev.map(i => i._id === id ? { ...i, qty: i.qty + 1 } : i)
    );
  };

  const total = order.reduce((a, i) => a + i.precio * i.qty, 0);

  const imprimirTicket = () => {
    const itemsText = order.map(i => 
      `${i.qty}x ${i.nombre.toUpperCase().padEnd(12)} $${(i.qty * i.precio).toFixed(2).padStart(7)}`
    ).join('\n');
    
    // Texto del ticket (Agregamos comandos de formato RawBT como [C] para centrar)
    const textoTicket = 
      ` Rhytm Oaxaca\n` + // Actualizado a tu nuevo logo/nombre
      `SUCURSAL ZAACHILA\n` +
      `--------------------------------\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `TOTAL:          $${total.toFixed(2).padStart(10)}\n` +
      `EFECTIVO:       $${parseFloat(lastSale?.efectivoRecibido || efectivo || 0).toFixed(2).padStart(10)}\n` +
      `CAMBIO:         $${(lastSale?.cambio || 0).toFixed(2).padStart(10)}\n` +
      `--------------------------------\n` +
      `¡GRACIAS POR SU COMPRA!\n` +
      `${new Date().toLocaleString()}\n\n\n\n`;

    // CONSTRUCCIÓN CORRECTA DEL INTENT PARA ANDROID
    // El formato debe ser intent://#Intent;...
    const encodedText = encodeURIComponent(textoTicket);
    const intentURL = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    // Intentamos abrir el enlace
    try {
      window.location.href = intentURL;
    } catch (e) {
      alert("Asegúrate de tener instalada la app RawBT Printer en tu tablet.");
    }
};
  const sendWhatsApp = () => {
    if (!phone || phone.length < 10) return alert("Por favor, ingresa un número de 10 dígitos");
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
    const itemsText = order.map(i => `• ${i.qty}x ${i.nombre.toUpperCase()} - $${(i.qty * i.precio).toFixed(2)}`).join('%0A');
    const message = `*🍗 Rhytm 🍗*%0A` + `*Ticket Digital - Sucursal Oaxaca*%0A` + `--------------------------%0A` + `${itemsText}%0A` + `--------------------------%0A` + `*TOTAL: $${total.toFixed(2)}*%0A` + `Efectivo: $${parseFloat(lastSale.efectivoRecibido).toFixed(2)}%0A` + `Cambio: $${lastSale.cambio.toFixed(2)}%0A` + `--------------------------%0A` + `¡Gracias por su compra!%0A` + `_Generado por Rhytm _`;
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  const handlePagar = async () => {
    const efectivoRecibido = parseFloat(efectivo);
    
    // Validación inicial
    if (!efectivoRecibido || efectivoRecibido < total) {
      return showModal("Efectivo insuficiente", "error");
    }

    setIsProcessing(true); // 1. Bloqueamos el botón y mostramos "Validando..."

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          productos: order.map(item => ({ 
            productoId: item._id, 
            nombre: item.nombre, 
            cantidad: item.qty, 
            precio: item.precio 
          })),
          efectivoRecibido
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el servidor responde con error (ej. 400 o 500)
        throw new Error(data.msg || "Error al procesar la venta");
      }

      // Si todo sale bien
      setLastSale(data.sale);
      showModal(`Venta exitosa\nCambio: $${data.sale.cambio.toFixed(2)}`, "success");
      setEfectivo("");
      if (window.innerWidth < 1024) setShowOrderMobile(false);

    } catch (err) {
      // 2. Si hay error de red o el "throw" de arriba se activa
      showModal(err.message, "error");
    } finally {
      // 3. ESTO ES LO MÁS IMPORTANTE: 
      // Se ejecuta siempre, devolviendo el botón a "Finalizar Venta"
      setIsProcessing(false); 
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handlePagar();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#1F1F1F] overflow-hidden text-white font-sans">

      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 h-full">
        <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
                <FiShoppingCart className="text-secondary w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Venta</h1>
                <p className="text-white/40 text-[10px] md:text-sm italic">Rhytm - Oaxaca</p>
              </div>
            </div>
            <button
              onClick={() => setShowOrderMobile(true)}
              className="lg:hidden relative p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <FiShoppingBag className="text-secondary w-6 h-6" />
              {order.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {order.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setSearchTerm("")} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${searchTerm === "" ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>TODOS</button>
            {quickFilters.map(filter => (
              <button key={filter} onClick={() => setSearchTerm(filter)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${searchTerm.toUpperCase() === filter ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{filter}</button>
            ))}
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input type="text" placeholder="BUSCAR PRODUCTO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 md:py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold tracking-widest text-xs uppercase" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <div key={product._id} onClick={() => addToOrder(product)} className="group relative bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-xl active:scale-95">
                <div className="aspect-square relative overflow-hidden">
                  <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3"><span className="bg-secondary text-black px-2 py-0.5 md:py-1 rounded-lg font-black text-xs md:text-sm shadow-lg">${product.precio.toFixed(2)}</span></div>
                </div>
                <div className="p-3 md:p-4 bg-white/5"><h3 className="text-white font-bold text-[10px] md:text-[11px] line-clamp-2 leading-tight uppercase tracking-tighter">{product.nombre}</h3></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className={`
        fixed inset-0 z-40 lg:relative lg:translate-x-0 lg:flex lg:w-[400px] xl:w-[450px]
        bg-black/95 lg:bg-black/40 backdrop-blur-xl flex flex-col shadow-2xl transition-transform duration-300
        ${showOrderMobile ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1"><FiShoppingBag className="text-secondary" /><h2 className="text-xl font-black uppercase">Orden Actual</h2></div>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold italic">Rhytm Orden</p>
          </div>
          <button onClick={() => setShowOrderMobile(false)} className="lg:hidden p-2 text-white/40 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {order.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 opacity-50"><FiShoppingBag size={64} className="mb-4" /><p className="font-bold uppercase tracking-widest text-xs">Esperando pedido...</p></div>
          ) : (
            order.map(item => (
              <div key={item._id} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between group">
                <div className="flex-1 min-w-0"><p className="text-white font-bold text-sm truncate uppercase tracking-tight">{item.nombre}</p><p className="text-secondary font-black text-xs mt-1">${item.precio.toFixed(2)}</p></div>
                <div className="flex items-center gap-2 md:gap-3 ml-4 bg-black/40 rounded-xl p-1 border border-white/10">
                  <button onClick={(e) => { e.stopPropagation(); decreaseQty(item._id); }} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-red-500 transition-colors"><FiMinus size={14} /></button>
                  <span className="w-6 text-center text-white font-black text-sm">{item.qty}</span>
                  <button onClick={(e) => { e.stopPropagation(); increaseQty(item._id); }} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-green-500 transition-colors"><FiPlus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 md:p-8 bg-black/60 border-t border-white/10 space-y-4 md:space-y-6 shrink-0 pb-10 lg:pb-8">
          <div className="flex justify-between items-end"><span className="text-white font-black text-lg md:text-xl uppercase italic">Total</span><span className="text-3xl md:text-4xl font-black text-secondary tracking-tighter">${total.toFixed(2)}</span></div>
          <div className="relative">
            <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="number"
              placeholder="EFECTIVO RECIBIDO"
              value={efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-12 md:h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white font-black text-lg focus:border-secondary outline-none transition-all placeholder:text-white/10"
            />
          </div>
          <button
            type="button"
            // Se deshabilita si no hay productos, no hay efectivo o si ya está cargando
            disabled={order.length === 0 || !efectivo || isProcessing}
            onClick={handlePagar}
            className="group relative w-full h-14 md:h-16 bg-primary text-white rounded-2xl font-black text-lg md:text-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:bg-white/5 disabled:text-white/20 overflow-hidden uppercase tracking-tighter italic transition-all"
          >
            {/* Efecto de brillo que cruza el botón al pasar el mouse */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

            <div className="flex items-center justify-center gap-3">
              {isProcessing ? (
                <>
                  <FiLoader className="animate-spin text-2xl" />
                  <span className="tracking-widest text-sm not-italic">Validando...</span>
                </>
              ) : (
                "Finalizar Venta"
              )}
            </div>
          </button>
        </div>
      </aside>

      {modal.open && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-[#262626] w-full max-w-sm rounded-3xl border-2 ${modal.tipo === "success" ? "border-green-500/50" : "border-red-500/50"} shadow-2xl p-6 md:p-8 text-center animate-in zoom-in duration-300`}>
            <div className="flex justify-center mb-6">{modal.tipo === "success" ? <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center"><FiCheckCircle className="text-green-500 w-10 h-10 md:w-12 md:h-12" /></div> : <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 rounded-full flex items-center justify-center"><FiAlertCircle className="text-red-500 w-10 h-10 md:w-12 md:h-12" /></div>}</div>
            <h3 className="text-white text-lg md:text-xl font-black uppercase mb-2 tracking-tight">{modal.tipo === "success" ? "¡Venta Exitosa!" : "Atención"}</h3>
            <p className="text-white/60 text-sm md:text-base font-medium mb-6 md:mb-8 whitespace-pre-line leading-relaxed">{modal.message}</p>

            {modal.tipo === "success" && (
              <div className="mb-6 md:mb-8 space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Opciones de Ticket</p>
                <button onClick={imprimirTicket} className="w-full py-3 bg-secondary hover:bg-[#D97018] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mb-2"><FiPrinter size={16} /> Imprimir</button>
                <div className="border-t border-white/10 my-3 pt-3">
                  <input type="text" placeholder="NÚMERO (10 DÍGITOS)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-green-500 transition-all text-sm placeholder:text-white/20 mb-2" />
                  <button onClick={sendWhatsApp} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"><FiMessageCircle size={16} /> WhatsApp</button>
                </div>
              </div>
            )}

            {/* BOTÓN CON AUTOFOCUS: Al dar Enter se cerrará automáticamente */}
            <button
              autoFocus
              onClick={handleCloseModal}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] outline-none focus:bg-white/10"
            >
              Nueva Venta / Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
