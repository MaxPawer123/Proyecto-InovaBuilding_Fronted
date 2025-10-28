import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfile";
import { authAPI, empleadosAPI, ticketsAPI, notificacionesAPI } from "../services/api";
import { io } from "socket.io-client";
import Cookies from 'js-cookie';

// =============================================================================
// Módulo: Tickets y Mantenimiento — Panel Empleado/Técnico
// Estética: igual a tus páginas (Tailwind + Sidebar/UserProfile)
// Regla: El EMPLEADO atiende SOLO tickets asignados a él. Puede avanzar estado,
//        dejar comentarios públicos o privados, subir adjuntos y marcar horas.
// -----------------------------------------------------------------------------
// Endpoints sugeridos (ajústalos a tu backend):
//   MIS ASIGNACIONES
//    GET   /api/tickets?asignado_a=me&q=&estado=&prioridad=&desde=&hasta=&page=&size=
//    GET   /api/tickets/:id
//    PATCH /api/tickets/:id { estado } // restringir transiciones válidas
//   COMENTARIOS
//    GET   /api/tickets/:id/comentarios
//    POST  /api/tickets/:id/comentarios { comentario, privado } // empleado puede privado
//   ADJUNTOS
//    GET   /api/tickets/:id/adjuntos
//    POST  /api/tickets/:id/adjuntos (multipart) file
//   PARTES DE TRABAJO / TIEMPO (opcional)
//    GET   /api/tickets/:id/partes
//    POST  /api/tickets/:id/partes { horas, descripcion }
// -----------------------------------------------------------------------------
// BD mapeo 1:1 de tu esquema sugerido:
//  - ticket_asignaciones: id_asignacion, id_ticket, id_empleado, ... (la actual la maneja admin)
//  - tickets: id_ticket, codigo, titulo, descripcion, estado, prioridad, id_categoria, fecha_reporte, fecha_compromiso
//  - ticket_comentarios: id_comentario, id_ticket, id_persona, comentario, privado, created_at
//  - ticket_adjuntos: id_adjunto, id_ticket, url, tipo_mime, peso_bytes, subido_por_persona, created_at
//  - ticket_partes_trabajo: id_parte, id_ticket, id_empleado, horas, descripcion, created_at
// =============================================================================

// ------------------------ UI Helpers (reusa estilos) ------------------------
const Input = ({ label, error, register, dark, ...props }) => {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
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
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};

const Textarea = ({ label, error, register, dark, rows = 4, ...props }) => {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone("text-slate-600", "text-slate-300")}`}>{label}</span>
      <textarea
        rows={rows}
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
            : tone("border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};

const Select = ({ label, error, register, dark, children, ...props }) => {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
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
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};

// Componente de Notificaciones
function NotificacionesDropdown({ dark, notificaciones, onMarcarLeida, onCerrar, onVerTicket }) {
  const tone = (a,b)=> (dark?b:a);
  const noLeidas = notificaciones.filter(n => !n.leida).length;
  
  return (
    <div className="absolute right-0 top-full mt-2 w-96 z-50">
      <div className={`rounded-2xl border shadow-2xl ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h4 className="text-base font-semibold">Notificaciones</h4>
            {noLeidas > 0 && (
              <p className="text-xs opacity-60">{noLeidas} nueva{noLeidas > 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ✕
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-sm opacity-60">
              <div className="mb-2 text-2xl">🔔</div>
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {notificaciones.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 transition-colors cursor-pointer ${
                    !notif.leida 
                      ? tone("bg-blue-50 hover:bg-blue-100", "bg-blue-900/20 hover:bg-blue-900/30")
                      : tone("hover:bg-slate-50", "hover:bg-slate-700/30")
                  }`}
                  onClick={() => {
                    onMarcarLeida(notif.id);
                    if (notif.ticket) {
                      onVerTicket(notif.ticket);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      !notif.leida 
                        ? "bg-blue-600 text-white" 
                        : tone("bg-slate-200 text-slate-600", "bg-slate-700 text-slate-300")
                    }`}>
                      🎫
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">Nuevo ticket asignado</p>
                        {!notif.leida && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-sm opacity-80 line-clamp-2">
                        {notif.ticket?.codigo} - {notif.ticket?.titulo}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(notif.fecha).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notificaciones.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700/60">
            <button 
              onClick={() => notificaciones.forEach(n => onMarcarLeida(n.id))}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children, className = "", dark }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  return (
    <div className={`rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")} ${className}`}>{children}</div>
  );
}
function Badge({ children, toneName = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    gray: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>;
}

const toneEstado = (e) => ({ abierto: "amber", en_progreso: "blue", resuelto: "green", cerrado: "slate", cancelado: "gray" }[e] || "slate");
const tonePrioridad = (p) => ({ baja: "blue", media: "amber", alta: "red", critica: "violet" }[p] || "slate");

// Componente barra de progreso para estados
function BarraProgreso({ estado, dark }) {
  const tone = (a,b)=> (dark?b:a);
  const getProgreso = (estado) => {
    switch (estado) {
      case 'abierto': return { porcentaje: 25, color: 'bg-amber-500', colorFondo: 'bg-amber-100 dark:bg-amber-900/30' };
      case 'en_progreso': return { porcentaje: 50, color: 'bg-blue-500', colorFondo: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'resuelto': return { porcentaje: 75, color: 'bg-green-500', colorFondo: 'bg-green-100 dark:bg-green-900/30' };
      case 'cerrado': return { porcentaje: 100, color: 'bg-slate-500', colorFondo: 'bg-slate-100 dark:bg-slate-900/30' };
      default: return { porcentaje: 0, color: 'bg-gray-500', colorFondo: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };
  
  const { porcentaje, color, colorFondo } = getProgreso(estado);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize">{estado.replace('_', ' ')}</span>
        <span className="text-xs opacity-60">{porcentaje}%</span>
      </div>
      <div className={`w-full h-2 rounded-full ${colorFondo}`}>
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

// ======================== Subvistas ========================================
function Filtros({ dark, onFilter }) {
  const tone = (a,b)=> (dark?b:a);
  const [q, setQ] = useState("");
  useEffect(()=>{ onFilter({ q }); }, [q]);
  return (
    <Card dark={dark}>
      <div className="p-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar (código, título, desc)" className={`w-full rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`} />
      </div>
    </Card>
  );
}

function TablaAsignados({ dark, rows, onVer, onAvanzar }) {
  const tone = (a,b)=> (dark?b:a);
  return (
    <Card dark={dark}>
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`border-b ${tone("border-slate-200 text-slate-500","border-slate-700/60 text-slate-400")} text-left`}>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(t => (
              <tr key={t.id_ticket} className={`border-b ${tone("border-slate-100","border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                <td className="px-4 py-3 font-mono text-xs">{t.codigo}</td>
                <td className="px-4 py-3"><div className="font-medium line-clamp-1">{t.titulo}</div><div className="opacity-70 text-xs line-clamp-1">{t.descripcion}</div></td>
                <td className="px-4 py-3"><Badge toneName={tonePrioridad(t.prioridad)}>{t.prioridad}</Badge></td>
                <td className="px-4 py-3 min-w-[120px]"><BarraProgreso estado={t.estado} dark={dark} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>onVer(t)} className={"rounded-lg px-3 py-1.5 text-xs "+tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}>Ver detalle</button>
                  <button onClick={()=>onAvanzar(t)} className="rounded-lg bg-green-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">Cambiar estado</button>
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center opacity-70">No tienes tickets asignados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ModalAvanzarEstado({ dark, ticket, onClose, onConfirm }) {
  const tone = (a,b)=> (dark?b:a);
  if (!ticket) return null;
  // transiciones simplificadas válidas para técnico
  const nextOptions = (estado) => {
    switch (estado) {
      case 'abierto': return [{ valor: 'en_progreso', texto: 'Comenzar trabajo', descripcion: 'Marcar como "En progreso" - Iniciar atención del ticket' }];
      case 'en_progreso': return [{ valor: 'resuelto', texto: 'Marcar resuelto', descripcion: 'Trabajo completado - Listo para revisión' }];
      case 'resuelto': return [{ valor: 'cerrado', texto: 'Cerrar ticket', descripcion: 'Confirmar que está totalmente terminado' }];
      default: return [];
    }
  };
  const options = nextOptions(ticket.estado);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className={`w-full max-w-lg rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <h4 className="text-lg font-semibold">Cambiar estado del ticket</h4>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-sm">
            <div className="font-medium mb-2">Ticket: {ticket.codigo}</div>
            <div className="opacity-70">{ticket.titulo}</div>
            <div className="mt-2">
              <span className="text-xs">Estado actual: </span>
              <Badge toneName={toneEstado(ticket.estado)}>{ticket.estado}</Badge>
            </div>
          </div>
          
          {options.length===0 ? (
            <div className="text-sm opacity-70 p-4 text-center">
              <div className="mb-2">🏁 Este ticket ya está en su estado final</div>
              <div>No se pueden hacer más cambios de estado.</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium">¿Qué acción quieres realizar?</div>
              {options.map(opcion => (
                <button 
                  key={opcion.valor} 
                  onClick={()=>onConfirm(ticket, opcion.valor)} 
                  className={`w-full rounded-xl border-2 border-dashed p-4 text-left transition-colors ${tone('border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50','border-slate-600 bg-slate-800 hover:border-green-600 hover:bg-green-900/30')}`}
                >
                  <div className="font-medium text-green-600">{opcion.texto}</div>
                  <div className="text-xs opacity-70 mt-1">{opcion.descripcion}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetalleTicketEmpleado({ dark, ticket, adjuntos, onClose }) {
  const tone = (a,b)=> (dark?b:a);
  if (!ticket) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className={`w-full max-w-3xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl max-h-[88vh] overflow-auto`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <h4 className="text-lg font-semibold">Ticket {ticket.codigo}</h4>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <div className="p-6">
          {/* Contenido principal */}
          <div className="space-y-6">
            {/* Título y descripción */}
            <div className="space-y-3">
              <div className="text-2xl font-semibold">{ticket.titulo}</div>
              <div className="text-base opacity-80 whitespace-pre-wrap">{ticket.descripcion}</div>
              <div className="flex gap-2 pt-2">
                <Badge toneName={tonePrioridad(ticket.prioridad)}>{ticket.prioridad}</Badge>
                <Badge toneName={toneEstado(ticket.estado)}>{ticket.estado}</Badge>
              </div>
            </div>

            {/* Información del ticket */}
            <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${tone("bg-slate-50","bg-slate-900/30")}`}>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Creado</span>
                  <div className="text-sm font-medium">{new Date(ticket.fecha_reporte).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Categoría</span>
                  <div className="text-sm font-medium">{ticket.categoria_nombre || '—'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Residente</span>
                  <div className="text-sm font-medium">{ticket.nombre_residente || '—'}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Departamento</span>
                  <div className="text-sm font-medium">{ticket.nro_depa || '—'}</div>
                </div>
              </div>
            </div>

            {/* Adjuntos del residente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">📎 Adjuntos del Residente</div>
                {adjuntos.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">{adjuntos.length}</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {adjuntos.map(a => (
                  <div key={a.id_adjunto} className={`rounded-xl border overflow-hidden ${tone("border-slate-200 bg-slate-50","border-slate-700/60 bg-slate-900/30")}`}>
                    <img 
                      src={a.url} 
                      alt={a.nombre_original || "Adjunto"} 
                      className="w-full h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(a.url, '_blank')}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-40 items-center justify-center text-sm p-4">
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-center">
                        📄 {a.nombre_original || 'Ver archivo'}
                      </a>
                    </div>
                    <div className="p-2 text-xs opacity-70 truncate">
                      {a.nombre_original || 'Archivo'}
                    </div>
                  </div>
                ))}
                {adjuntos.length===0 && (
                  <div className={`rounded-xl border p-6 text-center text-sm opacity-70 col-span-3 ${tone("border-slate-200","border-slate-700/60")}`}>
                    📭 Sin adjuntos del residente
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================= Página principal: Empleado Tickets ==============
export default function EmpleadoTicketsMantenimiento() {
  // THEME
  const [dark, setDark] = useState(false);
  const tone = (a,b)=> (dark?b:a);

  // Contexto general: obtener desde backend
  const [edificioName] = useState("InnovaBuilding");
  const [usuarioActual, setUsuarioActual] = useState({ nombre: "", apellido: "", email: "", rol: "", avatar: "" });
  const [, setCurrentEmpleadoId] = useState(null); // mapea a BD

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Obtener perfil    autenticado
        const profileRes = await authAPI.profile();
        if (!mounted) return;
        if (profileRes && profileRes.success && profileRes.data && profileRes.data.user) {
          const u = profileRes.data.user;
          setUsuarioActual({
            nombre: u.nombres || u.name || '',
            apellido: u.apellidos || '',
            email: u.email || '',
            rol: u.rol || '',
            avatar: u.avatar || ''
          });

          // Si es empleado, buscar su registro en /api/empleados para obtener id_empleado y cargo/telefono
          if ((u.rol || '').toLowerCase() === 'empleado') {
            try {
              const empRes = await empleadosAPI.list();
              if (!mounted) return;
              if (empRes && empRes.success && empRes.data && Array.isArray(empRes.data.empleados)) {
                const found = empRes.data.empleados.find(e => e.email === u.email || e.correo === u.email);
                if (found) {
                  setCurrentEmpleadoId(found.id_empleado || found.id_user || null);
                  // if available, update local usuario with persona names
                  setUsuarioActual(prev => ({ ...prev, nombre: found.nombres || prev.nombre, apellido: found.apellidos || prev.apellido, telefono: found.telefono || prev.telefono }));
                }
              }
            } catch (e) {
              console.warn('No se pudo obtener lista de empleados:', e.message || e);
            }
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener perfil:', err.message || err);
      }
    })();
    return () => { mounted = false; };
  }, []);
  

  // Tickets asignados a mi (desde backend)
  const [tickets, setTickets] = useState([]);
  
  // Sistema de notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Conectar al socket para recibir notificaciones de tickets asignados
  useEffect(() => {
    if (!usuarioActual.email) return;

    const socket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      auth: { token: Cookies.get('token') }
    });

    socket.on('connect', () => {
      console.log('🔌 Socket conectado para notificaciones');
    });

    // Escuchar evento de ticket asignado
    socket.on('ticket-asignado', (data) => {
      console.log('🔔 Nuevo ticket asignado:', data);
      
      // Agregar notificación
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'ticket-asignado',
        ticket: data,
        fecha: new Date().toISOString(),
        leida: false
      };
      
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      
      // Recargar la lista de tickets
      (async () => {
        try {
          const rows = await ticketsAPI.getMisAsignados();
          const mapped = (rows || []).map(r => ({
            id_ticket: r.id_ticket,
            codigo: r.codigo,
            titulo: r.titulo,
            descripcion: r.descripcion,
            estado: r.estado,
            prioridad: r.prioridad,
            categoria_nombre: r.categoria_nombre,
            fecha_reporte: r.fecha_reporte,
            nombre_residente: r.nombre_residente || '',
            nro_depa: r.nro_depa || '',
            total_adjuntos: r.total_adjuntos || 0
          }));
          setTickets(mapped);
        } catch (e) {
          console.error('Error recargando tickets:', e);
        }
      })();
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, [usuarioActual.email]);

  // Tickets asignados a mi (desde backend)

  // Cargar tickets asignados al empleado autenticado
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await ticketsAPI.getMisAsignados();
        if (!mounted) return;
        // Normalizar campo estado al formato visual si llega distinto
        const mapped = (rows || []).map(r => ({
          id_ticket: r.id_ticket,
          codigo: r.codigo,
          titulo: r.titulo,
          descripcion: r.descripcion,
          estado: r.estado,
          prioridad: r.prioridad,
          categoria_nombre: r.categoria_nombre,
          fecha_reporte: r.fecha_reporte,
          nombre_residente: r.nombre_residente || '',
          nro_depa: r.nro_depa || '',
          total_adjuntos: r.total_adjuntos || 0
        }));
        setTickets(mapped);
      } catch (e) {
        console.warn('No se pudieron cargar mis tickets asignados:', e.message || e);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [adjuntos, setAdjuntos] = useState({});

  // Cargar notificaciones desde la BD al iniciar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return;
        
        const response = await notificacionesAPI.list(token, false); // false = todas las notificaciones
        if (!mounted) return;
        
        if (response && response.success && response.data) {
          // Convertir las notificaciones de BD al formato del estado local
          const notifs = response.data.map(n => ({
            id: n.id_notificacion,
            tipo: n.tipo_notificacion,
            ticket: {
              id_ticket: n.id_ticket,
              titulo: n.ticket_titulo || n.titulo,
              estado: n.ticket_estado,
              prioridad: n.ticket_prioridad,
              codigo: n.ticket_codigo
            },
            fecha: n.created_at,
            leida: n.leida,
            mensaje: n.mensaje
          }));
          
          setNotificaciones(notifs);
          console.log('📬 Notificaciones cargadas desde BD:', notifs.length);
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filtros
  const [filters, setFilters] = useState({});
  const filas = useMemo(()=>{
    let rows = [...tickets];
    const { q } = filters;
    if (q?.trim()) { const term = q.trim().toLowerCase(); rows = rows.filter(t => (t.codigo+" "+t.titulo+" "+t.descripcion).toLowerCase().includes(term)); }
    return rows.sort((a,b)=> new Date(a.fecha_reporte) - new Date(b.fecha_reporte));
  }, [tickets, filters]);

  // UI
  const [showDetalle, setShowDetalle] = useState(null);
  const [showAvanzar, setShowAvanzar] = useState(null);
  const [showAsignacion, setShowAsignacion] = useState(null);

  // Socket: conectar y escuchar asignaciones
  useEffect(() => {
    let socket;
    (async () => {
      try {
        // Espera a que tengamos el usuarioActual con id y rol
        // Obtenemos el perfil para conocer el id del user
        const profile = await authAPI.profile();
        const user = profile?.data?.user;
        if (!user) return;
        socket = io('http://localhost:8000', { transports: ['websocket'], withCredentials: true });
        socket.on('connect', () => {
          // Registrar el userId para recibir notificaciones dirigidas
          console.log('🔌 Socket conectado, registrando usuario:', user.id);
          socket.emit('registerUser', { userId: user.id });
        });
        
        // Escuchar el evento ticket-asignado (broadcast a todos)
        socket.on('ticket-asignado', (payload) => {
          console.log('🎉 Notificación de ticket asignado recibida:', payload);
          
          // Verificar si este ticket es para el empleado actual
          if (payload.id_persona_asignada === user.id_persona) {
            console.log('✅ Este ticket es para mí, agregando a notificaciones');
            
            // Agregar notificación
            setNotificaciones(prev => [{
              id: Date.now(),
              tipo: 'ticket-asignado',
              ticket: payload,
              fecha: new Date().toISOString(),
              leida: false
            }, ...prev]);
            
            // Recargar tickets
            (async () => {
              try {
                const rows = await ticketsAPI.getMisAsignados();
                const mapped = (rows || []).map(r => ({
                  id_ticket: r.id_ticket,
                  codigo: r.codigo,
                  titulo: r.titulo,
                  descripcion: r.descripcion,
                  estado: r.estado,
                  prioridad: r.prioridad,
                  categoria_nombre: r.categoria_nombre,
                  fecha_reporte: r.fecha_reporte,
                  nombre_residente: r.nombre_residente || '',
                  nro_depa: r.nro_depa || '',
                  total_adjuntos: r.total_adjuntos || 0
                }));
                setTickets(mapped);
                console.log('✅ Tickets recargados después de nueva asignación');
              } catch (e) {
                console.error('Error recargando tickets:', e);
              }
            })();
          } else {
            console.log('ℹ️ Este ticket no es para mí (id_persona:', user.id_persona, ', asignado a:', payload.id_persona_asignada, ')');
          }
        });
        
        // Mantener compatibilidad con ticketAssigned
        socket.on('ticketAssigned', (payload) => {
          console.log('🎉 Nuevo ticket asignado recibido:', payload);
          // Mostrar modal de nueva asignación
          setShowAsignacion(payload);

          // Normalizar id (aceptar string o number)
          const incomingId = (payload && payload.id_ticket) ? (isNaN(Number(payload.id_ticket)) ? payload.id_ticket : Number(payload.id_ticket)) : undefined;

          // agregar a la lista si no existe (comparar como strings para evitar mismatch)
          setTickets(prev => {
            const exists = prev.some(t => String(t.id_ticket) === String(incomingId));
            if (exists) {
              console.log('ℹ️ Ticket ya existe en lista, no se añade:', incomingId);
              return prev;
            }
            const newTicket = {
              id_ticket: incomingId,
              codigo: payload.codigo || `TICKET-${incomingId}`,
              titulo: payload.titulo || 'Nuevo ticket asignado',
              descripcion: payload.descripcion || '',
              estado: payload.estado || 'en_progreso',
              prioridad: payload.prioridad || 'media',
              categoria_nombre: payload.categoria_nombre || '',
              fecha_reporte: payload.fecha_asignacion,
              asignado_actual: payload.asignado_actual || null
            };
            const updated = [newTicket, ...prev];
            console.log('📝 Tickets actualizados (nueva asignación añadida):', updated.map(t => t.id_ticket));
            return updated;
          });
        });
      } catch (e) {
        console.warn('Socket empleado no inicializado:', e.message || e);
      }
    })();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  // Acciones
  const verTicket = async (t) => {
    // Cargar adjuntos del ticket antes de abrir modal
    try {
      const detail = await ticketsAPI.getById(null, t.id_ticket);
      if (detail && detail.adjuntos) {
        // Añadir prefijo http://localhost:8000 a las URLs
        const adjuntosConUrl = detail.adjuntos.map(adj => ({
          ...adj,
          url: adj.url.startsWith('http') ? adj.url : `http://localhost:8000${adj.url}`
        }));
        setAdjuntos(prev => ({ ...prev, [t.id_ticket]: adjuntosConUrl }));
        setShowDetalle({ ...t, ...detail });
      } else {
        setShowDetalle(t);
      }
    } catch (e) {
      console.warn('No se pudieron cargar adjuntos:', e);
      setShowDetalle(t);
    }
  };
  const abrirAvanzar = (t) => setShowAvanzar(t);
  const confirmarAvanzar = async (t, nuevo) => {
    const estadoAnterior = t.estado;
    
    // Actualizar estado localmente (optimistic UI)
    setTickets(prev => prev.map(x => x.id_ticket===t.id_ticket ? { ...x, estado: nuevo } : x));
    setShowAvanzar(null);
    
    // Guardar seguimiento en el backend
    try {
      const token = Cookies.get('token');
      if (!token) {
        console.warn('⚠️ No hay token, no se guardará el seguimiento');
        return;
      }
      
      const payload = {
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevo,
        comentario: `Empleado cambió estado de "${estadoAnterior}" a "${nuevo}"`
      };
      
      await ticketsAPI.addSeguimiento(token, t.id_ticket, payload);
      console.log('✅ Seguimiento guardado en el historial');
    } catch (error) {
      console.error('❌ Error guardando seguimiento:', error);
      // No mostramos error al usuario, el cambio de estado ya se aplicó localmente
    }
  };
  
  // Funciones para notificaciones
  const marcarNotificacionLeida = async (id) => {
    // Actualizar localmente (optimistic UI)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    
    // Actualizar en backend
    try {
      const token = Cookies.get('token');
      if (token) {
        await notificacionesAPI.marcarLeida(token, id);
        console.log('✅ Notificación marcada como leída en BD');
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };
  
  const verTicketDesdeNotificacion = (ticket) => {
    setMostrarNotificaciones(false);
    // Buscar el ticket completo en la lista
    const ticketCompleto = tickets.find(t => t.id_ticket === ticket.id_ticket);
    if (ticketCompleto) {
      verTicket(ticketCompleto);
    }
  };

  const ModalAsignacion = ({ dark, data, onClose }) => {
    if (!data) return null;
    const tone = (a,b)=> (dark?b:a);
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <div className={`w-full max-w-2xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-2xl animate-[scale-in_0.2s_ease-out]`}>
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${tone("border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50","border-slate-700/60 bg-gradient-to-r from-blue-950/30 to-indigo-950/30")}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold">🎯 Nuevo Ticket Asignado</h4>
              <p className="text-xs opacity-70 mt-0.5">Te han asignado un nuevo ticket de mantenimiento</p>
            </div>
            <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
          </div>
          <div className="p-6 space-y-4">
            {/* Código y Título */}
            <div className={`rounded-lg p-4 ${tone("bg-slate-50","bg-slate-800/50")}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Código del Ticket</span>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{data.codigo || `#${data.id_ticket}`}</span>
              </div>
              <h3 className="text-lg font-semibold">{data.titulo || 'Sin título'}</h3>
              {data.descripcion && (
                <p className="mt-2 text-sm opacity-80">{data.descripcion}</p>
              )}
            </div>

            {/* Detalles en grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 ${tone("bg-slate-50","bg-slate-800/50")}`}>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Prioridad</div>
                <Badge toneName={tonePrioridad(data.prioridad || 'media')}>{data.prioridad || 'media'}</Badge>
              </div>
              <div className={`rounded-lg p-3 ${tone("bg-slate-50","bg-slate-800/50")}`}>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Estado</div>
                <Badge toneName={toneEstado(data.estado || 'en_progreso')}>{data.estado || 'en_progreso'}</Badge>
              </div>
              {data.categoria_nombre && (
                <div className={`rounded-lg p-3 ${tone("bg-slate-50","bg-slate-800/50")}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Categoría</div>
                  <div className="text-sm font-medium">{data.categoria_nombre}</div>
                </div>
              )}
              <div className={`rounded-lg p-3 ${tone("bg-slate-50","bg-slate-800/50")}`}>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Fecha Asignación</div>
                <div className="text-sm font-medium">{new Date(data.fecha_asignacion || Date.now()).toLocaleDateString()}</div>
                <div className="text-xs opacity-60">{new Date(data.fecha_asignacion || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Técnico asignado */}
            {data.asignado_actual && (
              <div className={`rounded-lg p-4 ${tone("bg-gradient-to-br from-blue-50 to-indigo-50","bg-gradient-to-br from-blue-950/30 to-indigo-950/30")} border ${tone("border-blue-200","border-blue-800/50")}`}>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-2">👤 Asignado a</div>
                <div className="font-semibold text-base">
                  {data.asignado_actual.nombres} {data.asignado_actual.apellidos}
                </div>
                <div className="flex gap-3 mt-2 text-sm opacity-80">
                  {data.asignado_actual.cargo && <div>📋 {data.asignado_actual.cargo}</div>}
                  {data.asignado_actual.celular && <div>📞 {data.asignado_actual.celular}</div>}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { 
                  setShowAsignacion(null); 
                  setShowDetalle(tickets.find(t => String(t.id_ticket) === String(data.id_ticket)) || data);
                }} 
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                📋 Ver Detalles
              </button>
              <button 
                onClick={() => { setShowAsignacion(null); }} 
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tone("bg-slate-200 hover:bg-slate-300","bg-slate-700 hover:bg-slate-600")} transition-colors`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <main className="w-full">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🧰</span>
                    <span className="font-medium">Mis Tickets Asignados</span>
                  </div>

                  <Link
                    to="/empleado"
                    className={`rounded-xl px-3 py-2 text-sm ${tone(
                      "bg-white border border-slate-200 hover:bg-slate-100",
                      "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                    )} flex items-center gap-2`}
                  >
                    <span className="text-slate-500"></span>
                    <span>Mi cuenta</span>
                  </Link>

                  <div className="ms-auto flex items-center gap-2">
                    {/* Botón de Notificaciones */}
                    <div className="relative">
                      <button
                        onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                        className={`relative rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}
                        title="Notificaciones"
                      >
                        <span className="text-lg">🔔</span>
                        {notificaciones.filter(n => !n.leida).length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {notificaciones.filter(n => !n.leida).length}
                          </span>
                        )}
                      </button>
                      
                      {mostrarNotificaciones && (
                        <NotificacionesDropdown
                          notificaciones={notificaciones}
                          onMarcarLeida={marcarNotificacionLeida}
                          onCerrar={() => setMostrarNotificaciones(false)}
                          onVerTicket={verTicketDesdeNotificacion}
                        />
                      )}
                    </div>
                    
                    <button onClick={() => setDark((d) => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                    <UserProfile
                      dark={dark}
                      usuarioActual={usuarioActual}
                      edificioName={edificioName}
                      onLogout={()=>alert('Logout (implementar con backend)')}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 pt-4 space-y-6">
              <Filtros dark={dark} onFilter={setFilters} />

              <TablaAsignados
                dark={dark}
                rows={filas}
                onVer={verTicket}
                onAvanzar={abrirAvanzar}
              />
            </div>
          </main>
        </div>

      {showDetalle && (
        <DetalleTicketEmpleado
          dark={dark}
          ticket={showDetalle}
          adjuntos={adjuntos[showDetalle.id_ticket] || []}
          onClose={()=>setShowDetalle(null)}
        />
      )}

      {showAvanzar && (
        <ModalAvanzarEstado
          dark={dark}
          ticket={showAvanzar}
          onClose={()=>setShowAvanzar(null)}
          onConfirm={confirmarAvanzar}
        />
      )}

      {showAsignacion && (
        <ModalAsignacion
          dark={dark}
          data={showAsignacion}
          onClose={()=>setShowAsignacion(null)}
        />
      )}
    </div>
  );
}
