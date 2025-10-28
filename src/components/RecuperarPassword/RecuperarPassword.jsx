import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

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
  if (name === "mail")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"
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
  return null;
};

const RecoverPassword = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
  } = useForm({ mode: "onChange" });

  const [step, setStep] = useState(1); // 1: email, 2: PIN + nueva contraseña
  const [sentToEmail, setSentToEmail] = useState("");

  // Función para solicitar reset de contraseña (enviar PIN)
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Error desconocido' };
      }

    } catch (error) {
      console.error('Error solicitando reset de contraseña:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Verifica que el servidor esté ejecutándose.' 
      };
    }
  };

  // Función para resetear contraseña con PIN
  const resetPassword = async (data) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sentToEmail,
          pin: data.pin,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Error desconocido' };
      }

    } catch (error) {
      console.error('Error reseteando contraseña:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Verifica que el servidor esté ejecutándose.' 
      };
    }
  };

  const onSubmitStep1 = async (data) => {
    clearErrors();
    
    const result = await requestPasswordReset(data.email);
    
    if (result.success) {
      setSentToEmail(data.email);
      setStep(2);
      reset(); // Limpiar el formulario para el siguiente paso
    } else {
      setError("email", { 
        type: "manual", 
        message: result.message 
      });
    }
  };

  const onSubmitStep2 = async (data) => {
    clearErrors();
    
    const result = await resetPassword(data);
    
    if (result.success) {
      // Mostrar mensaje de éxito y redirigir al login
      alert('¡Contraseña cambiada exitosamente! Serás redirigido al login.');
      navigate('/login');
    } else {
      // Determinar qué campo tiene el error
      if (result.message && result.message.includes('PIN')) {
        setError("pin", { 
          type: "manual", 
          message: result.message 
        });
      } else {
        setError("newPassword", { 
          type: "manual", 
          message: result.message 
        });
      }
    }
  };

  return (
    <div className="grid place-items-center">
      {/* Card contenedor para mantener la estética del Login */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-6 sm:p-8 space-y-5">
        
        {step === 1 ? (
          // Paso 1: Solicitar PIN por email
          <>
            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Recuperar contraseña</h1>
              <p className="text-sm text-gray-600">Te enviaremos un PIN de recuperación a tu email.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4" aria-describedby={Object.keys(errors).length ? "form-errors" : undefined}>
              <InputWrapper label="Correo electrónico" htmlFor="email" error={errors.email}>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400">
                    <Icon name="mail" className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    {...register("email", {
                      required: "El correo electrónico es requerido",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                        message: "Correo electrónico inválido",
                      },
                      minLength: { value: 3, message: "Mínimo 3 caracteres" },
                      maxLength: { value: 50, message: "Máximo 50 caracteres" },
                    })}
                    placeholder="tucorreo@dominio.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-white px-10 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                      errors.email ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                    }`}
                  />
                </div>
              </InputWrapper>

              <button
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900 px-4 py-3.5 text-white font-semibold shadow-lg transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.07]"
                type="submit"
                disabled={isSubmitting}
              >
                <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-black/20 to-transparent transition duration-300 group-hover:translate-y-0" />
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon name="spinner" className="w-5 h-5 animate-spin" />
                    Enviando…
                  </span>
                ) : (
                  "Enviar PIN de recuperación"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-gray-800 text-sm font-medium hover:underline"
                >
                  ¿Recordaste tu contraseña? Inicia sesión
                </Link>
              </div>

              {Object.keys(errors).length > 0 && (
                <div id="form-errors" aria-live="polite" className="sr-only">
                  Hay errores en el formulario. Revisa los mensajes en rojo.
                </div>
              )}
            </form>
          </>
        ) : (
          // Paso 2: Ingresar PIN y nueva contraseña
          <>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Ingresa tu PIN</h1>
              <p className="text-sm text-gray-600">
                Enviamos un PIN de 6 dígitos a: <br />
                <span className="font-medium text-gray-800">{sentToEmail}</span>
              </p>
            </div>

            <div className="rounded-2xl border bg-blue-50 p-4 sm:p-5 shadow-sm text-blue-800 text-sm">
              <p className="font-medium mb-2">📧 Revisa tu email</p>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• El PIN expira en 15 minutos</li>
                <li>• Revisa también la carpeta de spam</li>
                <li>• Solo puedes usar el PIN una vez</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-4" aria-describedby={Object.keys(errors).length ? "form-errors" : undefined}>
              
              {/* PIN Field */}
              <InputWrapper label="PIN de 6 dígitos" htmlFor="pin" error={errors.pin}>
                <input
                  id="pin"
                  {...register("pin", {
                    required: "El PIN es requerido",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "El PIN debe ser de 6 dígitos",
                    },
                  })}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                    errors.pin ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                  }`}
                />
              </InputWrapper>

              {/* Nueva contraseña */}
              <InputWrapper label="Nueva contraseña" htmlFor="newPassword" error={errors.newPassword}>
                <input
                  id="newPassword"
                  type="password"
                  {...register("newPassword", {
                    required: "La nueva contraseña es requerida",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                    maxLength: { value: 20, message: "Máximo 20 caracteres" },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: "Debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial",
                    },
                  })}
                  placeholder="Nueva contraseña"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                    errors.newPassword ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                  }`}
                />
              </InputWrapper>

              {/* Confirmar contraseña */}
              <InputWrapper label="Confirmar contraseña" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", {
                    required: "Confirma tu nueva contraseña",
                  })}
                  placeholder="Confirma tu nueva contraseña"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                    errors.confirmPassword ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
                  }`}
                />
              </InputWrapper>

              <button
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900 px-4 py-3.5 text-white font-semibold shadow-lg transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.07]"
                type="submit"
                disabled={isSubmitting}
              >
                <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-black/20 to-transparent transition duration-300 group-hover:translate-y-0" />
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon name="spinner" className="w-5 h-5 animate-spin" />
                    Cambiando contraseña…
                  </span>
                ) : (
                  "Cambiar contraseña"
                )}
              </button>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSentToEmail("");
                    clearErrors();
                    reset();
                  }}
                  className="w-full text-gray-700 text-sm font-medium hover:underline"
                >
                  ¿No recibiste el PIN? Intentar con otro email
                </button>
                
                <Link
                  to="/login"
                  className="block text-center text-gray-800 text-sm font-medium hover:underline"
                >
                  Volver al login
                </Link>
              </div>

              {Object.keys(errors).length > 0 && (
                <div id="form-errors" aria-live="polite" className="sr-only">
                  Hay errores en el formulario. Revisa los mensajes en rojo.
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RecoverPassword;
