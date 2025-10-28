import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfile";

export default function ResidentDashboard() {
  // THEME
  const [dark, setDark] = useState(false);
  const tone = (clsLight, clsDark) => (dark ? clsDark : clsLight);

  // MOCK DATA (ajusta a tus endpoints cuando conectes backend)
  const edificio = { id_edificio: 1, nombre: "Torre Aura" };
  const usuarioActual = {
    id_residente: 2,
    id_persona: 101,
    id_departamento: 2,
    nombre: "Luis",
    apellido: "Torrez",
    email: "luis@ej.com",
    rol: "Residente",
    avatar: "",
  };

  const departamentos = [
    { id_departamento: 1, nro_piso: 3, nro_depa: "3B", estado: "ocupado", metros2: 75.5, id_edificio: 1 },
    { id_departamento: 2, nro_piso: 5, nro_depa: "5A", estado: "ocupado", metros2: 92.0, id_edificio: 1 },
    { id_departamento: 4, nro_piso: 8, nro_depa: "8A", estado: "ocupado", metros2: 68.0, id_edificio: 1 },
  ];

  const areasComunes = [
    { id_area_comun: 1, nombre: "Sala de eventos", ubicacion: "Mezanine", costo_hora: 60, id_edificio: 1 },
    { id_area_comun: 2, nombre: "Gimnasio", ubicacion: "Piso 2", costo_hora: 0, id_edificio: 1 },
  ];

  const consumos = [
    { id_consumo: 10, periodo_ini: "2025-09-01", periodo_fin: "2025-09-30", costo_total: 95.0, id_departamento: 2, id_servicio: 3 },
    { id_consumo: 11, periodo_ini: "2025-08-01", periodo_fin: "2025-08-31", costo_total: 88.0, id_departamento: 2, id_servicio: 3 },
  ];

  const pagos = [
    { id_pago: 20, concepto: "Expensas", periodo_ini: "2025-09-01", periodo_fin: "2025-09-30", metodo: "QR", costo_total: 210.0, id_departamento: 2, created_at: "2025-09-10" },
    { id_pago: 21, concepto: "Reserva sala", periodo_ini: "2025-09-14", periodo_fin: "2025-09-14", metodo: "Tarjeta", costo_total: 120.0, id_departamento: 2, created_at: "2025-09-14" },
  ];

  const estadosCuenta = [
    { id_estado: 200, id_residente: 2, id_departamento: 2, periodo: "2025-09", saldo_anterior: 0, cargos_mes: 210, pagos_mes: 210, saldo_actual: 0 },
    { id_estado: 201, id_residente: 2, id_departamento: 2, periodo: "2025-08", saldo_anterior: 20, cargos_mes: 100, pagos_mes: 80, saldo_actual: 40 },
  ];

  const reservas = [
    { id_reserva: 91, fecha_ini: "2025-10-15T09:00:00", fecha_fin: "2025-10-15T11:00:00", estado: "confirmada", costo_total: 0, id_area_comun: 2, id_residente: 2 },
    { id_reserva: 95, fecha_ini: "2025-10-20T19:00:00", fecha_fin: "2025-10-20T21:00:00", estado: "pendiente", costo_total: 60, id_area_comun: 1, id_residente: 2 },
  ];

  const notificaciones = [
    { id_notificacion: 100, titulo: "Reserva confirmada", mensaje: "Gimnasio 15/10 a las 9:00", leida: false, fecha_envio: "2025-10-02T14:22:00", id_residente: 2 },
    { id_notificacion: 101, titulo: "Pago registrado", mensaje: "Se registró tu pago de expensas", leida: true, fecha_envio: "2025-09-10T11:00:00", id_residente: 2 },
  ];

  const anunciosRecientes = [
    { 
      id_anuncio: 1, 
      titulo: "Corte de agua programado", 
      contenido: "Estimados residentes, informamos que mañana de 09:00 a 12:00 habrá un corte de agua por mantenimiento.", 
      fijado: true, 
      fecha_publicacion: "2025-10-11T08:00:00", 
      autor: { nombres: "Administración" } 
    },
    { 
      id_anuncio: 2, 
      titulo: "Limpieza de áreas comunes", 
      contenido: "Este sábado se realizará la limpieza mensual de todas las áreas comunes del edificio.", 
      fijado: false, 
      fecha_publicacion: "2025-10-10T15:30:00", 
      autor: { nombres: "Administración" } 
    },
    { 
      id_anuncio: 3, 
      titulo: "Reunión de consorcio", 
      contenido: "Los invitamos a la reunión mensual del consorcio el próximo jueves a las 19:00 en la sala de eventos.", 
      fijado: false, 
      fecha_publicacion: "2025-10-09T10:15:00", 
      autor: { nombres: "Administración" } 
    },
    { 
      id_anuncio: 4, 
      titulo: "Nuevo reglamento de mascotas", 
      contenido: "Se ha actualizado el reglamento para el uso de áreas comunes con mascotas. Por favor revisar en portería.", 
      fijado: true, 
      fecha_publicacion: "2025-10-08T12:00:00", 
      autor: { nombres: "Consejo de Administración" } 
    },
  ];

  // HELPERS
  const currency = (v) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v || 0);
  const formatDate = (d) => new Date(d).toLocaleString();

  const miDepto = useMemo(
    () => departamentos.find((d) => d.id_departamento === usuarioActual.id_departamento),
    [departamentos, usuarioActual.id_departamento]
  );

  const misReservas = useMemo(
    () =>
      reservas
        .filter((r) => r.id_residente === usuarioActual.id_residente)
        .sort((a, b) => new Date(a.fecha_ini) - new Date(b.fecha_ini)),
    [reservas, usuarioActual.id_residente]
  );

  const misPagos = useMemo(
    () =>
      pagos
        .filter((p) => p.id_departamento === usuarioActual.id_departamento)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [pagos, usuarioActual.id_departamento]
  );

  const misConsumos = useMemo(
    () =>
      consumos
        .filter((c) => c.id_departamento === usuarioActual.id_departamento)
        .sort((a, b) => new Date(b.periodo_ini) - new Date(a.periodo_ini)),
    [consumos, usuarioActual.id_departamento]
  );

  const miEstadoActual = useMemo(
    () =>
      estadosCuenta
        .filter((e) => e.id_residente === usuarioActual.id_residente)
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1))[0],
    [estadosCuenta, usuarioActual.id_residente]
  );

  // QUICK INFO (encabezado de datos)
  const deptoLabel = miDepto ? `Depto ${miDepto.nro_depa}` : "Mi departamento";
  const nombreEdificio = edificio.nombre;
  const precioMensual = miEstadoActual?.cargos_mes ?? 0; // TODO: cuando conectes backend, usa campo "precio_mensual" del depa/contrato
  const estadoActivo = miDepto ? (miDepto.estado === "ocupado" ? "Activo" : "Inactivo") : "—";

  // Otros cálculos
  const saldoActual = miEstadoActual?.saldo_actual ?? 0;
  // Loading
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // UI atoms
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
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>
    );
  }

  // Header actions
  const handleLogout = () => {
    console.log("Cerrando sesión (residente)...");
    alert("Cierre de sesión (mock). Integra con tu backend.");
  };

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div
        className={
          tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900", "bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") +
          " min-h-screen"
        }
      >
        {/* Topbar */}
        <header
          className={
            `sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70", "border-slate-700/60 bg-slate-900/60")} backdrop-blur`
          }
        >
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                <span>🏘️</span>
                <span className="font-medium">Panel del Residente</span>
                <span className="text-slate-500">• {deptoLabel} — {nombreEdificio}</span>
              </div>
              <nav className="flex-1">
                <ul className="flex flex-wrap gap-2 text-sm">
                  <li>
                    <Link
                      to="/residente/comunicacion"
                      className={`rounded-xl px-3 py-2 ${tone(
                        "bg-white border border-slate-200 hover:bg-slate-100",
                        "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                      )}`}
                    >
                      Ver Comunicacion
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
                      to="/residente/ticketsMantenimiento"
                      className={`rounded-xl px-3 py-2 ${tone(
                        "bg-white border border-slate-200 hover:bg-slate-100",
                        "bg-slate-800 border border-slate-700/60 hover:bg-slate-700/40"
                      )}`}
                    >
                      Mis Tikests de mantenimiento
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/residente/reservas"
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
                usuarioActual={usuarioActual}
                edificioName={nombreEdificio}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* 1) Encabezado: Depto / Precio mensual / Estado */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Departamento</div>
                <div className="mt-1 text-2xl font-semibold">{miDepto ? miDepto.nro_depa : "—"}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{nombreEdificio}</div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Precio mensual</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                  {currency(precioMensual)}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">(*) tomado del último estado</div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Estado</div>
                <div className="mt-2">
                  {estadoActivo === "Activo" ? (
                    <Badge toneName="green">Activo</Badge>
                  ) : (
                    <Badge toneName="red">Inactivo</Badge>
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* 2) Botones grandes (6 slots) */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/residente/comunicacion"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Ver comunicación</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            <Link
              to="/residente/consumo"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Ver consumo</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            <Link
              to="/mis-pagos"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Ver mis pagos</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            <Link
              to="/reservasAreas"
              className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${tone(
                "border-slate-200 bg-white hover:border-blue-300",
                "border-slate-700/60 bg-slate-800 hover:border-blue-400/50"
              )}`}
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">Módulo</div>
              <div className="mt-1 text-xl font-semibold">Reservar Áreas Comunes</div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">Abrir →</div>
            </Link>

            {/* Slots para futuro crecimiento */}
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
            {/* Muro de Anuncios: anuncios recientes */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Muro de Anuncios</h3>
                  <Link to="/residente/comunicacion" className="text-xs text-blue-600 hover:underline">
                    Ver todo
                  </Link>
                </div>
                <ul className="space-y-3">
                  {anunciosRecientes
                    .slice(0, 4)
                    .map((anuncio) => (
                      <li
                        key={anuncio.id_anuncio}
                        className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{anuncio.titulo}</div>
                          <div className="flex gap-2 items-center">
                            {anuncio.fijado && <Badge toneName="violet">Fijado</Badge>}
                          </div>
                        </div>
                        <div className={"text-sm " + tone("text-slate-700", "text-slate-300")}>
                          {anuncio.contenido.length > 100 
                            ? anuncio.contenido.substring(0, 100) + "..." 
                            : anuncio.contenido
                          }
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Por {anuncio.autor?.nombres || "Admin"} • {formatDate(anuncio.fecha_publicacion)}
                        </div>
                      </li>
                    ))}
                  {anunciosRecientes.length === 0 && (
                    <li className={`rounded-xl border p-3 ${tone("border-slate-100", "border-slate-700/40")} opacity-70`}>
                      <div className="text-sm">No hay anuncios recientes</div>
                    </li>
                  )}
                </ul>
              </div>
            </Card>

            {/* Consumo: últimos consumos */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Consumo • Últimos meses</h3>
                  <Link to="/mis-consumos" className="text-xs text-blue-600 hover:underline">
                    Ver detalle
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr
                        className={`border-b ${tone(
                          "border-slate-200 text-slate-500",
                          "border-slate-700/60 text-slate-400"
                        )} text-left`}
                      >
                        <th className="px-3 py-2">Periodo</th>
                        <th className="px-3 py-2">Servicio</th>
                        <th className="px-3 py-2 text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misConsumos.slice(0, 6).map((c) => (
                        <tr key={c.id_consumo} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                          <td className="px-3 py-2">{new Date(c.periodo_ini).toISOString().slice(0, 7)}</td>
                          <td className="px-3 py-2">Servicio #{c.id_servicio}</td>
                          <td className="px-3 py-2 text-right">{currency(c.costo_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Pagos: estado + últimos pagos */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Mis pagos • Estado actual</h3>
                  <Link to="/mis-pagos" className="text-xs text-blue-600 hover:underline">
                    Ver detalle
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  {saldoActual > 0 ? (
                    <>
                      <Badge toneName="red">Saldo pendiente</Badge>
                      <div className="text-sm">
                        Debes <span className="font-semibold text-red-600 dark:text-red-300">{currency(saldoActual)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge toneName="green">Al día</Badge>
                      <div className="text-sm">No tienes deudas pendientes</div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Últimos pagos
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr
                          className={`border-b ${tone(
                            "border-slate-200 text-slate-500",
                            "border-slate-700/60 text-slate-400"
                          )} text-left`}
                        >
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2">Concepto</th>
                          <th className="px-3 py-2">Método</th>
                          <th className="px-3 py-2 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misPagos.slice(0, 6).map((p) => (
                          <tr key={p.id_pago} className={`border-b ${tone("border-slate-100", "border-slate-700/40")}`}>
                            <td className="px-3 py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{p.concepto}</td>
                            <td className="px-3 py-2">{p.metodo}</td>
                            <td className="px-3 py-2 text-right">{currency(p.costo_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reservas: recientes */}
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Reservas • Recientes</h3>
                  <Link to="/reservasAreas" className="text-xs text-blue-600 hover:underline">
                    Reservar
                  </Link>
                </div>
                <ul className="space-y-3">
                  {misReservas.length ? (
                    misReservas.slice(0, 5).map((r) => {
                      const area = areasComunes.find((a) => a.id_area_comun === r.id_area_comun)?.nombre || "Área";
                      return (
                        <li
                          key={r.id_reserva}
                          className={`rounded-2xl border p-3 ${tone("border-slate-100", "border-slate-700/40")}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{area}</div>
                            <Badge toneName={r.estado === "confirmada" ? "green" : "amber"}>{r.estado}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(r.fecha_ini).toLocaleString()} → {new Date(r.fecha_fin).toLocaleTimeString()}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">Sin reservas futuras</div>
                  )}
                </ul>
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
