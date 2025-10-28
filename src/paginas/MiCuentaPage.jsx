import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import UserProfile from '../components/UserProfile/UserProfile';
import { userAPI } from '../services/api';

export default function MiCuentaPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [departamento, setDepartamento] = useState(null);
  const [loadingDepartamento, setLoadingDepartamento] = useState(false);
  
  // Estado inicial del usuario - normalmente vendría de un contexto de autenticación
  const [usuario, setUsuario] = useState({
    id: 4, // Este ID debería venir del token/sesión actual
    nombre: "Luis",
    apellido: "Torrez", 
    email: "gmamaniv@fcpn.edu.bo",
    rol: "Residente",
    telefono: "70000000",
    avatar: ""
  });
  
  const [formData, setFormData] = useState({
    nombres: usuario.nombre,
    apellidos: usuario.apellido,
    telefono: usuario.telefono,
    name: `${usuario.nombre} ${usuario.apellido}`
  });

  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  const fetchUserData = useCallback(async () => {
    try {
      // Obtener el usuario actual desde las cookies
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        setMessage({ type: 'error', text: 'No hay sesión activa' });
        navigate('/login');
        return;
      }
      
      const loggedUser = JSON.parse(userCookie);
      const userId = loggedUser.id;
      
      console.log('Cargando datos del usuario:', userId, loggedUser);
      
      const response = await fetch(`http://localhost:8000/api/users/${userId}/profile`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          const user = data.data.user;
          const persona = user.persona;
          
          const updatedUser = {
            id: user.id,
            nombre: persona.nombres || user.name.split(' ')[0],
            apellido: persona.apellidos || user.name.split(' ').slice(1).join(' '),
            email: user.email,
            rol: user.rol,
            telefono: persona.telefono || "70000000",
            avatar: ""
          };
          
          setUsuario(updatedUser);
          
          // Actualizar formData con los datos cargados
          setFormData({
            nombres: updatedUser.nombre,
            apellidos: updatedUser.apellido,
            telefono: updatedUser.telefono,
            name: `${updatedUser.nombre} ${updatedUser.apellido}`
          });

          // Si el usuario es residente, cargar su departamento
          if (user.rol === 'Residente') {
            setLoadingDepartamento(true);
            try {
              const deptResponse = await userAPI.getMiDepartamento(userId);
              if (deptResponse.success && deptResponse.data.departamento) {
                setDepartamento(deptResponse.data.departamento);
              }
            } catch (deptError) {
              console.error('Error cargando departamento:', deptError);
              setMessage({ type: 'error', text: 'No se pudo cargar la información del departamento' });
            } finally {
              setLoadingDepartamento(false);
            }
          }
        }
      } else {
        console.error('Error al cargar datos del usuario:', response.statusText);
        setMessage({ type: 'error', text: 'Error al cargar los datos del perfil' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error de conexión al cargar el perfil' });
    }
  }, [navigate]);

  useEffect(() => {
    // Obtener datos del usuario actual desde el backend
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Obtener el usuario actual desde las cookies
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        setMessage({ type: 'error', text: 'No hay sesión activa' });
        return;
      }
      
      const loggedUser = JSON.parse(userCookie);
      const userId = loggedUser.id;
      
      // Construir el payload asegurando que name se actualice correctamente
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        name: `${formData.nombres} ${formData.apellidos}` // Actualizar el campo name en la tabla users
      };

      console.log('Actualizando usuario:', userId, 'con payload:', payload); // Para debug

      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Aquí se debería incluir el token de autorización
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
        setEditing(false);
        
        // Recargar los datos desde la base de datos para confirmar la actualización
        await fetchUserData();
        
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al actualizar perfil' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      nombres: usuario.nombre,
      apellidos: usuario.apellido,
      telefono: usuario.telefono,
      name: `${usuario.nombre} ${usuario.apellido}`
    });
    setEditing(false);
    setMessage(null);
  };

  return (
    <div className={`min-h-screen ${tone("bg-slate-50", "bg-slate-900")} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${tone("bg-white/90 border-slate-200", "bg-slate-800/90 border-slate-700/60")} backdrop-blur-md`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg ${tone("hover:bg-slate-100", "hover:bg-slate-700/50")} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-xl font-bold ${tone("text-slate-900", "text-white")}`}>Mi Cuenta</h1>
              <p className={`text-sm ${tone("text-slate-600", "text-slate-400")}`}>Gestiona tu información personal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg ${tone("hover:bg-slate-100", "hover:bg-slate-700/50")} transition-colors`}
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <UserProfile usuarioActual={usuario} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Card de Perfil */}
        <div className={`rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${tone("text-slate-900", "text-white")}`}>
                Información Personal
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>
              )}
            </div>

            {/* Avatar y datos básicos */}
            <div className="flex items-start space-x-6 mb-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {usuario.avatar ? (
                  <img src={usuario.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-600 to-violet-600 text-white text-xl font-bold flex items-center justify-center">
                    {usuario.nombre?.charAt(0)}{usuario.apellido?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Información básica */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombres */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${tone("text-slate-700", "text-slate-300")}`}>
                      Nombres
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${tone(
                          "border-slate-300 bg-white text-slate-900 focus:border-blue-500", 
                          "border-slate-600 bg-slate-700 text-white focus:border-blue-400"
                        )} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    ) : (
                      <p className={`py-2 ${tone("text-slate-900", "text-white")}`}>
                        {usuario.nombre}
                      </p>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${tone("text-slate-700", "text-slate-300")}`}>
                      Apellidos
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${tone(
                          "border-slate-300 bg-white text-slate-900 focus:border-blue-500", 
                          "border-slate-600 bg-slate-700 text-white focus:border-blue-400"
                        )} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    ) : (
                      <p className={`py-2 ${tone("text-slate-900", "text-white")}`}>
                        {usuario.apellido}
                      </p>
                    )}
                  </div>

                  {/* Email (no editable) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${tone("text-slate-700", "text-slate-300")}`}>
                      Correo Electrónico
                    </label>
                    <p className={`py-2 ${tone("text-slate-600", "text-slate-400")}`}>
                      {usuario.email}
                    </p>
                    <small className={`${tone("text-slate-500", "text-slate-500")}`}>
                      El email no puede ser modificado
                    </small>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${tone("text-slate-700", "text-slate-300")}`}>
                      Teléfono
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${tone(
                          "border-slate-300 bg-white text-slate-900 focus:border-blue-500", 
                          "border-slate-600 bg-slate-700 text-white focus:border-blue-400"
                        )} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    ) : (
                      <p className={`py-2 ${tone("text-slate-900", "text-white")}`}>
                        {usuario.telefono}
                      </p>
                    )}
                  </div>

                  {/* Rol (no editable) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${tone("text-slate-700", "text-slate-300")}`}>
                      Rol
                    </label>
                    <p className={`py-2 ${tone("text-slate-600", "text-slate-400")}`}>
                      {usuario.rol}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            {editing && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg border ${tone(
                    "border-slate-300 text-slate-700 hover:bg-slate-50", 
                    "border-slate-600 text-slate-300 hover:bg-slate-700"
                  )} transition-colors disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card de Información del Departamento - Solo para residentes */}
        {usuario.rol === 'Residente' && (
          <div className={`mt-6 rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")}`}>
            <div className="p-6">
              <h2 className={`text-lg font-semibold mb-6 ${tone("text-slate-900", "text-white")}`}>
                Mi Departamento
              </h2>

              {loadingDepartamento ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={`ml-3 ${tone("text-slate-600", "text-slate-400")}`}>
                    Cargando información del departamento...
                  </span>
                </div>
              ) : departamento ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Número de Departamento */}
                  <div className={`p-4 rounded-lg ${tone("bg-blue-50", "bg-blue-900/20")}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tone("bg-blue-100", "bg-blue-800/40")}`}>
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${tone("text-slate-600", "text-slate-400")}`}>
                          Departamento
                        </p>
                        <p className={`text-xl font-bold ${tone("text-slate-900", "text-white")}`}>
                          {departamento.nro_depa}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Habitaciones */}
                  <div className={`p-4 rounded-lg ${tone("bg-purple-50", "bg-purple-900/20")}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tone("bg-purple-100", "bg-purple-800/40")}`}>
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${tone("text-slate-600", "text-slate-400")}`}>
                          Habitaciones
                        </p>
                        <p className={`text-xl font-bold ${tone("text-slate-900", "text-white")}`}>
                          {departamento.habitaciones}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className={`p-4 rounded-lg ${tone("bg-green-50", "bg-green-900/20")}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tone("bg-green-100", "bg-green-800/40")}`}>
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${tone("text-slate-600", "text-slate-400")}`}>
                          Estado
                        </p>
                        <p className={`text-xl font-bold ${tone("text-slate-900", "text-white")}`}>
                          {departamento.estado}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ID Contrato */}
                  <div className={`p-4 rounded-lg ${tone("bg-amber-50", "bg-amber-900/20")}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tone("bg-amber-100", "bg-amber-800/40")}`}>
                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${tone("text-slate-600", "text-slate-400")}`}>
                          ID Contrato
                        </p>
                        <p className={`text-xl font-bold ${tone("text-slate-900", "text-white")}`}>
                          {departamento.id_contrato || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${tone("text-slate-600", "text-slate-400")}`}>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p>No se encontró información del departamento asociado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}