import React from "react";
import { Link } from "react-router-dom";  

const UserProfile = ({ dark, usuarioActual, edificioName, onLogout }) => {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  const handleLogout = () => {
    // Aquí puedes agregar la lógica de cierre de sesión
    if (onLogout) {
      onLogout();
    } else {
      // Lógica por defecto si no se proporciona onLogout
      console.log("Cerrando sesión...");
      // Ejemplo: localStorage.removeItem('token');
      // Ejemplo: navigate('/login');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <div className="text-sm font-medium">{usuarioActual.nombre} {usuarioActual.apellido}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{usuarioActual.rol}</div>
      </div>
      <div className="relative group">
        {usuarioActual.avatar ? (
          <img src={usuarioActual.avatar} alt="Avatar" className="h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-700" />
        ) : (
          <div className="h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-600 to-violet-600 text-white text-sm font-semibold grid place-items-center">
            {usuarioActual.nombre.charAt(0)}{usuarioActual.apellido.charAt(0)}
          </div>
        )}
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="font-medium">{usuarioActual.nombre} {usuarioActual.apellido}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{usuarioActual.email}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{usuarioActual.rol} - {edificioName}</div>
          </div>
          <div className="p-2">
            <a href="#" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/40">Mi perfil</a>
            <a href="#" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/40">Configuración</a>
            <hr className="my-2 border-slate-200 dark:border-slate-700/60" />
            {/*<button
              onClick={handleLogout}
              className="w-full text-left block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Cerrar sesión
            </button>*/}

            {/* Si descementas el <Link> , si dara la redirecion al login pero solo sera mediante el fornted y hay que desconectarlo mediante el backend tambien
              Importante si quieres que de el <link> tambien tiene que immportar 
              import { Link } from "react-router-dom";
            */}

           <Link
              to="/login"
              className="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Cerrar sesión
            </Link>


          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;