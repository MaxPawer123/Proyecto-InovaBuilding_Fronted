import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfile";
import Cookies from 'js-cookie';
import { ticketsAPI } from "../services/api";

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
function BarraProgreso({ estado }) {
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

// ======================== Notificaciones (UI) ===============================
function Bell({ count = 0, onClick, dark }) {
  const tone = (a,b)=> (dark?b:a);
  return (
    <button onClick={onClick} className={`relative rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100","border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>
      🔔
      {count>0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white px-1">
          {count}
        </span>
      )}
    </button>
  );
}

function PanelNotificaciones({ open, onClose, items = [], onLeer, onAbrir, dark }) {
  if (!open) return null;
  const tone = (a,b)=> (dark?b:a);
  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md border-l shadow-xl ${tone("bg-white border-slate-200","bg-slate-800 border-slate-700/60")}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="font-semibold">Notificaciones</div>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <div className="p-3 space-y-2 max-h-[calc(100%-56px)] overflow-auto">
          {items.map(n => (
            <div key={n.id} className={`rounded-xl border p-3 text-sm ${n.leida? 'opacity-70':''} ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{n.titulo}</div>
                <Badge toneName={n.tipo==='asignacion'?'blue':n.tipo==='estado'?'amber':'violet'}>{n.tipo}</Badge>
              </div>
              <div className="opacity-80 mt-1 whitespace-pre-wrap">{n.detalle}</div>
              <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                <div>{new Date(n.created_at).toLocaleString()}</div>
                <div className="space-x-2">
                  {!n.leida && <button onClick={()=>onLeer(n)} className={`rounded-lg px-2 py-1 ${tone('border border-slate-200','border-slate-600 border')}`}>Marcar leída</button>}
                  {n.id_ticket && <button onClick={()=>onAbrir(n)} className="rounded-lg bg-blue-600 px-2 py-1 text-white">Abrir ticket</button>}
                </div>
              </div>
            </div>
          ))}
          {items.length===0 && <div className="text-sm opacity-70 p-2">No tienes notificaciones</div>}
        </div>
      </aside>
    </div>
  );
}

// ======================== Subvistas Tickets ================================
function FiltrosTickets({ dark, onFilter, onCrear }) {
  const tone = (a,b)=> (dark?b:a);
  const [q, setQ] = useState("");

  useEffect(()=>{ onFilter({ q, estado: "", prioridad: "", desde: "", hasta: "" }); }, [q, onFilter]);

  return (
    <Card dark={dark}>
      <div className="p-4 flex gap-3">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar (código, título, descripción)" className={`flex-1 rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`} />
        <button onClick={onCrear} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95 whitespace-nowrap">+ Crear ticket</button>
      </div>
    </Card>
  );
}

function TablaMisTickets({ dark, rows, onVer }) {
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
                <td className="px-4 py-3 min-w-[120px]"><BarraProgreso estado={t.estado} /></td>
                <td className="px-4 py-3">{new Date(t.fecha_reporte).toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>onVer(t)} className={"rounded-lg px-3 py-1.5 text-xs "+tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}>Ver</button>
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center opacity-70">Aún no tienes tickets</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TablaTicketsAsignados({ dark, rows, onVer }) {
  const tone = (a,b)=> (dark?b:a);
  return (
    <Card dark={dark}>
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`border-b ${tone("border-slate-200 text-slate-500","border-slate-700/60 text-slate-400")} text-left`}>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const nombre = t.tecnico_nombre || '(sin asignar)';
              const cargo = t.tecnico_cargo || '—';
              const tipo = t.tipo_tecnico || '—';
              return (
                <tr key={t.id_ticket} className={`border-b ${tone("border-slate-100","border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                  <td className="px-4 py-3 font-mono text-xs">{t.codigo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{t.titulo}</div>
                    <div className="opacity-70 text-xs line-clamp-1">{t.descripcion}</div>
                  </td>
                  <td className="px-4 py-3">{nombre}</td>
                  <td className="px-4 py-3">{cargo}</td>
                  <td className="px-4 py-3 capitalize"><Badge toneName={tipo==='interno'?'blue':tipo==='externo'?'violet':'slate'}>{tipo}</Badge></td>
                  <td className="px-4 py-3 min-w-[120px]"><BarraProgreso estado={t.estado} /></td>
                  <td className="px-4 py-3">{new Date(t.fecha_reporte).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>onVer(t)} className={"rounded-lg px-3 py-1.5 text-xs "+tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}>Ver</button>
                  </td>
                </tr>
              );
            })}
            {rows.length===0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center opacity-70">No tienes tickets asignados aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TimelineAsignaciones({ items = [], dark }) {
  const tone = (a,b)=> (dark?b:a);
  if (!items.length) return <div className="text-sm opacity-70">(Sin asignaciones)</div>;
  return (
    <ul className="space-y-2 text-sm">
      {items.map(a => (
        <li key={a.id_asignacion} className={`rounded-xl border px-3 py-2 ${tone('border-slate-200 bg-white','border-slate-700/60 bg-slate-800')}`}>
          <div className="text-xs opacity-70">{new Date(a.fecha_asignacion).toLocaleString()}</div>
          <div><span className="font-medium">{a.empleado_nombre}</span> asignado por {a.asignado_por_nombre || 'Admin'}</div>
          {a.nota && <div className="opacity-80">{a.nota}</div>}
        </li>
      ))}
    </ul>
  );
}

function DetalleTicketResidente({ dark, ticket, adjuntos, onClose, asignadoInfo }) {
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
              {asignadoInfo?.tipo_tecnico && (
                <div className="text-sm">
                  <span className="font-medium">Tipo de técnico:</span>
                  <span className="ml-2 capitalize">{asignadoInfo.tipo_tecnico}</span>
                </div>
              )}
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

function ModalCrearTicket({ dark, onClose, onCrear }) {
  const tone = (a,b)=> (dark?b:a);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { titulo: "", descripcion: "", prioridad: "media" } });
  useEffect(()=>{ reset({ titulo: "", descripcion: "", prioridad: "media" }); }, [reset]);
  const [files, setFiles] = useState([]);
  const onFiles = (e) => setFiles(Array.from(e.target.files||[]));
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className={`w-full max-w-xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <h4 className="text-lg font-semibold">Nuevo ticket</h4>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <form onSubmit={handleSubmit((data)=> onCrear({ ...data, files }))} className="p-4 space-y-3">
          <Input label="Título" dark={dark} register={register("titulo",{required:"Requerido", minLength:{value:3,message:"Mín 3"}})} error={errors.titulo} />
          <Textarea label="Descripción" dark={dark} rows={5} register={register("descripcion",{required:"Requerido", minLength:{value:5,message:"Mín 5"}})} error={errors.descripcion} />
          <Select label="Prioridad" dark={dark} register={register("prioridad")}> 
            <option value="baja">baja</option>
            <option value="media">media</option>
            <option value="alta">alta</option>
          </Select>
          <label className="block text-sm">
            <span className="text-xs font-medium">Adjuntar fotos/videos (opcional)</span>
            <input type="file" multiple onChange={onFiles} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`} />
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
            <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>Enviar ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================= Página principal: Residente Tickets ==============



export default function ResidenteTicketsMantenimiento() {
  // THEME
  const [dark, setDark] = useState(false);
  const tone = (a,b)=> (dark?b:a);

  // Contexto general (mock)
  const edificioName = "Torre Aura";
  const usuarioActual = { nombre: "Ana", apellido: "Soria", email: "residente@edificio.com", rol: "Residente", avatar: "" };

  // control de tab local
  const [tab, setTab] = useState('tickets');

  // Mock datos
  const [tickets, setTickets] = useState([]);
  const [ticketsAsignados, setTicketsAsignados] = useState([]);
  const [asignadosMap, setAsignadosMap] = useState({});
  
  const [adjuntos, setAdjuntos] = useState({});
  const [filters, setFilters] = useState({ q: "", estado: "", prioridad: "", desde: "", hasta: "" });
  


  // Filtrar tickets
  const filas = useMemo(() => {
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

  // UI
  const [showCrear, setShowCrear] = useState(false);
  const [showDetalle, setShowDetalle] = useState(null);
  

  // Cargar tickets al montar el componente
  useEffect(() => {
    const cargarTickets = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          console.log('⚠️ No hay token, usuario no autenticado');
          return;
        }

        // Cargar tickets del residente
        const ticketsData = await ticketsAPI.list(token);
        setTickets(ticketsData);
        
        console.log('✅ Tickets cargados:', ticketsData);

        // Cargar tickets asignados (con técnico actual) para el residente
        try {
          const asignados = await ticketsAPI.getAsignadosResidente(token);
          setTicketsAsignados(asignados || []);
          const map = {};
          (asignados || []).forEach(r => { map[r.id_ticket] = r; });
          setAsignadosMap(map);
          console.log('✅ Tickets asignados (residente):', asignados?.length || 0);
        } catch (e) {
          console.warn('No se pudieron cargar tickets asignados del residente:', e?.message || e);
        }
      } catch (error) {
        console.error('❌ Error al cargar tickets:', error);
      }
    };

    cargarTickets();
  }, []);

  // Acciones
  const crearTicket = async (data) => {
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        alert('No estás autenticado. Por favor inicia sesión.');
        return;
      }

      // Crear ticket en la base de datos
      const nuevoTicket = await ticketsAPI.create(token, {
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        id_categoria: 1 // Por ahora usar categoría por defecto, puedes agregar un select después
      });

      console.log('✅ Ticket creado exitosamente:', nuevoTicket);

      // Agregar el ticket al estado local
      setTickets(prev => [nuevoTicket, ...prev]);
  setAdjuntos(prev => ({ ...prev, [nuevoTicket.id_ticket]: nuevoTicket.adjuntos || [] }));

      // Si hay archivos, subirlos después via FormData
      if (data.files?.length) {
        console.log('📎 Archivos a subir:', data.files);
        for (const file of data.files) {
          try {
            await ticketsAPI.uploadAdjunto(token, nuevoTicket.id_ticket, file);
          } catch (upErr) {
            console.error('Error subiendo adjunto:', upErr);
          }
        }
        // Refrescar ticket desde el backend para obtener adjuntos reales
        try {
          const actualizado = await ticketsAPI.getById(token, nuevoTicket.id_ticket);
          setTickets(prev => prev.map(t => t.id_ticket === actualizado.id_ticket ? actualizado : t));
          setAdjuntos(prev => ({ ...prev, [actualizado.id_ticket]: actualizado.adjuntos || [] }));
        } catch (refErr) {
          console.error('No se pudieron refrescar adjuntos:', refErr);
        }
      }

      alert('✅ Ticket creado exitosamente');
      setShowCrear(false);
    } catch (error) {
      console.error('❌ Error al crear ticket:', error);
      alert('Error al crear el ticket: ' + (error.message || 'Error desconocido'));
    }
  };
  const verTicket = async (t) => {
    setShowDetalle(t);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      const det = await ticketsAPI.getById(token, t.id_ticket);
      setAdjuntos(prev => ({ ...prev, [t.id_ticket]: det.adjuntos || [] }));
      // También actualiza el ticket mostrado por si cambió estado/asignaciones
      setTickets(prev => prev.map(x => x.id_ticket === det.id_ticket ? det : x));
      setShowDetalle(det);
    } catch (e) {
      console.error('No se pudo cargar detalle del ticket:', e);
    }
  };
 
  

  // (Sin handlers de notificaciones; esta vista usa el apartado de Seguimiento)

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <main className="w-full">
          {/* Topbar */}
          <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">📨</span>
                    <span className="font-medium">Mis Tickets de Mantenimiento</span>
                  </div>

                  <Link
                    to="/residente"
                    className={`rounded-xl px-3 py-2 text-sm ${tone(
                      "bg-white border border-slate-200 hover:bg-slate-100",
                      "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                    )}`}
                  >
                    Mi cuenta
                  </Link>

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

            {/* Acciones principales */}
            <div className="mx-auto max-w-7xl px-4 pt-4 space-y-6">
              {/* Tabs locales: Tickets vs Seguimiento */}
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/50")}`}>
                <button onClick={()=>setTab('tickets')} className={`rounded-xl px-4 py-2 text-sm ${tab==='tickets' ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>Mis tickets</button>
                <button onClick={()=>setTab('asignados')} className={`rounded-xl px-4 py-2 text-sm ${tab==='asignados' ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>Asignados</button>
                              </div>

              {tab==='tickets' && (
                <>
                  <FiltrosTickets dark={dark} onFilter={setFilters} onCrear={()=>setShowCrear(true)} />

                  <TablaMisTickets
                    dark={dark}
                    rows={filas}
                    onVer={verTicket}
                  />
                </>
              )}


              {tab==='asignados' && (
                <TablaTicketsAsignados
                  dark={dark}
                  rows={ticketsAsignados}
                  onVer={verTicket}
                />
              )}
            </div>
          </main>
        </div>

      {/* Modales */}
      {showCrear && (
        <ModalCrearTicket
          dark={dark}
          onClose={()=>setShowCrear(false)}
          onCrear={crearTicket}
        />
      )}

      {showDetalle && (
        <DetalleTicketResidente
          dark={dark}
          ticket={showDetalle}
          adjuntos={adjuntos[showDetalle.id_ticket] || []}
          asignadoInfo={asignadosMap[showDetalle.id_ticket]}
          onClose={()=>setShowDetalle(null)}
        />
      )}

      
    </div>
  );
}
