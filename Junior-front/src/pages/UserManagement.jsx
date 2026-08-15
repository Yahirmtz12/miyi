import { useState, useEffect } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiShield,
  FiUser,
  FiAlertCircle,
  FiMessageCircle,
  FiLock,
  FiX,
  FiCheck
} from "react-icons/fi";
import { API_URL } from "../api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [errorMsg, setErrorMsg] = useState("");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToEditPassword, setUserToEditPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [noPhoneToast, setNoPhoneToast] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    password: "",
    rol: "cliente"
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const normalizedData = {
      ...formData,
      usuario: formData.usuario.toLowerCase().trim()
    };

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(normalizedData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRegisterModal(false);
        setFormData({ nombre: "", usuario: "", password: "", rol: "cliente" });
        fetchUsers();
      } else {
        setErrorMsg(data.msg || "Error al registrar");
      }
    } catch (err) {
      setErrorMsg("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRol = async (userId, currentRol) => {
    const rolesEmpleado = ["admin", "cliente"];
    const currentIndex = rolesEmpleado.indexOf(currentRol);

    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % rolesEmpleado.length;
    const newRol = rolesEmpleado[nextIndex];

    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/api/users/${userId}/rol`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rol: newRol }),
      });
      fetchUsers();
    } catch (err) {
      console.error("Error al cambiar rol:", err);
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  // --- WHATSAPP HANDLER ---
  const handleWhatsApp = (user) => {
    if (!user.telefono) {
      setNoPhoneToast(`${user.nombre || user.usuario} no ha registrado su número telefónico`);
      setTimeout(() => setNoPhoneToast(""), 4000);
      return;
    }
    const mensaje = encodeURIComponent(
      `¡Hola ${user.nombre}! 💈 Te escribimos de Xolos Barbershop. Estamos a tus órdenes para agendar tu próximo corte.`
    );
    const telefono = `52${user.telefono}`;
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (newPassword.length < 4) {
      setErrorMsg("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/${userToEditPassword._id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowPasswordModal(false);
        setNewPassword("");
        setUserToEditPassword(null);
      } else {
        setErrorMsg(data.msg || "Error al actualizar la contraseña");
      }
    } catch (err) {
      setErrorMsg("Error de conexión");
    }
  };

  const displayedUsers = users.filter((u) => {
    const matchesSearch = (u.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.usuario || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "todos" || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      {noPhoneToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-3 duration-300">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl max-w-sm">
            <FiAlertCircle className="shrink-0 w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">{noPhoneToast}</span>
          </div>
        </div>
      )}
      
      <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-[#C5A473]/20 rounded-2xl border border-[#C5A473]/20 shrink-0">
            <FiShield className="text-[#C5A473] w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Usuarios</h1>
            <p className="text-white/40 text-[10px] md:text-sm italic">Xolos Barbershop - Oaxaca</p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setShowRegisterModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#C5A473] hover:bg-[#8C6A3B] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest"
        >
          <FiUserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 bg-black/20 p-4 rounded-3xl border border-white/5">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="BUSCAR NOMBRE O USUARIO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-[#C5A473] outline-none text-xs font-bold uppercase transition-all placeholder:text-white/20 tracking-widest"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-48 bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-8 text-white focus:border-[#C5A473] outline-none text-xs font-bold uppercase transition-all cursor-pointer appearance-none tracking-widest"
              >
                <option value="todos">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Nombre / Usuario</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase text-center tracking-widest">Teléfono</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase text-center tracking-widest">Rol</th>
                  <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase text-center tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-12 text-center text-white/30 text-xs font-black uppercase tracking-widest">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((u) => {
                    const esCliente = u.rol === 'cliente';
                    const esYoMismo = u.usuario === currentUser.usuario;
                    const puedeActualizarRol = !esYoMismo;

                    return (
                      <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-[#C5A473] font-bold border border-white/10 shadow-inner">
                            {(u.nombre || u.usuario).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold tracking-wide italic">{u.nombre || "Sin Nombre"}</span>
                            <span className="text-white/30 text-xs font-mono">@{u.usuario}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-white/60">
                          {u.telefono || "N/A"}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest ${
                            u.rol === 'admin' ? 'bg-[#C5A473]/10 text-[#C5A473] border-[#C5A473]/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex justify-center gap-2">
                            {esCliente && (
                              <button
                                onClick={() => handleWhatsApp(u)}
                                className="p-3 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl transition-all border border-[#25D366]/20 active:scale-90"
                                title="Enviar WhatsApp"
                              >
                                <FiMessageCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setUserToEditPassword(u);
                                setShowPasswordModal(true);
                                setErrorMsg("");
                              }}
                              className="p-3 bg-white/5 hover:bg-[#C5A473] text-white rounded-xl transition-all border border-white/5 active:scale-90"
                              title="Cambiar Contraseña"
                            >
                              <FiLock className="w-5 h-5" />
                            </button>
                            {puedeActualizarRol && (
                              <button
                                onClick={() => handleToggleRol(u._id, u.rol)}
                                className="p-3 bg-white/5 hover:bg-blue-500 text-white rounded-xl transition-all border border-white/5 active:scale-90"
                                title="Cambiar Rol (Admin/Cliente)"
                              >
                                <FiUsers className="w-5 h-5" />
                              </button>
                            )}
                            {!esYoMismo && (
                              <button
                                onClick={() => confirmDelete(u)}
                                className="p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-90"
                                title="Eliminar Usuario"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODALES --- */}

      {/* Modal Registrar Usuario */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
          <div className="relative bg-[#161616] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Nuevo Usuario</h2>
            {errorMsg && <p className="text-red-400 text-xs font-bold mb-4">{errorMsg}</p>}
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <input type="text" placeholder="Nombre completo" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
              <input type="text" placeholder="Nombre de usuario" required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
              <input type="password" placeholder="Contraseña" required minLength="4" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
              <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm">
                <option value="cliente">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-black uppercase text-xs">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#C5A473] text-white rounded-xl font-black uppercase text-xs">{loading ? "Guardando..." : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-[#161616] border border-red-500/20 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">¿Eliminar Usuario?</h2>
            <p className="text-white/40 text-sm mb-6">Se borrará permanentemente a <strong>{userToDelete?.usuario}</strong>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xs uppercase transition-colors">Cancelar</button>
              <button onClick={handleDeleteUser} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-[#161616] border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Cambiar Contraseña</h2>
            <p className="text-white/40 text-xs mb-6">Nueva contraseña para <strong>{userToEditPassword?.usuario}</strong></p>
            {errorMsg && <p className="text-red-400 text-xs font-bold mb-4">{errorMsg}</p>}
            <form onSubmit={handleChangePassword}>
              <input type="password" placeholder="Nueva Contraseña" required minLength="4" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm mb-6" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-black uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#C5A473] text-white rounded-xl font-black uppercase text-xs">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}