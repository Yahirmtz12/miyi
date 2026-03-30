import { useEffect, useState, useMemo } from "react";
import {
    FiShoppingCart, FiPlus, FiMinus, FiSearch,
    FiPlusSquare, FiSend, FiLoader, FiCoffee, FiGrid,
    FiShoppingBag, FiDollarSign, FiCheckCircle, FiTrash2,
    FiPrinter, FiMessageCircle, FiAlertCircle
} from "react-icons/fi";
import { API_URL } from "../api";
import qz from "qz-tray";

export default function WaiterPanel() {
    // --- ESTADOS ---
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [order, setOrder] = useState([]);
    const [savedOrder, setSavedOrder] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cashReceived, setCashReceived] = useState(""); // El input del mesero para cobrar
    const [modal, setModal] = useState({ open: false, message: "", tipo: "info" });
    const [phone, setPhone] = useState("");

    const itemsNuevos = order.filter(item => !savedOrder.some(saved => saved._id === item._id));
    const itemsAnteriores = order.filter(item => savedOrder.some(saved => saved._id === item._id));
    const userRole = localStorage.getItem("userRole"); 
    const isAdmin = userRole === "admin"; // o "ADMIN", dependiendo de tu base de datos
    // --- CONSTANTES ---
  const quickFilters = ["COMBO","BOTANA","BEBIDA","GUARNICION","KENTUCKY", "ASADO", "ROSTIZADO", "RANCHERO", "BARBACOA","BBQ", "AGRIDULCE","HAMBURGUESA","HELADO","CREPA"];
    const token = localStorage.getItem("token");
    const esMovil = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // --- VALORES CALCULADOS ---
    const total = useMemo(() => order.reduce((a, i) => a + i.precio * i.qty, 0), [order]);
    const filteredProducts = useMemo(() =>
        products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    // --- EFECTOS ---
    useEffect(() => {
        fetchTables();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!selectedTable) {
            resetLocalOrder();
            return;
        }
        if (selectedTable.estado === 'OCUPADA') {
            fetchOrderDetails(selectedTable._id);
        } else {
            resetLocalOrder();
        }
    }, [selectedTable]);

    // --- FUNCIONES DE APOYO ---
    const resetLocalOrder = () => {
        setOrder([]);
        setSavedOrder([]);
        setCashReceived("");
    };

    const showModal = (message, tipo = "info") => {
        setModal({ open: true, message, tipo });
        if (tipo !== "success") {
            setTimeout(() => setModal({ open: false, message: "", tipo: "info" }), 3000);
        }
    };

    const handleCloseModal = () => {
        setModal({ ...modal, open: false });
        if (modal.tipo === "success") {
            setPhone("");
        }
    };

    // --- LLAMADAS A API ---
    const fetchTables = async () => {
        try {
            const res = await fetch(`${API_URL}/api/tables`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (Array.isArray(data)) setTables(data.sort((a, b) => a.numero - b.numero));
        } catch (err) { console.error("Error tables:", err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setProducts(data.filter(p => p.categoria === "Venta"));
        } catch (err) { console.error("Error products:", err); }
    };

    const fetchOrderDetails = async (tableId) => {
        try {
            const res = await fetch(`${API_URL}/api/orders/table/${tableId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data && data.productos) {
                const formatOrder = data.productos.map(p => ({
                    _id: p.productoId,
                    nombre: p.nombre,
                    qty: p.cantidad,
                    precio: p.precio,
                    notas: p.notas
                }));
                setOrder(formatOrder);
                setSavedOrder(formatOrder);
            }
        } catch (err) {
            console.error("Error fetching order:", err);
            resetLocalOrder();
        }
    };

    const addTable = async () => {
        const numero = (tables.length + 1).toString();
        try {
            await fetch(`${API_URL}/api/tables`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ numero }),
            });
            fetchTables();
        } catch (err) { alert("Error al crear mesa"); }
    };

    const deleteLastTable = async () => {
        if (tables.length === 0) return;
        const lastTable = tables[tables.length - 1];
        if (lastTable.estado === 'OCUPADA') return alert("No puedes eliminar una mesa que está OCUPADA");
        if (!window.confirm(`¿Estás seguro de eliminar la Mesa ${lastTable.numero}?`)) return;

        try {
            const res = await fetch(`${API_URL}/api/tables/${lastTable._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchTables();
                if (selectedTable?._id === lastTable._id) setSelectedTable(null);
            }
        } catch (err) { alert("Error al eliminar la mesa"); }
    };

    const updateNote = (id, text) => {
        setOrder(prev => prev.map(item =>
            (item._id === id && item.isNew) ? { ...item, notas: text } : item
        ));
    };

    // --- LÓGICA DE CARRITO ---
    const addToOrder = (product) => {
        if (!selectedTable) return alert("Selecciona una mesa");
        setOrder(prev => {
            const existingInNew = prev.find(p => p._id === product._id && p.isNew);
            if (existingInNew) return prev.map(p => (p._id === product._id && p.isNew) ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { ...product, qty: 1, isNew: true, notas: "" }];
        });
    };

    const updateQty = (id, delta) => {
        setOrder(prev => prev.map(item =>
            item._id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        ).filter(item => item.qty > 0));
    };

    // --- ACCIONES FINALES ---
    const handleSendToKitchen = async () => {
        if (order.length === 0 || !selectedTable) return;
        setLoading(true);

        const isUpdate = selectedTable.estado === 'OCUPADA';
        const itemsParaEnviar = isUpdate ? order.filter(item => item.isNew) : order;

        if (itemsParaEnviar.length === 0 && isUpdate) {
            setLoading(false);
            return alert("No hay productos nuevos para enviar.");
        }

        try {
            const productosProcesados = itemsParaEnviar.map(item => ({
                productoId: item._id,
                nombre: item.nombre,
                cantidad: item.qty,
                precio: item.precio,
                notas: item.notas
            }));

            const res = await fetch(isUpdate ? `${API_URL}/api/orders/table/${selectedTable._id}` : `${API_URL}/api/orders`, {
                method: isUpdate ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    mesaId: selectedTable._id,
                    productos: productosProcesados,
                    total: itemsParaEnviar.reduce((a, i) => a + i.precio * i.qty, 0),
                    tipoConsumo: "LOCAL",
                    cliente: `Mesa ${selectedTable.numero}`
                }),
            });

            if (res.ok) {
                alert("¡Pedido enviado a cocina!");
                resetLocalOrder();
                setSelectedTable(null);
                setIsOrderOpen(false);
                fetchTables();
            }
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };
    const handleRemoveSavedItem = async (itemToRemove, index) => {
    // 1. Confirmación para evitar accidentes
    if (!window.confirm(`¿Seguro que deseas cancelar "${itemToRemove.nombre}" de la mesa ${selectedTable.numero}?`)) return;

    setLoading(true);
    try {
        // Opción A: Si tu backend tiene un endpoint para eliminar un producto específico de la orden
        // (Recomendado para no alterar los demás productos)
        const res = await fetch(`${API_URL}/api/orders/table/${selectedTable._id}/product/${itemToRemove._id}`, {
            method: "DELETE", // o PUT, dependiendo de cómo lo programaste en Node
            headers: { 
                "Content-Type": "application/json", 
                Authorization: `Bearer ${token}` 
            }
        });

        // Opción B (Alternativa): Si tu backend requiere que mandes TODA la lista de nuevo, 
        // tendrías que enviar 'savedOrder' filtrando el producto eliminado usando un método PUT.

        if (res.ok) {
            alert("Producto cancelado correctamente");
            // Recargamos la mesa para que traiga la información actualizada del servidor
            fetchOrderDetails(selectedTable._id); 
        } else {
            const data = await res.json();
            alert("Error al cancelar: " + (data.msg || "Desconocido"));
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión al intentar cancelar el producto");
    } finally {
        setLoading(false);
    }
};
    const abrirCajonFisico = async () => {
    try {
        if (!qz.websocket.isActive()) await qz.websocket.connect();
        const config = qz.configs.create("POS-58"); // Asegúrate que sea el mismo nombre que en imprimirTicket
        
        // Comando ESC/POS estándar para abrir cajón (1B 70 00 32 FA)
        const data = [
            { type: 'raw', format: 'hex', data: '1B700032FA' }
        ];
        await qz.print(config, data);
    } catch (err) {
        console.error("Error al abrir el cajón:", err);
        // No lanzamos alert aquí para no interrumpir el flujo del usuario si falla la impresora
    }
};
    const handleFinishOrder = async () => {
    const montoRecibido = parseFloat(cashReceived);
    if (!selectedTable || isNaN(montoRecibido) || montoRecibido < total) {
        return alert("Monto insuficiente");
    }

    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/api/orders/table/${selectedTable._id}/finish`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                efectivoRecibido: montoRecibido,
                cambio: montoRecibido - total
            }),
        });

        const data = await res.json();
        if (res.ok) {
            // --- CAMBIO AQUÍ: ABRIR CAJÓN AL FINALIZAR ---
            // Si no es móvil (es decir, usa QZ Tray), mandamos la señal de apertura
            if (!esMovil()) {
                await abrirCajonFisico();
            }
            
            alert(`¡Cuenta pagada y liberada!\nCambio a entregar: $${(montoRecibido - total).toFixed(2)}`);

            resetLocalOrder();
            setSelectedTable(null);
            fetchTables();
        } else {
            alert("Error: " + data.msg);
        }
    } catch (err) {
        alert("Error de conexión");
    } finally {
        setLoading(false);
    }
};

    // --- IMPRESIÓN Y REDES (CORREGIDO PARA NO ROMPER LA APP) ---
   const imprimirTicket = () => {
    // Definimos el comando de apertura de cajón (ESC p 0 25 250)
    const comandoApertura = "\u001b\u0070\u0000\u0019\u00fa";

    // 1. Mapeo de items
    const itemsText = order.map(i => 
      `${i.qty}x ${i.nombre.toUpperCase().slice(0, 15)} - $${(i.qty * i.precio).toFixed(2)}`
    ).join('\n');
    
    // 2. Cálculos de efectivo y cambio
    const montoEfectivo = parseFloat(cashReceived) || 0;
    const cambio = montoEfectivo > total ? montoEfectivo - total : 0;

    // Construimos el ticket concatenando el comando al inicio
    const textoTicket = 
      comandoApertura + 
      `Rhytm Oaxaca\n` + 
      `SUCURSAL Centro\n` +
      `--------------------------\n` +
      `${itemsText}\n` +
      `--------------------------\n` +
      `TOTAL: $${total.toFixed(2)}\n` +
      `EFECTIVO: $${montoEfectivo.toFixed(2)}\n` +
      `CAMBIO: $${cambio.toFixed(2)}\n` +
      `--------------------------\n` +
      `¡GRACIAS POR SU COMPRA!\n` +
      `${new Date().toLocaleString()}\n\n\n\n`;

    // 3. Generamos el Intent para RawBT en la tablet
    const linkRawBT = "intent:" + encodeURIComponent(textoTicket) + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
    
    window.location.href = linkRawBT;
};
    const sendWhatsApp = () => {
        if (!phone || phone.length < 10) return alert("Por favor, ingresa un número de 10 dígitos");
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
        const itemsText = order.map(i => `• ${i.qty}x ${i.nombre.toUpperCase()} - $${(i.qty * i.precio).toFixed(2)}`).join('%0A');


        const message = `*🍗 Rhytm 🍗*%0A` +
            `*Ticket Digital - Sucursal Centro*%0A` +
            `--------------------------%0A` +
            `${itemsText}%0A` +
            `--------------------------%0A` +
            `*TOTAL: $${total.toFixed(2)}*%0A` +
            `--------------------------%0A` +
            `¡Gracias por su compra!%0A` +
            `_Generado por Rhytm _`;
        window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-[#1F1F1F] text-white overflow-hidden font-sans relative">
            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#1F1F1F] h-screen lg:h-full">

                {/* HEADER */}
                <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
                                <FiShoppingBag className="text-secondary w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight text-white">Panel Meseros</h1>
                                <p className="text-white/40 text-[10px] md:text-sm italic">Rhytm - Oaxaca</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOrderOpen(true)} className="lg:hidden relative p-3 bg-white/5 rounded-xl border border-white/10">
                            <FiShoppingBag className="text-secondary w-6 h-6" />
                            {order.length > 0 && <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{order.length}</span>}
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button onClick={() => setSearchTerm("")} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${searchTerm === "" ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>TODOS</button>
                        {quickFilters.map(f => (
                            <button key={f} onClick={() => setSearchTerm(f)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${searchTerm.toUpperCase() === f ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{f}</button>
                        ))}
                    </div>

                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="BUSCAR PRODUCTO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 md:py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold tracking-widest text-xs uppercase text-white"
                        />
                    </div>
                </header>

                {/* SELECTOR DE MESAS */}
                <div className="px-6 py-4 border-b border-white/5 shrink-0 bg-transparent">
                    <div className="flex items-center gap-2 mb-3">
                        <FiGrid className="text-secondary text-xs" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">Seleccionar Mesa</h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {tables.map(table => (
                            <button
                                key={table._id}
                                onClick={() => setSelectedTable(table)}
                                className={`flex-none w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 ${selectedTable?._id === table._id
                                    ? "bg-secondary border-secondary text-black shadow-[0_0_15px_rgba(251,192,45,0.3)]"
                                    : table.estado === 'OCUPADA'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                    }`}
                            >
                                <span className="text-[8px] font-black uppercase leading-none mb-1">M-</span>
                                <span className="text-lg font-black leading-none">{table.numero}</span>
                            </button>
                        ))}
                        <button onClick={addTable} className="flex-none w-14 h-14 rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-white/40 flex items-center justify-center hover:border-secondary/50 hover:text-secondary transition-all active:scale-90"><FiPlusSquare className="w-6 h-6" /></button>
                        <button onClick={deleteLastTable} className="flex-none w-14 h-14 rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-white/40 flex items-center justify-center hover:border-primary/50 hover:text-primary transition-all active:scale-90"><FiTrash2 className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* GRID PRODUCTOS */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 custom-scrollbar ">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-24">
                        {filteredProducts.map(product => (
                            <div key={product._id} onClick={() => addToOrder(product)} className="group relative bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-xl active:scale-95">
                                <div className="aspect-square relative overflow-hidden">
                                    <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F] via-transparent to-transparent opacity-80" />
                                    <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
                                        <span className="bg-secondary text-black px-2 py-0.5 md:py-1 rounded-lg font-black text-xs md:text-sm shadow-lg">${product.precio.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 bg-white/5">
                                    <h3 className="text-white font-bold text-[10px] md:text-[11px] line-clamp-2 leading-tight uppercase tracking-tighter">{product.nombre}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* ASIDE DE COMANDA */}
            <aside className={`fixed inset-0 z-50 lg:relative lg:translate-x-0 lg:w-[400px] xl:w-[450px] bg-black lg:bg-black/40 backdrop-blur-xl flex flex-col shadow-2xl transition-transform duration-300 border-l border-white/5 ${isOrderOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 md:p-8 border-b border-white/10 shrink-0 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <FiShoppingBag className="text-secondary" />
                            <h2 className="text-xl font-black uppercase italic">Comanda</h2>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md inline-block w-fit ${selectedTable?.estado === 'OCUPADA' ? 'bg-primary text-white' : 'bg-green-500 text-black'}`}>
                            {selectedTable ? (selectedTable.estado === 'OCUPADA' ? 'MESA OCUPADA' : 'MESA LIBRE') : 'SIN SELECCION'}
                        </span>
                    </div>
                    <button onClick={() => setIsOrderOpen(false)} className="lg:hidden p-2 bg-white/5 rounded-xl"><FiPlus className="rotate-45 text-white w-6 h-6" /></button>
                </div>

                <div className="px-6 md:px-8 py-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold italic">
                        {selectedTable ? `Referencia: Mesa ${selectedTable.numero}` : "Selecciona una mesa en el panel"}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                    {order.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/10 py-10">
                            <FiCoffee size={48} className="mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-[0.3em] text-[9px]">Mesa Vacía</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <FiPlusSquare className="text-green-500 text-xs" />
                                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Nuevos por enviar:</span>
                                </div>
                                {order.filter(item => item.isNew).map((item, index) => (
                                    <div key={`new-${item._id}-${index}`} className="bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/[0.08] transition-all border-l-4 border-l-green-500">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate uppercase tracking-tight">{item.nombre}</p>
                                                <p className="text-secondary font-black text-xs mt-1">${(item.precio * item.qty).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3 ml-4 bg-black/40 rounded-xl p-1 border border-white/10">
                                                <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><FiMinus size={14} /></button>
                                                <span className="w-6 text-center text-white font-black text-sm">{item.qty}</span>
                                                <button onClick={() => updateQty(item._id, 1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"><FiPlus size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="mt-3 relative">
                                            <input type="text" placeholder="Instrucciones especiales..." value={item.notas || ""} onChange={(e) => updateNote(item._id, e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-white/70 placeholder:text-white/20 outline-none focus:border-secondary/30 transition-all uppercase" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {savedOrder.length > 0 && (
    <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2">
            <FiCheckCircle className="text-white/20 text-xs" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Enviado a cocina / Entregado:</span>
        </div>
        {savedOrder.map((item, index) => (
            <div key={`old-${item._id}-${index}`} className="bg-white/[0.05] rounded-2xl p-4 border border-white/10 flex flex-col gap-3 group transition-all">
                
                {/* Detalles del producto */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-white/80 font-bold text-sm truncate uppercase tracking-tight">{item.nombre}</p>
                        <p className="text-white/50 font-black text-xs mt-1">${(item.precio * item.qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-white/40">
                        <span className="text-xs font-black">CANT: {item.qty}</span>
                        <FiCheckCircle size={14} className="text-green-500/50" />
                    </div>
                </div>

                {isAdmin && (
    <div className="flex justify-end border-t border-white/5 pt-2">
        <button 
            onClick={() => handleRemoveSavedItem(item, index)}
            className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
        >
            <FiTrash2 size={12} /> Cancelar Producto
        </button>
    </div>
)}

            </div>
        ))}
    </div>
)}
                        </>
                    )}
                </div>

                <div className="p-6 md:p-8 bg-black/60 border-t border-white/10 space-y-4 shrink-0 pb-10">
                    {selectedTable?.estado === 'OCUPADA' && (
                        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Efectivo Recibido</span>
                                <button
                                    // <-- BOTÓN DE IMPRESIÓN (ABRE EL MODAL Y LUEGO IMPRIME)
                                    onClick={() => showModal(`Revisar ticket para:\n$${total.toFixed(2)}`, "success")}
                                    className="text-secondary hover:text-white transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
                                >
                                    <FiPrinter size={12} /> Imprimir Cuenta
                                </button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-black">$</span>
                                <input type="number" placeholder="0.00" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-lg font-black text-white outline-none focus:border-secondary/50 transition-all" />
                            </div>
                            {parseFloat(cashReceived) >= total && (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-green-500/60 uppercase">Cambio sugerido:</span>
                                    <span className="text-lg font-black text-green-500">${(parseFloat(cashReceived) - total).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-end px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Cuenta Total</span>
                            <span className="text-white font-black text-lg md:text-xl uppercase italic leading-none">Subtotal</span>
                        </div>
                        <span className="text-3xl md:text-4xl font-black text-secondary tracking-tighter">${total.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {selectedTable?.estado === 'OCUPADA' && (
                            <button disabled={loading || !cashReceived || parseFloat(cashReceived) < total} onClick={handleFinishOrder} className="w-full h-14 bg-secondary disabled:bg-white/5 disabled:text-white/10 hover:bg-[#F9A825] text-black rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 uppercase italic flex items-center justify-center gap-3">
                                <FiDollarSign className="text-2xl" /> Finalizar Cuenta
                            </button>
                        )}
                        <button disabled={order.length === 0 || loading || !selectedTable} onClick={handleSendToKitchen} className="w-full h-14 bg-primary disabled:opacity-50 hover:bg-[#B71C1C] text-white rounded-2xl font-black text-lg transition-all active:scale-95 uppercase italic flex items-center justify-center gap-3">
                            {loading ? <FiLoader className="animate-spin" /> : <><FiSend /> Mandar a cocina</>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MODAL DE OPCIONES DE TICKET */}
            {modal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4">
                    <div className={`bg-[#262626] w-full max-w-sm rounded-3xl border-2 ${modal.tipo === "success" ? "border-green-500/50" : "border-red-500/50"} shadow-2xl p-6 md:p-8 text-center animate-in zoom-in duration-300`}>

                        <div className="flex justify-center mb-6">
                            {modal.tipo === "success" ? (
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <FiCheckCircle className="text-green-500 w-10 h-10 md:w-12 md:h-12" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <FiAlertCircle className="text-red-500 w-10 h-10 md:w-12 md:h-12" />
                                </div>
                            )}
                        </div>

                        <h3 className="text-white text-lg md:text-xl font-black uppercase mb-2 tracking-tight">
                            {modal.tipo === "success" ? "Opciones de Ticket" : "Atención"}
                        </h3>

                        <p className="text-white/60 text-sm md:text-base font-medium mb-6 md:mb-8 whitespace-pre-line leading-relaxed">
                            {modal.message}
                        </p>

                        {modal.tipo === "success" && (
                            <div className="mb-6 md:mb-8 space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Selecciona un método</p>
                                <button onClick={imprimirTicket} className="w-full py-3 bg-secondary hover:bg-[#D97018] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mb-2">
                                    <FiPrinter size={16} /> Imprimir Físico
                                </button>
                                <div className="border-t border-white/10 my-3 pt-3">
                                    <input type="text" placeholder="NÚMERO (10 DÍGITOS)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-green-500 transition-all text-sm placeholder:text-white/20 mb-2" />
                                    <button onClick={sendWhatsApp} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                                        <FiMessageCircle size={16} /> Enviar WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}

                        <button autoFocus onClick={handleCloseModal} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] outline-none focus:bg-white/10">
                            Cerrar Ventana
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
