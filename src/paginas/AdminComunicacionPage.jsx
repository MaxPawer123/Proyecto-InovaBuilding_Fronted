import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import io from 'socket.io-client';


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

// ------------------------ Panel: Anuncios (Admin) ---------------------------
import { comunicacionAPI } from "../services/api";
import Cookies from 'js-cookie';

function AnunciosAdmin({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [anuncios, setAnuncios] = useState([]);

  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // anuncio
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    mode: "onChange",
    defaultValues: { titulo: "", contenido: "", fijado: false }
  });

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = anuncios;
    const rows = term ? base.filter(a => a.titulo.toLowerCase().includes(term) || a.contenido.toLowerCase().includes(term)) : base;
    return rows.sort((a,b) => (b.fijado - a.fijado) || (new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)));
  }, [q, anuncios]);

  const openCreate = () => { setEditing(null); reset({ titulo: "", contenido: "", fijado: false }); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); reset({ titulo: a.titulo, contenido: a.contenido, fijado: !!a.fijado }); setShowModal(true); };

  const onSubmit = async (data) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('Debe iniciar sesión con una cuenta con permisos de administrador');
        return;
      }

      if (editing) {
        // PATCH via API helper
        await comunicacionAPI.patchAnuncio(token, editing.id_anuncio, data);
        // Refresh list
        const res = await comunicacionAPI.listAnuncios(token);
        setAnuncios(res.data || []);
      } else {
        // Create anuncio with explicit fetch to ensure JSON body + headers
        const payload = { titulo: data.titulo, contenido: data.contenido, fijado: !!data.fijado };
        const r = await fetch('http://localhost:8000/api/comunicacion/anuncios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const rbody = await r.json().catch(()=>null);
        if (!r.ok) {
          const msg = rbody && rbody.message ? rbody.message : `Error creando anuncio (${r.status})`;
          throw new Error(msg);
        }
        // Refresh list
        const res = await comunicacionAPI.listAnuncios(token);
        setAnuncios(res.data || []);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error guardando anuncio', err);
      const msg = err && err.message ? err.message : 'Error al guardar anuncio';
      alert(`Error al guardar anuncio: ${msg}`);
    }
  };

  const eliminar = (id) => {
    (async ()=>{
      try {
        const token = Cookies.get('token');
        await comunicacionAPI.deleteAnuncio(token, id);
        const res = await comunicacionAPI.listAnuncios(token);
        setAnuncios(res.data || []);
      } catch (err) {
        console.error('Error eliminando', err);
        alert('Error eliminando anuncio');
      }
    })();
  };

  // Cargar anuncios desde API al montar
  useEffect(()=>{
    (async ()=>{
      try {
        const token = Cookies.get('token');
        const res = await comunicacionAPI.listAnuncios(token);
        setAnuncios(res.data || []);
      } catch (err) {
        console.error('Error cargando anuncios', err);
      }
    })();
  },[]);

  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar anuncios" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
          <button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95">+ Nuevo anuncio</button>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Fijado</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id_anuncio} onClick={()=>setSelected(a)} className={`border-b ${tone("border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer`}>
                  <td className="px-4 py-3 font-medium">{a.titulo}</td>
                  <td className="px-4 py-3">{a.fijado ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">{new Date(a.fecha_publicacion).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={(e)=>{e.stopPropagation(); openEdit(a);}} className={`rounded-lg px-3 py-1.5 text-xs ${tone("border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Editar</button>
                    <button onClick={(e)=>{e.stopPropagation(); eliminar(a.id_anuncio);}} className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length===0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center opacity-70">Sin anuncios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4">
          <div className="mb-2 text-lg font-semibold">Detalle</div>
          {selected ? (
            <div className="space-y-2 text-sm">
              <div className="text-xl font-semibold">{selected.titulo}</div>
              <div className="opacity-80 whitespace-pre-wrap">{selected.contenido}</div>
              <div className="flex gap-2 pt-1">
                {selected.fijado && <Badge toneName="violet">Fijado</Badge>}
              </div>
              <div className="text-xs opacity-70">Publicado: {new Date(selected.fecha_publicacion).toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-sm opacity-70">Selecciona un anuncio para ver el detalle.</div>
          )}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-xl rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">{editing?"Editar anuncio":"Nuevo anuncio"}</h4>
              <button onClick={()=>setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200", "border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
              <Input label="Título" dark={dark} register={register("titulo",{required:"Requerido", minLength:{value:3,message:"Mín 3"}})} error={errors.titulo} />
              <Textarea label="Contenido" dark={dark} rows={6} register={register("contenido",{required:"Requerido", minLength:{value:5,message:"Mín 5"}})} error={errors.contenido} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("fijado")} /> Fijado
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>{editing?"Guardar cambios":"Publicar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------ Panel: Quejas (Admin) -----------------------------
function QuejasAdmin({ dark }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [quejas, setQuejas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar quejas desde la BD
  useEffect(() => {
    const fetchQuejas = async () => {
      try {
        const token = Cookies.get('token');
        console.log('🔍 API Request:', { endpoint: '/comunicacion/quejas', estado });
        
        // Construir parámetros de consulta
        const queryParams = {};
        if (estado) queryParams.estado = estado;
        
        const response = await comunicacionAPI.listQuejas(token, queryParams);
        console.log('✅ Quejas obtenidas:', response);
        
        if (response && response.success && response.data) {
          setQuejas(response.data);
        } else {
          setQuejas([]);
        }
      } catch (error) {
        console.error('Error fetching quejas:', error);
        setQuejas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuejas();
  }, [estado]); // Recargar cuando cambie el filtro de estado

  const filtradas = useMemo(()=>{
    let rows = quejas;
    const term = q.trim().toLowerCase();
    if (term) rows = rows.filter(qj => qj.asunto.toLowerCase().includes(term) || qj.descripcion.toLowerCase().includes(term));
    return rows.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  }, [q, quejas]);

  const cambiarEstado = async (id_queja, nuevo) => {
    try {
      const token = Cookies.get('token');
      await comunicacionAPI.updateQuejaEstado(token, id_queja, { estado: nuevo });
      
      // Actualizar el estado localmente
      setQuejas(prev => prev.map(qj => qj.id_queja === id_queja ? { ...qj, estado: nuevo } : qj));
      console.log(`✅ Estado de queja ${id_queja} actualizado a: ${nuevo}`);
    } catch (error) {
      console.error('Error actualizando estado de queja:', error);
      alert('Error al actualizar el estado de la queja');
    }
  };

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar quejas" className={`flex-1 rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
          <select value={estado} onChange={(e)=>setEstado(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
            <option value="">Estado: todos</option>
            <option value="pendiente">pendiente</option>
            <option value="abierta">abierta</option>
            <option value="en_progreso">en_progreso</option>
            <option value="resuelta">resuelta</option>
            <option value="cerrada">cerrada</option>
          </select>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center opacity-70">Cargando quejas...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                  <th className="px-4 py-3">Asunto</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creada</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((qj)=>(
                  <tr key={qj.id_queja} className={`border-b ${tone("border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{qj.asunto}</div>
                      <div className="opacity-70 text-xs line-clamp-1">{qj.descripcion}</div>
                    </td>
                    <td className="px-4 py-3"><Badge toneName={qj.prioridad==='alta'?'red':qj.prioridad==='media'?'amber':'blue'}>{qj.prioridad}</Badge></td>
                    <td className="px-4 py-3"><Badge toneName={qj.estado==='pendiente'||qj.estado==='abierta'?'amber':qj.estado==='en_progreso'?'blue':qj.estado==='resuelta'?'green':'slate'}>{qj.estado}</Badge></td>
                    <td className="px-4 py-3">{new Date(qj.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <select value={qj.estado} onChange={(e)=>cambiarEstado(qj.id_queja, e.target.value)} className={`rounded-xl border px-2 py-1 text-xs ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
                        <option value="pendiente">pendiente</option>
                        <option value="abierta">abierta</option>
                        <option value="en_progreso">en_progreso</option>
                        <option value="resuelta">resuelta</option>
                        <option value="cerrada">cerrada</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filtradas.length===0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center opacity-70">Sin quejas</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// ------------------------ Panel: Votaciones (Admin) -------------------------
function VotacionesAdmin({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [vots, setVots] = useState([]);
  const [opciones, setOpciones] = useState({});
  const [votos, setVotos] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { titulo: "", descripcion: "", inicio: "", fin: "", opciones: "Sí, aprobar\nNo, rechazar" }
  });

  const abrirNueva = () => { reset({ titulo: "", descripcion: "", inicio: new Date().toISOString().slice(0,16), fin: new Date(Date.now()+3*24*3600*1000).toISOString().slice(0,16), opciones: "Sí, aprobar\nNo, rechazar" }); setShowModal(true); };

  const crearVotacion = async (data) => {
    try {
      const token = Cookies.get('token');
      if (!token) { alert('Debe iniciar sesión'); return; }

      // Client-side validation
      if (!data.titulo || !data.titulo.toString().trim()) { alert('El título es requerido'); return; }
      if (!data.inicio || !data.fin) { alert('Debes especificar fecha de inicio y fin'); return; }
      const inicioTs = new Date(data.inicio);
      const finTs = new Date(data.fin);
      if (isNaN(inicioTs.getTime()) || isNaN(finTs.getTime())) { alert('Fechas inválidas'); return; }
      if (inicioTs >= finTs) { alert('La fecha de inicio debe ser anterior a la fecha de fin'); return; }

      const opcionesArr = data.opciones.split('\n').map(s=>s.trim()).filter(Boolean);
      if (!Array.isArray(opcionesArr) || opcionesArr.length < 2) { alert('Debe indicar al menos 2 opciones (una por línea)'); return; }

      const payload = { titulo: data.titulo.toString().trim(), descripcion: data.descripcion || '', inicio: inicioTs.toISOString(), fin: finTs.toISOString(), opciones: opcionesArr };
      // Use explicit fetch to guarantee Content-Type + Authorization are sent correctly
      const r = await fetch('http://localhost:8000/api/comunicacion/votaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const rbody = await r.json().catch(()=>null);
      if (!r.ok) {
        const msg = rbody && rbody.message ? rbody.message : `Error creando votación (${r.status})`;
        throw new Error(msg);
      }
      // Refresh list
      const list = await comunicacionAPI.listVotaciones(token);
      setVots(list.data || []);
      setShowModal(false);
    } catch (err) {
      console.error('Error creando votación', err);
      alert(err && err.message ? err.message : 'Error creando votación');
    }
  };

  const cerrar = (id_votacion) => {
    // TODO: PATCH /api/votaciones/:id/estado { estado: 'cerrada' }
    setVots(prev => prev.map(v=> v.id_votacion===id_votacion ? { ...v, estado: 'cerrada' } : v));
  };

  const conteo = (id_votacion) => {
    const ops = opciones[id_votacion] || [];
    const counts = {};
    ops.forEach(o => counts[o.id_opcion] = 0);
    votos.filter(v=>v.id_votacion===id_votacion).forEach(v => { counts[v.id_opcion] = (counts[v.id_opcion]||0)+1; });
    return counts;
  };

  // Load votaciones when this panel mounts
  useEffect(()=>{
    (async ()=>{
      try {
        const token = Cookies.get('token');
        // Try the API helper first (will use Authorization if token present)
        try {
          const vRes = await comunicacionAPI.listVotaciones(token);
          if (vRes && Array.isArray(vRes.data)) {
            setVots(vRes.data || []);
          }
        } catch (err) {
          console.warn('comunicacionAPI.listVotaciones failed, will try direct fetch', err);
        }

        // If still empty, try direct fetch (no auth required on server for GET)
        if (!vots || vots.length === 0) {
          try {
            const r = await fetch('http://localhost:8000/api/comunicacion/votaciones');
            if (r.ok) {
              const json = await r.json();
              setVots(json && json.data ? json.data : []);
            } else {
              setVots([]);
            }
          } catch (e) {
            console.error('direct fetch votaciones failed', e);
            setVots([]);
          }
        }

        // Optionally fetch opciones and votos for each votacion (lightweight):
        // We'll iterate vots after they are set via separate effect below.
      } catch (err) {
        console.error('Error cargando votaciones', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // When votaciones list changes, fetch opciones and votos counts for each
  useEffect(()=>{
    if (!vots || vots.length===0) return;
    (async ()=>{
      try {
        const token = Cookies.get('token');
        const newOpc = {};
        const allVotos = [];
        for (const v of vots) {
          try {
            const res = await comunicacionAPI.getVotacion(token, v.id_votacion);
            if (res && res.data) {
              newOpc[v.id_votacion] = res.data.opciones || [];
              // res.data.votos maybe present depending on API; normalize
              if (Array.isArray(res.data.votos)) {
                allVotos.push(...res.data.votos.map(x=>({ ...x, id_votacion: v.id_votacion })));
              }
            }
          } catch (e) {
            // try direct fetch for this votacion
            try {
              const r = await fetch(`http://localhost:8000/api/comunicacion/votaciones/${v.id_votacion}`);
              if (r.ok) {
                const j = await r.json();
                if (j && j.data) {
                  newOpc[v.id_votacion] = j.data.opciones || [];
                  if (Array.isArray(j.data.votos)) {
                    allVotos.push(...j.data.votos.map(x=>({ ...x, id_votacion: v.id_votacion })));
                  }
                }
              }
            } catch (er) {
              console.warn('Could not fetch votacion details for', v.id_votacion, er);
            }
          }
        }
        setOpciones(newOpc);
        setVotos(allVotos);
      } catch (err) {
        console.error('Error cargando opciones/votos para votaciones', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[vots]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">Votaciones</div>
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{vots.length}</div>
          </div>
          <button onClick={abrirNueva} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95">+ Nueva votación</button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {vots.map(v => {
          const c = conteo(v.id_votacion);
          const ops = opciones[v.id_votacion] || [];
          const total = Object.values(c).reduce((a,b)=>a+b,0);
          return (
            <Card key={v.id_votacion} dark={dark}>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{v.titulo}</div>
                  <Badge toneName={v.estado==='activa'?'green':'slate'}>{v.estado}</Badge>
                </div>
                {v.descripcion && <div className="text-sm opacity-80 whitespace-pre-wrap">{v.descripcion}</div>}
                <div className="text-xs opacity-70">{new Date(v.inicio).toLocaleString()} → {new Date(v.fin).toLocaleString()}</div>
                <ul className="space-y-2 text-sm">
                  {ops.map(o => (
                    <li key={o.id_opcion} className="flex items-center justify-between">
                      <span>- {o.texto}</span>
                      <span className="font-semibold">{c[o.id_opcion] || 0}</span>
                    </li>
                  ))}
                  {ops.length===0 && <li className="opacity-70">(Sin opciones)</li>}
                </ul>
                <div className="pt-2 flex justify-end gap-2">
                  {v.estado==='activa' && (
                    <button onClick={()=>cerrar(v.id_votacion)} className="rounded-xl bg-amber-600/90 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600">Cerrar</button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {vots.length===0 && (
          <Card dark={dark}><div className="p-4 text-sm opacity-70">No hay votaciones</div></Card>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-xl rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">Nueva votación</h4>
              <button onClick={()=>setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200", "border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(crearVotacion)} className="p-4 space-y-3">
              <Input label="Título" dark={dark} register={register("titulo",{required:"Requerido"})} error={errors.titulo} />
              <Textarea label="Descripción" dark={dark} rows={4} register={register("descripcion")} error={errors.descripcion} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input type="datetime-local" label="Inicio" dark={dark} register={register("inicio",{required:"Requerido"})} error={errors.inicio} />
                <Input type="datetime-local" label="Fin" dark={dark} register={register("fin",{required:"Requerido"})} error={errors.fin} />
              </div>
              <Textarea label={"Opciones (una por línea)"} dark={dark} rows={4} register={register("opciones",{required:"Requerido", minLength:{value:3,message:"Mín 1 opción"}})} error={errors.opciones} />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------ Panel: Chat (Admin) --------------------------------
function ChatAdmin({ dark, currentPersonaId }) {
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);
  const [salas, setSalas] = useState([]);
  const [mensajes, setMensajes] = useState({});
  const [salaSel, setSalaSel] = useState(1);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [showSalaModal, setShowSalaModal] = useState(false);
  const [editingSala, setEditingSala] = useState(null);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { nombre: "", tipo: "general" } });

  // Inicializar WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    
    newSocket.on('connect', () => {
      console.log('✅ Admin conectado a WebSocket');
    });

    newSocket.on('newMessage', (mensaje) => {
      console.log('📨 Nuevo mensaje recibido (admin):', mensaje);
      setMensajes(prev => ({
        ...prev,
        [mensaje.id_sala]: [...(prev[mensaje.id_sala] || []), mensaje]
      }));
    });

    newSocket.on('errorMessage', (error) => {
      console.error('❌ Error en mensaje:', error);
      alert('Error: ' + error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Obtener userId del token actual
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      } catch (e) {
        console.error('Error parseando token', e);
      }
    }
  }, []);

  // Join/leave salas cuando cambia salaSel
  useEffect(() => {
    if (!socket || !salaSel) return;
    
    socket.emit('joinRoom', { id_sala: salaSel });
    console.log(`🚪 Admin se unió a sala ${salaSel}`);

    return () => {
      socket.emit('leaveRoom', { id_sala: salaSel });
      console.log(`🚪 Admin salió de sala ${salaSel}`);
    };
  }, [socket, salaSel]);

  const crearSala = (data) => {
    (async ()=>{
      try {
        console.log('crearSala called with data:', data);
        // basic client-side validation to avoid empty nombre being sent
        if (!data || !data.nombre || !data.nombre.toString().trim()) {
          alert('El nombre de la sala es obligatorio');
          return;
        }
        const token = Cookies.get('token');
        if (!token) {
          alert('Debe iniciar sesión con una cuenta con permisos de administrador');
          return;
        }

        if (editingSala) {
          // Modo edición
          const payload = { nombre: data.nombre.toString().trim(), tipo: data.tipo };
          await comunicacionAPI.updateSala(token, editingSala.id_sala, payload);
          console.log(`✅ Sala ${editingSala.id_sala} actualizada`);
        } else {
          // Modo creación
          const payload = { nombre: data.nombre.toString().trim(), tipo: data.tipo };
          console.log('crearSala sending payload:', payload, 'token present?', !!token);
          const r = await fetch('http://localhost:8000/api/comunicacion/salas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const rbody = await r.json().catch(()=>null);
          if (!r.ok) {
            const msg = rbody && rbody.message ? rbody.message : `Error creando sala (${r.status})`;
            throw new Error(msg);
          }
          const res = rbody;
          setMensajes(prev => ({ ...prev, [res.data.id_sala]: [] }));
        }
        
        // Refrescar lista de salas
        const salasRes = await comunicacionAPI.listSalas(token);
        setSalas(salasRes.data || []);
        setShowSalaModal(false);
        setEditingSala(null);
      } catch (err) {
        console.error('Error con sala', err);
        const msg = err && err.body && err.body.message ? err.body.message : err.message || 'Error con sala';
        alert(`Error: ${msg}`);
      }
    })();
  };

  const editarSala = (sala) => {
    setEditingSala(sala);
    reset({ nombre: sala.nombre, tipo: sala.tipo });
    setShowSalaModal(true);
  };

  const eliminarSala = async (id_sala) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sala? Se eliminarán también todos los mensajes.')) {
      return;
    }

    try {
      const token = Cookies.get('token');
      await comunicacionAPI.deleteSala(token, id_sala);
      console.log(`✅ Sala ${id_sala} eliminada`);
      
      // Refrescar lista de salas
      const salasRes = await comunicacionAPI.listSalas(token);
      setSalas(salasRes.data || []);
      
      // Si la sala eliminada era la seleccionada, seleccionar la primera disponible
      if (salaSel === id_sala) {
        const nuevaSalas = salasRes.data || [];
        if (nuevaSalas.length > 0) {
          setSalaSel(nuevaSalas[0].id_sala);
        } else {
          setSalaSel(null);
        }
      }
      
      // Limpiar mensajes de la sala eliminada
      setMensajes(prev => {
        const nuevo = { ...prev };
        delete nuevo[id_sala];
        return nuevo;
      });
    } catch (err) {
      console.error('Error eliminando sala', err);
      alert('Error eliminando sala: ' + (err.message || 'Error desconocido'));
    }
  };

  const enviar = () => {
    if (!nuevoMensaje.trim() || !socket || !userId) return;
    
    // Enviar mensaje via WebSocket para comunicación en tiempo real
    socket.emit('sendMessage', {
      id_sala: salaSel,
      id_user: userId,
      contenido: nuevoMensaje.trim()
    });
    
    setNuevoMensaje('');
  };

  // Cargar salas y mensajes básicos al montar
  useEffect(()=>{
    (async ()=>{
      try {
        const token = Cookies.get('token');
        // Load salas
        const salasRes = await comunicacionAPI.listSalas(token);
        const list = salasRes.data || [];
        setSalas(list);
        // load first sala messages
        if (list.length) {
          const id = list[0].id_sala;
          setSalaSel(id);
          const msgsRes = await comunicacionAPI.listMensajes(token, id);
          setMensajes(prev => ({ ...prev, [id]: msgsRes.data || [] }));
        }
        // (votaciones are loaded in their own component)
      } catch (err) {
        console.error('Error cargando salas/mensajes/votaciones', err);
      }
    })();
  },[]);

  // Cargar mensajes cuando cambia la sala seleccionada
  useEffect(() => {
    if (!salaSel) return;
    (async () => {
      try {
        const token = Cookies.get('token');
        if (!mensajes[salaSel]) {
          const msgsRes = await comunicacionAPI.listMensajes(token, salaSel);
          setMensajes(prev => ({ ...prev, [salaSel]: msgsRes.data || [] }));
        }
      } catch (err) {
        console.error('Error cargando mensajes de sala', salaSel, err);
      }
    })();
  }, [salaSel]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Salas */}
        <Card dark={dark}>
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Salas</div>
              <button onClick={()=>{ setEditingSala(null); reset({ nombre: "", tipo: "general" }); setShowSalaModal(true); }} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-medium text-white">+ Nueva sala</button>
            </div>
            <ul className="space-y-2 text-sm">
              {salas.map(s => (
                <li key={s.id_sala} className={`rounded-xl border px-3 py-2 ${salaSel===s.id_sala ? 'ring-2 ring-blue-500' : ''} ${tone("border-slate-100", "border-slate-700/40")}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium cursor-pointer" onClick={()=>setSalaSel(s.id_sala)}>{s.nombre}</span>
                    <Badge toneName={s.tipo==='general'?'blue':'violet'}>{s.tipo}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); editarSala(s); }} 
                      className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium ${tone("bg-blue-100 text-blue-700 hover:bg-blue-200", "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50")}`}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); eliminarSala(s.id_sala); }} 
                      className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium ${tone("bg-red-100 text-red-700 hover:bg-red-200", "bg-red-900/30 text-red-300 hover:bg-red-900/50")}`}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
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
                  const nombreCompleto = m.nombres && m.apellidos 
                    ? `${m.nombres} ${m.apellidos}` 
                    : m.autor?.nombres 
                      ? `${m.autor.nombres} ${m.autor.apellidos || ''}` 
                      : 'Usuario';
                  const esPropio = m.id_user === userId;
                  
                  return (
                    <li key={m.id_mensaje} className={`max-w-[80%] rounded-xl border px-3 py-2 ${tone('border-slate-200 bg-white','border-slate-700/60 bg-slate-800')} ${esPropio ? 'ml-auto bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="text-xs opacity-70">
                        {nombreCompleto} — {new Date(m.created_at).toLocaleTimeString()}
                      </div>
                      <div className="whitespace-pre-wrap">{m.contenido}</div>
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

      {showSalaModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-md rounded-2xl border ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">{editingSala ? 'Editar sala' : 'Crear sala'}</h4>
              <button onClick={()=>{ setShowSalaModal(false); setEditingSala(null); }} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200", "border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(crearSala)} className="p-4 space-y-3">
              <Input label="Nombre" dark={dark} register={register("nombre",{required:"Requerido"})} error={errors.nombre} />
              <Select label="Tipo" dark={dark} register={register("tipo")}> 
                <option value="general">general</option>
                <option value="tema">tema</option>
                <option value="edificio">edificio</option>
              </Select>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>{ setShowSalaModal(false); setEditingSala(null); }} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">
                  {editingSala ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------ Página principal: Admin Comunicación ----------------
export default function AdminComunicacionPage() {
  // THEME (igual que el dashboard)
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // Contexto general (mock). id_persona actual del admin logueado.
  const edificioName = "Torre Aura";
  const usuarioActual = { nombre: "Admin", apellido: "Edificio", email: "admin@edificio.com", rol: "Administrador", avatar: "" };
  const currentPersonaId = 100; // <- importante para crear registros (autor)

  const [tab, setTab] = useState("anuncios");

  const handleLogout = () => {
    alert("Logout (implementar con backend)");
  };

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          <Sidebar
            dark={dark}
            edificioName={edificioName}
            totalDepartamentos={0}
            currentPage="comunicacion_admin"
          />

          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🗣️</span>
                    <span className="font-medium">Comunicación interna — Admin</span>
                  </div>

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
                  { id: "quejas", label: "Buzón de Quejas" },
                  { id: "votaciones", label: "Votaciones" },
                  { id: "chat", label: "Chat comunitario" },
                ].map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6">
              {tab === 'anuncios' && <AnunciosAdmin dark={dark} currentPersonaId={currentPersonaId} />}
              {tab === 'quejas' && <QuejasAdmin dark={dark} />}
              {tab === 'votaciones' && <VotacionesAdmin dark={dark} currentPersonaId={currentPersonaId} />}
              {tab === 'chat' && <ChatAdmin dark={dark} currentPersonaId={currentPersonaId} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
