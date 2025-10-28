import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

const InputWrapper = ({ label, htmlFor, error, children }) => (
  <div className="space-y-2">
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    {children}
    {error && (
      <p className="text-red-500 text-xs leading-snug">{error.message}</p>
    )}
  </div>
);

const Icon = ({ name, className = "" }) => {
  if (name === "lock")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 0 1 6 0v3Z"
        />
      </svg>
    );
  if (name === "check-circle")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
    );
  if (name === "spinner")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (name === "x-circle")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"
        />
      </svg>
    );
  return null;
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams(); // Obtener token de la URL
  const [tokenValid, setTokenValid] = useState(null); // null = verificando, true = válido, false = inválido
  const [userInfo, setUserInfo] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm({ mode: "onChange" });

  const password = watch("password");

  // Verificar token al cargar la página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/auth/verify-reset-token/${token}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setTokenValid(true);
          setUserInfo(result.user);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  // Función para cambiar contraseña
  const resetPassword = async (newPassword, confirmPassword) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword, 
          confirmPassword 
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Error desconocido' };
      }

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Verifica que el servidor esté ejecutándose.' 
      };
    }
  };

  const onSubmit = async (data) => {
    clearErrors();
    
    const result = await resetPassword(data.password, data.confirmPassword);
    
    if (result.success) {
      setResetSuccess(true);
    } else {
      setError("password", { 
        type: "manual", 
        message: result.message 
      });
    }
  };

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-sky-100 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-8 text-center space-y-4">
          <Icon name="spinner" className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Token inválido
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-pink-100 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-8 text-center space-y-4">
          <Icon name="x-circle" className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">Enlace inválido</h1>
          <p className="text-gray-600">
            Este enlace de recuperación ha expirado o no es válido.
          </p>
          <div className="space-y-2">
            <Link
              to="/recuperarPassword"
              className="block w-full bg-red-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-700 transition"
            >
              Solicitar nuevo enlace
            </Link>
            <Link
              to="/login"
              className="block text-gray-700 font-medium hover:underline"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Éxito
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-emerald-100 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-8 text-center space-y-4">
          <Icon name="check-circle" className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">¡Contraseña actualizada!</h1>
          <p className="text-gray-600">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            to="/login"
            className="block w-full bg-green-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-700 transition"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-sky-100 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-6 sm:p-8 space-y-5">
        
        {/* Header con info del usuario */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nueva contraseña</h1>
          {userInfo && (
            <p className="text-sm text-gray-600">
              Para: <span className="font-medium">{userInfo.nombres} {userInfo.apellidos}</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            Email: {userInfo?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <InputWrapper label="Nueva contraseña" htmlFor="password" error={errors.password}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Icon name="lock" className="w-5 h-5" />
              </span>
              <input
                id="password"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  maxLength: { value: 20, message: "Máximo 20 caracteres" },
                  validate: {
                    hasLower: (v) => /[a-z]/.test(v) || "Debe contener al menos una minúscula",
                    hasUpper: (v) => /[A-Z]/.test(v) || "Debe contener al menos una mayúscula",
                    hasNumber: (v) => /[0-9]/.test(v) || "Debe contener al menos un número",
                    hasSpecial: (v) => /[!@#$%^&()_+\-=[\]{};':"\\|,.<>?~`]/.test(v) || "Debe contener al menos un carácter especial",
                  },
                })}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-xl border bg-white px-10 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                  errors.password ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                }`}
              />
            </div>
          </InputWrapper>

          <InputWrapper label="Confirmar contraseña" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Icon name="lock" className="w-5 h-5" />
              </span>
              <input
                id="confirmPassword"
                {...register("confirmPassword", {
                  required: "Confirma tu nueva contraseña",
                  validate: (v) => v === password || "Las contraseñas no coinciden",
                })}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-xl border bg-white px-10 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                  errors.confirmPassword ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                }`}
              />
            </div>
          </InputWrapper>

          <button
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 px-4 py-3.5 text-white font-semibold shadow-lg transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.07]"
            type="submit"
            disabled={isSubmitting}
          >
            <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-black/20 to-transparent transition duration-300 group-hover:translate-y-0" />
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Icon name="spinner" className="w-5 h-5 animate-spin" />
                Actualizando…
              </span>
            ) : (
              "Cambiar contraseña"
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-gray-700 text-sm font-medium hover:underline"
            >
              Volver al login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;