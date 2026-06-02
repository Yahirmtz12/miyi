import { useState, useEffect, useRef, useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiActivity, FiX } from "react-icons/fi";
import { API_URL } from "../api";

/**
 * AttendanceListener — Componente flotante que escucha el lector QR físico en segundo plano.
 * 
 * Se monta globalmente (ej. en DashboardLayout o Sales) y detecta cuando el lector
 * envía un código de membresía. Registra la asistencia automáticamente y muestra
 * una notificación toast sin interrumpir la pantalla de ventas.
 * 
 * El lector físico actúa como teclado: envía caracteres rápidamente y termina con Enter.
 * Diferenciamos del teclado humano porque la pistola envía chars en <100ms.
 */
export default function AttendanceListener() {
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'denied', name, message, clasesRestantes }
  const scannerBuffer = useRef("");
  const scannerTimeout = useRef(null);
  const lastScannedRef = useRef({ id: "", time: 0 });
  const processingRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  // Limpiar toast después de X segundos
  const showToast = useCallback((data, duration = 4000) => {
    setToast(data);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Procesar el ID escaneado
  const processScannedId = useCallback(async (scannedId) => {
    if (processingRef.current) return;
    
    const now = Date.now();
    // Cooldown de 6 segundos para evitar registros duplicados
    if (lastScannedRef.current.id === scannedId && now - lastScannedRef.current.time < 6000) {
      return;
    }

    processingRef.current = true;
    const token = localStorage.getItem("token");

    try {
      // 1. Buscar info del miembro
      const memberRes = await fetch(`${API_URL}/api/users/member/${scannedId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const memberData = await memberRes.json();

      if (!memberRes.ok) {
        showToast({ type: "error", message: "Membresía no encontrada" });
        return;
      }

      // 2. Verificar si puede acceder
      if (memberData.status !== "activa") {
        showToast({
          type: "denied",
          name: memberData.nombre,
          message: memberData.mensaje || "Acceso denegado"
        }, 5000);
        return;
      }

      // 3. Registrar asistencia
      const attendRes = await fetch(`${API_URL}/api/users/register-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          membershipId: scannedId,
          nombreClase: memberData.disciplina || "Clase General"
        })
      });

      const attendData = await attendRes.json();

      if (attendRes.ok) {
        lastScannedRef.current = { id: scannedId, time: now };
        showToast({
          type: "success",
          name: memberData.nombre,
          message: "Acceso concedido",
          clasesRestantes: attendData.clasesRestantes
        });
      } else {
        showToast({
          type: "error",
          name: memberData.nombre,
          message: attendData.msg || "Error al registrar"
        });
      }
    } catch (error) {
      console.error("AttendanceListener error:", error);
      showToast({ type: "error", message: "Error de conexión" });
    } finally {
      processingRef.current = false;
    }
  }, [showToast]);

  // Listener global de teclado para detectar el lector QR físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      // No interferir con inputs/textareas
      const active = document.activeElement;
      const isInput = active.tagName === "INPUT" || active.tagName === "TEXTAREA";
      if (isInput) return;

      // Ignorar teclas especiales excepto Enter
      if (e.key === "Backspace" || (e.key.length > 1 && e.key !== "Enter")) return;

      if (e.key === "Enter") {
        const scanned = scannerBuffer.current.trim().toUpperCase();
        if (scanned.length >= 5) {
          processScannedId(scanned);
        }
        scannerBuffer.current = "";
        return;
      }

      // Solo caracteres individuales, sin modificadores
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scannerBuffer.current += e.key;
        clearTimeout(scannerTimeout.current);
        // 100ms timeout: si pasan más de 100ms sin nuevo char, no es una pistola
        scannerTimeout.current = setTimeout(() => {
          scannerBuffer.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(scannerTimeout.current);
      clearTimeout(toastTimeoutRef.current);
    };
  }, [processScannedId]);

  if (!toast) return null;

  const colors = {
    success: {
      bg: "bg-green-500/15 border-green-500/30",
      icon: <FiCheckCircle className="text-green-400 w-7 h-7" />,
      accent: "text-green-400"
    },
    denied: {
      bg: "bg-yellow-500/15 border-yellow-500/30",
      icon: <FiAlertCircle className="text-yellow-400 w-7 h-7" />,
      accent: "text-yellow-400"
    },
    error: {
      bg: "bg-red-500/15 border-red-500/30",
      icon: <FiAlertCircle className="text-red-400 w-7 h-7" />,
      accent: "text-red-400"
    }
  };

  const style = colors[toast.type] || colors.error;

  return (
    <div className="fixed top-6 right-6 z-[90] animate-in slide-in-from-right-5 fade-in duration-300">
      <div className={`${style.bg} backdrop-blur-xl border rounded-2xl p-4 pr-5 shadow-2xl min-w-[280px] max-w-[340px] flex items-start gap-4`}>
        <div className="shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FiActivity className={`w-3 h-3 ${style.accent}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${style.accent}`}>
              Asistencia
            </span>
          </div>
          {toast.name && (
            <p className="text-white font-black text-sm uppercase tracking-tight truncate">{toast.name}</p>
          )}
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">{toast.message}</p>
          {toast.clasesRestantes !== undefined && (
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
              Quedan: <span className="text-white">{toast.clasesRestantes}</span> clases
            </p>
          )}
        </div>
        <button
          onClick={() => setToast(null)}
          className="shrink-0 p-1 text-white/20 hover:text-white/60 transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
}
