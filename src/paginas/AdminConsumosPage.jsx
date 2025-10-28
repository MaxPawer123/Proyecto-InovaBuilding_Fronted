import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import { userAPI, consumosAPI, alertasAPI } from "../services/api";
import Cookies from 'js-cookie';

// =============================================================================
// Módulo: Monitoreo de Consumos — Panel Administrador (JSX)
// **Actualizado** para tu esquema FINAL:
//  - consumos_registrados: { id_departamento, tipo_servicio, periodo, consumo, costo_total, observaciones }
//  - umbrales_consumo:     { id_departamento, tipo_servicio, limite_maximo, activo }
//  - alertas_consumo:      { id_consumo, id_departamento, tipo_servicio, periodo, mensaje, estado }
//
// Endpoints sugeridos (ajústalos a tu stack Express/Laravel):
//   CONSUMOS
//    GET    /api/consumos?periodo=&tipo_servicio=&id_departamento=&page=&limit=
//    POST   /api/consumos { id_departamento, tipo_servicio, periodo, consumo, costo_total, observaciones }
//    PATCH  /api/consumos/:id { consumo?, costo_total?, observaciones? }
//    DELETE /api/consumos/:id
//
//   UMBRALES
//    GET    /api/umbrales?tipo_servicio=&id_departamento=
//    POST   /api/umbrales { id_departamento, tipo_servicio, limite_maximo, activo }
//    PATCH  /api/umbrales/:id { limite_maximo?, activo? }
//    DELETE /api/umbrales/:id
//
//   ALERTAS (buzón)
//    GET    /api/alertas?estado=&periodo=&tipo_servicio=&id_departamento=
//    PATCH  /api/alertas/:id { estado } // 'abierta'|'en_progreso'|'resuelta'
// =============================================================================

// ------------------------ UI Helpers (mismos estilos) -----------------------
const tone = (dark, clsLight, clsDark) => (dark ? clsDark : clsLight);

function Card({ children, className = "", dark }) {
  return (
    <div className={`rounded-2xl border shadow-sm ${tone(dark, "border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")} ${className}`}>{children}</div>
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

function Input({ label, error, register, dark, ...props }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone(dark, "text-slate-600", "text-slate-300")}`}>{label}</span>
      <input
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
            : tone(dark, "border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
}

function Select({ label, error, register, dark, children, ...props }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone(dark, "text-slate-600", "text-slate-300")}`}>{label}</span>
      <select
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
            : tone(dark, "border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
}

function Textarea({ label, error, register, dark, rows = 4, ...props }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone(dark, "text-slate-600", "text-slate-300")}`}>{label}</span>
      <textarea
        rows={rows}
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error
            ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
            : tone(dark, "border-slate-200 bg-white", "border-slate-600 bg-slate-800")
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
}

// ------------------------ Helpers dominio ------------------------------
const servicios = [
  { value: "agua", label: "Agua" },
  { value: "luz", label: "Luz" },
  { value: "gas", label: "Gas" },
];

function formatPeriodo(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}



// ------------------------ Tab: Consumos -------------------------------
function ConsumosAdmin({ dark, departamentos }) {
  // Estado inicial - se cargará desde BD
  const [consumos, setConsumos] = useState([]);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { id_departamento: "", tipo_servicio: "agua", periodo: formatPeriodo(new Date()), consumo: "", costo_total: "", observaciones: "" }
  });

  // Cargar consumos desde la base de datos
  useEffect(() => {
    const cargarConsumos = async () => {
      try {
        const token = Cookies.get('token');
        const response = await consumosAPI.list(token);
        console.log('📡 Respuesta API consumos:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          setConsumos(response.data);
          console.log('✅ Consumos cargados desde BD:', response.data.length, 'registros');
        }
      } catch (error) {
        console.error('❌ Error cargando consumos:', error);
      }
    };
    cargarConsumos();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ id_departamento: departamentos[0]?.id_departamento||"", tipo_servicio: 'agua', periodo: formatPeriodo(new Date()), consumo: "", costo_total: "", observaciones: "" });
    setShowModal(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    reset({ id_departamento: row.id_departamento, tipo_servicio: row.tipo_servicio, periodo: row.periodo, consumo: row.consumo, costo_total: row.costo_total, observaciones: row.observaciones||"" });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      id_departamento: parseInt(data.id_departamento),
      tipo_servicio: data.tipo_servicio,
      periodo: data.periodo,
      consumo: parseFloat(data.consumo) || 0,
      costo_total: parseFloat(data.costo_total) || 0,
      observaciones: data.observaciones || ''
    };
    
    try {
      const token = Cookies.get('token');
      
      if (editing) {
        // PATCH /api/consumos/:id
        const response = await consumosAPI.update(token, editing.id_consumo, payload);
        console.log('📡 Respuesta actualizar consumo:', response);
        
        if (response && response.success) {
          setConsumos(prev => prev.map(c => 
            c.id_consumo === editing.id_consumo 
              ? { ...c, ...payload, ...response.data } 
              : c
          ));
          console.log('✅ Consumo actualizado exitosamente');
        }
      } else {
        // POST /api/consumos
        console.log('📤 Enviando datos al backend:', payload);
        const response = await consumosAPI.create(token, payload);
        console.log('📡 Respuesta crear consumo:', response);
        
        if (response && response.success && response.data) {
          const nuevoConsumo = {
            ...response.data,
            nro_depa: departamentos.find(d => d.id_departamento === parseInt(data.id_departamento))?.nro_depa || data.id_departamento
          };
          setConsumos(prev => [nuevoConsumo, ...prev]);
          console.log('✅ Consumo creado exitosamente:', nuevoConsumo);
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error guardando consumo:', error);
      const errorMsg = error.body?.message || error.message || 'Error desconocido';
      alert(`Error al guardar el consumo: ${errorMsg}`);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este consumo?')) return;
    
    try {
      const token = Cookies.get('token');
      await consumosAPI.delete(token, id);
      setConsumos(prev => prev.filter(c => c.id_consumo !== id));
      console.log('✅ Consumo eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando consumo:', error);
      alert('Error al eliminar el consumo. Por favor intenta nuevamente.');
    }
  };

  const filtrados = useMemo(()=>{
    const term = q.trim().toLowerCase();
    let rows = consumos;
    if (term) rows = rows.filter((r)=>
      r.periodo.toLowerCase().includes(term) ||
      r.tipo_servicio.toLowerCase().includes(term) ||
      String(r.id_departamento).includes(term)
    );
    return rows.sort((a,b)=> b.id_consumo - a.id_consumo);
  }, [q, consumos]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por periodo/servicio/depto" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
          <button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95">+ Nuevo consumo</button>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${tone(dark, "border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                <th className="px-4 py-3">Depto</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Consumo</th>
                <th className="px-4 py-3">Costo total</th>
                <th className="px-4 py-3">Obs.</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r)=> (
                <tr key={r.id_consumo} className={`border-b ${tone(dark, "border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                  <td className="px-4 py-3">{r.nro_depa ? r.nro_depa : (departamentos.find(d => d.id_departamento === r.id_departamento)?.nro_depa ?? r.id_departamento)}</td>
                  <td className="px-4 py-3">{r.tipo_servicio}</td>
                  <td className="px-4 py-3">{r.periodo}</td>
                  <td className="px-4 py-3 font-medium">{Number(r.consumo).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">Bs {Number(r.costo_total).toFixed(2)}</td>
                  <td className="px-4 py-3 max-w-[240px] truncate" title={r.observaciones||''}>{r.observaciones||'-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>openEdit(r)} className={`rounded-lg px-3 py-1.5 text-xs ${tone(dark, "border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Editar</button>
                    <button onClick={()=>eliminar(r.id_consumo)} className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center opacity-70">Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-xl rounded-2xl border ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">{editing?"Editar consumo":"Nuevo consumo"}</h4>
              <button onClick={()=>setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone(dark, "border border-slate-200", "border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
              <Select label="Departamento" dark={dark} register={register("id_departamento", { required: "Requerido" })} error={errors.id_departamento}>
                {departamentos.map((d)=> <option key={d.id_departamento} value={d.id_departamento}>{d.nro_depa}</option>)}
              </Select>
              <Select label="Servicio" dark={dark} register={register("tipo_servicio")}> 
                {servicios.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Input label="Periodo (YYYY-MM)" dark={dark} register={register("periodo", { required: "Requerido", pattern: { value: /^\d{4}-\d{2}$/, message: "Formato YYYY-MM" } })} error={errors.periodo} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input type="number" step="0.01" label="Consumo" dark={dark} register={register("consumo", { required: "Requerido" })} error={errors.consumo} />
                <Input type="number" step="0.01" label="Costo total" dark={dark} register={register("costo_total", { required: "Requerido" })} error={errors.costo_total} />
              </div>
              <Textarea label="Observaciones" dark={dark} register={register("observaciones")} />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className={`rounded-xl px-4 py-2 text-sm ${tone(dark, "border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>{editing?"Guardar cambios":"Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// ------------------------ Tab: Alertas -------------------------------
function AlertasAdmin({ dark, departamentos }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { id_departamento: '', tipo_servicio: 'agua', periodo: formatPeriodo(new Date()), mensaje: '', estado: 'abierta' }
  });

  // Cargar alertas desde la BD
  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const token = Cookies.get('token');
        const response = await alertasAPI.list(token);
        console.log('📡 Respuesta API alertas:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          setItems(response.data);
          console.log('✅ Alertas cargadas desde BD:', response.data.length, 'registros');
        }
      } catch (error) {
        console.error('❌ Error cargando alertas:', error);
      }
    };
    cargarAlertas();
  }, []);

  const openCreate = () => {
    reset({ id_departamento: departamentos[0]?.id_departamento || '', tipo_servicio: 'agua', periodo: formatPeriodo(new Date()), mensaje: '', estado: 'abierta' });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      id_departamento: parseInt(data.id_departamento),
      tipo_servicio: data.tipo_servicio,
      periodo: data.periodo,
      mensaje: data.mensaje,
      estado: data.estado || 'abierta'
    };

    try {
      const token = Cookies.get('token');
      console.log('📤 Enviando alerta al backend:', payload);
      const response = await alertasAPI.create(token, payload);
      console.log('📡 Respuesta crear alerta:', response);

      if (response && response.success && response.data) {
        const nuevaAlerta = {
          ...response.data,
          nro_depa: departamentos.find(d => d.id_departamento === parseInt(data.id_departamento))?.nro_depa || data.id_departamento
        };
        setItems(prev => [nuevaAlerta, ...prev]);
        console.log('✅ Alerta creada exitosamente:', nuevaAlerta);
      }
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error guardando alerta:', error);
      const errorMsg = error.body?.message || error.message || 'Error desconocido';
      alert(`Error al guardar la alerta: ${errorMsg}`);
    }
  };

  const cambiarEstado = async (id_alerta, nuevo) => {
    try {
      const token = Cookies.get('token');
      await alertasAPI.updateEstado(token, id_alerta, nuevo);
      setItems(prev => prev.map(a => a.id_alerta === id_alerta ? { ...a, estado: nuevo, updated_at: new Date().toISOString() } : a));
      console.log('✅ Estado de alerta actualizado');
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      alert('Error al actualizar el estado de la alerta');
    }
  };

  const eliminar = async (id_alerta) => {
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;
    
    try {
      const token = Cookies.get('token');
      await alertasAPI.delete(token, id_alerta);
      setItems(prev => prev.filter(a => a.id_alerta !== id_alerta));
      console.log('✅ Alerta eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando alerta:', error);
      alert('Error al eliminar la alerta');
    }
  };

  const filtrados = useMemo(()=>{
    let rows = items;
    const term = q.trim().toLowerCase();
    if (term) rows = rows.filter(a => a.mensaje.toLowerCase().includes(term) || a.periodo.includes(term) || a.tipo_servicio.includes(term) || String(a.id_departamento).includes(term));
    return rows.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [q, items]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar en mensaje/período/servicio/depto" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
          <button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow hover:opacity-95 whitespace-nowrap">+ Nueva alerta</button>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${tone(dark, "border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                <th className="px-4 py-3">Depto</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creada</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a)=> (
                <tr key={a.id_alerta} className={`border-b ${tone(dark, "border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                  <td className="px-4 py-3">{a.nro_depa ? a.nro_depa : (departamentos.find(d => d.id_departamento === a.id_departamento)?.nro_depa ?? a.id_departamento)}</td>
                  <td className="px-4 py-3">{a.tipo_servicio}</td>
                  <td className="px-4 py-3">{a.periodo}</td>
                  <td className="px-4 py-3">{a.mensaje}</td>
                  <td className="px-4 py-3"><Badge toneName={a.estado==='resuelta'?'green':a.estado==='en_progreso'?'blue':'amber'}>{a.estado}</Badge></td>
                  <td className="px-4 py-3">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <select value={a.estado} onChange={(e)=>cambiarEstado(a.id_alerta, e.target.value)} className={`rounded-xl border px-2 py-1 text-xs ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
                      <option value="abierta">abierta</option>
                      <option value="en_progreso">en_progreso</option>
                      <option value="resuelta">resuelta</option>
                    </select>
                    <button onClick={()=>eliminar(a.id_alerta)} className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center opacity-70">Sin alertas</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Alerta */}
      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className={`w-full max-w-xl rounded-2xl border ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">Nueva Alerta</h4>
              <button onClick={()=>setShowModal(false)} className={`rounded-lg px-2 py-1 text-sm ${tone(dark, "border border-slate-200", "border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
              <Select label="Departamento" dark={dark} register={register("id_departamento", { required: "Requerido" })} error={errors.id_departamento}>
                {departamentos.map((d)=> <option key={d.id_departamento} value={d.id_departamento}>{d.nro_depa}</option>)}
              </Select>
              <Select label="Servicio" dark={dark} register={register("tipo_servicio")}>
                {servicios.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Input label="Periodo (YYYY-MM)" dark={dark} register={register("periodo", { required: "Requerido", pattern: { value: /^\d{4}-\d{2}$/, message: "Formato YYYY-MM" } })} error={errors.periodo} />
              <Textarea label="Mensaje" dark={dark} register={register("mensaje", { required: "Requerido" })} error={errors.mensaje} rows={3} />
              <Select label="Estado" dark={dark} register={register("estado")}>
                <option value="abierta">Abierta</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelta">Resuelta</option>
              </Select>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className={`rounded-xl px-4 py-2 text-sm ${tone(dark, "border border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95" disabled={isSubmitting}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------ Página principal: Admin Consumos ----------------
export default function AdminConsumosPage() {
  const [dark, setDark] = useState(false);

  const edificioName = "InovaBulding";
  const usuarioActual = { nombre: "Admin", apellido: "Edificio", email: "admin@edificio.com", rol: "Administrador", avatar: "" };

  const [tab, setTab] = useState("consumos"); // 'consumos'|'umbrales'|'alertas'

  // MOCK de departamentos para selects; reemplazar con GET /api/departamentos
  const [departamentos, setDepartamentos] = useState([
    { id_departamento: 1, nro_depa: '1A' },
    { id_departamento: 2, nro_depa: '2B' },
    { id_departamento: 3, nro_depa: '3C' },
  ]);

  // Cargar departamentos desde la base de datos
  useEffect(() => {
    const cargarDepartamentos = async () => {
      try {
        const response = await userAPI.listDepartamentos();
        console.log('📡 Respuesta API departamentos:', response);
        
        if (response && response.data && Array.isArray(response.data.departamentos)) {
          setDepartamentos(response.data.departamentos);
          console.log('✅ Departamentos cargados desde BD:', response.data.departamentos);
        } else if (response && Array.isArray(response)) {
          setDepartamentos(response);
          console.log('✅ Departamentos cargados desde BD:', response);
        }
      } catch (error) {
        console.error('❌ Error cargando departamentos:', error);
        // Mantener datos mock en caso de error
      }
    };
    cargarDepartamentos();
  }, []);



  const handleLogout = () => alert("Logout (implementar con backend)");

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={`${tone(dark, "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100")} min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar dark={dark} edificioName={edificioName} totalDepartamentos={departamentos.length} currentPage="consumos_admin" />

          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone(dark, "border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">📈</span>
                    <span className="font-medium">Monitoreo de Consumos — Admin</span>
                  </div>
                  <div className="ms-auto flex items-center gap-2">
                    <button onClick={() => setDark((d) => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone(dark, "border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                    <UserProfile dark={dark} usuarioActual={usuarioActual} edificioName={edificioName} onLogout={handleLogout} />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone(dark, "border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/50")}`}>
                {[ {id:'consumos',label:'Consumos'}, {id:'alertas',label:'Alertas'} ].map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id ? 'bg-blue-600 text-white' : tone(dark, 'border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
              {tab==='consumos' && <ConsumosAdmin dark={dark} departamentos={departamentos} />}
              {tab==='alertas' && <AlertasAdmin dark={dark} departamentos={departamentos} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
