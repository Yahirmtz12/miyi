import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FiStar, FiCalendar, FiLogOut, FiInfo, FiActivity, FiClock } from "react-icons/fi";
import { GiChickenLeg } from "react-icons/gi";
import logoEmpresa from "../assets/logo.png";
import { API_URL } from "../api";

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
        console.log("Error actualizando datos.");
      }
    };
    fetchData();
  }, []);

  const totalVisitas = user?.visitas?.length || 0;
  const patitasActivas = totalVisitas % 7 === 0 && totalVisitas > 0 ? 7 : totalVisitas % 7;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-6 pb-12 flex flex-col items-center font-sans">
      
      {/* HEADER */}
      <div className="w-full max-w-md mb-8 relative">
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/10 blur-[40px] rounded-full" />
        <div className="relative flex justify-between items-center bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-[#00205B] to-black flex items-center justify-center font-black text-2xl shadow-2xl border border-white/20">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter">{user.nombre.split(' ')[0]}</h1>
              <span className="text-secondary text-[9px] font-black uppercase tracking-[0.2em] bg-secondary/10 px-2 py-0.5 rounded-md border border-secondary/20 w-fit">Miembro</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 hover:bg-red-500/10 transition-all">
            <FiLogOut className="text-white/40 group-hover:text-red-500 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TARJETA QR PRINCIPAL */}
      <div className="w-full max-w-md bg-[#0f0f0f] rounded-[3.5rem] p-1 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,51,160,0.1),transparent_70%)]" />
        
        <div className="w-full h-full bg-[#161616]/80 backdrop-blur-xl rounded-[3.3rem] p-8 flex flex-col items-center border border-white/5">
          
          {/* QR SECTION */}
          <div className="relative mt-4">
            <div className="absolute -top-4 -left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-50" />
            <div className="absolute -bottom-4 -right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-50" />
            <div className="bg-white p-4 rounded-[2rem] shadow-2xl relative z-10 border-[6px] border-black">
              <QRCodeCanvas value={user.membershipId} size={170} level={"H"} imageSettings={{ src: logoEmpresa, height: 40, width: 40, excavate: true }} />
            </div>
          </div>

          {/* NUEVA SECCIÓN: ESTADO DE MENSUALIDAD (POST-QR) */}
          <div className="mt-10 w-full space-y-4">
            <div className="flex justify-center">
              <div className="bg-white/[0.03] border border-white/10 px-5 py-1.5 rounded-xl">
                <span className="text-xs font-mono font-black text-primary tracking-[0.3em]">{user.membershipId}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">{user.nombre}</h2>
               <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mb-4">Socio Activo</p>
               
               {/* INDICADORES DINÁMICOS */}
               <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group/item">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <FiActivity className="text-primary mb-1" size={16} />
                    <span className="text-lg font-black tracking-tighter text-white">{user.clasesDisponibles || 0}</span>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Clases disponibles</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group/item">
                    <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <FiClock className="text-secondary mb-1" size={16} />
                    <span className="text-lg font-black tracking-tighter text-white uppercase">
                      {user.fechaVencimiento ? new Date(user.fechaVencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '--'}
                    </span>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Vencimiento</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>


      {/* FOOTER INFO */}
      <div className="w-full max-w-md mt-6 bg-primary/5 border border-primary/20 p-4 rounded-[2rem] flex gap-3 items-center">
        <FiInfo className="text-primary shrink-0" size={18} />
        <p className="text-[9px] text-white/40 leading-tight font-medium">
          Muestra tu QR en recepción para registrar tu asistencia. Las clases vencen el día indicado arriba.
        </p>
      </div>
    </div>
  );
}