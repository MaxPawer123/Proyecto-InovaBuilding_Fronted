import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import Cookies from 'js-cookie'

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm({ mode: "onChange" })

  const [captchaText, setCaptchaText] = useState("")
  const [captchaInput, setCaptchaInput] = useState("")
  const canvasRef = useRef(null)

  // Generar texto aleatorio para el CAPTCHA
  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Dibujar CAPTCHA en el canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fondo degradado celeste
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#38bdf8") // celeste claro
    gradient.addColorStop(1, "#0ea5e9") // celeste oscuro
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Texto
    ctx.font = "24px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let i = 0; i < captchaText.length; i++) {
      const x = 20 + i * 20
      const y = 20 + Math.random() * 8
      const rotation = Math.random() * 0.4 - 0.2

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillText(captchaText[i], 0, 0)
      ctx.restore()
    }

    // Líneas de interferencia
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.strokeStyle = "rgba(255,255,255,0.5)"
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  useEffect(() => {
    setCaptchaText(generateCaptcha())
  }, [])

  useEffect(() => {
    if (captchaText && canvasRef.current) {
      drawCaptcha()
    }
  }, [captchaText])

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha())
    setCaptchaInput("")
    clearErrors("captcha")
  }

  const onSubmit = async (data) => {
    // Validar CAPTCHA
    if (captchaInput.toUpperCase() !== captchaText) {
      setError("captcha", {
        type: "manual",
        message: "El código CAPTCHA es incorrecto",
      })
      return
    }

    try {
      // Preparar datos para el backend (estructura de BD real)
      const userData = {
        name: `${data.nombres} ${data.apellidos}`, // Nombre completo para users.name
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono || ''
      };

      // Petición real al backend
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, rol: data.rol || 'Residente' }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mostrar error del backend
        if (result.message.includes('email')) {
          setError("email", { type: "manual", message: result.message });
        } else if (result.message.includes('contraseña')) {
          setError("password", { type: "manual", message: result.message });
        } else if (result.message.includes('nombres') || result.message.includes('nombre')) {
          setError("nombres", { type: "manual", message: result.message });
        } else {
          setError("email", { type: "manual", message: result.message });
        }
        return;
      }

      if (result.success) {
        // Si requiere verificación: redirigir a verify-pin
        if (result.data.requiresEmailVerification) {
          // Si vino token (empleado), hacemos auto-login
          if (result.data.token) {
            const cookieExpires = 1; // token temporal: 1 día
            Cookies.set('token', result.data.token, { expires: cookieExpires, sameSite: 'Lax' });
            Cookies.set('user', JSON.stringify(result.data.user), { expires: cookieExpires, sameSite: 'Lax' });
            navigate('/empleado');
            return;
          }

          navigate(`/verify-pin?email=${encodeURIComponent(result.data.user.email)}`);
        } else {
          // Registro sin verificación
          alert(`¡Registro exitoso! Bienvenido ${result.data.user.nombres}`);
          // Si backend devolvió token, guardarlo y redirigir según rol
          if (result.data.token) {
            const cookieExpires = 1;
            Cookies.set('token', result.data.token, { expires: cookieExpires, sameSite: 'Lax' });
            Cookies.set('user', JSON.stringify(result.data.user), { expires: cookieExpires, sameSite: 'Lax' });
            const userRole = result.data.user.rol?.toLowerCase();
            if (userRole === 'empleado') {
              navigate('/empleado');
            } else if (userRole === 'administrador') {
              navigate('/Administrador');
            } else {
              navigate('/residente');
            }
            return;
          }

          navigate('/login');
        }

        reset();
        setCaptchaInput("");
        setCaptchaText(generateCaptcha());
      }

    } catch (err) {
      console.error("Error en el registro:", err);
      setError("nombres", { 
        type: "manual", 
        message: "Error de conexión. Verifica que el servidor esté ejecutándose." 
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 flex flex-col gap-4 lg:gap-5 max-w-[500px] mx-auto"
    >
      {/* Nombres */}
      <div>
        <input
          type="text"
          {...register("nombres", {
            required: "Los nombres son requeridos",
            minLength: { value: 2, message: "Mínimo 2 caracteres" },
            maxLength: { value: 50, message: "Máximo 50 caracteres" },
          })}
          autoComplete="given-name"
          placeholder="Nombres"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.nombres
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.nombres && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.nombres.message}
          </p>
        )}
      </div>

      {/* Apellidos */}
      <div>
        <input
          type="text"
          {...register("apellidos", {
            required: "Los apellidos son requeridos",
            minLength: { value: 2, message: "Mínimo 2 caracteres" },
            maxLength: { value: 50, message: "Máximo 50 caracteres" },
          })}
          autoComplete="family-name"
          placeholder="Apellidos"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.apellidos
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.apellidos && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.apellidos.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <input
          {...register("email", {
            required: "El correo electronico es requerido",
            pattern: {
              value:
                /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/,
              message: "Correo electronico invalido",
            },
            minLength: { value: 3, message: "Minimo 3 caracteres" },
            maxLength: { value: 40, message: "Maximo 40 caracteres" },
          })}
          placeholder="Correo electronico"
          autoComplete="email"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.email
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <input
          {...register("password", {
            required: "La contraseña es obligatoria (6 a 20 caracteres)",
            minLength: { value: 6, message: "Minimo 6 caracteres" },
            maxLength: { value: 20, message: "Maximo 20 caracteres" },
            validate: {
              hasLower: (v) =>
                /[a-z]/.test(v) || "Debe contener al menos una minúscula",
              hasUpper: (v) =>
                /[A-Z]/.test(v) || "Debe contener al menos una mayúscula",
              hasNumber: (v) =>
                /[0-9]/.test(v) || "Debe contener al menos un número",
              hasSpecial: (v) =>
                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(v) ||
                "Debe contener al menos un carácter especial (@$!%*?&)",
            },
          })}
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.password
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirmar Contraseña */}
      <div>
        <input
          {...register("confirmPassword", {
            required: "Debes confirmar tu contraseña",
            validate: (value, { password }) =>
              value === password || "Las contraseñas no coinciden",
          })}
          type="password"
          placeholder="Confirmar contraseña"
          autoComplete="new-password"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.confirmPassword
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Teléfono (opcional) */}
      <div>
        <input
          {...register("telefono", {
            pattern: {
              value: /^[0-9+\-\s()]*$/,
              message: "Formato de teléfono inválido",
            },
            minLength: { value: 7, message: "Mínimo 7 dígitos" },
            maxLength: { value: 20, message: "Máximo 20 caracteres" },
          })}
          type="tel"
          placeholder="Teléfono (opcional)"
          autoComplete="tel"
          className={`p-2 outline-2 rounded focus:outline-blue-400 w-full ${
            errors.telefono
              ? "border-red-400 outline-red-400 focus:outline-red-400"
              : ""
          }`}
        />
        {errors.telefono && (
          <p className="text-red-500 text-sm mt-2 ml-2">
            {errors.telefono.message}
          </p>
        )}
      </div>

      {/* CAPTCHA */}
      {/* Rol (Residente o Empleado) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona rol</label>
        <select
          {...register('rol')}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition shadow-sm"
          defaultValue="Residente"
        >
          <option value="Residente">Residente</option>
          <option value="Empleado">Empleado</option>
        </select>
      </div>
      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-700 font-medium">
            Verificación de seguridad
          </p>

          <div className="flex items-center gap-3">
            <canvas
              ref={canvasRef}
              width="140"
              height="40"
              className="rounded-lg shadow bg-transparent"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Actualizar código"
            >
              🔄
            </button>
          </div>

          <input
            type="text"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value)
              if (errors.captcha) clearErrors("captcha")
            }}
            placeholder="Ingresa el código CAPTCHA"
            className={`p-2 rounded-lg border w-full text-center tracking-widest font-mono focus:outline-blue-400 ${
              errors.captcha
                ? "border-red-400 outline-red-400 focus:outline-red-400"
                : ""
            }`}
          />
          {errors.captcha && (
            <p className="text-red-500 text-sm mt-1">
              {errors.captcha.message}
            </p>
          )}
        </div>
      </div>

      {/* Botón */}
      <button
        className="bg-black text-white py-3.5 font-bold mb-4 hover:scale-[1.07] transition-transform cursor-pointer rounded text-[1.2rem]"
        type="submit"
      >
        Registrar
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-gray-600 text-sm mb-3">¿Ya tienes cuenta?</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-200"
        >
          Iniciar sesión
        </Link>
      </div>
    </form>
  )
}

export default Register
