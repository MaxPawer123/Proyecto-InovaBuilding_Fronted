import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import Cookies from 'js-cookie';
import { tecnicosAPI, ticketsAPI, empleadosAPI } from "../services/api";

// =============================================================================
// Módulo: Tickets y Mantenimiento — Panel Administrador (gestiona, no crea)
// Estética: igual a tu ejemplo (Tailwind + mismo Sidebar/UserProfile)
// Datos: MOCK para conectar luego con tu backend (reemplaza TODOs fetch)
// -----------------------------------------------------------------------------
// Endpoints sugeridos (ajústalos a tu stack):
//   CATEGORÍAS
//    GET   /api/ticket-categorias
//   TICKETS (solo lectura para admin)
//    GET   /api/tickets?estado=&prioridad=&q=&desde=&hasta=&page=&size=
//    GET   /api/tickets/:id
//    PATCH /api/tickets/:id { estado?, prioridad?, visibilidad?, fecha_compromiso? }
//   ASIGNACIONES
//    GET   /api/tickets/:id/asignaciones?actual=true
//    POST  /api/tickets/:id/asignaciones { id_empleado, nota }
//    PATCH /api/tickets/:id/asignaciones/:id_asignacion { es_actual=false, fecha_fin }
//   COMENTARIOS
//    GET   /api/tickets/:id/comentarios
//    POST  /api/tickets/:id/comentarios { comentario, privado }
//   ADJUNTOS
//    GET   /api/tickets/:id/adjuntos
//    POST  /api/tickets/:id/adjuntos (multipart) file, tipo_mime, peso_bytes
// =============================================================================

// ------------------------ UI Helpers (reusa los de tu ejemplo) --------------
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

const SelectEstado = ({ label, error, register, dark, selectedValue, ...props }) => {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  
  const getEstadoColor = (estado) => {
    const colores = {
      'abierto': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
      'en_progreso': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
      'resuelto': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
      'cerrado': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
    };
    return colores[estado] || tone("border-slate-200 bg-white", "border-slate-600 bg-slate-800");
  };

  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone("text-slate-600", "text-slate-300")}`}>{label}</span>
      <select
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring transition-colors ${
          error
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
            : selectedValue 
              ? getEstadoColor(selectedValue)
              : tone("border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      >
        <option value="abierto" className="bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          🔴 Abierto
        </option>
        <option value="en_progreso" className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          🔵 En progreso
        </option>
        <option value="resuelto" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          🟢 Resuelto
        </option>
        <option value="cerrado" className="bg-gray-50 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
          ⚫ Cerrado
        </option>
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};

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

// mapping de estados/prioridades -> Badge
const toneEstado = (e) => ({
  abierto: "amber",
  en_progreso: "blue",
  resuelto: "green",
  cerrado: "slate",
}[e] || "slate");
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
function FiltrosTickets({ dark, onFilter }) {
  const tone = (a,b)=> (dark?b:a);
  const [q, setQ] = useState("");

  useEffect(()=>{ onFilter({ q, estado: "", prioridad: "", desde: "", hasta: "" }); }, [q]);

  return (
    <Card dark={dark}>
      <div className="p-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar (código, título, descripción)" className={`w-full rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`} />
      </div>
    </Card>
  );
}

function TablaTickets({ dark, rows, onVer, onAsignar, onSeguimiento,onEliminar }) {
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
              <th className="px-4 py-3">Creado</th>
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
                <td className="px-4 py-3">{new Date(t.fecha_reporte).toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>onVer(t)} className={"rounded-lg px-3 py-1.5 text-xs "+tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}>Ver</button>
                  <button onClick={()=>onAsignar(t)} className="rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600">Asignar</button>
                  <button onClick={()=>onSeguimiento(t)} className="rounded-lg bg-green-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">📊 Seguimiento</button>
                 <button onClick={()=>onEliminar(t)} className="rounded-lg px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700">Eliminadasdr</button>

                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center opacity-70">Sin tickets</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DetalleTicket({ dark, ticket, comentarios, adjuntos, onClose, onComentar, onSubir, onActualizarMeta, onCambiarPrioridad, onCambiarVisibilidad }) {
  const tone = (a,b)=> (dark?b:a);
  if (!ticket) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className={`w-full max-w-2xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl max-h-[88vh] overflow-auto`}>
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
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Creado:</span> 
                <span className="ml-2">{new Date(ticket.fecha_reporte).toLocaleString()}</span>
              </div>
            </div>
            {/* Adjuntos */}
            <div className="space-y-3">
              <div className="text-lg font-semibold">Adjuntos</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adjuntos.map(a => {
                  const imageUrl = `http://localhost:8000${a.url}`;
                  return (
                    <div key={a.id_adjunto} className={`rounded-xl border overflow-hidden ${tone("border-slate-200 bg-slate-50","border-slate-700/60 bg-slate-900/30")}`}>
                      <img 
                        src={imageUrl} 
                        alt={a.nombre_original || "Adjunto"} 
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(imageUrl, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-32 items-center justify-center text-sm">
                        <a href={imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          📄 Ver archivo
                        </a>
                      </div>
                    </div>
                  );
                })}
                {adjuntos.length===0 && (
                  <div className={`rounded-xl border p-6 text-center text-sm opacity-70 ${tone("border-slate-200","border-slate-700/60")}`}>
                    Sin adjuntos
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

function ModalAsignar({ dark, ticket, empleadosInternos, tecnicosExternos, onClose, onAsignarConfirm }) {
  const tone = (a,b)=> (dark?b:a);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues: { tipo_tecnico: "", id_empleado: "", nota: "" } });
  
  // Observar el tipo de técnico seleccionado
  const tipoTecnico = watch("tipo_tecnico");
  
  // Reset del empleado cuando cambia el tipo
  useEffect(() => {
    setValue("id_empleado", "");
  }, [tipoTecnico, setValue]);
  
  useEffect(()=>{ reset({ tipo_tecnico: "", id_empleado: "", nota: "" }); }, [ticket]);
  
  // Obtener lista de técnicos según el tipo seleccionado
  const tecnicosDisponibles = tipoTecnico === "interno" ? empleadosInternos : tipoTecnico === "externo" ? tecnicosExternos : [];
    if (!ticket) return null;
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <div className={`w-full max-w-md rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
            <h4 className="text-lg font-semibold">Asignar técnico — {ticket.codigo}</h4>
            <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
          </div>
          <form onSubmit={handleSubmit(onAsignarConfirm)} className="p-4 space-y-3">
            <Select label="Tipo de técnico" dark={dark} register={register("tipo_tecnico",{required:"Requerido"})} error={errors.tipo_tecnico}>
              <option value="">Seleccionar tipo...</option>
              <option value="interno">🏢 Técnico Interno (del edificio)</option>
              <option value="externo">👨‍🔧 Técnico Externo (agenda)</option>
            </Select>
                        
            {tipoTecnico && (
              <Select label="Técnico disponible" dark={dark} register={register("id_empleado",{required:"Requerido"})} error={errors.id_empleado}>
                <option value="">Seleccionar técnico...</option>
                {tecnicosDisponibles.map(e => (
                  <option key={e.id_empleado || e.id || Math.random()} value={e.id_empleado || e.id}>
                    {e.nombres || e.name} {e.apellidos || e.apellido} — {e.cargo || e.cargo} {e.celular ? `(${e.celular})` : ''}
                  </option>
                ))}
              </Select>
            )}
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
              <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>Asignar</button>
            </div>
          </form>
        </div>
      </div>
    );
}

// ========================= Modal de Seguimiento =============================
function ModalSeguimiento({ dark, ticket, onClose, onConfirmarSeguimiento }) {
  const tone = (a,b)=> (dark?b:a);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ 
    defaultValues: { 
      nuevo_estado: ticket?.estado || "", 
      comentario: ""
    } 
  });

  const selectedEstado = watch("nuevo_estado");

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className={`w-full max-w-md rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <h4 className="text-lg font-semibold">Seguimiento - {ticket.codigo}</h4>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit(onConfirmarSeguimiento)} className="p-4 space-y-4">
          <SelectEstado
            label="Estado" 
            dark={dark} 
            selectedValue={selectedEstado}
            register={register("nuevo_estado", {required: "Selecciona un estado"})} 
            error={errors.nuevo_estado}
          />

          <Textarea 
            label="Comentario" 
            dark={dark} 
            rows={3}
            register={register("comentario", {required: "Escribe un comentario"})} 
            error={errors.comentario}
            placeholder="¿Qué se hizo o qué va a pasar?"
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
              Cancelar
            </button>
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================= Historial de Seguimiento =========================
function HistorialSeguimiento({ dark, historial = [] }) {
  const tone = (a,b)=> (dark?b:a);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      'abierto': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'en_progreso': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'resuelto': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'cerrado': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${tone("text-slate-900","text-white")}`}>
          Historial de Seguimiento
        </h3>
        <span className={`text-sm ${tone("text-slate-600","text-slate-400")}`}>
          {historial.length} registros
        </span>
      </div>

      {historial.length === 0 ? (
        <div className={`text-center py-8 ${tone("text-slate-500","text-slate-400")}`}>
          <p>No hay registros de seguimiento aún</p>
          <p className="text-sm mt-1">Los seguimientos aparecerán aquí cuando se actualicen tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historial.map((registro) => (
            <div 
              key={registro.id}
              className={`p-4 rounded-xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800/50")}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className={`font-medium ${tone("text-slate-900","text-white")}`}>
                    {registro.ticket_codigo} - {registro.ticket_titulo}
                  </h4>
                  <p className={`text-sm ${tone("text-slate-600","text-slate-400")}`}>
                    {formatearFecha(registro.fecha)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getEstadoBadge(registro.estado_anterior)}`}>
                  {registro.estado_anterior}
                </span>
                <span className={`${tone("text-slate-400","text-slate-500")}`}>→</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getEstadoBadge(registro.estado_nuevo)}`}>
                  {registro.estado_nuevo}
                </span>
              </div>
              
              <p className={`text-sm ${tone("text-slate-700","text-slate-300")}`}>
                {registro.comentario}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================= Agenda de Técnicos ==============================
function GestionTecnicos({ dark, empleados, onAgregar, onEliminar }) {
  const tone = (a,b)=> (dark?b:a);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { nombres: "", apellidos: "", cargo: "", celular: "" } });
  const [showModal, setShowModal] = useState(false);

  const agregarTecnico = (data) => {
    onAgregar(data);
    reset();
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Botón agregar */}
      <Card dark={dark}>
        <div className="p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Agenda de Técnicos Externos</h3>
            <p className="text-sm opacity-70">Administrar técnicos externos disponibles para mantenimiento</p>
          </div>
          <button onClick={()=>setShowModal(true)} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">+ Agregar Técnico</button>
        </div>
      </Card>

      {/* Lista de técnicos */}
      <Card dark={dark}>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {empleados.map(emp => (
              <div key={emp.id_empleado} className={`rounded-xl border p-4 ${tone("border-slate-200 bg-slate-50","border-slate-700/60 bg-slate-900/30")}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{emp.nombres} {emp.apellidos}</h4>
                    <p className="text-sm opacity-70">{emp.cargo}</p>
                    {emp.celular && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs">📱</span>
                        <a href={`tel:${emp.celular}`} className="text-xs text-blue-600 hover:underline">{emp.celular}</a>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>onEliminar(emp)} className="rounded-lg px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700">Eliminar</button>
                </div>
              </div>
            ))}
            {empleados.length === 0 && (
              <div className="col-span-full text-center text-sm opacity-70 py-8">No hay técnicos registrados</div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal agregar técnico */}
      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-md rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">Agregar Técnico Externo</h4>
              <button onClick={()=>setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(agregarTecnico)} className="p-4 space-y-3">
              <Input label="Nombres" dark={dark} register={register("nombres",{required:"Requerido", minLength:{value:2,message:"Mín 2"}})} error={errors.nombres} />
              <Input label="Apellidos" dark={dark} register={register("apellidos",{required:"Requerido", minLength:{value:2,message:"Mín 2"}})} error={errors.apellidos} />
              <Input label="Celular" dark={dark} type="tel" register={register("celular",{required:"Requerido", pattern:{value:/^[0-9]{8}$/,message:"Debe ser un número de 8 dígitos"}})} error={errors.celular} placeholder="Ej: 77329374" />
              <Input label="Cargo/Oficio" dark={dark} register={register("cargo",{required:"Requerido", minLength:{value:3,message:"Mín 3 caracteres"}})} error={errors.cargo} placeholder="Ej: Electricista, Plomero, Albañil..." />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================= Página principal: Admin Tickets ==================
export default function AdminTicketsMantenimiento() {
  // THEME (igual que tu dashboard)
  const [dark, setDark] = useState(false);
  const tone = (a,b)=> (dark?b:a);

  // Sección principal
  const [seccionPrincipal, setSeccionPrincipal] = useState('tickets'); // 'tickets' | 'agenda' | 'asignados'

  // Contexto general
  const edificioName = "InnovaBulding";
  const usuarioActual = { nombre: "Admin", apellido: "Edificio", email: "admin@edificio.com", rol: "Administrador", avatar: "" };
  
  // Técnicos externos de la agenda
  const [tecnicosExternos, setTecnicosExternos] = useState([]);
  const [empleadosInternos, setEmpleadosInternos] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsAsignados, setTicketsAsignados] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [adjuntos, setAdjuntos] = useState({});
  const [historialSeguimiento, setHistorialSeguimiento] = useState([
    {
      id: 1,
      ticket_codigo: "TCK-2025-0001",
      ticket_titulo: "Fuga en lavamanos",
      estado_anterior: "abierto",
      estado_nuevo: "en_progreso",
      comentario: "Se asignó técnico para revisión",
      fecha: "2025-01-18T10:30:00.000Z"
    },
    {
      id: 2,
      ticket_codigo: "TCK-2025-0002",
      ticket_titulo: "Luces parpadean",
      estado_anterior: "en_progreso",
      estado_nuevo: "resuelto",
      comentario: "Se cambió balastro y se probó funcionamiento",
      fecha: "2025-01-18T14:15:00.000Z"
    }
  ]);

  // Filtros y filas derivadas
  const [filters, setFilters] = useState({});
  const filas = useMemo(()=>{
    let rows = [...tickets];
    const { q, estado, prioridad, desde, hasta } = filters;
    if (q?.trim()) {
      const term = q.trim().toLowerCase();
      rows = rows.filter(t => (t.codigo+" "+t.titulo+" "+t.descripcion).toLowerCase().includes(term));
    }
    if (estado) rows = rows.filter(t => t.estado===estado);
    if (prioridad) rows = rows.filter(t => t.prioridad===prioridad);
    if (desde) rows = rows.filter(t => new Date(t.fecha_reporte) >= new Date(desde));
    if (hasta) rows = rows.filter(t => new Date(t.fecha_reporte) <= new Date(hasta+'T23:59:59'));
    return rows.sort((a,b)=> new Date(b.fecha_reporte) - new Date(a.fecha_reporte));
  }, [tickets, filters]);

  // Estado UI
  const [showDetalle, setShowDetalle] = useState(null); // ticket
  const [showAsignar, setShowAsignar] = useState(null); // ticket
  const [showSeguimiento, setShowSeguimiento] = useState(null); // ticket

  // Cargar técnicos externos al montar el componente
  useEffect(() => {
    const cargarTecnicos = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          console.log('⚠️ No hay token, usuario no autenticado');
          return;
        }

        // Cargar técnicos externos activos
        const tecnicosData = await tecnicosAPI.list(token, { activo: 'true' });
        
        // Adaptar formato para el frontend
        const tecnicosAdaptados = tecnicosData.map(t => ({
          id_empleado: t.id_tecnico,
          nombres: t.nombres,
          apellidos: t.apellidos,
          cargo: t.cargo,
          celular: t.celular,
          tipo: "externo"
        }));

        setTecnicosExternos(tecnicosAdaptados);
        console.log('✅ Técnicos externos cargados:', tecnicosAdaptados);
      } catch (error) {
        console.error('❌ Error al cargar técnicos externos:', error);
      }
    };

    cargarTecnicos();
  }, []);

    // Cargar empleados internos al montar el componente
    useEffect(() => {
      const cargarEmpleados = async () => {
        try {
          const resp = await empleadosAPI.list();
          if (resp.success) {
            // Adaptar datos para el select
            const empleados = resp.data.empleados.map(e => ({
              id_empleado: e.id_empleado || e.id_user,
              id_user: e.id_user,
              nombres: e.nombres,
              apellidos: e.apellidos,
              cargo: e.cargo,
              celular: e.telefono || e.celular || '',
            }));
            setEmpleadosInternos(empleados);
            console.log('✅ Empleados internos cargados:', empleados);
          }
        } catch (error) {
          console.error('Error al cargar empleados internos:', error);
        }
      };
      cargarEmpleados();
    }, []);

  // Cargar tickets al montar el componente
  useEffect(() => {
    const cargarTickets = async () => {
      try {
        console.log('🔄 Iniciando carga de tickets para admin...');
        const token = Cookies.get('token');
        if (!token) {
          console.log('⚠️ No hay token, usuario no autenticado');
          return;
        }

        console.log('📡 Llamando a ticketsAPI.list...');
        // Cargar todos los tickets (admin ve todos)
        const ticketsData = await ticketsAPI.list(token);
        
        console.log('✅ Tickets recibidos del servidor:', ticketsData.length, 'tickets');
        console.log('📋 Datos completos:', ticketsData);
        
        setTickets(ticketsData);
        console.log('✅ Tickets cargados en el estado');

        // Inicializar comentarios y adjuntos vacíos para cada ticket
        const comentariosInit = {};
        const adjuntosInit = {};
        ticketsData.forEach(t => {
          comentariosInit[t.id_ticket] = [];
          adjuntosInit[t.id_ticket] = t.adjuntos || [];
        });
        setComentarios(comentariosInit);
        setAdjuntos(adjuntosInit);
      } catch (error) {
        console.error('❌ Error al cargar tickets:', error);
      }
    };

    cargarTickets();
  }, []);

  // Cargar tickets asignados al montar el componente
  useEffect(() => {
    const cargarTicketsAsignados = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return;

        const ticketsAsignadosData = await ticketsAPI.getAsignados(token);
        setTicketsAsignados(ticketsAsignadosData);
        console.log('✅ Tickets asignados cargados:', ticketsAsignadosData.length);
      } catch (error) {
        console.error('❌ Error al cargar tickets asignados:', error);
      }
    };

    cargarTicketsAsignados();
  }, []);

  // Acciones - Tickets
  const verTicket = async (t) => {
    try {
      const token = Cookies.get('token');
      if (!token) return setShowDetalle(t);
      const det = await ticketsAPI.getById(token, t.id_ticket);
      // Guardar adjuntos en estado por id_ticket
      setAdjuntos(prev => ({ ...prev, [t.id_ticket]: det.adjuntos || [] }));
      setTickets(prev => prev.map(x => x.id_ticket === det.id_ticket ? det : x));
      setShowDetalle(det);
    } catch (e) {
      console.error('No se pudo cargar detalle del ticket (admin):', e);
      setShowDetalle(t);
    }
  };
   const eliminarTicket = (ticket) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el ticket "${ticket.titulo}"?`)) {
      setTickets(prev => prev.filter(t => t.id_ticket !== ticket.id_ticket));
      setAdjuntos(prev => {
        const nuevos = { ...prev };
        delete nuevos[ticket.id_ticket];
        return nuevos;
      });
      // Si se está mostrando el ticket eliminado, cerrar el modal
      if (showDetalle && showDetalle.id_ticket === ticket.id_ticket) {
        setShowDetalle(null);
      }
    }
  };
  
  const abrirAsignar = (t) => setShowAsignar(t);
  const abrirSeguimiento = (t) => setShowSeguimiento(t);
  const confirmarSeguimiento = (data) => {
    const ticket = showSeguimiento;
    if (!ticket) return;
    // Optimistic UI: actualizar estado localmente primero
    setTickets(prev => prev.map(x => 
      x.id_ticket === ticket.id_ticket ? { ...x, estado: data.nuevo_estado } : x
    ));

    // Agregar comentario local
    setComentarios(prev => ({ 
      ...prev, 
      [ticket.id_ticket]: [ 
        { 
          id_comentario: Date.now(), 
          comentario: `${data.nuevo_estado}: ${data.comentario}`, 
          privado: true, 
          created_at: new Date().toISOString(), 
          autor: "Admin" 
        }, 
        ...(prev[ticket.id_ticket] || []) 
      ] 
    }));

    // Crear payload para backend
    const payload = {
      estado_anterior: ticket.estado,
      estado_nuevo: data.nuevo_estado,
      comentario: data.comentario
    };

    // Llamada al backend para guardar seguimiento
    (async () => {
      try {
        const token = Cookies.get('token');
        if (!token) throw new Error('No autenticado');
        const resp = await ticketsAPI.addSeguimiento(token, ticket.id_ticket, payload);
        // Si el backend devuelve el registro creado, usarlo; si no, construir uno localmente
        const nuevoRegistro = resp && resp.data ? resp.data : {
          id: Date.now(),
          ticket_codigo: ticket.codigo,
          ticket_titulo: ticket.titulo,
          estado_anterior: payload.estado_anterior,
          estado_nuevo: payload.estado_nuevo,
          comentario: payload.comentario,
          fecha: new Date().toISOString()
        };

        setHistorialSeguimiento(prev => [nuevoRegistro, ...prev]);
      } catch (err) {
        console.error('Error guardando seguimiento en backend:', err);
        // En caso de error, agregar registro local indicando fallo (opcional)
        setHistorialSeguimiento(prev => [{ id: Date.now(), ticket_codigo: ticket.codigo, ticket_titulo: ticket.titulo, estado_anterior: ticket.estado, estado_nuevo: data.nuevo_estado, comentario: data.comentario + ' (no guardado)', fecha: new Date().toISOString() }, ...prev]);
      }
    })();

    setShowSeguimiento(null);
  };
  const comentar = (t, data) => {
    // TODO: POST /api/tickets/:id/comentarios
    setComentarios(prev => ({ ...prev, [t.id_ticket]: [ { id_comentario: Date.now(), comentario: data.comentario, privado: !!data.privado, created_at: new Date().toISOString(), autor: "Admin" }, ...(prev[t.id_ticket]||[]) ] }));
  };
  const subirAdjunto = (t, file) => {
    if (!file) return;
    // TODO: POST multipart /api/tickets/:id/adjuntos
    const fakeUrl = URL.createObjectURL(file);
    setAdjuntos(prev => ({ ...prev, [t.id_ticket]: [ { id_adjunto: Date.now(), url: fakeUrl }, ...(prev[t.id_ticket]||[]) ] }));
  };
  const confirmarAsignar = async ({ tipo_tecnico, id_empleado, nota }) => {
    const t = showAsignar; if (!t) return;
    try {
      const token = Cookies.get('token');
      const payload = tipo_tecnico === 'interno' 
        ? { tipo_tecnico, id_empleado: Number(id_empleado), nota }
        : { tipo_tecnico, id_tecnico_externo: Number(id_empleado), nota };
      const resp = await ticketsAPI.assign(token, t.id_ticket, payload);
      if (resp && resp.success) {
        const asignado = resp.data.asignado_actual;
        const nombreCompleto = `${asignado.nombres || ''} ${asignado.apellidos || ''} ${asignado.tipo === 'interno' ? '(Interno)' : '(Externo)'} `.trim();
        setTickets(prev => prev.map(x => x.id_ticket===t.id_ticket ? { 
          ...x, 
          asignado_actual: { 
            empleado_nombre: nombreCompleto,
            empleado_cargo: asignado.cargo
          }, 
          estado: x.estado==='abierto'? 'en_progreso': x.estado 
        } : x));
        setComentarios(prev => ({ ...prev, [t.id_ticket]: [ { id_comentario: Date.now(), comentario: `Asignado a ${nombreCompleto}. ${nota||''}`.trim(), privado: true, created_at: new Date().toISOString(), autor: "Admin" }, ...(prev[t.id_ticket]||[]) ] }));
        
        // Recargar tickets asignados
        const ticketsAsignadosData = await ticketsAPI.getAsignados(token);
        setTicketsAsignados(ticketsAsignadosData);
        
        setShowAsignar(null);
      }
    } catch (err) {
      console.error('❌ Error asignando técnico:', err);
      alert(`Error al asignar técnico: ${err.message || err}`);
    }
  };
  const actualizarMeta = (t, data) => {
    // TODO: PATCH /api/tickets/:id { fecha_compromiso, visibilidad, prioridad }
    setTickets(prev => prev.map(x => x.id_ticket===t.id_ticket ? { ...x, fecha_compromiso: data.fecha_compromiso? new Date(data.fecha_compromiso).toISOString(): null, visibilidad: data.visibilidad, prioridad: data.prioridad } : x));
    setComentarios(prev => ({ ...prev, [t.id_ticket]: [ { id_comentario: Date.now(), comentario: `Actualizó metas (compromiso, visibilidad, prioridad)`, privado: true, created_at: new Date().toISOString(), autor: "Admin" }, ...(prev[t.id_ticket]||[]) ] }));
  };

  // Acciones - Técnicos
  const agregarTecnico = async (data) => {
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        alert('No estás autenticado. Por favor inicia sesión.');
        return;
      }

      // Crear técnico en la base de datos
      const nuevoTecnico = await tecnicosAPI.create(token, {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cargo: data.cargo,
        celular: data.celular,
        email: data.email || null
      });

      console.log('✅ Técnico externo creado exitosamente:', nuevoTecnico);

      // Agregar al estado local (adaptado para el formato del frontend)
      const tecnicoAdaptado = {
        id_empleado: nuevoTecnico.id_tecnico, // Usar id_tecnico como id_empleado para compatibilidad
        nombres: nuevoTecnico.nombres,
        apellidos: nuevoTecnico.apellidos,
        cargo: nuevoTecnico.cargo,
        celular: nuevoTecnico.celular,
        tipo: "externo"
      };

      setTecnicosExternos(prev => [...prev, tecnicoAdaptado]);
      alert('✅ Técnico externo agregado exitosamente');
    } catch (error) {
      console.error('❌ Error al crear técnico externo:', error);
      alert('Error al crear técnico externo: ' + (error.message || 'Error desconocido'));
    }
  };
  const eliminarTecnico = (tecnico) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${tecnico.nombres} ${tecnico.apellidos}?`)) {
      setTecnicosExternos(prev => prev.filter(e => e.id_empleado !== tecnico.id_empleado));
    }
  };

  // Cargar historial de seguimiento desde backend cuando se entra en la sección 'historial'
  useEffect(() => {
    const cargarHistorial = async () => {
      if (seccionPrincipal !== 'historial') return;
      try {
        const token = Cookies.get('token');
        if (!token) return;
        const resp = await ticketsAPI.getHistorialSeguimiento(token);
        // Si el backend devuelve un array directamente
        const registros = Array.isArray(resp) ? resp : (resp && resp.data && Array.isArray(resp.data) ? resp.data : []);
        setHistorialSeguimiento(registros);
      } catch (err) {
        console.error('Error cargando historial de seguimiento:', err);
      }
    };

    cargarHistorial();
  }, [seccionPrincipal]);

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          <Sidebar
            dark={dark}
            edificioName={edificioName}
            totalDepartamentos={0}
            currentPage="tickets_admin"
          />

          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🛠️</span>
                    <span className="font-medium">Tickets y Mantenimiento — Admin</span>
                  </div>

                  <div className="ms-auto flex items-center gap-2">
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

            {/* Navegación principal */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/50")}`}>
                {[
                  { id: "tickets", label: "Tickets y Mantenimiento" },
                  { id: "asignados", label: "Tickets Asignados" },
                  { id: "historial", label: "Historial de Seguimiento" },
                  { id: "agenda", label: "Agenda de Técnicos" },
                ].map(t => (
                  <button key={t.id} onClick={()=>setSeccionPrincipal(t.id)} className={`rounded-xl px-4 py-2 text-sm ${seccionPrincipal===t.id ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido según sección */}
            <div className="mx-auto max-w-7xl px-4 pt-4 space-y-6">
              {seccionPrincipal === 'tickets' && (
                <>
                  <FiltrosTickets dark={dark} onFilter={setFilters} />
                  <TablaTickets
                    dark={dark}
                    rows={filas}
                    onVer={verTicket}
                    onAsignar={abrirAsignar}
                    onSeguimiento={abrirSeguimiento}
                     onEliminar={eliminarTicket}
                  />
                </>
              )}

              {seccionPrincipal === 'asignados' && (
                <div className={`rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} overflow-hidden`}>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700/60">
                    <h3 className="text-lg font-semibold">Tickets Asignados a Técnicos</h3>
                    <p className="text-sm opacity-60 mt-1">Todos los tickets que tienen un técnico asignado actualmente</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`text-xs uppercase ${tone("bg-slate-50 text-slate-600", "bg-slate-900/50 text-slate-300")}`}>
                        <tr>
                          <th className="px-4 py-3 text-left">Código</th>
                          <th className="px-4 py-3 text-left">Título</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Prioridad</th>
                          <th className="px-4 py-3 text-left">Técnico Asignado</th>
                          <th className="px-4 py-3 text-left">Cargo</th>
                          <th className="px-4 py-3 text-left">Tipo</th>
                          <th className="px-4 py-3 text-left">Celular</th>
                          <th className="px-4 py-3 text-left">Fecha Asignación</th>
                          <th className="px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                        {ticketsAsignados.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-4 py-8 text-center text-sm opacity-60">
                              No hay tickets asignados aún
                            </td>
                          </tr>
                        ) : (
                          ticketsAsignados.map(t => (
                            <tr key={t.id_ticket} className={tone("hover:bg-slate-50", "hover:bg-slate-700/30")}>
                              <td className="px-4 py-3 font-mono text-sm">{t.codigo}</td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{t.titulo}</div>
                                <div className="text-xs opacity-60 truncate max-w-xs">{t.descripcion}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  t.estado === 'abierto' ? 'bg-orange-100 text-orange-700' :
                                  t.estado === 'en_progreso' ? 'bg-blue-100 text-blue-700' :
                                  t.estado === 'resuelto' ? 'bg-green-100 text-green-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.estado === 'en_progreso' ? 'En Progreso' : t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  t.prioridad === 'critica' ? 'bg-red-100 text-red-700' :
                                  t.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                                  t.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.prioridad.charAt(0).toUpperCase() + t.prioridad.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{t.tecnico_nombre}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">{t.tecnico_cargo || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  t.tipo_tecnico === 'interno' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                                }`}>
                                  {t.tipo_tecnico === 'interno' ? '🏢 Interno' : '👨‍🔧 Externo'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{t.tecnico_celular || '—'}</td>
                              <td className="px-4 py-3 text-xs opacity-60">
                                {new Date(t.fecha_asignacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  onClick={() => verTicket(t)}
                                  className={`rounded-lg px-3 py-1 text-xs font-medium ${tone("bg-blue-600 text-white hover:bg-blue-700", "bg-blue-500 text-white hover:bg-blue-600")}`}
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {seccionPrincipal === 'historial' && (
                <HistorialSeguimiento dark={dark} historial={historialSeguimiento} />
              )}

              {seccionPrincipal === 'agenda' && (
                <GestionTecnicos
                  dark={dark}
                  empleados={tecnicosExternos}
                  onAgregar={agregarTecnico}
                  onEliminar={eliminarTecnico}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {showDetalle && (
        <DetalleTicket
          dark={dark}
          ticket={showDetalle}
          comentarios={comentarios[showDetalle.id_ticket] || []}
          adjuntos={adjuntos[showDetalle.id_ticket] || []}
          onClose={()=>setShowDetalle(null)}
          onComentar={comentar}
          onSubir={subirAdjunto}
          onActualizarMeta={actualizarMeta}
        />
      )}

      {showAsignar && (
        <ModalAsignar
          dark={dark}
          ticket={showAsignar}
          empleadosInternos={empleadosInternos}
          tecnicosExternos={tecnicosExternos}
          onClose={()=>setShowAsignar(null)}
          onAsignarConfirm={confirmarAsignar}
        />
      )}

      {showSeguimiento && (
        <ModalSeguimiento
          dark={dark}
          ticket={showSeguimiento}
          onClose={()=>setShowSeguimiento(null)}
          onConfirmarSeguimiento={confirmarSeguimiento}
        />
      )}
    </div>
  );
}
