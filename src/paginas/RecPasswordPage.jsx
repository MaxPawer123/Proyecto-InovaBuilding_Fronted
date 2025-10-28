import RecoverPassword from "../components/RecuperarPassword/RecuperarPassword";

export const RecPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-green-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/40 bg-white/60 backdrop-blur-2xl">
        
        {/* Panel de bienvenida (solo visible en pantallas grandes) */}
        <div className="hidden lg:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-emerald-700 to-green-600 text-white text-center relative">
          {/* Overlay decorativo */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-sm mx-auto leading-relaxed">
              Recupera el acceso a tu cuenta de InnovaBuilding en unos pasos
              rápidos y seguros.
            </p>
            <div className="mt-10">
              <img
                src="/src/Img/icono.jpeg"
                alt="Logo InnovaBuilding"
                className="w-40 h-40 rounded-full ring-4 ring-white/70 object-cover shadow-2xl mx-auto transform transition duration-500 hover:scale-110"
              />
            </div>
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-white/70">
          <div className="w-full max-w-md animate-fadeIn">
            <RecoverPassword />
          </div>
        </div>
      </div>
    </div>
  );
};
