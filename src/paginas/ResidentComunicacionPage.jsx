import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import { comunicacionAPI } from "../services/api";
import Cookies from 'js-cookie';
import io from 'socket.io-client';

// =============================================================================
// Módulo: Comunicación Interna — Panel Residente
// Estética: igual a tu Dashboard/Usuarios (Tailwind + mismo Sidebar/UserProfile)
// Funcionalidades para RESIDENTE:
//  - Muro de Anuncios (listar + comentar)
//  - Mis Quejas (crear y ver estado)
//  - Votaciones (listar activas, ver detalle y VOTAR)
//  - Chat comunitario (salas, mensajes)
//
// IMPORTANTE (para tu backend):
//  Endpoints sugeridos (ajústalos a tu stack):
//   ANUNCIOS
//    GET   /api/anuncios?offset=&limit=
//    GET   /api/anuncios/:id/comentarios
//    POST  /api/anuncios/:id/comentarios { contenido, id_persona }
//
//   QUEJAS (Residente)
//    GET   /api/quejas?mine=1
//    POST  /api/quejas { asunto, descripcion, id_persona, id_departamento? }
//
//   VOTACIONES (Residente)
//    GET   /api/votaciones?estado=activa
//    GET   /api/votaciones/:id/opciones // con conteos opcionales
//    POST  /api/votos { id_votacion, id_opcion, id_persona }
//
//   CHAT
//    GET   /api/salas
//    GET   /api/salas/:id/mensajes?before=&limit=
//    POST  /api/salas/:id/mensajes { contenido, id_persona }
//
//  Mapea columnas 1:1 con tu BD (JS -> SQL):
//   - anuncio_comentarios: id_comentario, contenido, id_anuncio, id_persona
//   - quejas: id_queja, asunto, descripcion, estado, prioridad, id_persona, id_departamento
//   - votos: id_voto, id_votacion, id_opcion, id_persona
//   - mensajes_chat: id_mensaje, contenido, id_sala, id_persona
// =============================================================================

// ------------------------ UI Helpers (mismos estilos) -----------------------
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
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>;
}

// ------------------------ Panel: Anuncios (Residente) -----------------------
function AnunciosResidente({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [anuncios, setAnuncios] = useState([]);

  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = anuncios;
    const rows = term ? base.filter(a => a.titulo.toLowerCase().includes(term) || a.contenido.toLowerCase().includes(term)) : base;
    return rows.sort((a,b) => (b.fijado - a.fijado) || (new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)));
  }, [q, anuncios]);

  useEffect(()=>{
    (async ()=>{
      try {
        // Try helper first (it uses API_BASE_URL)
        try {
          const token = Cookies.get('token') || null;
          const res = await comunicacionAPI.listAnuncios(token);
          if (res && Array.isArray(res.data)) {
            setAnuncios(res.data || []);
            return;
          }
        } catch (e) {
          console.warn('comunicacionAPI.listAnuncios failed, falling back to direct fetch', e);
        }

        // Fallback to direct fetch
        try {
          const r = await fetch('http://localhost:8000/api/comunicacion/anuncios');
          if (r.ok) {
            const j = await r.json();
            setAnuncios(j && j.data ? j.data : []);
          } else {
            setAnuncios([]);
          }
        } catch (err) {
          console.error('Direct fetch anuncios failed', err);
          setAnuncios([]);
        }
      } catch (err) {
        console.error('Error cargando anuncios', err);
      }
    })();
  },[]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar anuncios" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {filtrados.map(a => (
          <Card key={a.id_anuncio} dark={dark}>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{a.titulo}</div>
                <div className="flex gap-2 items-center">
                  {a.fijado && <Badge toneName="violet">Fijado</Badge>}
                </div>
              </div>
              <div className="opacity-80 whitespace-pre-wrap">{a.contenido}</div>
              <div className="text-xs opacity-70">{new Date(a.fecha_publicacion).toLocaleString()}</div>
            </div>
          </Card>
        ))}
        {filtrados.length===0 && <Card dark={dark}><div className="p-4 text-sm opacity-70">Sin anuncios</div></Card>}
      </div>
    </div>
  );
}

// ------------------------ Panel: Mis Quejas (Residente) ---------------------
function MisQuejas({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [quejas, setQuejas] = useState([]);

  const fetchQuejas = async () => {
    try {
      const token = Cookies.get('token');
      const res = await comunicacionAPI.listMisQuejas(token);
      if (res && Array.isArray(res.data)) {
        setQuejas(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else {
        setQuejas([]);
      }
    } catch (error) {
      console.error("Error fetching quejas:", error);
      setQuejas([]);
    }
  };

  useEffect(() => {
    fetchQuejas();
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { asunto: "", descripcion: "", prioridad: "media" }
  });

  const onSubmit = async (data) => {
    try {
      const token = Cookies.get('token');
      // El id_persona se adjuntará en el backend a partir del token
      await comunicacionAPI.createQueja(token, data);
      await fetchQuejas(); // Re-fetch para mostrar la nueva queja
      reset({ asunto: "", descripcion: "", prioridad: "media" });
    } catch (error) {
      console.error("Error creando queja:", error);
      alert(`Error al enviar la queja: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4">
          <div className="mb-3 text-lg font-semibold">Crear nueva queja</div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
            <Input label="Asunto" dark={dark} register={register("asunto", { required: "Requerido", minLength:{ value: 3, message: "Mín 3" } })} error={errors.asunto} />
            <Select label="Prioridad" dark={dark} register={register("prioridad")}> 
              <option value="baja">baja</option>
              <option value="media">media</option>
              <option value="alta">alta</option>
            </Select>
            <div className="sm:col-span-2">
              <Textarea label="Descripción" dark={dark} rows={5} register={register("descripcion", { required: "Requerido", minLength:{ value: 5, message: "Mín 5" } })} error={errors.descripcion} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">Enviar queja</button>
            </div>
          </form>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          <div className="mb-3 text-lg font-semibold">Mis quejas</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creada</th>
              </tr>
            </thead>
            <tbody>
              {quejas.map(qj => (
                <tr key={qj.id_queja} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{qj.asunto}</div>
                    <div className="opacity-70 text-xs line-clamp-1">{qj.descripcion}</div>
                  </td>
                  <td className="px-4 py-3"><Badge toneName={qj.prioridad==='alta'?'red':qj.prioridad==='media'?'amber':'blue'}>{qj.prioridad}</Badge></td>
                  <td className="px-4 py-3"><Badge toneName={qj.estado==='abierta'?'amber':qj.estado==='en_progreso'?'blue':qj.estado==='resuelta'?'green':'slate'}>{qj.estado}</Badge></td>
                  <td className="px-4 py-3">{new Date(qj.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {quejas.length===0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center opacity-70">Aún no registraste quejas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ------------------------ Panel: Votaciones (Residente) ---------------------
function VotacionesResidente({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [vots, setVots] = useState(() => [
    // start empty; we'll load from backend
  ]);
  const [opciones, setOpciones] = useState({});
  const [yaVote, setYaVote] = useState({});

  // Load votaciones on mount
  useEffect(()=>{
    (async ()=>{
      try {
        const token = Cookies.get('token') || null;
        try {
          const res = await comunicacionAPI.listVotaciones(token);
          if (res && Array.isArray(res.data)) {
            setVots(res.data || []);
          }
        } catch (e) {
          console.warn('comunicacionAPI.listVotaciones failed, will try direct fetch', e);
        }

        if (!vots || vots.length===0) {
          try {
            const r = await fetch('http://localhost:8000/api/comunicacion/votaciones');
            if (r.ok) {
              const j = await r.json();
              setVots(j && j.data ? j.data : []);
            } else {
              setVots([]);
            }
          } catch (err) {
            console.error('Direct fetch votaciones failed', err);
            setVots([]);
          }
        }
      } catch (err) {
        console.error('Error cargando votaciones', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // When votaciones change, load opciones and detect if user already voted
  useEffect(()=>{
    if (!vots || vots.length===0) return;
    (async ()=>{
      try {
        const token = Cookies.get('token') || null;
        const newOpc = {};
        const voted = {};
        for (const v of vots) {
          try {
            const res = await comunicacionAPI.getVotacion(token, v.id_votacion);
            if (res && res.data) {
              newOpc[v.id_votacion] = res.data.opciones || [];
              // if API returns votos and currentPersonaId present, check
              if (Array.isArray(res.data.votos) && currentPersonaId) {
                voted[v.id_votacion] = res.data.votos.some(x=>x.id_persona===currentPersonaId);
              }
            }
          } catch (e) {
            // fallback per-votacion fetch
            try {
              const r = await fetch(`http://localhost:8000/api/comunicacion/votaciones/${v.id_votacion}`);
              if (r.ok) {
                const j = await r.json();
                if (j && j.data) {
                  newOpc[v.id_votacion] = j.data.opciones || [];
                  if (Array.isArray(j.data.votos) && currentPersonaId) voted[v.id_votacion] = j.data.votos.some(x=>x.id_persona===currentPersonaId);
                }
              }
            } catch (er) {
              console.warn('Could not fetch votacion details for', v.id_votacion, er);
            }
          }
        }
        setOpciones(newOpc);
        setYaVote(voted);
      } catch (err) {
        console.error('Error cargando opciones/votos para votaciones', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[vots]);

  const votar = async (id_votacion, id_opcion) => {
    // TODO: POST /api/votos { id_votacion, id_opcion, id_persona: currentPersonaId }
    setYaVote(prev => ({ ...prev, [id_votacion]: true }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {vots.filter(v=>v.estado==='activa').map(v => (
          <Card key={v.id_votacion} dark={dark}>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{v.titulo}</div>
                <Badge toneName="green">activa</Badge>
              </div>
              {v.descripcion && <div className="text-sm opacity-80 whitespace-pre-wrap">{v.descripcion}</div>}
              <div className="text-xs opacity-70">{new Date(v.inicio).toLocaleString()} → {new Date(v.fin).toLocaleString()}</div>
              <div className="space-y-2">
                {(opciones[v.id_votacion]||[]).map(o => (
                  <button key={o.id_opcion} disabled={yaVote[v.id_votacion]} onClick={()=>votar(v.id_votacion, o.id_opcion)} className={`w-full rounded-xl border px-4 py-2 text-left ${tone("border-slate-200 bg-white hover:bg-slate-50", "border-slate-700/60 bg-slate-800 hover:bg-slate-800/60")} disabled:opacity-60`}>
                    {o.texto}
                  </button>
                ))}
                {(opciones[v.id_votacion]||[]).length===0 && <div className="opacity-70 text-sm">(Sin opciones)</div>}
              </div>
              {yaVote[v.id_votacion] && <div className="text-sm text-emerald-600 dark:text-emerald-300">¡Voto registrado!</div>}
            </div>
          </Card>
        ))}
        {vots.filter(v=>v.estado==='activa').length===0 && <Card dark={dark}><div className="p-4 text-sm opacity-70">No hay votaciones activas</div></Card>}
      </div>
    </div>
  );
}

// ------------------------ Panel: Chat (Residente) ---------------------------
function ChatResidente({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [salas, setSalas] = useState([]);
  const [mensajes, setMensajes] = useState({});
  const [salaSel, setSalaSel] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Obtener ID del usuario actual desde las cookies
  useEffect(() => {
    try {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        const user = JSON.parse(userCookie);
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error parsing user cookie:', err);
    }
  }, []);

  const enviar = () => {
    if (!nuevoMensaje.trim() || !salaSel || !socket || !currentUserId) return;
    
    // Enviar mensaje via WebSocket para tiempo real
    socket.emit('sendMessage', {
      id_sala: salaSel,
      id_user: currentUserId,
      contenido: nuevoMensaje.trim()
    });
    
    setNuevoMensaje('');
  };

  // Cargar salas y mensajes al montar
  useEffect(()=>{
    (async ()=>{
      try {
        const token = Cookies.get('token');
        // Cargar salas
        const salasRes = await comunicacionAPI.listSalas(token);
        const list = salasRes.data || [];
        setSalas(list);
        // Seleccionar primera sala y cargar sus mensajes
        if (list.length) {
          const id = list[0].id_sala;
          setSalaSel(id);
          const msgsRes = await comunicacionAPI.listMensajes(token, id);
          setMensajes(prev => ({ ...prev, [id]: msgsRes.data || [] }));
        }
      } catch (err) {
        console.error('Error cargando salas/mensajes', err);
      }
    })();
  },[]);

  // Inicializar WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    
    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
    });

    newSocket.on('newMessage', (mensaje) => {
      console.log('📩 Nuevo mensaje recibido:', mensaje);
      setMensajes(prev => ({
        ...prev,
        [mensaje.id_sala]: [...(prev[mensaje.id_sala] || []), mensaje]
      }));
    });

    newSocket.on('errorMessage', (error) => {
      console.error('❌ Error del servidor:', error);
      alert('Error al enviar mensaje: ' + error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Unirse a la sala cuando cambia
  useEffect(() => {
    if (!socket || !salaSel) return;
    
    socket.emit('joinRoom', { id_sala: salaSel });
    console.log(`🚪 Unido a sala ${salaSel}`);
    
    return () => {
      socket.emit('leaveRoom', { id_sala: salaSel });
    };
  }, [socket, salaSel]);

  // Cargar mensajes al cambiar de sala
  useEffect(()=>{
    if (!salaSel) return;
    if (mensajes[salaSel]) return; // ya cargados
    (async ()=>{
      try {
        const token = Cookies.get('token');
        const msgsRes = await comunicacionAPI.listMensajes(token, salaSel);
        setMensajes(prev => ({ ...prev, [salaSel]: msgsRes.data || [] }));
      } catch (err) {
        console.error('Error cargando mensajes', err);
      }
    })();
  },[salaSel]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Salas */}
        <Card dark={dark}>
          <div className="p-4">
            <div className="mb-2 text-lg font-semibold">Salas</div>
            <ul className="space-y-2 text-sm">
              {salas.map(s => (
                <li key={s.id_sala} onClick={()=>setSalaSel(s.id_sala)} className={`flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer ${salaSel===s.id_sala ? 'ring-2 ring-blue-500' : ''} ${tone("border-slate-100 hover:bg-slate-50", "border-slate-700/40 hover:bg-slate-800/40")}`}>
                  <span className="font-medium">{s.nombre}</span>
                  <Badge toneName={s.tipo==='general'?'blue':'violet'}>{s.tipo}</Badge>
                </li>
              ))}
              {salas.length===0 && <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")} opacity-70`}>Sin salas</li>}
            </ul>
          </div>
        </Card>

        {/* Chat */}
        <Card dark={dark} className="lg:col-span-2">
          <div className="p-4 flex flex-col h-[420px]">
            <div className="mb-2 text-lg font-semibold">Chat — {salas.find(s=>s.id_sala===salaSel)?.nombre || '...'}</div>
            <div className={`flex-1 overflow-auto rounded-xl p-3 ${tone('bg-slate-50','bg-slate-900/40')}`}>
              <ul className="space-y-2 text-sm">
                {(mensajes[salaSel]||[]).map(m => {
                  const esPropio = m.id_user === currentUserId;
                  const nombreCompleto = m.nombres && m.apellidos
                    ? `${m.nombres} ${m.apellidos}`
                    : 'Usuario';

                  return (
                    <li key={m.id_mensaje} className={`max-w-[80%] rounded-xl border px-3 py-2 ${tone('border-slate-200 bg-white','border-slate-700/60 bg-slate-800')} ${esPropio ? 'ml-auto bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="text-xs opacity-70">
                        {nombreCompleto} — {new Date(m.created_at).toLocaleTimeString()}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                    </li>
                  );
                })}
                {(mensajes[salaSel]||[]).length===0 && <li className="opacity-70">(Sin mensajes)</li>}
              </ul>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input 
                value={nuevoMensaje} 
                onChange={(e)=>setNuevoMensaje(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && enviar()}
                placeholder="Escribe un mensaje" 
                className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} 
              />
              <button onClick={enviar} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Enviar</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ------------------------ Página principal: Residente Comunicación -----------
export default function ResidentComunicacionPage() {
  // THEME (igual que el dashboard)
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // Contexto general (mock). id_persona actual del residente logueado.
  const edificioName = "Torre Aura";
  const usuarioActual = { nombre: "Ana", apellido: "Soria", email: "residente@edificio.com", rol: "Residente", avatar: "" };
  const currentPersonaId = 101; // <- importante para crear registros (autor)

  const [tab, setTab] = useState("anuncios");

  const handleLogout = () => {
    alert("Logout (implementar con backend)");
  };

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          

          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🏠</span>
                    <span className="font-medium">Comunicación interna — Residente</span>
                  </div>

                  <nav className="flex-1">
                    <ul className="flex flex-wrap gap-2 text-sm">
                      <li>
                        <Link
                          to="/residente"
                          className={`rounded-xl px-3 py-2 ${tone(
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Mi cuenta
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/residente/consumo"
                          className={`rounded-xl px-3 py-2 ${tone(
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Ver Consumos
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/mis-pagos"
                          className={`rounded-xl px-3 py-2 ${tone(
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Ver mis pagos
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/mis-reservas"
                          className={`rounded-xl px-3 py-2 ${tone(
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Reservas
                        </Link>
                      </li>
                    </ul>
                  </nav>

                  <div className="ms-auto flex items-center gap-2">
                    <button onClick={() => setDark((d) => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                    <UserProfile
                      dark={dark}
                      usuarioActual={usuarioActual}
                      edificioName={edificioName}
                      onLogout={handleLogout}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/50")}`}>
                {[
                  { id: "anuncios", label: "Muro de Anuncios" },
                  { id: "quejas", label: "Mis Quejas" },
                  { id: "votaciones", label: "Votaciones" },
                  { id: "chat", label: "Chat comunitario" },
                ].map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6">
              {tab === 'anuncios' && <AnunciosResidente dark={dark} currentPersonaId={currentPersonaId} />}
              {tab === 'quejas' && <MisQuejas dark={dark} currentPersonaId={currentPersonaId} />}
              {tab === 'votaciones' && <VotacionesResidente dark={dark} currentPersonaId={currentPersonaId} />}
              {tab === 'chat' && <ChatResidente dark={dark} currentPersonaId={currentPersonaId} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
