import Register from "../components/Register/Register"

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-emerald-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white/50 backdrop-blur-xl">
        
        {/* Panel de bienvenida (solo en pantallas grandes) */}
        <div className="flex lg:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-600/80 to-green-600/80 text-white text-center"> {/*aca le pusimos que simrpe sea flex es en si el primer flex*/}
          <h2 className="text-3xl font-bold tracking-tight">¡Crea tu cuenta!</h2>
          <p className="mt-3 text-white/90 max-w-sm">
            Únete a InnovaBuilding y administra tu edificio de manera sencilla y eficiente.
          </p>
          <div className="mt-8">
            <img
              src="src/Img/icono.jpeg"
              alt="Logo InnovaBuilding"
              className="w-28 h-28 rounded-full ring-4 ring-white/50 object-cover shadow-lg mx-auto"
            />
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          {/* Header */}
          <div className="flex flex-col items-center lg:items-start gap-3 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-wide">
              InnovaBuilding
            </h1>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-center lg:text-left text-gray-700 mb-1">
            Registrar Cuenta
          </h2>

          {/* Formulario */}
          <div className="mx-auto w-full max-w-md">
            <Register />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage