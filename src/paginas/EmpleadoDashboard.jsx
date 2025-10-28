import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfile";

export default function EmpleadoDashboard() {
  // ===== THEME =====
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // ===== MOCK DATA (cámbialos por tus endpoints cuando conectes backend) =====
  const edificio = { id_edificio: 1, nombre: "Torre Aura" };

  // Empleado actual (join de personas + empleados)
  const empleadoActual = {
    id_empleado: 8,
    id_persona: 301,
    nombres: "Maríadasd Fernanda",
    apellidos: "Rojas",
    correo: "maria.rojas@edificio.com",
    cargo: "Técnico de mantenimiento",
    turno: "Lunes–Viernes • 08:00–16:00",
    sueldo: 4200.0,
    estado: "Activo",
    avatar: "",
  };

  // Nóminas (últimos pagos)
  const nominas = [
    {
      id_nomina: 501,
      id_empleado: 8,
      salario_base: 4200.0,
      bono: 300.0,
      descuento: 120.0,
      total: 4380.0,
      fecha_pago: "2025-09-30",
      created_at: "2025-09-30T18:10:00",
    },
    {
      id_nomina: 472,
      id_empleado: 8,
      salario_base: 4200.0,
      bono: 0.0,
      descuento: 0.0,
      total: 4200.0,
      fecha_pago: "2025-08-31",
      created_at: "2025-08-31T17:50:00",
    },
  ];



  // Tickets (Sistema de tickets — ejemplo de cómo se vería)
  const tickets = [
    {
      id_ticket: "TK-1023",
      titulo: "Fuga en cañería baño 5A",
      prioridad: "alta",
      estado: "en_progreso",
      creado_por: "Admin",
      categoria: "Plomería",
      created_at: "2025-10-12T09:20:00",
      vence: "2025-10-15",
      asignado_a: 8,
    },
    {
      id_ticket: "TK-1019",
      titulo: "Foco quemado – pasillo piso 3",
      prioridad: "media",
      estado: "pendiente",
      creado_por: "Residente 3B",
      categoria: "Eléctrico",
      created_at: "2025-10-10T16:00:00",
      vence: "2025-10-17",
      asignado_a: 8,
    },
    {
      id_ticket: "TK-1008",
      titulo: "Mantenimiento ascensor B",
      prioridad: "alta",
      estado: "resuelto",
      creado_por: "Admin",
      categoria: "Mecánico",
      created_at: "2025-10-03T10:00:00",
      vence: "2025-10-05",
      asignado_a: 8,
    },
  ];

  // ===== HELPERS =====
  const currency = (v) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v || 0);
  const formatDate = (d) => new Date(d).toLocaleString();

  const misTickets = useMemo(
    () => tickets.filter((t) => t.asignado_a === empleadoActual.id_empleado),
    [tickets, empleadoActual.id_empleado]
  );

  const misNominas = useMemo(
    () => nominas.filter((n) => n.id_empleado === empleadoActual.id_empleado).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)),
    [nominas, empleadoActual.id_empleado]
  );

  const ultimaNomina = misNominas[0];

  // Loading (pequeño efecto visual)
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // ===== UI ATOMS =====
  function Card({ children, className = "" }) {
    return (
      <div
        className={`rounded-2xl border shadow-sm ${tone(
          "border-slate-200 bg-white/90",
          "border-slate-700/60 bg-slate-800/70"
        )} ${className}`}
      >
        {children}
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
      zinc: tone("bg-zinc-100 text-zinc-700", "bg-zinc-700/60 text-zinc-200"),
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>
    );
  }

  // ===== ACTIONS =====
  const handleLogout = () => {
    console.log("Cerrando sesión (empleado)...");
    alert("Cierre de sesión (mock). Integra con tu backend.");
  };

  // ===== RENDER =====
  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div
        className={
          tone(
            "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900",
            "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100"
          ) + " min-h-screen"
        }
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 z-10 border-b ${tone(
            "border-slate-200 bg-white/70",
            "border-slate-700/60 bg-slate-900/60"
          )} backdrop-blur`}
        >
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                <span>🛠️</span>
                <span className="font-medium">Panel del Empleado</span>
                <span className="text-slate-500">• {edificio.nombre}</span>
              </div>

              <nav className="flex-1">
                <ul className="flex flex-wrap gap-2 text-sm">
                  <li>
                    <Link
                      to="/empleado/ticketsMantenimiento"
                      className={`rounded-xl px-3 py-2 ${tone(
                        "bg-white border border-slate-200 hover:bg-slate-100",
                        "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                      )}`}
                    >
                      Tickets de mantenimiento
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/empleado/finanzas"
                      className={`rounded-xl px-3 py-2 ${tone(
                        "bg-white border border-slate-200 hover:bg-slate-100",
                        "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                      )}`}
                    >
                      Gestión financiera
                    </Link>
                  </li>
                </ul>
              </nav>

              <button
                onClick={() => setDark((d) => !d)}
                className={`rounded-xl px-3 py-2 text-sm ${tone(
                  "border border-slate-200 bg-white hover:bg-slate-100",
                  "border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40"
                )}`}
              >
                {dark ? "☾ Modo claro" : "☀︎ Modo oscuro"}
              </button>

              <UserProfile
                dark={dark}
                usuarioActual={{
                  id_persona: empleadoActual.id_persona,
                  nombre: empleadoActual.nombres,
                  apellido: empleadoActual.apellidos,
                  email: empleadoActual.correo,
                  rol: "Empleado",
                  avatar: empleadoActual.avatar,
                }}
                edificioName={edificio.nombre}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* 1) Encabezado: Cargo / Turno / Sueldo / Estado */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Cargo</div>
                <div className="mt-1 text-xl font-semibold">{empleadoActual.cargo}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">ID Empleado #{empleadoActual.id_empleado}</div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Turno</div>
                <div className="mt-1 text-xl font-semibold">{empleadoActual.turno}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Ajustable por RRHH</div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Sueldo base</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{currency(empleadoActual.sueldo)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Última nómina: {ultimaNomina ? currency(ultimaNomina.total) : "—"}</div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Estado</div>
                <div className="mt-2">
                  {empleadoActual.estado === "Activo" ? (
                    <Badge toneName="green">Activo</Badge>
                  ) : (
                    <Badge toneName="red">Inactivo</Badge>
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* 2) Botones grandes (2 módulos) */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/empleado/tickets"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Tickets de mantenimiento</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            <Link
              to="/empleado/finanzas"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Gestión financiera</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            {/* Slot para crecimiento futuro */}
            <div
              className={`rounded-2xl border p-5 opacity-60 ${tone(
                "border-slate-200 bg-white",
                "border-slate-700/60 bg-slate-800"
              )}`}
              title="Disponible para nuevo módulo"
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">—</div>
              <div className="mt-2 text-sm text-slate-400">Próximamente</div>
            </div>
          </section>

          {/* 3) Vistas rápidas de los módulos */}
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Tickets asignados */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tickets asignados</h3>
                  <Link to="/empleado/tickets" className="text-xs text-blue-600 hover:underline">
                    Ver todos
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Título</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2">Prioridad</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Vence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misTickets.slice(0, 6).map((t) => (
                        <tr key={t.id_ticket} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                          <td className="px-3 py-2 font-mono text-xs">{t.id_ticket}</td>
                          <td className="px-3 py-2">{t.titulo}</td>
                          <td className="px-3 py-2">{t.categoria}</td>
                          <td className="px-3 py-2">
                            {t.prioridad === "alta" ? (
                              <Badge toneName="red">Alta</Badge>
                            ) : t.prioridad === "media" ? (
                              <Badge toneName="amber">Media</Badge>
                            ) : (
                              <Badge toneName="zinc">Baja</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {t.estado === "resuelto" ? (
                              <Badge toneName="green">Resuelto</Badge>
                            ) : t.estado === "en_progreso" ? (
                              <Badge toneName="blue">En progreso</Badge>
                            ) : (
                              <Badge toneName="zinc">Pendiente</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">{t.vence}</td>
                        </tr>
                      ))}
                      {misTickets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                            No tienes tickets asignados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Finanzas del empleado */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Finanzas • Mi nómina</h3>
                  <Link to="/empleado/finanzas" className="text-xs text-blue-600 hover:underline">
                    Ver detalle
                  </Link>
                </div>

                {/* KPIs */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={`rounded-xl p-3 ${tone("bg-slate-50", "bg-slate-900/30")}`}>
                    <div className="text-xs text-slate-500">Último pago</div>
                    <div className="mt-1 text-lg font-semibold">{ultimaNomina ? currency(ultimaNomina.total) : "—"}</div>
                    <div className="text-xs text-slate-500">{ultimaNomina ? new Date(ultimaNomina.fecha_pago).toLocaleDateString() : ""}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${tone("bg-slate-50", "bg-slate-900/30")}`}>
                    <div className="text-xs text-slate-500">Salario base</div>
                    <div className="mt-1 text-lg font-semibold">{currency(empleadoActual.sueldo)}</div>
                    <div className="text-xs text-slate-500">Mensual</div>
                  </div>
                  <div className={`rounded-xl p-3 ${tone("bg-slate-50", "bg-slate-900/30")}`}>
                    <div className="text-xs text-slate-500">Bonos (último)</div>
                    <div className="mt-1 text-lg font-semibold">{ultimaNomina ? currency(ultimaNomina.bono) : "—"}</div>
                    <div className="text-xs text-slate-500">Descuentos: {ultimaNomina ? currency(ultimaNomina.descuento) : "—"}</div>
                  </div>
                </div>

                {/* Tabla de últimas nóminas */}
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className={`border-b ${tone("border-slate-200 text-slate-500", "border-slate-700/60 text-slate-400")} text-left`}>
                        <th className="px-3 py-2">Fecha pago</th>
                        <th className="px-3 py-2 text-right">Base</th>
                        <th className="px-3 py-2 text-right">Bono</th>
                        <th className="px-3 py-2 text-right">Descuento</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misNominas.slice(0, 6).map((n) => (
                        <tr key={n.id_nomina} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                          <td className="px-3 py-2">{new Date(n.fecha_pago).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-right">{currency(n.salario_base)}</td>
                          <td className="px-3 py-2 text-right">{currency(n.bono)}</td>
                          <td className="px-3 py-2 text-right">{currency(n.descuento)}</td>
                          <td className="px-3 py-2 text-right font-medium">{currency(n.total)}</td>
                        </tr>
                      ))}
                      {misNominas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                            Aún no hay nóminas registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </section>

          {/* 4) "Mi día" */}
          <section className="mt-8">
            {/* Mi día / Turno */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Mi día</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Resumen</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-xl p-3 ${tone("bg-slate-50", "bg-slate-900/30")}`}>
                    <div className="text-xs text-slate-500">Turno de hoy</div>
                    <div className="mt-1 text-lg font-semibold">08:00 – 16:00</div>
                    <div className="text-xs text-slate-500">Llegadas: 0 • Salidas: 0</div>
                  </div>
                  <div className={`rounded-xl p-3 ${tone("bg-slate-50", "bg-slate-900/30")}`}>
                    <div className="text-xs text-slate-500">Tickets por estado</div>
                    <div className="mt-1 text-lg font-semibold">
                      {misTickets.filter((t) => t.estado !== "resuelto").length} abiertos
                    </div>
                    <div className="text-xs text-slate-500">Resueltos: {misTickets.filter((t) => t.estado === "resuelto").length}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  * Estos datos son demostrativos.
                </div>
              </div>
            </Card>
          </section>

          {loading && (
            <div className="fixed inset-0 z-20 grid place-items-center bg-black/10 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
