import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FiStar, FiCalendar, FiLogOut, FiInfo } from "react-icons/fi";
import { GiChickenLeg } from "react-icons/gi"; // Icono de patita de pollo
import logoEmpresa from "../assets/logo.png";
import { API_URL } from "../api";
import { FaCoffee } from "react-icons/fa";
export default function CustomerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!storedUser) return;
      setUser(storedUser);

      try {
        const res = await fetch(`${API_URL}/api/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.log("Error actualizando datos, usando caché.");
      }
    };
    fetchData();
  }, []);

  // Lógica para las patitas:
  // Si tiene 8 visitas, 8 % 7 = 1 patita iluminada.
  // Si tiene 7 visitas, 7 % 7 = 0... pero queremos que se vean las 7 llenas antes de reiniciar.
  const totalVisitas = user?.visitas?.length || 0;
  const patitasActivas = totalVisitas % 7 === 0 && totalVisitas > 0 ? 7 : totalVisitas % 7;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-6 pb-12 flex flex-col items-center font-sans">

      {/* HEADER - DISEÑO TECH PREMIUM */}
      <div className="w-full max-w-md mb-10 relative">
        {/* Fondo decorativo difuminado detrás del avatar */}
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/10 blur-[40px] rounded-full" />

        <div className="relative flex justify-between items-center bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-[2.5rem] shadow-2xl">

          <div className="flex items-center gap-4">
            {/* Avatar con borde de luz y gradiente */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-2xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-[#00205B] to-black flex items-center justify-center font-black text-2xl shadow-2xl border border-white/20 text-white transform group-hover:rotate-3 transition-transform">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              {/* Indicador de estado online */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1A1A1A] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                  {user.nombre.split(' ')[0]} {/* Solo primer nombre para estilo más limpio */}
                </h1>
                <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-secondary text-[9px] font-black uppercase tracking-[0.2em] bg-secondary/10 px-2 py-0.5 rounded-md border border-secondary/20">
                  Miembro
                </span>
              </div>
            </div>
          </div>

          {/* Botón Logout Estilizado */}
          <button
            onClick={handleLogout}
            className="group relative w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 active:scale-90 overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors" />
            <FiLogOut className="text-white/40 group-hover:text-red-500 w-5 h-5 transition-colors relative z-10" />
          </button>
        </div>
      </div>

      {/* TARJETA QR - DISEÑO VORTEX TECH */}
      <div className="w-full max-w-md bg-[#0f0f0f] rounded-[3.5rem] p-1 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col items-center relative overflow-hidden group">

        {/* Fondo de Gradiente Radial Dinámico */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,51,160,0.1),transparent_70%)]" />

        <div className="w-full h-full bg-[#161616]/80 backdrop-blur-xl rounded-[3.3rem] p-9 flex flex-col items-center border border-white/5">

          {/* Label Superior Estilo Industrial */}
          <div className="w-full flex justify-between items-center mb-10">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white tracking-[0.3em] uppercase italic">Tarjeta de miembro</span>
              <div className="h-[2px] w-8 bg-primary mt-1" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-white/30 uppercase">Verificado</span>
              <div className="flex gap-1 mt-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                ))}
              </div>
            </div>
          </div>

          {/* Frame del QR - DISEÑO DE MIRA AVANZADA */}
          <div className="relative group-hover:scale-105 transition-transform duration-700">

            {/* Bordes Animados */}
            <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Brillo perimetral */}
            <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-75 group-hover:scale-110 transition-transform duration-700" />

            <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl relative z-10 border-[6px] border-black">
              <QRCodeCanvas
                value={user.membershipId}
                size={190}
                level={"H"}
                imageSettings={{ src: logoEmpresa, height: 45, width: 45, excavate: true }}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Sección de Datos Optimizada */}
          <div className="mt-12 w-full flex flex-col gap-6">

            {/* Contenedor de ID Resaltado (PJ-...) */}
            <div className="relative flex justify-center">
              <div className="bg-white/[0.03] border border-white/10 px-6 py-2 rounded-xl backdrop-blur-md">
                <span className="text-sm font-mono font-black text-primary tracking-[0.4em] drop-shadow-[0_0_8px_rgba(0,51,160,0.4)]">
                  {user.membershipId}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Miembro San Sebastian</span>
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                {user.nombre}
              </span>
              <div className="flex gap-1 h-3 ">
                {[2, 4, 1, 6, 2, 8, 3, 5, 2, 4].map((w, i) => (
                  <div key={i} className="bg-white rounded-full" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reflejo de luz ambiental */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.03),transparent_40%)] animate-[spin_10s_linear_infinite] pointer-events-none" />
      </div>

      {/* PUNTOS Y VISITAS - DISEÑO TECH CAPSULE */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4 mt-8">
        {[
          {
            label: "Puntos",
            val: Math.floor(user.puntos || 0),
            icon: <FiStar className="text-secondary" size={20} />,
            color: "border-secondary/20"
          },
          {
            label: "Visitas",
            val: totalVisitas,
            icon: <FiCalendar className="text-primary" size={20} />,
            color: "border-primary/20"
          }
        ].map((stat, i) => (
          <div key={i} className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-md p-6 rounded-[2.5rem] border ${stat.color} shadow-2xl flex flex-col items-center group transition-transform hover:scale-105`}>
            {/* Destello de fondo */}
            <div className={`absolute -top-10 -right-10 w-20 h-20 opacity-10 blur-2xl rounded-full ${i === 0 ? "bg-secondary" : "bg-primary"}`} />

            <div className="mb-2 p-2 bg-white/5 rounded-xl">{stat.icon}</div>
            <span className="text-4xl font-black text-white tracking-tighter italic">{stat.val}</span>
            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* --- SECCIÓN DE PATITAS (REWARD TRACKER) --- */}
      <div className="w-full max-w-md mt-6 relative overflow-hidden bg-[#0f0f0f] p-8 rounded-[3rem] border border-white/10 shadow-2xl group">
        {/* Línea de escaneo decorativa lateral */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-50" />

        <div className="flex justify-between items-end mb-6 px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Sistema de recompensas</span>
            <h3 className="text-lg font-black uppercase text-white tracking-tighter">Próximo Regalo</h3>
          </div>
          <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="text-[12px] font-mono font-black text-primary">{patitasActivas} / 7</span>
          </div>
        </div>

        {/* --- SECCIÓN DE ICONOS DE CAFÉ (CORREGIDA) --- */}
        {/* --- SECCIÓN DE ICONOS DE RECOMPENSA (ACTUALIZADA A PIERNA DE POLLO) --- */}
        <div className="flex justify-between items-center bg-black/40 p-5 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />

          {[...Array(7)].map((_, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div
                className={`transition-all duration-700 ${i < patitasActivas
                    ? "scale-110 -rotate-12" // Un poco más de rotación para que luzca la pierna
                    : "opacity-20 grayscale"
                  }`}
              >
                <GiChickenLeg
                  size={28}
                  className={
                    i < patitasActivas
                      ? "text-secondary drop-shadow-[0_0_15px_rgba(26,188,156,0.6)]"
                      : "text-white"
                  }
                />
              </div>

              <div
                className={`h-1.5 w-1.5 rounded-full mt-3 transition-all duration-500 ${i < patitasActivas
                    ? "bg-secondary shadow-[0_0_8px_#1ABC9C]"
                    : "bg-white/10"
                  }`}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em] whitespace-nowrap">
            Recibe una recompensa al completar las 7 visitas
          </p>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      </div>

      {/* INFO */}
      <div className="w-full max-w-md mt-6 bg-primary/5 border border-primary/20 p-5 rounded-[2rem] flex gap-4 items-center">
        <FiInfo className="text-primary shrink-0" size={20} />
        <p className="text-[10px] text-white/50 leading-relaxed font-medium">
          Puntos validos unicamente para ventas en local, <span className="text-white font-bold"> no aplica en eventos</span> .
        </p>
      </div>
    </div>
  );
}