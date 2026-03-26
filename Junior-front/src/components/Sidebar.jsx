import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all";
  const active =
    "bg-primary/15 text-primary";
  const inactive =
    "text-stone-400 hover:text-white hover:bg-white/5";

  return (
    <aside className="w-64 bg-background-dark border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 text-primary">
        <span className="material-symbols-outlined">restaurant</span>
        <h1 className="text-white font-black tracking-tight">Pollería POS</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <NavLink
          to="/dashboard/sales"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <span className="material-symbols-outlined">point_of_sale</span>
          Ventas
        </NavLink>

        <NavLink
          to="/dashboard/inventory"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <span className="material-symbols-outlined">inventory_2</span>
          Inventario
        </NavLink>

        <NavLink
          to="/dashboard/reports"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <span className="material-symbols-outlined">analytics</span>
          Reportes
        </NavLink>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10 text-xs text-stone-400">
        Cajero 01 · Turno Mañana
      </div>
    </aside>
  );
}
