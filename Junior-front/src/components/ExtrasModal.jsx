import { useState, useEffect } from "react";
import { FiX, FiPlus, FiCheck, FiCoffee, FiLoader } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal de personalización de extras para un producto.
 * 
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - product: el producto seleccionado
 *  - extras: array de extras disponibles para la categoría
 *  - onConfirm: (product, selectedExtras) => void
 *  - loading: boolean (mientras se cargan los extras)
 */
export default function ExtrasModal({ isOpen, onClose, product, extras = [], onConfirm, loading = false }) {
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Reset selección al abrir/cerrar o cambiar de producto
  useEffect(() => {
    if (isOpen) setSelectedExtras([]);
  }, [isOpen, product?._id]);

  if (!isOpen || !product) return null;

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) => {
      const exists = prev.find((e) => e._id === extra._id);
      if (exists) {
        return prev.filter((e) => e._id !== extra._id);
      }
      return [...prev, extra];
    });
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.precio, 0);
  const itemTotal = product.precio + extrasTotal;

  const handleConfirm = () => {
    onConfirm(product, selectedExtras);
    onClose();
  };

  // Agregar sin extras (directo)
  const handleSkip = () => {
    onConfirm(product, []);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header con imagen del producto */}
            <div className="relative">
              {product.imagen && (
                <div className="h-36 w-full overflow-hidden">
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
                </div>
              )}
              <div className={`${product.imagen ? 'absolute bottom-0 left-0 right-0' : ''} p-6 pb-4 flex items-end justify-between`}>
                <div>
                  <p className="text-[9px] font-black text-primary/80 uppercase tracking-[0.3em] mb-1">
                    Personalizar
                  </p>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {product.nombre}
                  </h3>
                  <span className="text-secondary font-black text-sm">
                    ${product.precio.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <FiX className="text-white w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido: Lista de extras */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <FiCoffee className="text-primary text-sm" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  Extras disponibles
                </span>
                <span className="text-[9px] text-white/20 ml-auto italic">Opcional</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <FiLoader className="animate-spin text-primary w-8 h-8" />
                </div>
              ) : extras.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">
                    No hay extras para esta categoría
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {extras.map((extra) => {
                    const isSelected = selectedExtras.some(
                      (e) => e._id === extra._id
                    );
                    return (
                      <button
                        key={extra._id}
                        onClick={() => toggleExtra(extra)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 shadow-lg shadow-primary/10"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-white/10 text-white/30"
                            }`}
                          >
                            {isSelected ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiPlus className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`font-bold text-sm uppercase tracking-tight ${
                              isSelected ? "text-white" : "text-white/60"
                            }`}
                          >
                            {extra.nombre}
                          </span>
                        </div>
                        <span
                          className={`font-black text-sm ${
                            isSelected ? "text-secondary" : "text-white/30"
                          }`}
                        >
                          +${extra.precio.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: Total y botones */}
            <div className="p-6 pt-2 space-y-3 border-t border-white/5">
              {/* Desglose */}
              {selectedExtras.length > 0 && (
                <div className="bg-black/30 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    <span>Base</span>
                    <span>${product.precio.toFixed(2)}</span>
                  </div>
                  {selectedExtras.map((e) => (
                    <div
                      key={e._id}
                      className="flex justify-between text-[10px] text-primary/70 font-bold uppercase tracking-widest"
                    >
                      <span>+ {e.nombre}</span>
                      <span>${e.precio.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-1 mt-1 flex justify-between">
                    <span className="text-white font-black text-sm uppercase">
                      Total
                    </span>
                    <span className="text-secondary font-black text-lg">
                      ${itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <button
                onClick={handleConfirm}
                className="group relative w-full h-14 bg-primary text-white rounded-2xl font-black text-base shadow-lg active:scale-95 overflow-hidden uppercase tracking-tighter italic transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <FiPlus className="w-5 h-5" />
                  {selectedExtras.length > 0
                    ? `Agregar — $${itemTotal.toFixed(2)}`
                    : "Agregar al pedido"}
                </span>
              </button>

              {extras.length > 0 && (
                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-white/30 hover:text-white/60 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Agregar sin extras
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
