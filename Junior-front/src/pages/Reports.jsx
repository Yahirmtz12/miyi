import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { API_URL } from "../api";
import { FiCalendar, FiBarChart2, FiStar, FiTrendingUp, FiPieChart } from "react-icons/fi";

export default function Reports() {
  const [ventasSemanales, setVentasSemanales] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [totalHoy, setTotalHoy] = useState(0);
  const [totalAyer, setTotalAyer] = useState(0);
  const [totalMesActual, setTotalMesActual] = useState(0);
  const [totalMesAnterior, setTotalMesAnterior] = useState(0);
  const [topProducto, setTopProducto] = useState({ nombre: "", cantidad: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const diaActual = hoy.getDate();
        const añoActual = hoy.getFullYear();

        const ayer = new Date();
        ayer.setDate(diaActual - 1);
        const diaAyer = ayer.getDate();
        const mesAyer = ayer.getMonth();
        const añoAyer = ayer.getFullYear();

        const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        const añoMesAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

        const ventasPorDia = data.reduce((acc, venta) => {
          const fecha = new Date(venta.fecha || venta.createdAt);
          const dia = diasSemana[fecha.getDay()];
          if (!acc[dia]) acc[dia] = 0;
          acc[dia] += Number(venta.total);
          return acc;
        }, {});

        const arrayVentasSemanales = diasSemana.map((dia) => ({
          dia,
          total: ventasPorDia[dia] || 0,
        }));
        setVentasSemanales(arrayVentasSemanales);

        let sumaHoy = 0, sumaAyer = 0, sumaMesActual = 0, sumaMesAnterior = 0;

        data.forEach((venta) => {
          const fecha = new Date(venta.fecha || venta.createdAt);
          const totalVenta = Number(venta.total);
          const dia = fecha.getDate();
          const mes = fecha.getMonth();
          const año = fecha.getFullYear();

          if (dia === diaActual && mes === mesActual && año === añoActual) sumaHoy += totalVenta;
          if (dia === diaAyer && mes === mesAyer && año === añoAyer) sumaAyer += totalVenta;
          if (mes === mesActual && año === añoActual) sumaMesActual += totalVenta;
          if (mes === mesAnterior && año === añoMesAnterior) sumaMesAnterior += totalVenta;
        });

        setTotalHoy(sumaHoy);
        setTotalAyer(sumaAyer);
        setTotalMesActual(sumaMesActual);
        setTotalMesAnterior(sumaMesAnterior);

        const ventasPorMes = Array(12).fill(0);
        data.forEach((venta) => {
          const fecha = new Date(venta.fecha || venta.createdAt);
          ventasPorMes[fecha.getMonth()] += Number(venta.total);
        });

        const arrayVentasMensuales = meses.map((mes, idx) => ({
          mes,
          total: ventasPorMes[idx] || 0,
        }));
        setVentasMensuales(arrayVentasMensuales);

        const conteoProductos = {};
        data.forEach((venta) => {
          venta.productos.forEach((p) => {
            if (!conteoProductos[p.nombre]) conteoProductos[p.nombre] = 0;
            conteoProductos[p.nombre] += Number(p.cantidad);
          });
        });

        const productosOrdenados = Object.entries(conteoProductos)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setProductosTop(productosOrdenados.slice(0, 5));
        if (productosOrdenados.length > 0) setTopProducto(productosOrdenados[0]);
      })
      .catch((err) => console.error(err));
  }, []);

  const calcularPorcentaje = (actual, anterior) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return (((actual - anterior) / anterior) * 100).toFixed(1);
  };

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      
      {/* HEADER UNIFICADO Y RESPONSIVO */}

      <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
                                          <FiPieChart className="text-secondary w-6 h-6 md:w-8 md:h-8" />

                            </div>
                            <div>
                              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Analisis</h1>
                              <p className="text-white/40 text-[10px] md:text-sm italic">San Sebastian - Zaachila</p>
                            </div>
                          </div>
                          </div>
                      </header>
      {/* CUERPO PRINCIPAL RESPONSIVO */}
      <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-20">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl flex items-center space-x-4 border-l-4 border-l-green-500/50">
            <div className="p-3 bg-green-500/20 rounded-full shrink-0">
              <FiCalendar className="text-green-400 w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Ventas Diarias</span>
              <h4 className="text-xl md:text-2xl font-black text-white mt-1">${totalHoy.toLocaleString()}</h4>
              <div className={`flex items-center gap-1 text-[10px] md:text-xs font-medium mt-1 ${totalHoy >= totalAyer ? "text-green-400" : "text-red-400"}`}>
                <span>{totalHoy >= totalAyer ? "+" : ""}{calcularPorcentaje(totalHoy, totalAyer)}% vs ayer</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl flex items-center space-x-4 border-l-4 border-l-yellow-500/50">
            <div className="p-3 bg-yellow-500/20 rounded-full shrink-0">
              <FiBarChart2 className="text-yellow-400 w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Ventas Mensuales</span>
              <h4 className="text-xl md:text-2xl font-black text-white mt-1">${totalMesActual.toLocaleString()}</h4>
              <div className={`flex items-center gap-1 text-[10px] md:text-xs font-medium mt-1 ${totalMesActual >= totalMesAnterior ? "text-green-400" : "text-red-400"}`}>
                <span>{totalMesActual >= totalMesAnterior ? "+" : ""}{calcularPorcentaje(totalMesActual, totalMesAnterior)}% vs mes anterior</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl flex items-center space-x-4 border-l-4 border-l-blue-500/50">
            <div className="p-3 bg-blue-500/20 rounded-full shrink-0">
              <FiStar className="text-blue-400 w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Top Producto</span>
              <h4 className="text-lg md:text-xl font-black text-white mt-1 truncate">{topProducto.nombre || "---"}</h4>
              <p className="text-[10px] md:text-xs text-blue-300 font-medium mt-1 flex items-center gap-1">
                <FiTrendingUp className="text-xs" /> {topProducto.cantidad || 0} unid. este ciclo
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-green-400" />
                </div>
                <h5 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">Rendimiento Semanal</h5>
              </div>
              <span className="text-[9px] md:text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 uppercase font-black">En Vivo</span>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasSemanales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="dia" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#4ade80", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#4ade80" strokeWidth={4} dot={{ r: 4, fill: "#4ade80", strokeWidth: 2, stroke: "#1F1F1F" }} activeDot={{ r: 7, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiStar className="w-5 h-5 text-blue-400" />
              </div>
              <h5 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">Ranking Ventas</h5>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productosTop} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="nombre" type="category" stroke="#ffffff50" fontSize={10} width={80} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  />
                  <Bar dataKey="cantidad" fill="#60a5fa" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ventas Mensuales Chart */}
        <div className="bg-black/40 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <FiBarChart2 className="w-5 h-5 text-yellow-400" />
            </div>
            <h5 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">Histórico de Ingresos Mensuales</h5>
          </div>
          <div className="h-[200px] md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="mes" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#facc15" }}
                />
                <Line type="stepAfter" dataKey="total" stroke="#facc15" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}