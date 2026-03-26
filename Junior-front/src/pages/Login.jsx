import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle
} from "react-icons/fi";
import logoEmpresa from "../assets/logo.png";
import { API_URL } from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const normalizedUsername = username.trim().toLowerCase();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: normalizedUsername,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", data.user.rol);
      window.location.href = "/dashboard";

    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A]">

      {/* Luces de profundidad de marca */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full animate-pulse" />

      <div className="relative z-10 w-full max-w-[460px] px-6">

        {/* Contenedor del Logo con efecto Elevado */}
        {/* Contenedor del Logo con efecto Elevado y Zoom */}
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

        <div className="rounded-[2.5rem] p-10 bg-[#161616]/80 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              BIENVENIDO <span className="text-secondary">DE VUELTA</span>
            </h1>
            <p className="text-white/30 text-[10px] mt-3 font-bold uppercase tracking-[0.3em]">Inicio de sesion </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] p-4 rounded-2xl flex items-center gap-3 mb-8 animate-in slide-in-from-top-2">
              <FiAlertCircle className="shrink-0 w-4 h-4" />
              <span className="font-black uppercase tracking-tight">{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

            {/* Campo Usuario */}
            <div className="flex flex-col gap-2 group">
              <span className="text-white/20 text-[9px] font-black uppercase ml-4 tracking-[0.2em] group-focus-within:text-secondary transition-colors">Usuario</span>
              <div className="relative">
                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-secondary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-15 py-4 rounded-2xl bg-black/40 text-white border border-white/5 pl-14 pr-4 outline-none focus:border-secondary/40 focus:bg-black/60 transition-all font-bold text-sm"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col gap-2 group">
              <span className="text-white/20 text-[9px] font-black uppercase ml-4 tracking-[0.2em] group-focus-within:text-primary transition-colors">Contraseña</span>
              <div className="relative">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-15 py-4 rounded-2xl bg-black/40 text-white border border-white/5 pl-14 pr-12 outline-none focus:border-primary/40 focus:bg-black/60 transition-all font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-16 bg-primary text-white font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(0,51,160,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 overflow-hidden mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px]">
                {loading ? (
                  <>
                    <FiLoader className="animate-spin text-lg" />
                    <span>Validando...</span>
                  </>
                ) : (
                  "Entrar al Sistema"
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
              ¿Eres cliente nuevo?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-secondary hover:text-primary transition-colors underline underline-offset-4"
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          <div className="mt-10 flex justify-between items-center text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">
            <span>V 1.2.0</span>
            <div className="flex gap-2 items-center">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              <span>Server Online</span>
            </div>
            <span>@Rhytm</span>
          </div>
        </div>
      </div>
    </div>
  );
}