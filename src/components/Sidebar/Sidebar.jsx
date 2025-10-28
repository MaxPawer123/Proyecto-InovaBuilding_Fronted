import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar({ dark, edificioName, totalDepartamentos, currentPage = "dashboard" }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // Función helper para determinar si una página está activa
  const isActive = (page) => currentPage === page;
  const getLinkClass = (page) => {
    return isActive(page) 
      ? "block rounded-xl px-3 py-2 font-medium bg-white/20 text-white backdrop-blur-sm"
      : "block rounded-xl px-3 py-2 text-white/90 hover:bg-white/10 hover:text-white transition-all";
  };

  return (
    <aside className="hidden lg:flex w-80 shrink-0 flex-col relative overflow-hidden">
      {/* Fondo con gradiente llamativo */}
      <div className={`absolute inset-0 ${tone("bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700","bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900")}`}></div>
      <div className={`absolute inset-0 ${tone("bg-white/10","bg-black/20")} backdrop-blur-sm`}></div>
      
      {/* Contenido del sidebar */}
      <div className="relative z-10 flex flex-col h-full">
        <div className={`px-6 py-5 border-b ${tone("border-white/20","border-white/10")}`}>
          <div className="text-xs uppercase tracking-widest text-white/70">Administración</div>
          <div className="mt-1 text-xl font-bold text-white">Panel General</div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link to="/administrador" className={getLinkClass("dashboard")}>
            Dashboard
          </Link>
          <Link to="/GestionDeUsuarios" className={getLinkClass("gestionDeUsuarios")}>
            Gestión de usuarios
          </Link>
        <Link to="/Administrador/comunicacion" className={getLinkClass("Comunicacion")}>
            Comunicación
          </Link>
          <Link to="/Administrador/consumos" className={getLinkClass("Consumo")}>
            Consumo
          </Link>
           <Link to="/Administrador/ticketsMantenimiento" className={getLinkClass("TicketsMantenimiento")}>
            Tickets de Mantenimiento
          </Link>
          <Link to="/Administrador/reservas" className={getLinkClass("Reserva")}>
            Reservas
          </Link>
        
        </nav>
        
        <div className={`mt-auto p-4 border-t ${tone("border-white/20","border-white/10")} text-xs text-white/70`}>
          {edificioName} • {totalDepartamentos} deptos
        </div>
      </div>
      
      {/* Elementos decorativos */}
      <div className="absolute top-10 right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 left-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
    </aside>
  );
}