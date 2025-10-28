import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import UserProfile from "../components/UserProfile/UserProfile";
import { consumosAPI, userAPI, alertasAPI } from "../services/api";

// =============================================================================
// Módulo: Monitoreo de Consumos — Panel Residente (Opción A)
// Solo consulta: SIN registro/edición y SIN ver umbrales.
// Tabs: Resumen | Mis consumos | Mis alertas
//
// Endpoints sugeridos (solo lectura para residente):
//   GET /api/consumos?mine=1&periodo=&tipo_servicio=&page=&limit=
//   GET /api/alertas?mine=1&estado=&periodo=&tipo_servicio=
// =============================================================================

// ------------------------ UI Helpers -----------------------
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

function Input({ label, error, dark, ...props }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone(dark, "text-slate-600", "text-slate-300")}`}>{label}</span>
      <input
        {...props}
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

function Select({ label, error, dark, children, ...props }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${tone(dark, "text-slate-600", "text-slate-300")}`}>{label}</span>
      <select
        {...props}
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

// ------------------------ Helpers dominio ------------------------------
const servicios = [
  { value: "agua", label: "Agua" },
  { value: "luz", label: "Luz" },
  { value: "gas", label: "Gas" },
];
function formatPeriodo(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

// ------------------------ Mis Consumos (solo lectura) ----------------
function MisConsumos({ dark, idDepartamento }){
  const [consumos, setConsumos] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar consumos del residente desde la base de datos
  useEffect(() => {
    const cargarConsumos = async () => {
      if (!idDepartamento) {
        console.warn('⚠️ No hay id_departamento para cargar consumos');
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get('token');
        // Filtrar por id_departamento del residente
        const response = await consumosAPI.list(token, { id_departamento: idDepartamento });
        console.log('📡 Consumos del residente:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          setConsumos(response.data);
          console.log(`✅ Cargados ${response.data.length} consumos del departamento ${idDepartamento}`);
        }
      } catch (error) {
        console.error('❌ Error cargando consumos del residente:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarConsumos();
  }, [idDepartamento]);

  const filtrados = useMemo(()=>{
    const term = q.trim().toLowerCase();
    let rows = consumos;
    if (term) rows = rows.filter(r=> r.periodo.includes(term) || r.tipo_servicio.includes(term));
    return rows.sort((a,b)=> b.id_consumo - a.id_consumo);
  },[q, consumos]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por período/servicio" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                Cargando consumos...
              </span>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`border-b ${tone(dark, "border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Consumo</th>
                  <th className="px-4 py-3">Costo total</th>
                  <th className="px-4 py-3">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r)=>(
                  <tr key={r.id_consumo} className={`border-b ${tone(dark, "border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="px-4 py-3">{r.tipo_servicio}</td>
                    <td className="px-4 py-3">{r.periodo}</td>
                    <td className="px-4 py-3 font-medium">{Number(r.consumo).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold">Bs {Number(r.costo_total).toFixed(2)}</td>
                    <td className="px-4 py-3 max-w-[240px] truncate" title={r.observaciones||''}>{r.observaciones||'-'}</td>
                  </tr>
                ))}
                {filtrados.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center opacity-70">Sin registros de consumos</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// ------------------------ Mis Alertas (solo lectura) -----------------
function MisAlertas({ dark, idDepartamento }){
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar alertas del residente desde la base de datos
  useEffect(() => {
    const cargarAlertas = async () => {
      if (!idDepartamento) {
        console.warn('⚠️ No hay id_departamento para cargar alertas');
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get('token');
        // Filtrar alertas por id_departamento del residente
        const response = await alertasAPI.list(token, { id_departamento: idDepartamento });
        console.log('📡 Alertas del residente:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          setItems(response.data);
          console.log(`✅ Cargadas ${response.data.length} alertas del departamento ${idDepartamento}`);
        }
      } catch (error) {
        console.error('❌ Error cargando alertas del residente:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarAlertas();
  }, [idDepartamento]);

  const filtrados = useMemo(()=>{
    let rows = items;
    const term = q.trim().toLowerCase();
    if (term) rows = rows.filter(a=> a.mensaje.toLowerCase().includes(term) || a.periodo.includes(term) || a.tipo_servicio.includes(term));
    return rows.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  },[q, items]);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar en mensaje/período/servicio" className={`w-full rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone(dark, "border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                Cargando alertas...
              </span>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`border-b ${tone(dark, "border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Mensaje</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creada</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(a=> (
                  <tr key={a.id_alerta} className={`border-b ${tone(dark, "border-slate-100", "border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="px-4 py-3">{a.tipo_servicio}</td>
                  <td className="px-4 py-3">{a.periodo}</td>
                  <td className="px-4 py-3">{a.mensaje}</td>
                  <td className="px-4 py-3"><Badge toneName={a.estado==='resuelta'?'green':a.estado==='en_progreso'?'blue':'amber'}>{a.estado}</Badge></td>
                  <td className="px-4 py-3">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {filtrados.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center opacity-70">Sin alertas para este departamento</td></tr>}
            </tbody>
          </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// ------------------------ Página: Residente Consumos (Opción A) ---------
export default function ResidenteConsumosPage(){
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState('consumos'); // consumos | alertas
  const [idDepartamento, setIdDepartamento] = useState(null);
  const [loadingDepartamento, setLoadingDepartamento] = useState(true);

  // Contexto general (mock). id_persona / depto del residente logueado.
  const edificioName = "Torre Aura";
  const usuarioActual = { nombre: "Ana", apellido: "Soria", email: "residente@edificio.com", rol: "Residente", avatar: "" };

  // Cargar el departamento del residente desde la BD
  useEffect(() => {
    const cargarDepartamento = async () => {
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) {
          console.warn('⚠️ No hay usuario en la cookie');
          setLoadingDepartamento(false);
          return;
        }

        const loggedUser = JSON.parse(userCookie);
        const userId = loggedUser.id;

        console.log('📍 Cargando departamento del residente, userId:', userId);
        
        const response = await userAPI.getMiDepartamento(userId);
        
        if (response && response.success && response.data.departamento) {
          setIdDepartamento(response.data.departamento.id_departamento);
          console.log('✅ Departamento del residente:', response.data.departamento);
        }
      } catch (error) {
        console.error('❌ Error cargando departamento del residente:', error);
      } finally {
        setLoadingDepartamento(false);
      }
    };

    cargarDepartamento();
  }, []);

  return (
    <div className={(dark? 'dark':'') + ' min-h-screen'}>
      <div className={`${tone(dark, 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900', 'bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100')} min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Sin Sidebar para un look más limpio del Residente */}
          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone(dark, 'border-slate-200 bg-white/70', 'border-slate-700/60 bg-slate-900/60')} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🏠</span>
                    <span className="font-medium">Mis consumos</span>
                  </div>
                  <nav className="flex-1">
                    <ul className="flex flex-wrap gap-2 text-sm">
                      <li>
                        <Link
                          to="/residente"
                          className={`rounded-xl px-3 py-2 ${tone(dark,
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Mi cuenta
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/residente/comunicacion"
                          className={`rounded-xl px-3 py-2 ${tone(dark,
                            "bg-white border border-slate-200 hover:bg-slate-100",
                            "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                          )}`}
                        >
                          Ver comunicación
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/mis-pagos"
                          className={`rounded-xl px-3 py-2 ${tone(dark,
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
                          className={`rounded-xl px-3 py-2 ${tone(dark,
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
                    <button onClick={()=>setDark(d=>!d)} className={`rounded-xl px-3 py-2 text-sm ${tone(dark, 'border border-slate-200 bg-white hover:bg-slate-100', 'border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40')}`}>{dark? '☾ Claro':'☀︎ Oscuro'}</button>
                    <UserProfile dark={dark} usuarioActual={usuarioActual} edificioName={edificioName} onLogout={()=>alert('Logout (implementar)')} />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone(dark, 'border-slate-200 bg-white/70', 'border-slate-700/60 bg-slate-900/50')}`}>
                {[ {id:'consumos',label:'Mis consumos'}, {id:'alertas',label:'Mis alertas'} ].map(t=> (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id? 'bg-blue-600 text-white' : tone(dark, 'border border-slate-200 bg-white', 'border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
              {loadingDepartamento ? (
                <Card dark={dark}>
                  <div className="flex items-center justify-center py-12">
                    <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-slate-600 dark:text-slate-400">
                      Cargando información del departamento...
                    </span>
                  </div>
                </Card>
              ) : !idDepartamento ? (
                <Card dark={dark}>
                  <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                    <p>No se pudo cargar la información del departamento.</p>
                    <p className="text-sm mt-2">Por favor, contacta al administrador.</p>
                  </div>
                </Card>
              ) : (
                <>
                  {tab==='consumos' && <MisConsumos dark={dark} idDepartamento={idDepartamento} />}
                  {tab==='alertas' && <MisAlertas dark={dark} idDepartamento={idDepartamento} />}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}