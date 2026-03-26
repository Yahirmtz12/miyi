import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import {
    FiClock, FiCheck, FiPlay, FiTrash2, FiShoppingBag,
    FiCoffee, FiShield, FiZap,
    FiMonitor
} from "react-icons/fi";
import { API_URL } from "../api";

export default function KitchenView() {
    const [orders, setOrders] = useState([]);

    const fetchActiveOrders = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/orders/active`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error de conexión:", err);
        }
    }, []);
    useEffect(() => {
    const interval = setInterval(() => {
        const token = localStorage.getItem("token");
        fetch(`${API_URL}/api/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => console.log("Servidor verificado (OK)"))
        .catch(() => console.log("Servidor despertando..."));
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
}, []);
    useEffect(() => {
        const cleanURL = API_URL.replace(/\/api$/, '').replace(/\/$/, '');
        
        const socket = io(cleanURL, { 
            transports: ['websocket'], // Forzar websocket es más estable en Render
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000 
        });

        // IMPORTANTE: Si el socket se conecta (o se RE-conecta), pedimos los datos
        // Esto evita que si el internet se fue 1 minuto, te falten pedidos en pantalla.
        socket.on("connect", () => {
            console.log("Conectado a Cocina");
            fetchActiveOrders(); 
        });

        socket.on("nuevo-pedido", (newOrder) => {
            setOrders((prev) => {
                if (prev.find(o => o._id === newOrder._id)) return prev;
                return [...prev, newOrder];
            });
        });

        socket.on("pedido-actualizado", (updatedOrder) => {
            setOrders((prev) => {
                // Si el pedido viene como ENTREGADO o CANCELADO, lo quitamos de la vista de cocina
                if (["ENTREGADO", "CANCELADO", "FINALIZADA"].includes(updatedOrder.estado)) {
                    return prev.filter(o => o._id !== updatedOrder._id);
                }

                // Si NO es entregado/cancelado, revisamos si ya existe en nuestra lista
                const exists = prev.find(o => o._id === updatedOrder._id);

                if (exists) {
                    // Si existe, lo actualizamos normalmente
                    return prev.map(o => o._id === updatedOrder._id ? { ...updatedOrder } : o);
                } else {
                    // ¡CLAVE!: Si no existe (porque era una mesa vieja que se reactivó), lo añadimos de nuevo
                    return [...prev, updatedOrder];
                }
            });
        });

        return () => socket.disconnect();
    }, [fetchActiveOrders]);

    const updateStatus = async (id, nuevoEstado) => {
        const token = localStorage.getItem("token");
        try {
            await fetch(`${API_URL}/api/orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ nuevoEstado })
            });
        } catch (err) { console.error(err); }
    };

    const updateProductStatus = async (orderId, productIndex) => {
        const token = localStorage.getItem("token");
        try {
            await fetch(`${API_URL}/api/orders/${orderId}/product/${productIndex}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ entregado: true })
            });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">

            {/* HEADER MODIFICADO PARA PARECERSE AL DE USUARIOS */}
            <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
                        <FiMonitor className="text-secondary w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Monitor Cocina</h1>
                        <p className="text-white/40 text-[10px] md:text-sm italic">Rhytm - Oaxaca</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                    <FiZap className="text-secondary animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Pendientes</span>
                        <span className="text-xl font-black text-secondary leading-tight">
                            {orders.filter(o => o.estado !== 'LISTO').length}
                        </span>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8">
                {orders.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-white/10">
                        <FiCoffee size={80} className="mb-6 opacity-20 animate-bounce" />
                        <p className="text-xl font-black uppercase tracking-widest">Sin pedidos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {orders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onUpdate={updateStatus}
                                onUpdateProduct={updateProductStatus}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function OrderCard({ order, onUpdate, onUpdateProduct }) {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval = setInterval(() => {
            const start = new Date(order.estado === 'PREPARANDO' ? order.updatedAt : order.createdAt);
            const diff = Math.floor((new Date() - start) / 1000);
            setMinutes(Math.floor(diff / 60));
            setSeconds(diff % 60);
        }, 1000);
        return () => clearInterval(interval);
    }, [order.estado, order.updatedAt, order.createdAt]);

    const estaListo = order.estado === 'LISTO';

    return (
        <div className={`rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col h-full relative overflow-hidden shadow-2xl ${estaListo
                ? "border-green-500/50 bg-[#1a2e1a] shadow-green-500/10"
                : "border-white/10 bg-[#262626] shadow-black/50"
            }`}>

            {/* ENCABEZADO UNIFICADO */}
            <div className={`p-6 border-b border-white/5 transition-colors duration-500 ${estaListo ? "bg-green-600/20" : "bg-black/20"}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1 italic">
                            Mesa / Cliente
                        </span>
                        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none truncate text-white">
                            {order.cliente}
                        </h2>
                    </div>

                    {!estaListo && (
                        <div className="bg-primary text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse">
                            {order.productos.filter(p => !p.entregado).length} Pendientes
                        </div>
                    )}
                </div>

                {/* TIMER ESTILO INVENTARIO */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${order.estado === 'PREPARANDO'
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10"
                            : "bg-white/5 border-white/10 text-white/40"
                        }`}>
                        <FiClock className={order.estado === 'PREPARANDO' ? "animate-spin-slow" : ""} />
                        {order.estado === 'PREPARANDO'
                            ? `${minutes}:${seconds < 10 ? `0${seconds}` : seconds} Preparando`
                            : `${minutes} Min EN USO`
                        }
                    </div>
                </div>
            </div>

            {/* LISTADO DE PRODUCTOS (Cuerpo estilo tabla de inventario) */}
            <div className="p-6 flex-1 bg-black/10 overflow-y-auto max-h-[350px]">
                <div className="space-y-4">
                    {/* Invertimos el array para que los últimos agregados aparezcan arriba */}
                    {[...order.productos].reverse().map((p) => {
                        // Buscamos su posición original en la lista para no romper el botón de Check
                        const originalIdx = order.productos.indexOf(p);
                        const esNuevo = p.entregado === false;

                        return (
                            <div key={`${order._id}-${originalIdx}`}
                                className={`flex items-center justify-between gap-3 group p-3 rounded-2xl transition-all duration-500 border ${!esNuevo
                                        ? 'bg-black/20 border-transparent opacity-30 grayscale'
                                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex gap-4 items-center">
                                    <span className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-sm shrink-0 shadow-lg transition-transform group-hover:scale-110 ${!esNuevo
                                            ? "bg-white/5 text-white/20 border border-white/10"
                                            : "bg-primary text-white shadow-red-500/20 italic"
                                        }`}>
                                        {p.cantidad}
                                    </span>

                                    <div className="flex flex-col justify-center">
                                        <span className={`font-black text-xs md:text-sm uppercase tracking-tight italic leading-tight ${!esNuevo ? "text-white/20 line-through" : "text-white"
                                            }`}>
                                            {p.nombre}
                                        </span>
                                        {p.notas && (
                                            <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter mt-0.5">
                                                {p.notas}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Usamos originalIdx para que el servidor sepa cuál producto marcamos */}
                                {esNuevo && !estaListo && (
                                    <button
                                        onClick={() => onUpdateProduct(order._id, originalIdx)}
                                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-green-500 border border-white/10 hover:border-green-400 flex items-center justify-center transition-all active:scale-90 group-hover:rotate-12"
                                    >
                                        <FiCheck className="text-white text-lg" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ACCIONES (Botones grandes tipo "Nuevo Registro") */}
            <div className="p-6 bg-black/40 border-t border-white/5 space-y-3">
                {order.estado === 'PENDIENTE' && (
                    <button onClick={() => onUpdate(order._id, 'PREPARANDO')} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500">
                        <FiPlay className="text-lg" /> Iniciar Cocina
                    </button>
                )}

                {order.estado === 'PREPARANDO' && (
                    <button onClick={() => onUpdate(order._id, 'LISTO')} className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-orange-500/20 transition-all hover:bg-orange-400">
                        <FiCheck className="text-lg" /> Terminar Orden
                    </button>
                )}

                {order.estado === 'LISTO' && (
                    <button onClick={() => onUpdate(order._id, 'ENTREGADO')} className="w-full h-14 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-green-600/20 transition-all hover:bg-green-500">
                        <FiShoppingBag className="text-lg" /> Entregar a Mesero
                    </button>
                )}
            </div>
        </div>
    );
}