import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const VerifyPinPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    if (!email) {
      setError('pin', { type: 'manual', message: 'Email no encontrado. Vuelve a registrarte.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-email-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          pin: data.pin
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError('pin', { type: 'manual', message: result.message });
        return;
      }

      if (result.success) {
        setSuccessMessage('¡Email verificado exitosamente! Redirigiendo al login...');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Verificación completada. Ya puedes iniciar sesión.' 
            } 
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Error verificando PIN:', error);
      setError('pin', { 
        type: 'manual', 
        message: 'Error de conexión. Verifica que el servidor esté funcionando.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendPin = async () => {
    if (!email) {
      alert('Email no encontrado. Vuelve a registrarte.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        alert('PIN reenviado exitosamente. Revisa tu email.');
      } else {
        alert(result.message || 'Error al reenviar PIN');
      }
    } catch (error) {
      console.error('Error reenviando PIN:', error);
      alert('Error de conexión al reenviar PIN');
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-100 via-white to-blue-100">
        <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-6">
              No se encontró el email para verificación.
            </p>
            <Link
              to="/register"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificar Email</h1>
          <p className="text-gray-600">
            Ingresa el código PIN de 6 dígitos que enviamos a:
          </p>
          <p className="font-semibold text-indigo-600 mt-1">{email}</p>
        </div>

        {successMessage ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                Código PIN (6 dígitos)
              </label>
              <input
                id="pin"
                {...register('pin', {
                  required: 'El PIN es requerido',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'El PIN debe tener exactamente 6 dígitos'
                  }
                })}
                type="text"
                maxLength="6"
                placeholder="123456"
                className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${
                  errors.pin 
                    ? 'border-red-400 focus:ring-red-100 focus:border-red-400' 
                    : 'border-gray-300'
                }`}
                autoComplete="off"
                autoFocus
              />
              {errors.pin && (
                <p className="mt-2 text-red-500 text-sm">{errors.pin.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Verificar PIN'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center space-y-4">
          <div className="text-sm text-gray-600">
            ¿No recibiste el código?
          </div>
          
          <button
            type="button"
            onClick={resendPin}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline"
          >
            Reenviar PIN
          </button>

          <div className="pt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-800 text-sm hover:underline"
            >
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPinPage;