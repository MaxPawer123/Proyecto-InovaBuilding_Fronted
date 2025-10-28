import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import { Link } from "react-router-dom";
import { consumosAPI, areasAPI, comunicacionAPI, userAPI } from "../services/api";

export default function AdminDashboard() {
  // THEME
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // RUTAS (ajústalas si tu app usa otras)
  const RUTA_COMUNICACION = "/Administrador/comunicacion";
  const RUTA_CONSUMOS = "/Administrador/consumos";
  const RUTA_RESERVAS = "/Administrador/reservas";
  const RUTA_TICKETS = "/Administrador/ticketsMantenimiento"; // nuevo

  // MOCK DATA
  const [edificios] = useState([
    { id_edificio: 1, nombre: "InnovaBulding", ubicacion: "Av. Siempre Viva 123", nro_pisos: 15 },
  ]);
  const edificioSel = 1;

  // Departamentos — cargados desde API
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentosLoading, setDepartamentosLoading] = useState(false);
  const [departamentosError, setDepartamentosError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setDepartamentosLoading(true);
        setDepartamentosError(null);
        const res = await userAPI.listDepartamentos();
        const list = (res && res.data && res.data.departamentos) 
          ? res.data.departamentos 
          : (res && res.data) 
            ? (Array.isArray(res.data) ? res.data : [])
            : (Array.isArray(res) ? res : []);
        if (mounted) setDepartamentos(list);
      } catch (err) {
        console.error('Error cargando departamentos:', err);
        if (mounted) setDepartamentosError(err.message || String(err));
      } finally {
        if (mounted) setDepartamentosLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [personas] = useState([
    { id_persona: 100, nombres: "Ana", apellidos: "Soria", correo: "ana@ej.com", telefono: "789123", foto_url: "" },
    { id_persona: 101, nombres: "Luis", apellidos: "Torrez", correo: "luis@ej.com", telefono: "555888", foto_url: "" },
    { id_persona: 102, nombres: "María", apellidos: "Quispe", correo: "maria@ej.com", telefono: "" },
  ]);

  const [residentes] = useState([
    { id_residente: 1, relacion_titular: "Titular", fecha_inicio_residencia: "2023-01-01", es_encargado: true, id_persona: 100, id_departamento: 1 },
    { id_residente: 2, relacion_titular: "Familiar", fecha_inicio_residencia: "2024-03-12", es_encargado: false, id_persona: 101, id_departamento: 2 },
    { id_residente: 3, relacion_titular: "Titular", fecha_inicio_residencia: "2022-07-20", es_encargado: true, id_persona: 102, id_departamento: 4 },
  ]);


  // consumos — se cargarán desde la API
  const [consumos, setConsumos] = useState([]);
  const [consumosLoading, setConsumosLoading] = useState(false);
  const [consumosError, setConsumosError] = useState(null);

  const [pagos] = useState([
    { id_pago: 1, concepto: "Expensas", periodo_ini: "2025-09-01", periodo_fin: "2025-09-30", metodo: "QR", costo_total: 350.0, id_servicio: 1, id_departamento: 1, id_reserva: 0, created_at: "2025-09-05" },
    { id_pago: 2, concepto: "Servicios", periodo_ini: "2025-09-01", periodo_fin: "2025-09-30", metodo: "Transferencia", costo_total: 210.0, id_servicio: 2, id_departamento: 1, id_reserva: 0, created_at: "2025-09-10" },
    { id_pago: 3, concepto: "Reserva sala", periodo_ini: "2025-09-14", periodo_fin: "2025-09-14", metodo: "Tarjeta", costo_total: 120.0, id_servicio: 0, id_departamento: 2, id_reserva: 91, created_at: "2025-09-14" },
    { id_pago: 4, concepto: "Expensas", periodo_ini: "2025-09-01", periodo_fin: "2025-09-30", metodo: "Efectivo", costo_total: 280.0, id_servicio: 4, id_departamento: 4, id_reserva: 0, created_at: "2025-09-12" },
  ]);

  // reservas cargadas desde la base de datos
  const [reservas, setReservas] = useState([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [reservasError, setReservasError] = useState(null);
  const [areasMap, setAreasMap] = useState({});

  const [areasComunes] = useState([
    { id_area_comun: 1, nombre: "Sala de eventos", ubicacion: "Mezanine", costo_hora: 60, id_edificio: 1 },
    { id_area_comun: 2, nombre: "Gimnasio", ubicacion: "Piso 2", costo_hora: 0, id_edificio: 1 },
  ]);

  // NUEVO: Tickets / Mantenimiento (solo columnas pedidas)
  const [tickets] = useState([
    { codigo: "TCK-2025-0001", titulo: "Fuga en lavamanos", prioridad: "alta", creado: "2025-10-26T15:08:52" },
    { codigo: "TCK-2025-0002", titulo: "Luces parpadean", prioridad: "media", creado: "2025-10-26T15:08:52" },
  ]);

  // Totales usuarios
  const [administradores] = useState([{ id: 1 }, { id: 2 }]);
  const [empleados] = useState([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);

  // Comunicación (tabla) — cargada desde API (anuncios públicos)
  const [comunicaciones, setComunicaciones] = useState([]);
  const [comunicacionesLoading, setComunicacionesLoading] = useState(false);
  const [comunicacionesError, setComunicacionesError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setComunicacionesLoading(true);
        setComunicacionesError(null);
        const res = await comunicacionAPI.listAnuncios();
        const list = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (mounted) setComunicaciones(list);
      } catch (err) {
        console.error('Error cargando comunicacion (anuncios):', err);
        if (mounted) setComunicacionesError(err.message || String(err));
      } finally {
        if (mounted) setComunicacionesLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // HELPERS
  const currency = (v) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v || 0);
  const formatDateTime = (d) => new Date(d).toLocaleString();
  const formatYearMonth = (d) => new Date(d).toISOString().slice(0, 7);
  const code = (n) => `RSV-${String(n).padStart(6, "0")}`;

  const depEdificio = useMemo(() => {
    if (!Array.isArray(departamentos) || departamentos.length === 0) return [];
    const hasIdEdificio = departamentos.some(d => d && Object.prototype.hasOwnProperty.call(d, 'id_edificio'));
    return hasIdEdificio ? departamentos.filter(d => d.id_edificio === edificioSel) : departamentos;
  }, [departamentos, edificioSel]);
  const totalDeptos = depEdificio.length;
  const ocupadosDep = depEdificio.filter(d => d.estado === "ocupado").length;
  const desocupados = totalDeptos - ocupadosDep;
  const ocupacionPct = totalDeptos ? Math.round((ocupadosDep / totalDeptos) * 100) : 0;

  const totalAdmins = administradores.length;
  const totalResidentes = useMemo(() => {
    const ids = new Set(depEdificio.map(d => d.id_departamento));
    return residentes.filter(r => ids.has(r.id_departamento)).length;
  }, [residentes, depEdificio]);
  const totalEmpleados = empleados.length;

  const totalUsuarios = totalAdmins + totalResidentes + totalEmpleados;
  const pct = (n) => totalUsuarios ? Math.round((n / totalUsuarios) * 100) : 0;
  const pctAdmins = pct(totalAdmins);
  const pctRes = pct(totalResidentes);
  const pctEmp = Math.max(0, 100 - pctAdmins - pctRes); // asegura suma 100

  const ingresosMes = useMemo(() => pagos.reduce((acc, p) => acc + Number(p.costo_total || 0), 0), [pagos]);

  const edificioName = edificios.find(e => e.id_edificio === edificioSel)?.nombre || "Edificio";

  const usuarioActual = { nombre: "Luis", apellido: "Pérez", email: "admin@edificio.com", rol: "Administrador", avatar: "" };
  const handleLogout = () => alert("Funcionalidad de cierre de sesión - implementar con backend");

  // Buscador
  const [q, setQ] = useState("");
  const resultadosBusqueda = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const matchDeptos = depEdificio.filter(d => `${d.nro_depa}`.toLowerCase().includes(term));
    const matchPersonas = personas.filter(p => `${p.nombres} ${p.apellidos}`.toLowerCase().includes(term));
    const matchReservas = reservas.filter(r => areasComunes.find(a => a.id_area_comun === r.id_area_comun)?.nombre.toLowerCase().includes(term));
    return [
      ...matchDeptos.map(d => ({ tipo: "Departamento", etiqueta: `Depto ${d.nro_depa}`, id: d.id_departamento })),
      ...matchPersonas.map(p => ({ tipo: "Persona", etiqueta: `${p.nombres} ${p.apellidos}`, id: p.id_persona })),
      ...matchReservas.map(r => ({ tipo: "Reserva", etiqueta: `${areasComunes.find(a => a.id_area_comun === r.id_area_comun)?.nombre}`, id: r.id_reserva })),
    ].slice(0, 8);
  }, [q, depEdificio, personas, reservas, areasComunes]);

  // Loading
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  // Cargar consumos reales desde la API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setConsumosLoading(true);
        setConsumosError(null);
        const res = await consumosAPI.list();
        const list = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (mounted) setConsumos(list);
      } catch (err) {
        console.error('Error cargando consumos:', err);
        if (mounted) setConsumosError(err.message || String(err));
      } finally {
        if (mounted) setConsumosLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Cargar áreas y reservas al montar (mostrar datos reales desde la BD)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setReservasLoading(true);
        setReservasError(null);

        const areasRes = await areasAPI.getAreas();
        // areasRes puede tener { success: true, data: [...] }
        const areasList = (areasRes && areasRes.data) ? areasRes.data : (Array.isArray(areasRes) ? areasRes : []);
        if (!mounted) return;

        // construir mapa id -> nombre
        const map = {};
        areasList.forEach(a => { if (a && a.id_area_comun) map[a.id_area_comun] = a.nombre; });
        if (mounted) setAreasMap(map);

        // obtener reservas por área en paralelo
        const promises = areasList.map(a => areasAPI.getReservasArea(a.id_area_comun).catch(err => {
          console.warn('Error al cargar reservas de área', a.id_area_comun, err);
          return { success: false, data: [] };
        }));

        const results = await Promise.all(promises);
        if (!mounted) return;

        // normalizar respuestas y aplanar
        const all = results.reduce((acc, r) => {
          const list = (r && r.data) ? r.data : (Array.isArray(r) ? r : []);
          return acc.concat(list);
        }, []);

        if (mounted) setReservas(all);
      } catch (err) {
        console.error('Error cargando reservas:', err);
        if (mounted) setReservasError(err.message || String(err));
      } finally {
        if (mounted) setReservasLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // UI ATOMS
  function Card({ children, className = "" }) {
    return (
      <div className={`rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90", "border-slate-700/60 bg-slate-800/70")} ${className}`}>
        {children}
      </div>
    );
  }
  function Stat({ title, value, hint, accent = "blue", children }) {
    const accentMap = {
      blue: tone("text-blue-700", "text-blue-300"),
      violet: tone("text-violet-700", "text-violet-300"),
      emerald: tone("text-emerald-700", "text-emerald-300"),
      amber: tone("text-amber-700", "text-amber-300"),
      slate: tone("text-slate-700", "text-slate-300"),
    };
    return (
      <Card>
        <div className="p-4">
          <div className={"text-base uppercase tracking-widest " + tone("text-slate-500", "text-slate-400")}>{title}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className={"text-3xl font-semibold " + accentMap[accent]}>{value}</div>
            {hint ? <div className={"text-xs " + tone("text-slate-500", "text-slate-400")}>{hint}</div> : null}
          </div>
          {children}
        </div>
      </Card>
    );
  }
  function Progress({ pct }) {
    return (
      <div className={"mt-3 h-2 w-full overflow-hidden rounded-full " + tone("bg-slate-100", "bg-slate-700")}>
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
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
  function Donut({ value = 0, size = 120, stroke = 22 }) {
    const pct = Math.min(100, Math.max(0, value));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className={tone("stroke-slate-200", "stroke-slate-700")} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round" stroke="url(#g1)" strokeDasharray={`${dash} ${c - dash}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" />
      </svg>
    );
  }

  // helper prioridad → badge
  const prioridadTone = (p) => {
    if ((p || "").toLowerCase() === "alta") return "red";
    if ((p || "").toLowerCase() === "media") return "amber";
    return "blue";
  };

  // LAYOUT
  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar dark={dark} edificioName={edificioName} totalDepartamentos={totalDeptos} currentPage="dashboard" />

          {/* Main */}
          <main className="flex-1">
            {/* Header */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🏢</span>
                    <span className="font-medium">Panel de Administración</span>
                  </div>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (Depto, Persona, Área...)" className={`w-full sm:flex-1 rounded-xl border px-4 py-2 text-sm outline-none ring-blue-500 focus:ring ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`} />
                  <button onClick={() => setDark((d) => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100", "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Modo claro" : "☀︎ Modo oscuro"}</button>

                  <UserProfile dark={dark} usuarioActual={usuarioActual} edificioName={edificioName} onLogout={handleLogout} />
                </div>

                {q && resultadosBusqueda.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {resultadosBusqueda.map((r) => (
                      <div key={`${r.tipo}-${r.id}`} className={`rounded-lg border px-3 py-2 text-sm ${tone("border-slate-200 bg-white", "border-slate-700/60 bg-slate-800")}`}>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">{r.tipo}</div>
                        <div className="font-medium">{r.etiqueta}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-4 py-6">
              {/* KPIs SUPERIORES */}
              <section className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {/* Ocupación */}
                <Stat title="Ocupación" value={`${ocupacionPct}%`} hint={`${ocupadosDep}/${totalDeptos} ocupados`} accent="blue">
                  <div className="mt-3 flex items-center gap-4">
                    {/* Donut más grueso */}
                    <Donut value={ocupacionPct} stroke={22} size={132} />
                    <div className="flex-1 text-sm">
                      <div>Ocupados <b>{ocupadosDep}</b></div>
                      <div>Desocupados <b>{desocupados}</b></div>
                      {/* Barra horizontal eliminada */}
                    </div>
                  </div>
                </Stat>

                {/* Usuarios */}
                <Stat title="Usuarios" value={totalUsuarios} hint="Totales" accent="emerald">
                  <div
                    className={
                      "mt-3 relative h-6 sm:h-7 w-full overflow-hidden rounded-full flex " +
                      tone("bg-slate-100", "bg-slate-700")
                    }
                  >
                    {/* Admins */}
                    <div className="h-full bg-violet-600" style={{ width: `${pctAdmins}%` }}>
                      <div className="h-full w-full flex items-center justify-center">
                        {pctAdmins > 6 && <span className="text-white text-[10px] sm:text-xs font-semibold drop-shadow-sm">{pctAdmins}%</span>}
                      </div>
                    </div>
                    {/* Residentes */}
                    <div className="h-full bg-blue-600" style={{ width: `${pctRes}%` }}>
                      <div className="h-full w-full flex items-center justify-center">
                        {pctRes > 6 && <span className="text-white text-[10px] sm:text-xs font-semibold drop-shadow-sm">{pctRes}%</span>}
                      </div>
                    </div>
                    {/* Empleados */}
                    <div className="h-full bg-amber-500" style={{ width: `${pctEmp}%` }}>
                      <div className="h-full w-full flex items-center justify-center">
                        {pctEmp > 6 && <span className="text-white text-[10px] sm:text-xs font-semibold drop-shadow-sm">{pctEmp}%</span>}
                      </div>
                    </div>
                  </div>

                  {/* Leyenda (sin porcentajes) */}
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div className={`rounded-xl border px-2 py-2 ${tone("border-slate-200", "border-slate-700/60")}`}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />
                        <span className="uppercase tracking-widest opacity-70">Admins</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold">{totalAdmins}</div>
                    </div>
                    <div className={`rounded-xl border px-2 py-2 ${tone("border-slate-200", "border-slate-700/60")}`}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                        <span className="uppercase tracking-widest opacity-70">Residentes</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold">{totalResidentes}</div>
                    </div>
                    <div className={`rounded-xl border px-2 py-2 ${tone("border-slate-200", "border-slate-700/60")}`}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="uppercase tracking-widest opacity-70">Empleados</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold">{totalEmpleados}</div>
                    </div>
                  </div>
                </Stat>

                {/* Ingresos este mes → minimal */}
                <Card>
                  <div className="p-5 min-h-[170px] flex flex-col justify-center">
                    <div className={"text-base uppercase tracking-widest " + tone("text-slate-500", "text-slate-400")}>
                      Ingresos este mes
                    </div>
                    <div className="mt-2 text-5xl sm:text-6xl font-semibold text-emerald-600 dark:text-emerald-300 leading-none">
                      {currency(ingresosMes)}
                    </div>
                    <div className={"mt-3 text-sm " + tone("text-slate-500", "text-slate-400")}>
                      Pagos registrados
                    </div>
                  </div>
                </Card>
              </section>

              {/* TABLAS */}
              <section className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Departamentos — Torre Aura */}
                <Card className="lg:col-span-2">
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Departamentos — {edificioName}</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="max-h-[280px] overflow-y-auto rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className={`${tone("bg-white", "bg-slate-800")} sticky top-0 z-10`}>
                            <tr className={tone("border-b border-slate-200 text-slate-500", "border-b border-slate-700/60 text-slate-400") + " text-left"}>
                              <th className="px-3 py-2">Depto</th>
                              <th className="px-3 py-2">Habitaciones</th>
                              <th className="px-3 py-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departamentosLoading ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">Cargando departamentos desde la base de datos...</td>
                              </tr>
                            ) : departamentosError ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-red-600">Error cargando departamentos: {departamentosError}</td>
                              </tr>
                            ) : depEdificio.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">No hay departamentos registrados.</td>
                              </tr>
                            ) : (
                              depEdificio.map((d) => {
                                const estadoNorm = (d.estado || '').toLowerCase();
                                const estadoBadge = estadoNorm.includes('ocupado') 
                                  ? 'green' 
                                  : estadoNorm.includes('disponible') 
                                    ? 'slate' 
                                    : 'amber';
                                const estadoLabel = d.estado || 'Desconocido';
                                
                                return (
                                  <tr key={d.id_departamento} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                                    <td className="px-3 py-2 font-medium">{d.nro_depa || '-'}</td>
                                    <td className="px-3 py-2">{d.habitaciones || '-'}</td>
                                    <td className="px-3 py-2">
                                      <Badge toneName={estadoBadge}>{estadoLabel}</Badge>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Comunicación */}
                <Card>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Comunicación</h3>
                      <a href={RUTA_COMUNICACION} className="text-sm text-blue-600 hover:underline">Ver todo</a>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="max-h-[240px] overflow-y-auto rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className={`${tone("bg-white", "bg-slate-800")} sticky top-0 z-10`}>
                            <tr className={tone("border-b border-slate-200 text-slate-500", "border-b border-slate-700/60 text-slate-400") + " text-left"}>
                              <th className="px-3 py-2">Asunto</th>
                              <th className="px-3 py-2">Estado</th>
                              <th className="px-3 py-2">Creada</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comunicacionesLoading ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">Cargando comunicaciones desde la base de datos...</td>
                              </tr>
                            ) : comunicacionesError ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-red-600">Error cargando comunicaciones: {comunicacionesError}</td>
                              </tr>
                            ) : comunicaciones.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">No hay comunicaciones registradas.</td>
                              </tr>
                            ) : (
                              comunicaciones.map((c) => {
                                const titulo = c.titulo || c.asunto || c.subject || '-';
                                const fecha = c.fecha_publicacion || c.created_at || c.creada || null;
                                const visible = (c.visible === undefined) ? true : !!c.visible; // por defecto visible
                                return (
                                  <tr key={c.id_anuncio || c.id} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                                    <td className="px-3 py-2 font-medium">{titulo}</td>
                                    <td className="px-3 py-2">
                                      <Badge toneName={visible ? "green" : "slate"}>{visible ? 'Visible' : 'Oculto'}</Badge>
                                    </td>
                                    <td className="px-3 py-2">{fecha ? formatDateTime(fecha) : '-'}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Segunda fila de tablas: Consumos + (NUEVO) Tickets */}
              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Consumos */}
                <Card>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Consumos</h3>
                      <a href={RUTA_CONSUMOS} className="text-sm text-blue-600 hover:underline">Ver todo</a>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="max-h-[260px] overflow-y-auto rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className={`${tone("bg-white", "bg-slate-800")} sticky top-0 z-10`}>
                            <tr className={tone("border-b border-slate-200 text-slate-500", "border-b border-slate-700/60 text-slate-400") + " text-left"}>
                              <th className="px-3 py-2">Depto</th>
                              <th className="px-3 py-2">Servicio</th>
                              <th className="px-3 py-2">Periodo</th>
                              <th className="px-3 py-2">Consumo</th>
                              <th className="px-3 py-2 text-right">Costo total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consumosLoading ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">Cargando consumos desde la base de datos...</td>
                              </tr>
                            ) : consumosError ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-sm text-red-600">Error cargando consumos: {consumosError}</td>
                              </tr>
                            ) : consumos.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">No hay consumos registrados.</td>
                              </tr>
                            ) : (
                              consumos.map((c) => {
                                const nroDep = c.nro_depa || departamentos.find(d => d.id_departamento === c.id_departamento)?.nro_depa || '-';
                                const servicio = c.tipo_servicio || servicios.find(s => s.id_servicio === c.id_servicio)?.nombre || '-';
                                const periodo = c.periodo || (c.periodo_ini ? formatYearMonth(c.periodo_ini) : '-');
                                const consumoVal = c.consumo !== undefined ? c.consumo : (c.consumo_calculado || '-');
                                return (
                                  <tr key={c.id_consumo || `${nroDep}-${periodo}`} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                                    <td className="px-3 py-2 font-medium">{nroDep}</td>
                                    <td className="px-3 py-2">{servicio}</td>
                                    <td className="px-3 py-2">{periodo}</td>
                                    <td className="px-3 py-2">{consumoVal}</td>
                                    <td className="px-3 py-2 text-right">{currency(c.costo_total)}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* NUEVO: Tickets y Mantenimiento (en lugar de Reservas) */}
              
              </section>

              {/* NUEVA sección abajo: Reservas (mover aquí) */}
              <section className="mt-6 grid gap-6">
                <Card>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Reservas</h3>
                      <a href={RUTA_RESERVAS} className="text-sm text-blue-600 hover:underline">Ver todo</a>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="max-h-[300px] overflow-y-auto rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className={`${tone("bg-white", "bg-slate-800")} sticky top-0 z-10`}>
                            <tr className={tone("border-b border-slate-200 text-slate-500", "border-b border-slate-700/60 text-slate-400") + " text-left"}>
                              <th className="px-3 py-2">Código</th>
                              <th className="px-3 py-2">Área</th>
                              <th className="px-3 py-2 text-right">Costo</th>
                              <th className="px-3 py-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservasLoading ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">Cargando reservas desde la base de datos...</td>
                              </tr>
                            ) : reservasError ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-sm text-red-600">Error cargando reservas: {reservasError}</td>
                              </tr>
                            ) : reservas.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">No hay reservas registradas.</td>
                              </tr>
                            ) : (
                              reservas.map((r) => {
                                const areaName = areasMap[r.id_area_comun] || areasComunes.find(a => a.id_area_comun === r.id_area_comun)?.nombre || "Área";
                                const codigo = r.codigo || code(r.id_reserva);
                                return (
                                  <tr key={r.id_reserva || codigo} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                                    <td className="px-3 py-2 font-medium">{codigo}</td>
                                    <td className="px-3 py-2">{areaName}</td>
                                    <td className="px-3 py-2 text-right">{currency(r.costo_total)}</td>
                                    <td className="px-3 py-2">
                                      <Badge toneName={r.estado === "pagado" ? "green" : (r.estado && r.estado.toLowerCase().includes('cancel') ? 'red' : 'slate')}>
                                        {r.estado || '-'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Acciones rápidas — exactamente 2 filas de 3 */}
              <section className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Gestión de usuarios */}
                <Link
                  to="/GestionDeUsuarios"
                  className={`group rounded-2xl border p-4 shadow-sm hover:shadow-md transition h-full ${tone(
                    "border-slate-200 bg-white hover:border-blue-300",
                    "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Gestión de usuarios</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Altas, roles, verificación</div>
                    <div className="mt-auto pt-3 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Ir al módulo →</div>
                  </div>
                </Link>

                {/* Comunicación */}
                <Link
                  to={RUTA_COMUNICACION}
                  className={`group rounded-2xl border p-4 shadow-sm hover:shadow-md transition h-full ${tone(
                    "border-slate-200 bg-white hover:border-blue-300",
                    "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Comunicación</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mensajes y avisos</div>
                    <div className="mt-auto pt-3 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Ir al módulo →</div>
                  </div>
                </Link>

                {/* Consumo */}
                <Link
                  to={RUTA_CONSUMOS}
                  className={`group rounded-2xl border p-4 shadow-sm hover:shadow-md transition h-full ${tone(
                    "border-slate-200 bg-white hover:border-blue-300",
                    "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Consumo</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Agua, luz y gas</div>
                    <div className="mt-auto pt-3 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Ir al módulo →</div>
                  </div>
                </Link>

                {/* Tickets Mantenimiento */}
                <Link
                  to={RUTA_TICKETS}
                  className={`group rounded-2xl border p-4 shadow-sm hover:shadow-md transition h-full ${tone(
                    "border-slate-200 bg-white hover:border-blue-300",
                    "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Tickets Mantenimiento</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Reportes y estado</div>
                    <div className="mt-auto pt-3 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Ir al módulo →</div>
                  </div>
                </Link>

                {/* Reservas */}
                <Link
                  to={RUTA_RESERVAS}
                  className={`group rounded-2xl border p-4 shadow-sm hover:shadow-md transition h-full ${tone(
                    "border-slate-200 bg-white hover:border-blue-300",
                    "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Reservas</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Áreas comunes</div>
                    <div className="mt-auto pt-3 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Ir al módulo →</div>
                  </div>
                </Link>

                {/* Espacio reservado (deshabilitado) */}
                <div
                  className={`rounded-2xl border p-4 opacity-50 cursor-not-allowed h-full ${tone(
                    "border-slate-200 bg-white",
                    "border-slate-700/60 bg-slate-800"
                  )}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
                    <div className="text-lg font-semibold">Próximo módulo</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Reservado</div>
                    <div className="mt-auto pt-3 text-sm text-slate-400">Disponible pronto</div>
                  </div>
                </div>
              </section>

              {loading && (
                <div className="fixed inset-0 z-20 grid place-items-center bg-black/10 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
                </div>
              )}
            </div> 
          </main>
        </div>
      </div>
    </div>
  );
}
