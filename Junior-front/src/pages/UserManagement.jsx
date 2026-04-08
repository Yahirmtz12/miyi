import { useEffect, useState } from "react";
import {
  FiShield, FiUserPlus, FiRefreshCw, FiX, FiUser,
  FiLock, FiEdit3, FiTrash2, FiAlertTriangle, FiEye, 
  FiCalendar, FiActivity, FiSearch, FiFilter
} from "react-icons/fi";
import { API_URL } from "../api";

// SEGURIDAD: Define aquí el ID de usuario que NADIE debe ver ni editar
const SUPER_ADMIN_USER = "admin_maestroyomg";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToEditPassword, setUserToEditPassword] = useState(null);
  
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // --- NUEVOS ESTADOS PARA FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [newPassword, setNewPassword] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    password: "",
    rol: "cajero"
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const filteredUsers = data.filter(u => u.usuario !== SUPER_ADMIN_USER);
        setUsers(filteredUsers);
      }
    } catch (err) { console.error("Error al obtener usuarios:", err); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
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

      if (res.ok) {
        setShowPasswordModal(false);
        setNewPassword("");
        setUserToEditPassword(null);
        alert("Contraseña actualizada con éxito");
      } else {
        const data = await res.json();
        setErrorMsg(data.msg || "Error al actualizar");
      }
    } catch (err) {
      setErrorMsg("Error de conexión");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const token = localStorage.getItem("token");

    const normalizedData = {
      ...formData,
      usuario: formData.usuario.trim().toLowerCase(),
      nombre: formData.nombre.trim()
    };

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(normalizedData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRegisterModal(false);
        setFormData({ nombre: "", usuario: "", password: "", rol: "cajero" });
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
    const rolesEmpleado = ["admin", "cajero", "cocinero", "mesero", "kiosko"];
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

  // --- LÓGICA DE FILTRADO ---
  const displayedUsers = users.filter((u) => {
    // Filtro por texto (nombre o usuario)
    const matchesSearch = (u.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.usuario || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por rol
    const matchesRole = roleFilter === "todos" || u.rol === roleFilter;

    // Filtro por estatus (solo aplica a clientes)
    let matchesStatus = true;
    if (statusFilter === "activo") {
      matchesStatus = u.rol === "cliente" && u.clasesDisponibles > 0;
    } else if (statusFilter === "inactivo") {
      matchesStatus = u.rol === "cliente" && (!u.clasesDisponibles || u.clasesDisponibles <= 0);
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="bg-[#1F1F1F] min-h-screen text-white font-sans">
      <header className="p-4 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/20 rounded-2xl border border-primary/20 shrink-0">
            <FiShield className="text-secondary w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Usuarios</h1>
            <p className="text-white/40 text-[10px] md:text-sm italic">Rhythm - Oaxaca</p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setShowRegisterModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-[#00205B] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase text-xs tracking-widest"
        >
          <FiUserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        
        {/* TÍTULO Y CONTADOR DE USUARIOS */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <FiUser className="text-secondary w-5 h-5" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 italic">Plantilla de Usuarios</h2>
          </div>
          <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
            {displayedUsers.length} {displayedUsers.length === 1 ? 'Usuario' : 'Usuarios'} en Total
          </span>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 bg-black/20 p-4 rounded-3xl border border-white/5">
          
          {/* Buscador de texto */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="BUSCAR NOMBRE O USUARIO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none text-xs font-bold uppercase transition-all placeholder:text-white/20 tracking-widest"
            />
          </div>

          {/* Filtros Selects */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  if (e.target.value !== "cliente" && e.target.value !== "todos") setStatusFilter("todos");
                }}
                className="w-full sm:w-48 bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-8 text-white focus:border-primary outline-none text-xs font-bold uppercase transition-all cursor-pointer appearance-none tracking-widest"
              >
                <option value="todos">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="cajero">Cajeros</option>
                <option value="cliente">Clientes</option>
                <option value="cocinero">Cocineros</option>
                <option value="mesero">Meseros</option>
                <option value="kiosko">Kioskos</option>
              </select>
            </div>

            <div className="relative">
              <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={roleFilter !== "todos" && roleFilter !== "cliente"}
                className="w-full sm:w-48 bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-8 text-white focus:border-primary outline-none text-xs font-bold uppercase transition-all cursor-pointer appearance-none tracking-widest disabled:opacity-30"
              >
                <option value="todos">Cualquier estatus</option>
                <option value="activo">Clientes Activos</option>
                <option value="inactivo">Clientes Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA PC */}
        <div className="hidden md:block bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Nombre / Usuario</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase text-center tracking-widest">Rol</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase text-center tracking-widest">Estatus</th>
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
                  const puedeActualizarRol = !esCliente && !esYoMismo;
                  const tieneClases = u.clasesDisponibles > 0;

                  return (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-secondary font-bold border border-white/10 shadow-inner">
                          {(u.nombre || u.usuario).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold tracking-wide italic">{u.nombre || "Sin Nombre"}</span>
                          <span className="text-white/30 text-xs font-mono">@{u.usuario}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest ${u.rol === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          u.rol === 'cajero' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            u.rol === 'cliente' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              u.rol === 'cocinero' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                u.rol === 'mesero' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  u.rol === 'kiosko' ? 'bg-red-500/10 text-green-400 border-green-500/20' :
                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        {esCliente ? (
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest ${
                            tieneClases ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {tieneClases ? 'Activo' : 'Inactivo'}
                          </span>
                        ) : (
                          <span className="text-white/20 font-black">—</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          {esCliente && (
                            <button
                              onClick={() => {
                                setSelectedClient(u);
                                setShowClientModal(true);
                              }}
                              className="p-3 bg-white/5 hover:bg-purple-500 text-white rounded-xl transition-all border border-white/5 active:scale-90"
                              title="Ver Membresía"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setUserToEditPassword(u);
                              setShowPasswordModal(true);
                              setErrorMsg("");
                            }}
                            className="p-3 bg-white/5 hover:bg-primary text-white rounded-xl transition-all border border-white/5 active:scale-90"
                            title="Cambiar Contraseña"
                          >
                            <FiLock className="w-5 h-5" />
                          </button>
                          {puedeActualizarRol && (
                            <button onClick={() => handleToggleRol(u._id, u.rol)} className="p-3 bg-white/5 hover:bg-secondary hover:text-black text-white rounded-xl transition-all border border-white/5 active:scale-90">
                              <FiRefreshCw className="w-5 h-5" />
                            </button>
                          )}
                          {!esYoMismo && (
                            <button onClick={() => confirmDelete(u)} className="p-3 bg-white/5 hover:bg-red-600 text-white rounded-xl transition-all border border-white/5 active:scale-90">
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CARDS MÓVIL */}
        <div className="grid grid-cols-1 gap-4 md:hidden pb-20">
          {displayedUsers.length === 0 ? (
            <div className="bg-black/40 border border-white/10 rounded-[2rem] p-10 text-center text-white/30 text-xs font-black uppercase tracking-widest">
              No se encontraron usuarios
            </div>
          ) : (
            displayedUsers.map((u) => {
              const esCliente = u.rol === 'cliente';
              const esYoMismo = u.usuario === currentUser.usuario;
              const puedeActualizarRol = !esCliente && !esYoMismo;
              const tieneClases = u.clasesDisponibles > 0;

              return (
                <div key={u._id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-secondary text-xl font-black border border-white/10 uppercase shrink-0">
                      {(u.nombre || u.usuario).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-white font-bold text-sm leading-none truncate italic">{u.nombre || "Sin Nombre"}</h3>
                      <span className="text-white/30 text-[10px] font-mono mt-1">@{u.usuario}</span>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${
                          u.rol === 'admin' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 
                          u.rol === 'cliente' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' : 
                          'text-blue-400 border-blue-500/20 bg-blue-500/10'
                        }`}>
                          {u.rol}
                        </span>
                        
                        {esCliente && (
                          <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${
                            tieneClases ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                          }`}>
                            {tieneClases ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {esCliente && (
                      <button
                        onClick={() => {
                          setSelectedClient(u);
                          setShowClientModal(true);
                        }}
                        className="p-3.5 bg-white/5 text-purple-400 rounded-2xl border border-white/10 active:scale-90 transition-transform"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserToEditPassword(u);
                        setShowPasswordModal(true);
                        setErrorMsg("");
                      }}
                      className="p-3.5 bg-white/5 text-primary rounded-2xl border border-white/10 active:scale-90 transition-transform"
                    >
                      <FiLock className="w-5 h-5" />
                    </button>
                    {puedeActualizarRol && (
                      <button onClick={() => handleToggleRol(u._id, u.rol)} className="p-3.5 bg-white/5 text-secondary rounded-2xl border border-white/10 active:scale-90 transition-transform">
                        <FiRefreshCw className="w-5 h-5" />
                      </button>
                    )}
                    {!esYoMismo && (
                      <button onClick={() => confirmDelete(u)} className="p-3.5 bg-white/5 text-red-500 rounded-2xl border border-white/10 active:scale-90 transition-transform">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* MODAL DETALLES DEL CLIENTE */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/20">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Datos de Membresía</h3>
              <button onClick={() => setShowClientModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto border border-purple-500/20 mb-3">
                  <FiUser className="text-purple-400 w-8 h-8" />
                </div>
                <h4 className="text-xl font-black uppercase text-white">{selectedClient.nombre}</h4>
                <p className="text-xs text-white/40 font-mono mt-1">{selectedClient.membershipId || "Sin ID asignado"}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <FiEdit3 className="text-primary w-5 h-5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Disciplina</p>
                    <p className="text-sm text-white font-bold">{selectedClient.disciplina || "No inscrita"}</p>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <FiActivity className="text-secondary w-5 h-5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Clases Disponibles</p>
                    <p className={`text-xl font-black ${selectedClient.clasesDisponibles > 0 ? 'text-white' : 'text-red-400'}`}>
                      {selectedClient.clasesDisponibles || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <FiCalendar className="text-green-400 w-5 h-5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Vencimiento</p>
                    <p className="text-sm text-white font-bold">
                      {selectedClient.fechaVencimiento 
                        ? new Date(selectedClient.fechaVencimiento).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) 
                        : "Sin fecha activa"}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowClientModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-[1.5rem] transition shadow-xl uppercase text-[10px] tracking-widest">
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
            <div className="p-8 flex justify-between items-center border-b border-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Registrar Personal</h3>
              <button onClick={() => setShowRegisterModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-8 space-y-5">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                  <FiAlertTriangle className="shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest italic">Nombre Completo</label>
                <div className="relative">
                  <FiEdit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none text-sm transition" placeholder="Nombre completo" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest italic">ID Usuario (Único)</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input type="text" required value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none text-sm transition" placeholder="Ej. adrian" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest italic">Contraseña</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none text-sm transition" placeholder="********" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest italic">Rol en Sistema</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary outline-none text-sm cursor-pointer appearance-none"
                  value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}>
                  <option value="cajero">Cajero (Ventas)</option>
                  <option value="admin">Administrador (Control Total)</option>
                  <option value="cocinero">Cocinero (Monitor Cocina)</option>
                  <option value="mesero">Mesero (Control Mesas)</option>
                  <option value="cliente">Cliente (Miembro)</option>
                  <option value="kiosko">Kiosko</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-[#00205B] text-white font-black py-5 rounded-[1.5rem] transition shadow-xl shadow-primary/20 mt-4 disabled:opacity-50 tracking-widest uppercase text-xs">
                {loading ? "PROCESANDO..." : "REGISTRAR USUARIO"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1F1F1F] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Nueva Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-8 space-y-5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
                Cambiando clave para: <span className="text-primary font-bold">{userToEditPassword?.usuario}</span>
              </p>

              <div className="space-y-2">
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none text-sm transition"
                    placeholder="Nueva contraseña"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{errorMsg}</p>}

              <button type="submit" className="w-full bg-primary hover:bg-[#00205B] text-white font-black py-5 rounded-[1.5rem] transition shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
                ACTUALIZAR CLAVE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1F1F1F] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center space-y-5">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <FiAlertTriangle className="text-red-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic">¿Confirmar Baja?</h3>
              <p className="text-white/40 text-xs leading-relaxed uppercase tracking-widest px-4">
                Borrar a <span className="text-white font-bold">{userToDelete?.nombre || userToDelete?.usuario}</span> de la plantilla.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <button onClick={handleDeleteUser} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition shadow-xl shadow-red-600/20 uppercase tracking-widest text-[10px]">
                  Sí, Eliminar Personal
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition uppercase tracking-widest text-[10px]">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 p-10 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Staff Only - Rhythm</p>
      </footer>
    </div>
  );
}