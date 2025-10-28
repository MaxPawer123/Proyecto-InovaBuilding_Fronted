import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";

// Componentes estables para evitar re-renders
const Input = ({ label, error, register, dark, ...props }) => {
  const tone = (clsLight, clsDark) => dark ? clsDark : clsLight;
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone("text-slate-600", "text-slate-300")}`}>{label}</span>
      <input 
        {...props} 
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error 
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400" 
            : tone("border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`} 
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </label>
  );
};

const Select = ({ label, error, register, dark, children, ...props }) => {
  const tone = (clsLight, clsDark) => dark ? clsDark : clsLight;
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone("text-slate-600", "text-slate-300")}`}>{label}</span>
      <select 
        {...props} 
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error 
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400" 
            : tone("border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      >
        {children}
      </select>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </label>
  );
};

export default function GestionDeUsuariosPage() {
  // THEME (igual que el dashboard)
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // Usuarios cargados desde la API
  const [usuarios, setUsuarios] = useState([]);
  
  // Departamentos disponibles
  const [departamentos, setDepartamentos] = useState([]);

  // Cargar usuarios reales desde backend cuando se monta el componente
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('http://localhost:8000/api/users');
        if (!res.ok) {
          console.error('Error cargando usuarios:', res.status);
          return;
        }
        const payload = await res.json();
        const rows = payload?.data?.users || [];

        const mapped = rows.map(u => ({
          id: u.id || u.user_id || u.id_usuario,
          name: u.name || `${(u.nombre || u.nombres || '')} ${(u.apellido || u.apellidos || '')}`.trim() || u.username || u.email,
          email: u.email,
          estado: (typeof u.activo !== 'undefined') ? (u.activo ? 'activo' : 'inactivo') : (u.estado || 'activo'),
          rol: u.rol || 'Residente',
          id_persona: u.id_persona || (u.persona && u.persona.id_persona) || null,
          persona: {
            id_persona: (u.persona && u.persona.id_persona) || u.id_persona || null,
            nombres: u.nombre || u.nombres || (u.persona && u.persona.nombres) || '',
            apellidos: u.apellido || u.apellidos || (u.persona && u.persona.apellidos) || '',
            telefono: u.telefono || (u.persona && u.persona.telefono) || ''
          },
          created_at: u.created_at || u.createdAt || new Date().toISOString()
        }));

        setUsuarios(mapped);
        if (mapped.length > 0) setSelected(mapped[0]);
      } catch (err) {
        console.error('Excepción cargando usuarios:', err);
      }
    }

    fetchUsers();
  }, []);

  // Cargar departamentos disponibles
  useEffect(() => {
    async function fetchDepartamentos() {
      try {
        console.log('🏢 Cargando departamentos...');
        
        // Importar Cookies para obtener el token
        const Cookies = (await import('js-cookie')).default;
        const token = Cookies.get('token');
        
        console.log('🔑 Token presente:', !!token);
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Agregar Authorization header si hay token
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch('http://localhost:8000/api/users/departamentos', {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        });
        
        console.log('📡 Response status:', res.status);
        
        if (!res.ok) {
          console.error('❌ Error cargando departamentos:', res.status);
          return;
        }
        
        const payload = await res.json();
        console.log('📦 Payload recibido:', payload);
        
        const deptos = payload?.data?.departamentos || [];
        console.log('🏠 Departamentos procesados:', deptos);
        
        setDepartamentos(deptos);
        console.log(`✅ ${deptos.length} departamentos cargados`);
      } catch (err) {
        console.error('❌ Excepción cargando departamentos:', err);
      }
    }
    fetchDepartamentos();
  }, []);

  // Estados UI
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // usuario en edición
  const [toDelete, setToDelete] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCreating, setIsCreating] = useState(false); // Estado de loading para crear usuario
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset: resetForm,
    setError,
    watch
  } = useForm({ 
    mode: "onChange",
    defaultValues: {
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      password: "",
      rol: "Residente",
      // Campos de empleado
      cargo: "",
      sueldo: "",
      turno: "",
      // Campos de residente
      relacion_titular: "",
      fecha_inicio_residencia: "",
      es_encargado: false,
      id_departamento: ""
    }
  });

  // Observar cambios en el campo "rol"
  const watchRol = watch("rol");

  // Derivados
  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = usuarios;
    const rows = term
      ? base.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.persona?.telefono || "").toLowerCase().includes(term)
        )
      : base;
    return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [q, usuarios]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageRows = filtrados.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [q]);

  // Layout constants (mismo que dashboard)
  const edificioName = "InovaBuilding"; // único
  const usuarioActual = { nombre: "Admin", apellido: "Edificio", email: "admin@edificio.com", rol: "Administrador", avatar: "" };

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS UI
  // ────────────────────────────────────────────────────────────────────────────
  function Card({ children, className = "" }) {
    return (
      <div className={`rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")} ${className}`}>{children}</div>
    );
  }
  function Badge({ children, toneName = "slate" }) {
    const map = {
      slate: tone("bg-slate-100 text-slate-700", "bg-slate-700 text-slate-200"),
      green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>;
  }


  function registrarActividad(accion, usuario, detalle = "") {
    const nuevaActividad = {
      id: Date.now(),
      accion,
      detalle,
      usuario,
      fecha: new Date().toLocaleDateString('es-ES')
    };
    setActividades(prev => [nuevaActividad, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CRUD ACTIONS (mock). Reemplaza con fetch a tu API
  // ────────────────────────────────────────────────────────────────────────────
  async function crearUsuario(payload) {
    setIsCreating(true);
    try {
      // Preparar el cuerpo de la solicitud
      const requestBody = {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        email: payload.email,
        telefono: payload.telefono,
        password: payload.password,
        rol: payload.rol
      };

      // Agregar campos de empleado si el rol es Empleado
      if (payload.rol === 'Empleado') {
        requestBody.cargo = payload.cargo;
        requestBody.sueldo = payload.sueldo;
        requestBody.turno = payload.turno;
      }

      // Agregar campos de residente si el rol es Residente
      if (payload.rol === 'Residente') {
        requestBody.relacion_titular = payload.relacion_titular;
        requestBody.fecha_inicio_residencia = payload.fecha_inicio_residencia;
        requestBody.es_encargado = payload.es_encargado || false;
        requestBody.id_departamento = payload.id_departamento;
      }

      // Llamar al backend para crear el usuario
      const response = await fetch('http://localhost:8000/api/auth/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error creando usuario');
      }

      // Si la creación fue exitosa, construir el usuario definitivo desde la respuesta
      const nuevoUsuario = {
        id: result.data.id,
        name: result.data.name,
        email: result.data.email,
        estado: "activo",
        rol: result.data.rol,
        id_persona: result.data.persona?.id_persona || Date.now(),
        persona: {
          id_persona: result.data.persona?.id_persona || Date.now(),
          nombres: result.data.persona?.nombres || payload.nombres,
          apellidos: result.data.persona?.apellidos || payload.apellidos,
          telefono: result.data.persona?.telefono || payload.telefono || ""
        },
        created_at: result.data.created_at || new Date().toISOString(),
      };

      // Reemplazar el usuario temporal (si existe) o añadirlo al inicio
      setUsuarios((prev) => {
        // Si ya existe un placeholder con misma email, reemplazarlo
        const idx = prev.findIndex(u => u.email === nuevoUsuario.email);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = nuevoUsuario;
          return copy;
        }
        return [nuevoUsuario, ...prev];
      });

      setSelected(nuevoUsuario);

      // Registrar actividad (si el backend indicó que no se envió PIN, usar mensaje de bienvenida)
      const actividadDetalle = result.sentWelcome ? `Bienvenida enviada` : (result.verificationPIN ? `PIN enviado` : '');
      registrarActividad("Se creó usuario", nuevoUsuario.name, `${nuevoUsuario.rol} ${actividadDetalle}`);

      // Mostrar mensaje de éxito con PIN en desarrollo o con nota de bienvenida
      const pinInfo = result.verificationPIN ? `\n\n🔢 PIN (desarrollo): ${result.verificationPIN}` : '';
      const welcomeInfo = result.sentWelcome ? `\n\n📧 Se envió un correo de bienvenida.` : '';
      alert(`✅ ${result.message}\n\n📧 Email: ${result.data.email}${pinInfo}${welcomeInfo}`);

    } catch (error) {
      console.error('Error creando usuario:', error);
      // No mostrar alert aquí - se maneja en submitForm
      throw error; // Re-throw para que el formulario maneje el error
    } finally {
      setIsCreating(false);
    }
  }
  function editarUsuario(id, payload) {
    const usuario = usuarios.find(u => u.id === id);
    const nombreCompleto = `${payload.nombres} ${payload.apellidos}`.trim();
    
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, name: nombreCompleto, email: payload.email, rol: payload.rol, persona: { ...u.persona, nombres: payload.nombres, apellidos: payload.apellidos, telefono: payload.telefono } } : u)));
    
    // Registrar actividad
    if (usuario && usuario.rol !== payload.rol) {
      registrarActividad("Se asignó", nombreCompleto, payload.rol);
    } else {
      registrarActividad("Se editó usuario", nombreCompleto, "");
    }
  }
  function eliminarUsuario(id) { 
    const usuario = usuarios.find(u => u.id === id);
    setUsuarios((prev) => prev.filter((u) => u.id !== id)); 
    if (selected?.id === id) setSelected(null);
    
    // Registrar actividad
    if (usuario) {
      registrarActividad("Se eliminó usuario", usuario.name, "");
    }
  }
  function asignarRol(id, rol) { setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, rol } : u))); if (selected?.id === id) setSelected((s) => ({ ...s, rol })); }

  // Handlers form con react-hook-form
  function openCreate() { 
    setEditing(null); 
    resetForm({
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      password: "",
      rol: "Residente"
    });
    setShowModal(true); 
  }
  
  function openEdit(u) {
    setEditing(u);
    resetForm({
      nombres: u.persona?.nombres || "",
      apellidos: u.persona?.apellidos || "",
      email: u.email || "",
      telefono: u.persona?.telefono || "",
      password: "",
      rol: u.rol || "Residente"
    });
    setShowModal(true);
  }
  
  const submitForm = async (data) => {
    try {
      if (editing) { 
        editarUsuario(editing.id, data); 
      } else { 
        // Crear un placeholder optimista para que aparezca inmediatamente en la UI
        const tempId = `temp-${Date.now()}`;
        const placeholder = {
          id: tempId,
          name: `${data.nombres} ${data.apellidos}`.trim(),
          email: data.email,
          estado: "activo",
          rol: data.rol || "Residente",
          id_persona: Date.now(),
          persona: { id_persona: Date.now(), nombres: data.nombres, apellidos: data.apellidos, telefono: data.telefono || "" },
          created_at: new Date().toISOString()
        };
        setUsuarios((prev) => [placeholder, ...prev]);
        setSelected(placeholder);

        try {
          await crearUsuario(data);
        } catch (err) {
          // Si falla, eliminar el placeholder y mostrar error específico
          setUsuarios((prev) => prev.filter(u => u.id !== tempId));
          setSelected(null);
          
          // Manejar errores específicos del backend
          if (err.message.includes('email ya está registrado')) {
            setError('email', { 
              type: 'manual', 
              message: 'Este email ya está registrado en el sistema' 
            });
          } else if (err.message.includes('teléfono')) {
            setError('telefono', { 
              type: 'manual', 
              message: 'Error con el número de teléfono' 
            });
          } else {
            // Error genérico - mostrar en el formulario
            alert(`❌ Error: ${err.message}`);
          }
          
          // No cerrar el modal para que el usuario pueda corregir
          return;
        }
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    }
  };

  // Resumen derecho
  const totalAdmins = usuarios.filter((u) => u.rol === "Administrador").length;
  const totalEmpleados = usuarios.filter((u) => u.rol === "Empleado").length;
  const totalRes = usuarios.filter((u) => u.rol === "Residente").length;

  // Función de cierre de sesión
  const handleLogout = () => {
    // Aquí implementarás la lógica real de cierre de sesión
    console.log("Cerrando sesión desde Gestión de Usuarios...");
    // Ejemplo: localStorage.removeItem('authToken');
    // Ejemplo: navigate('/login');
    alert("Funcionalidad de cierre de sesión - implementar con backend o descomentar el cometario en UserProfile.jsx");
  };

  // ────────────────────────────────────────────────────────────────────────────
  // UI (con layout igual al dashboard)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          {/* Sidebar Component */}
          <Sidebar 
            dark={dark} 
            edificioName={edificioName} 
            totalDepartamentos={usuarios.length}
            currentPage="gestionDeUsuarios"
          />

          {/* Main */}
          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">👤</span>
                    <span className="font-medium">Gestión de usuarios</span>
                  </div>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (nombre, correo, teléfono)" className={`w-full sm:flex-1 rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
                  <button onClick={() => setDark((d) => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                  {/* Componente de perfil de usuario */}
                  <UserProfile 
                    dark={dark}
                    usuarioActual={usuarioActual}
                    edificioName={edificioName}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </header>

            {/* Content reorganizado */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
              
              {/* FILA 1: Cards Usuarios y Resumen lado a lado */}
              <section className="grid gap-6 lg:grid-cols-2">
                {/* Card Usuarios */}
                <Card>
                  <div className="p-4">
                    <div className={`text-xs uppercase tracking-widest ${tone("text-slate-500", "text-slate-400")}`}>Usuarios</div>
                    <div className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{usuarios.length}</div>
                    <div className="mt-2 text-xs">Total registrados</div>
                  </div>
                </Card>

                {/* Card Resumen */}
                <Card>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Resumen</h3>
                      <div className="text-xs opacity-70">{filtrados.length} resultados</div>
                    </div>
                    <ul className="grid grid-cols-3 gap-3 text-sm">
                      <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}>
                        <div className="text-xs opacity-70">Administradores</div>
                        <div className="text-xl font-semibold">{totalAdmins}</div>
                      </li>
                      <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}>
                        <div className="text-xs opacity-70">Empleados</div>
                        <div className="text-xl font-semibold">{totalEmpleados}</div>
                      </li>
                      <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}>
                        <div className="text-xs opacity-70">Residentes</div>
                        <div className="text-xl font-semibold">{totalRes}</div>
                      </li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* FILA 2: Tabla de usuarios (ancho completo) */}
              <Card>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Usuarios del sistema</h3>
                    <div className="ms-auto flex items-center gap-2">
                      <button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow hover:opacity-95">+ Nuevo usuario</button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                          <th className="px-4 py-4">Nombre</th>
                          <th className="px-4 py-4">Correo</th>
                          <th className="px-4 py-4">Teléfono</th>
                          <th className="px-4 py-4">Rol</th>
                          <th className="px-4 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((u) => (
                          <tr key={u.id} className={`border-b ${tone("border-slate-100", "border-slate-700/40")} cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`} onClick={() => setSelected(u)}>
                            <td className="px-4 py-4 font-medium">{u.name}</td>
                            <td className="px-4 py-4">{u.email}</td>
                            <td className="px-4 py-4">{u.persona?.telefono || "-"}</td>
                            <td className="px-4 py-4">
                              <Badge toneName={u.rol === "Administrador" ? "violet" : "blue"}>{u.rol}</Badge>
                            </td>
                            <td className="px-4 py-4 text-right space-x-2">
                              <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className={`rounded-lg px-4 py-2 text-xs ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>Editar</button>
                              <button onClick={(e) => { e.stopPropagation(); setToDelete(u); }} className="rounded-lg bg-red-600/90 px-4 py-2 text-xs font-medium text-white hover:bg-red-600">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                        {pageRows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm opacity-70">Sin resultados</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="opacity-70">Página {page} de {totalPages}</div>
                    <div className="space-x-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`rounded-xl px-3 py-2 ${tone("border border-slate-200 bg-white", "border border-slate-700/60 bg-slate-800")} disabled:opacity-40`}>Anterior</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`rounded-xl px-3 py-2 ${tone("border border-slate-200 bg-white", "border border-slate-700/60 bg-slate-800")} disabled:opacity-40`}>Siguiente</button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* FILA 3: Detalle y Actividad lado a lado */}
              <section className="grid gap-6 lg:grid-cols-2">
                {/* Card Detalle */}
                <Card>
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">Detalle</h3>
                    </div>
                    {selected ? (
                      <div className="text-sm space-y-2">
                        <div className="font-medium">Nombre: {selected.name}</div>
                        <div className="">Correo: {selected.email}</div>
                        <div className="">Tel: {selected.persona?.telefono || "-"}</div>
                        <div className="">Rol: {selected.rol}</div>

                        <div className="pt-2 flex gap-2">
                          <button onClick={() => openEdit(selected)} className={`rounded-lg px-3 py-2 text-xs ${tone("border border-slate-200 bg-white", "border border-slate-700/60 bg-slate-800")}`}>Editar</button>
                          <button onClick={() => setToDelete(selected)} className="rounded-lg bg-red-600/90 px-3 py-2 text-xs font-medium text-white hover:bg-red-600">Eliminar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm opacity-70">Selecciona un usuario en la tabla para ver el detalle.</div>
                    )}
                  </div>
                </Card>

                {/* Card Actividad reciente
                <Card>
                  <div className="p-4">
                    <div className="mb-2 text-lg font-semibold">Actividad reciente</div>
                    <ul className="space-y-3 text-sm">
                      {actividades.slice(0, 3).map((actividad) => (
                        <li key={actividad.id} className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}>
                          {actividad.accion} {actividad.detalle && <><b>{actividad.detalle}</b> a </>}<b>{actividad.usuario}</b> — {actividad.fecha}
                        </li>
                      ))}
                      {actividades.length === 0 && (
                        <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")} opacity-70`}>
                          No hay actividades recientes
                        </li>
                      )}
                    </ul>
                  </div>
                </Card> */}
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-lg rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">{editing ? "Editar usuario" : "Nuevo usuario"}</h4>
              <button onClick={() => setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200", "border border-slate-600")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(submitForm)} className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input 
                  label="Nombres" 
                  register={register("nombres", {
                    required: "Los nombres son requeridos",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    maxLength: { value: 50, message: "Máximo 50 caracteres" },
                    pattern: {
                      value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                      message: "Solo se permiten letras y espacios"
                    }
                  })}
                  error={errors.nombres}
                  dark={dark} 
                />
                <Input 
                  label="Apellidos" 
                  register={register("apellidos", {
                    required: "Los apellidos son requeridos",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    maxLength: { value: 50, message: "Máximo 50 caracteres" },
                    pattern: {
                      value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                      message: "Solo se permiten letras y espacios"
                    }
                  })}
                  error={errors.apellidos}
                  dark={dark} 
                />
                <Input 
                  label="Correo" 
                  type="email" 
                  register={register("email", {
                    required: "El correo electrónico es requerido",
                    pattern: {
                      value: /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/,
                      message: "Correo electrónico inválido"
                    },
                    minLength: { value: 5, message: "Mínimo 5 caracteres" },
                    maxLength: { value: 100, message: "Máximo 100 caracteres" }
                  })}
                  error={errors.email}
                  dark={dark} 
                />
                <Input 
                  label="Teléfono" 
                  register={register("telefono", {
                    pattern: {
                      value: /^[0-9+\-\s()]*$/,
                      message: "Formato de teléfono inválido"
                    },
                    minLength: { value: 7, message: "Mínimo 7 dígitos" },
                    maxLength: { value: 20, message: "Máximo 20 caracteres" }
                  })}
                  error={errors.telefono}
                  dark={dark} 
                />
                {!editing && (
                  <Input 
                    label="Contraseña" 
                    type="password" 
                    register={register("password", {
                      required: "La contraseña es obligatoria",
                      minLength: { value: 6, message: "Mínimo 6 caracteres" },
                      maxLength: { value: 20, message: "Máximo 20 caracteres" },
                      validate: {
                        hasLower: (v) => /[a-z]/.test(v) || "Debe contener al menos una minúscula",
                        hasUpper: (v) => /[A-Z]/.test(v) || "Debe contener al menos una mayúscula",
                        hasNumber: (v) => /[0-9]/.test(v) || "Debe contener al menos un número",
                        hasSpecial: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(v) || "Debe contener al menos un carácter especial"
                      }
                    })}
                    error={errors.password}
                    dark={dark} 
                  />
                )}
                <Select 
                  label="Rol" 
                  register={register("rol", {
                    required: "El rol es requerido"
                  })}
                  error={errors.rol}
                  dark={dark}
                >
                  <option value="Residente">Residente</option>
                  <option value="Empleado">Empleado</option>
                  <option value="Administrador">Administrador</option>
                </Select>
              </div>

              {/* Campos adicionales para Empleado */}
              {watchRol === "Empleado" && (
                <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3 mt-3">
                  <h5 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Información de Empleado</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input 
                      label="Cargo" 
                      register={register("cargo", {
                        required: watchRol === "Empleado" ? "El cargo es requerido" : false,
                        minLength: { value: 2, message: "Mínimo 2 caracteres" },
                        maxLength: { value: 100, message: "Máximo 100 caracteres" }
                      })}
                      error={errors.cargo}
                      dark={dark} 
                    />
                    <Input 
                      label="Sueldo" 
                      type="number"
                      step="0.01"
                      register={register("sueldo", {
                        required: watchRol === "Empleado" ? "El sueldo es requerido" : false,
                        min: { value: 0, message: "El sueldo debe ser mayor a 0" },
                        max: { value: 999999.99, message: "Sueldo máximo excedido" }
                      })}
                      error={errors.sueldo}
                      dark={dark} 
                    />
                    <Select 
                      label="Turno" 
                      register={register("turno", {
                        required: watchRol === "Empleado" ? "El turno es requerido" : false
                      })}
                      error={errors.turno}
                      dark={dark}
                    >
                      <option value="">Seleccionar turno</option>
                      <option value="mañana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                      <option value="rotativo">Rotativo</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* Campos adicionales para Residente */}
              {watchRol === "Residente" && (
                <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3 mt-3">
                  <h5 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Información de Residente</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input 
                      label="Relación con Titular" 
                      register={register("relacion_titular", {
                        required: watchRol === "Residente" ? "La relación con el titular es requerida" : false,
                        minLength: { value: 2, message: "Mínimo 2 caracteres" },
                        maxLength: { value: 255, message: "Máximo 255 caracteres" }
                      })}
                      error={errors.relacion_titular}
                      dark={dark}
                      placeholder="Ej: Titular, Cónyuge, Hijo/a, etc."
                    />
                    <Input 
                      label="Fecha de Inicio" 
                      type="date"
                      register={register("fecha_inicio_residencia", {
                        required: watchRol === "Residente" ? "La fecha de inicio es requerida" : false
                      })}
                      error={errors.fecha_inicio_residencia}
                      dark={dark} 
                    />
                    <Select label="Departamento" dark={dark} register={register("id_departamento", { required: "Requerido" })} error={errors.id_departamento}>
                {departamentos.map((d)=> <option key={d.id_departamento} value={d.id_departamento}>{d.nro_depa}</option>)}
              </Select>
                   
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border border-slate-700/60 bg-slate-800")}`}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-50" 
                  disabled={isSubmitting || isCreating}
                >
                  {(isSubmitting || isCreating)
                    ? (editing ? "Guardando..." : "Creando usuario...") 
                    : editing 
                      ? "Guardar cambios" 
                      : "Crear usuario"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación */}
      {toDelete && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-md rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/60"><h4 className="text-lg font-semibold">Eliminar usuario</h4></div>
            <div className="p-4 text-sm">¿Seguro que deseas eliminar a <b>{toDelete.name}</b>? Esta acción no se puede deshacer.</div>
            <div className="px-4 pb-4 flex justify-end gap-2">
              <button onClick={() => setToDelete(null)} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
              <button onClick={() => { eliminarUsuario(toDelete.id); setToDelete(null); }} className="rounded-xl bg-red-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// End.
