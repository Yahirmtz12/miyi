import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiArrowLeft,
  FiSmile,
  FiCheckCircle // Añadido para el modal de éxito
} from "react-icons/fi";
import logoEmpresa from "../assets/logo.png";
import { API_URL } from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Estado para el nuevo modal

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const usernameNormalizado = username.toLowerCase().trim();

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          usuario: usernameNormalizado,
          password,
          rol: "cliente"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Error al registrar");

      // En lugar de alert, mostramos nuestro modal estilizado
      setShowSuccessModal(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A]">

      {/* --- MODAL DE ÉXITO INTEGRADO --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          {/* Backdrop con desenfoque profundo */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" />

          <div className="relative bg-[#161616] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center border border-[#25D366]/20">
                <FiCheckCircle className="text-[#25D366] text-4xl animate-bounce" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">¡Registro Exitoso!</h2>
            <p className="text-white/40 text-sm mt-4 font-medium italic">
              Bienvenido al Club VIP de Mr. Pollo. Tu cuenta ha sido creada correctamente.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full h-14 bg-primary text-white font-black rounded-2xl mt-8 shadow-[0_10px_20px_rgba(0,51,160,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        </div>
      )}

      {/* Luces ambientales de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-[460px] px-6">

        <div className="flex justify-center mb-10">
          <div className="relative p-[3px] bg-gradient-to-tr from-primary to-secondary rounded-full shadow-[0_0_50px_rgba(0,51,160,0.3)] transform hover:scale-105 transition-transform duration-500">
            <div className="bg-white rounded-full overflow-hidden flex items-center justify-center w-28 h-28 shadow-md">
              <img
                src={logoEmpresa}
                alt="Logo"
                className="h-full w-full object-cover transform scale-110 transition-transform"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] p-8 md:p-10 bg-[#161616]/80 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-white/40 hover:text-secondary transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <FiArrowLeft className="text-lg" /> Volver al login
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              ÚNETE AL <span className="text-primary">CLUB</span>
            </h1>
            <div className="h-1 w-12 bg-secondary mt-2 rounded-full" />
            <p className="text-white/40 text-[11px] mt-4 font-medium uppercase tracking-widest italic">Beneficios exclusivos en cada bocado</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] p-4 rounded-2xl flex items-center gap-3 mb-6">
              <FiAlertCircle className="shrink-0 w-4 h-4" />
              <span className="font-black uppercase tracking-tight">{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleRegister}>

            {/* Campo Nombre Completo */}
            <div className="flex flex-col gap-2 group">
              <span className="text-white/30 text-[9px] font-black uppercase ml-4 tracking-[0.2em] group-focus-within:text-primary transition-colors">Nombre Completo</span>
              <div className="relative">
                <FiSmile className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary" size={18} />
                <input
                  type="text"
                  placeholder="Tu nombre aquí"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full h-15 py-4 rounded-2xl bg-black/40 text-white border border-white/5 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-black/60 transition-all font-bold text-sm"
                />
              </div>
            </div>

            {/* Campo Usuario */}
            <div className="flex flex-col gap-2 group">
              <span className="text-white/30 text-[9px] font-black uppercase ml-4 tracking-[0.2em] group-focus-within:text-secondary transition-colors">Nombre de Usuario</span>
              <div className="relative">
                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary" size={18} />
                <input
                  type="text"
                  placeholder="usuario123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-15 py-4 rounded-2xl bg-black/40 text-white border border-white/5 pl-14 pr-4 outline-none focus:border-secondary/40 focus:bg-black/60 transition-all font-bold text-sm"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col gap-2 group">
              <div className="flex justify-between items-center px-4">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] group-focus-within:text-secondary transition-colors">
                  Contraseña Segura
                </span>
                <span className={`text-[9px] font-black transition-colors ${password.length >= 8 ? 'text-[#25D366]' : 'text-white/20'}`}>
                  {password.length >= 8 ? '✓ MÍNIMO ALCANZADO' : `${password.length}/8 min`}
                </span>
              </div>
              <div className="relative">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`w-full h-15 py-4 rounded-2xl bg-black/40 text-white border transition-all font-bold text-sm ${password.length > 0 && password.length < 8 ? 'border-primary/50' : 'border-white/5 focus:border-secondary/40'
                    } pl-14 pr-12 outline-none focus:bg-black/60`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-secondary transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className={`w-full h-16 font-black rounded-2xl transition-all shadow-xl mt-4 uppercase tracking-[0.2em] text-[11px] ${password.length >= 8
                ? 'bg-primary text-white hover:scale-[1.02] shadow-primary/20'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
            >
              {loading ? <FiLoader className="animate-spin mx-auto" /> : "Crear mi Cuenta VIP"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}