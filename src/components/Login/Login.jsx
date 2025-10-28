/* eslint-disable no-unused-vars */
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { useRef, useEffect, useState } from "react";

const InputWrapper = ({ label, htmlFor, error, children }) => (
  <div className="space-y-2">
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {label}
    </label>
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
  if (name === "lock")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 0 1 6 0v3Z"
        />
      </svg>
    );
  if (name === "refresh")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12 6V3L8 7l4 4V8a4 4 0 1 1-3.998 4.5h-2.01A6.002 6.002 0 0 0 18 12a6 6 0 0 0-6-6Z"
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

const Login = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm({ mode: "onChange" });

  // Generar CAPTCHA aleatorio
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(code);
    return code;
  };

  // Dibujar CAPTCHA en canvas (mejor estética y legibilidad)
  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;

    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#38bdf8");
    gradient.addColorStop(1, "#0ea5e9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Patrón sutil
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 10 + 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Texto del captcha con ligera rotación por carácter
    const letterSpacing = width / (text.length + 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    for (let i = 0; i < text.length; i++) {
      const x = letterSpacing * (i + 1);
      const y = height / 2;
      const angle = (Math.random() - 0.5) * 0.4; // +- ~23°
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 2;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Líneas de ruido sutiles
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.strokeStyle = "#ffffff66";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };

  // Refrescar Captcha
  const refreshCaptcha = () => {
    const newCaptcha = generateCaptcha();
    drawCaptcha(newCaptcha);
    setCaptchaInput("");
    clearErrors("captcha");
  };

  useEffect(() => {
    // Configurar lienzo (retina) una sola vez
    const canvas = canvasRef.current;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const logicalW = 160, logicalH = 48;
    canvas.style.width = logicalW + "px";
    canvas.style.height = logicalH + "px";
    canvas.width = logicalW * ratio;
    canvas.height = logicalH * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Generar y dibujar solo una vez para evitar desincronización
    refreshCaptcha();
  }, []);

  const onSubmit = async (data) => {
    // Validar captcha antes de enviar
    if (captchaInput.replace(/\s/g, '').toUpperCase() !== captcha.toUpperCase()) {
      setError("captcha", { type: "manual", message: "El CAPTCHA no coincide" });
      return;
    }

    try {
      // Petición real al backend (sin rol)
      const credentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false
      };

      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        // Verificar si necesita verificación de email
        if (result.requiresEmailVerification) {
          setError("password", { 
            type: "manual", 
            message: `${result.message} Puedes reenviar el email de verificación desde tu perfil.`
          });
          return;
        }
        
        // Mostrar error del backend
        setError("password", { type: "manual", message: result.message });
        return;
      }

      if (result.success) {
        // Determinar tiempo de expiración de cookies
        const cookieExpires = data.rememberMe ? 30 : 1; // 30 días si recordar, 1 día si no
        
        // Guardar token y datos del usuario
        Cookies.set("token", result.data.token, { expires: cookieExpires, sameSite: "Lax" });
        Cookies.set("user", JSON.stringify(result.data.user), { expires: cookieExpires, sameSite: "Lax" });
        
        // Guardar remember token si existe
        if (result.data.rememberToken) {
          Cookies.set("rememberToken", result.data.rememberToken, { expires: 30, sameSite: "Lax" });
        }

        // 🎯 REDIRIGIR SEGÚN ROL DEL USUARIO
        const userRole = result.data.user.rol?.toLowerCase(); // Convertir a minúsculas para comparación
        console.log(`📍 Usuario logueado con rol: ${result.data.user.rol} → ${userRole}`);
        
        if (userRole === 'residente') {
          navigate("/residente");
        } else if (userRole === 'administrador') {
          navigate("/Administrador");
        } else if (userRole === 'empleado') {
          navigate("/empleado"); // Por si tienes empleados
        } else {
          // Fallback si el rol no es reconocido
          console.warn(`⚠️ Rol no reconocido: ${result.data.user.rol}. Redirigiendo a página principal.`);
          navigate("/residente"); // Redirigir a residente por defecto
        }

        reset();
        setCaptchaInput("");
        refreshCaptcha();
      }

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("password", { 
        type: "manual", 
        message: "Error de conexión. Verifica que el servidor esté ejecutándose." 
      });
    }
  };

  return (
    <div className="grid place-items-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        /* Quitado: border, shadow del contenedor */
        className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl p-6 sm:p-6 space-y-5"
        aria-describedby={Object.keys(errors).length ? "form-errors" : undefined}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-gray-600">Accede con tu correo y contraseña.</p>
        </div>

        {/* Email */}
        <InputWrapper label="Correo electrónico" htmlFor="email" error={errors.email}>
          <div className={`relative flex items-center`}>
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
                maxLength: { value: 40, message: "Máximo 40 caracteres" },
              })}
              placeholder="tucorreo@dominio.com"
              autoComplete="email"
              className={`w-full rounded-xl border bg-white px-10 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                errors.email ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
              }`}
            />
          </div>
        </InputWrapper>

        {/* Password */}
        <InputWrapper label="Contraseña" htmlFor="password" error={errors.password}>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400">
              <Icon name="lock" className="w-5 h-5" />
            </span>
            <input
              id="password"
              {...register("password", {
                required: "La contraseña es obligatoria (6 a 20 caracteres)",
                minLength: { value: 6, message: "Mínimo 6 caracteres" },
                maxLength: { value: 20, message: "Máximo 20 caracteres" },
                validate: {
                  hasLower: (v) => /[a-z]/.test(v) || "Debe contener al menos una minúscula",
                  hasUpper: (v) => /[A-Z]/.test(v) || "Debe contener al menos una mayúscula",
                  hasNumber: (v) => /[0-9]/.test(v) || "Debe contener al menos un número",
                  hasSpecial: (v) =>
                    /[!@#$%^&()_+\-=[\]{};':"\\|,.<>\/?~`]/.test(v) ||
                    "Debe contener al menos un carácter especial (@$!%?&)",
                },
              })}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full rounded-xl border bg-white px-10 py-3 text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                errors.password ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 text-xs text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </InputWrapper>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            {...register("rememberMe")}
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            Recordarme por 30 días
          </label>
        </div>

        {/* CAPTCHA */}
        <div className="rounded-2xl border bg-gradient-to-br from-white to-sky-50 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700 font-medium">Verificación de seguridad</p>
            <div className="flex items-center gap-3">
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow border border-white/50"
                aria-label="CAPTCHA"
                role="img"
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[.99] transition"
                title="Actualizar código"
              >
                <Icon name="refresh" className="w-4 h-4" />
                Actualizar
              </button>
            </div>

            <input
              type="text"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (errors.captcha) clearErrors("captcha");
              }}
              placeholder="Ingresa el código CAPTCHA"
              className={`w-full rounded-xl border bg-white px-4 py-3 text-center tracking-widest font-mono text-sm outline-none transition shadow-sm focus:ring-4 focus:ring-sky-200 focus:border-sky-400 ${
                errors.captcha ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-300"
              }`}
              aria-invalid={!!errors.captcha}
            />
            {errors.captcha && (
              <p className="text-red-500 text-xs leading-snug">{errors.captcha.message}</p>
            )}
          </div>
        </div>

        {/* Botón login */}
        <button
          className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900 px-4 py-3.5 text-white font-semibold shadow-lg transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.07]"
          type="submit"
          disabled={isSubmitting}
        >
          <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-black/20 to-transparent transition duration-300 group-hover:translate-y-0" />
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Icon name="spinner" className="w-5 h-5 animate-spin" />
              Procesando…
            </span>
          ) : (
            "Iniciar sesión"
          )}
        </button>

        <div className="text-center">
          <Link
            to="/recuperarPassword"
            className="text-gray-800 text-sm font-medium hover:underline"
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-3">¿No tienes cuenta?</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            Crear nueva cuenta
          </Link>
        </div>

        {Object.keys(errors).length > 0 && (
          <div id="form-errors" aria-live="polite" className="sr-only">
            Hay errores en el formulario. Revisa los mensajes en rojo.
          </div>
        )}
      </form>
    </div> 
  );
};

export default Login;
