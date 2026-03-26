import { useState, useEffect } from "react";
import { 
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiX, 
  FiTag, FiImage, FiShoppingCart, FiTruck, FiLoader, FiDollarSign, FiLayers 
} from "react-icons/fi";
import { API_URL } from "../api";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("Venta"); 
  const [stock, setStock] = useState(0);
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const ventaProducts = products.filter(p => p.categoria === "Venta");
  const insumoProducts = products.filter(p => p.categoria === "Ingrediente");

  const openModal = (type, product = null) => {
    setModalType(type);
    setCurrentProduct(product);
    if (type === "edit" && product) {
      setNombre(product.nombre); 
      setPrecio(product.precio);
      setCategoria(product.categoria || "Venta"); 
      setStock(product.stock);
      setImagen(product.imagen); 
      setPreview(product.imagen);
    } else {
      setNombre(""); setPrecio(""); setCategoria("Venta"); setStock(0); setImagen(null); setPreview(null);
    }
    setShowModal(true);
  };

  const closeModal = () => { if (isSaving) return; setShowModal(false); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { 
      setImagen(reader.result); 
      setPreview(reader.result); 
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const method = modalType === "add" ? "POST" : "PUT";
    const url = modalType === "add" ? `${API_URL}/api/products` : `${API_URL}/api/products/${currentProduct._id}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ nombre, precio, categoria, stock, imagen }),
      });

      if (res.ok) {
        await fetchProducts();
        setShowModal(false);
      } else {
        alert("Error al procesar la solicitud");
      }
    } catch (error) { 
      alert("Error al conectar con el servidor"); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleDeleteProduct = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/api/products/${currentProduct._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      await fetchProducts();
      setShowModal(false);
    } catch (error) { 
      alert("Error al eliminar"); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Agotado", class: "bg-red-500/10 text-red-500 border-red-500/20" };
    if (stock <= 10) return { label: "Bajo", class: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
    return { label: "Disponible", class: "bg-green-500/10 text-green-400 border-green-500/20" };
  };

  const RenderTable = (title, list, Icon, colorClass) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 border border-current border-opacity-20`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colorClass}`} />
        </div>
        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-widest italic">{title}</h2>
        <span className="ml-auto text-white/20 text-[10px] md:text-xs font-mono">{list.length} Items</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {list.length === 0 ? (
          <p className="p-10 text-center text-white/10 uppercase font-black text-xs tracking-widest">Sin registros</p>
        ) : (
          list.map((p) => {
            const status = getStockStatus(p.stock);
            return (
              <div key={p._id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex items-center gap-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-black/20 overflow-hidden border border-white/5 shrink-0">
                  <img src={p.imagen || "https://via.placeholder.com/150"} alt={p.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-sm md:text-base uppercase truncate italic">{p.nombre}</h3>
                  <p className="text-secondary font-mono font-black text-xs md:text-sm">${Number(p.precio).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase border tracking-widest ${status.class}`}>
                      {p.stock} UNIDADES
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openModal("edit", p)} className="p-3 bg-white/5 text-secondary rounded-xl border border-white/10 active:scale-95 transition-all">
                    <FiEdit2 size={16} />
                  </button>
                  <button onClick={() => openModal("delete", p)} className="p-3 bg-white/5 text-red-500 rounded-xl border border-white/10 active:scale-95 transition-all">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      <header className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0 shadow-lg shadow-primary/10">
              <FiPackage className="text-secondary w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Inventario</h1>
              <p className="text-white/40 text-[10px] md:text-sm italic">Rhytm - Oaxaca</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        <button 
          onClick={() => openModal("add")}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-primary text-white font-black py-5 px-10 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-[0.2em] text-xs italic"
        >
          <FiPlus className="w-5 h-5" /> Nuevo Registro
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-20">
          {RenderTable("Menú de Venta", ventaProducts, FiShoppingCart, "text-blue-400")}
          {RenderTable("Insumos", insumoProducts, FiTruck, "text-purple-400")}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#262626] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
              <h3 className={`text-lg font-black uppercase tracking-tighter italic ${modalType === 'delete' ? 'text-red-500' : 'text-white'}`}>
                {modalType === "add" && "Nuevo Producto"}
                {modalType === "edit" && "Editar Datos"}
                {modalType === "delete" && "Confirmar Borrado"}
              </h3>
              {!isSaving && (
                <button onClick={closeModal} className="text-white/40 hover:text-white transition p-2 bg-white/5 rounded-full">
                  <FiX size={20} />
                </button>
              )}
            </div>

            <div className="p-8">
              {modalType !== "delete" ? (
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2">Nombre</label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isSaving}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold disabled:opacity-50" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2">Tipo de Producto</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={isSaving}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold appearance-none cursor-pointer">
                      <option value="Venta" className="bg-[#262626]">Producto para Venta</option>
                      <option value="Ingrediente" className="bg-[#262626]">Ingrediente / Insumo</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2">Precio</label>
                      <input type="number" required value={precio} onChange={(e) => setPrecio(e.target.value)} disabled={isSaving}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2">Stock</label>
                      <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} disabled={isSaving}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-2">Imagen</label>
                    <div className="flex items-center gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 transition ${isSaving ? 'opacity-50' : 'hover:border-primary/50 hover:bg-white/10 cursor-pointer'}`}>
                        <FiImage className="text-white/20" />
                        <span className="text-[10px] text-white/40 uppercase font-black">Subir</span>
                        <input type="file" onChange={handleFileChange} className="hidden" disabled={isSaving} accept="image/*" />
                      </label>
                      {preview && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/50">
                          <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4 flex justify-center items-center gap-2 transition-all active:scale-95">
                    {isSaving ? <FiLoader className="animate-spin" /> : "Guardar Registro"}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-white/60 font-bold italic uppercase">¿Deseas eliminar a <span className="text-white">"{currentProduct?.nombre}"</span> permanentemente?</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleDeleteProduct} disabled={isSaving} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-red-600/20">
                      {isSaving ? <FiLoader className="animate-spin mx-auto" /> : "Confirmar Borrado"}
                    </button>
                    <button onClick={closeModal} disabled={isSaving} className="text-white/20 uppercase font-black text-[10px] tracking-widest hover:text-white transition">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}