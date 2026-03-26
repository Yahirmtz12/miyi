import { FiLoader } from "react-icons/fi";

const ButtonLoading = ({ 
  loading, 
  disabled, 
  onClick, 
  children, 
  className = "" 
}) => {
  return (
    <button
      onClick={onClick}
      // Se deshabilita si está cargando O si la prop 'disabled' externa es true
      disabled={loading || disabled}
      className={`group relative overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {/* Efecto de brillo (Glow) que ya tenías */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      <div className="flex items-center justify-center gap-3">
        {loading ? (
          <>
            <FiLoader className="animate-spin text-lg" />
            <span className="uppercase tracking-[0.2em] text-[11px]">Procesando...</span>
          </>
        ) : (
          children
        )}
      </div>
    </button>
  );
};

export default ButtonLoading;