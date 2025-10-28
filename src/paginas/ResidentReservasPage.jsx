import  { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import UserProfile from "../components/UserProfile/UserProfile";
import QRCode from "qrcode";
import { areasAPI, reservasAPI } from "../services/api";

/**
 * ============================================================================
 * Reservas — Residente (V2)
 * Cambios pedidos:
 *  - Galería de Áreas con tarjetas grandes (imágenes/título/costo) para elegir.
 *  - En el modal de reserva se muestra el QR de pago ANTES de confirmar y
 *    se requiere marcar "He pagado" para habilitar Confirmar (mock de pago).
 *  - "Mis reservas": agrega botón "Ver" con modal estilo factura (detalle completo + QR).
 * 
 * TODO endpoints (cuando conectes backend):
 *  GET  /api/areas
 *  GET  /api/reservas?area=&desde=&hasta=
 *  GET  /api/mis-reservas?estado=
 *  POST /api/reservas { id_area_comun, fecha_ini, fecha_fin } -> { id_reserva, codigo, costo_total }
 *  PATCH /api/reservas/:id/estado { estado: 'cancelada' }
 *  POST /api/pagos/preparar { id_reserva } -> { qr_url/token } (mock aquí)
 * ============================================================================
 */

/* --------------------------- UI helpers ----------------------------- */
const Input = ({ label, error, register, dark, className = "", ...props }) => {
  const tone = (l,d) => dark ? d : l;
  return (
    <label className={`block ${className}`}>
      {label && <span className={`text-xs font-medium ${tone("text-slate-600","text-slate-300")}`}>{label}</span>}
      <input
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
               : tone("border-slate-200 bg-white","border-slate-600 bg-slate-800")
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};
const Select = ({ label, error, register, dark, children, className = "", ...props }) => {
  const tone = (l,d) => dark ? d : l;
  return (
    <label className={`block ${className}`}>
      {label && <span className={`text-xs font-medium ${tone("text-slate-600","text-slate-300")}`}>{label}</span>}
      <select
        {...props}
        {...(register ? register : {})}
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring ${
          error ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
               : tone("border-slate-200 bg-white","border-slate-600 bg-slate-800")
        }`}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </label>
  );
};
const Card = ({ children, className = "", dark }) => {
  const tone = (l,d) => dark ? d : l;
  return (
    <div className={`rounded-2xl border shadow-sm ${tone("border-slate-200 bg-white/90","border-slate-700/60 bg-slate-800/70")} ${className}`}>{children}</div>
  );
};
const Badge = ({ children, toneName = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[toneName]}`}>{children}</span>;
};

/* --------------------- Utilidades calendario ------------------------ */
function getMonthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
  while (cells.length < 42) cells.push(null);
  const rows = [];
  for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  return rows;
}
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function HHmm(date){ return date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function overlap(aStart, aEnd, bStart, bEnd){ return aStart < bEnd && bStart < aEnd; }

/* ---------------------- Área gallery (cards) ------------------------ */
function AreasGallery({ dark, areas, selectedId, onSelect }){
  const tone = (l,d) => dark ? d : l;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max mt-1 ml-1">
        {areas.map(a => (
          <div
            key={a.id_area_comun}
            className={`w-80 flex-shrink-0 rounded-2xl border overflow-hidden ${selectedId===a.id_area_comun ? 'ring-2 ring-blue-500' : ''} ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}
          >
          <div className={`h-36 w-full ${tone('bg-slate-100','bg-slate-900/40')} grid place-items-center`}>
            <div className="text-5xl">🏷️</div>
          </div>
          <div className="p-4">
            <div className="text-lg font-semibold">{a.nombre}</div>
            <div className="text-sm opacity-80 dark:text-slate-400 mt-1">Ubicacion: {a.ubicacion||'—'}</div>
            <div className="text-sm opacity-80 mt-2 line-clamp-2">{a.descripcion||'Sin descripción'}</div>
            <div className="mt-2 text-sm">Costo/hora: <b>BOB {Number(a.costo_hora||0).toFixed(2)}</b></div>
            <div className="pt-3 flex justify-end">
              <button onClick={()=>onSelect(a.id_area_comun)} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">
                Ver calendario
              </button>
            </div>
          </div>
        </div>
        ))}
        {areas.length===0 && (
          <div className="w-80 flex-shrink-0">
            <Card dark={dark}><div className="p-4 text-sm opacity-70">No hay áreas disponibles.</div></Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------ Calendario + Reserva ---------------------- */
function CalendarioResidente({ dark, currentPersona, areas, reservas, setReservas }){
  const tone = (l,d) => dark ? d : l;
  const [areaSel, setAreaSel] = useState(areas[0]?.id_area_comun || "");
  const [mes, setMes] = useState((new Date()).getMonth());
  const [anio, setAnio] = useState((new Date()).getFullYear());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const matrix = useMemo(()=>getMonthMatrix(anio, mes), [anio, mes]);
  const diasNombre = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  // Actualizar areaSel cuando se carguen las áreas
  useEffect(() => {
    if (areas.length > 0 && !areaSel) {
      setAreaSel(areas[0].id_area_comun);
    }
  }, [areas]);

  const reservasArea = useMemo(()=> (reservas[areaSel]||[]), [reservas, areaSel]);
  const perDay = useMemo(()=>{
    const map = {};
    reservasArea.filter(r => r.estado !== 'cancelado').forEach(r => {
      const d = new Date(r.fecha_ini);
      const key = d.toDateString();
      (map[key] ||= []).push(r);
    });
    return map;
  },[reservasArea]);

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const cambiarArea = (nuevaAreaId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setAreaSel(nuevaAreaId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Galería de Áreas */}
      <Card dark={dark}>
        <div className="p-4">
          <div className="mb-3 text-lg font-semibold">Elige un área</div>
          <AreasGallery dark={dark} areas={areas} selectedId={areaSel} onSelect={cambiarArea} />
        </div>
      </Card>

      {/* Calendario */}
      <Card dark={dark}>
        <div className="p-4 flex flex-wrap items-center gap-3">
          {areaSel && areas.find(a=>a.id_area_comun===areaSel) ? (
            <div className={`rounded-xl border-2 border-blue-500 ${tone("bg-blue-50","bg-blue-900/20")} px-4 py-2`}>
              <div className="flex items-center gap-2">
                <div className="text-lg">🏷️</div>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {areas.find(a=>a.id_area_comun===areaSel)?.nombre}
                </span>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border-2 border-dashed ${tone("border-slate-300 bg-slate-50","border-slate-600 bg-slate-800/50")} px-4 py-2`}>
              <span className="text-sm text-slate-500 dark:text-slate-400">Selecciona un área</span>
            </div>
          )}
          <div className="ms-auto flex items-center gap-2">
            <button onClick={()=> setMes(m => (m===0?11:m-1))} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100","border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>←</button>
            <div className="px-2 text-sm font-medium">{new Date(anio, mes).toLocaleDateString(undefined,{month:'long', year:'numeric'})}</div>
            <button onClick={()=> setMes(m => (m===11?0:m+1))} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100","border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>→</button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 text-xs font-medium opacity-70 mb-2">
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d=>(<div key={d} className="text-center">{d}</div>))}
          </div>
          <div className={`grid grid-cols-7 gap-2 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
            {(() => {
              const daysInMonth = new Date(anio, mes+1, 0).getDate();
              const days = Array.from({length: daysInMonth}, (_,i)=> new Date(anio, mes, i+1));
              return days.map((d, idx) => {
                const res = perDay[d.toDateString()] || [];
                const isToday = sameDay(d, new Date());
                return (
                  <div key={idx} onClick={()=> setDiaSeleccionado(d)} className={`h-28 rounded-xl border-2 p-2 cursor-pointer ${tone("border-slate-300 bg-white hover:bg-slate-50","border-slate-600/80 bg-slate-800 hover:bg-slate-700/40")} ${isToday?'ring-2 ring-blue-500':''}`}>
                    <div className="text-lg font-semibold">{d.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {res.slice(0,3).map(r => (
                        <div key={r.id_reserva} className="truncate text-[11px] rounded-md px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {HHmm(new Date(r.fecha_ini))} · {r.residente?.nombres || "Residente"}
                        </div>
                      ))}
                      {res.length>3 && <div className="text-[11px] opacity-60">+{res.length-3} más…</div>}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </Card>

      {diaSeleccionado && (
        <ReservarModal
          dark={dark}
          dia={diaSeleccionado}
          setDia={setDiaSeleccionado}
          area={areas.find(a=>a.id_area_comun===areaSel)}
          reservasDelDia={(reservas[areaSel]||[]).filter(r=> sameDay(new Date(r.fecha_ini), diaSeleccionado) && r.estado !== 'cancelado')}
          onCrear={async (nueva, pago_confirmado=false) => {
            try {
              // llamada al backend para crear reserva
              const payload = { ...nueva, pago_confirmado };
              const res = await reservasAPI.createReserva(areaSel, payload);
              if (res.success) {
                const created = res.data;
                // añadir residente simplificado para UI
                created.residente = { nombres: currentPersona.nombres, apellidos: currentPersona.apellidos };
                setReservas(prev => ({ ...prev, [areaSel]: [...(prev[areaSel]||[]), created] }));
                alert('Reserva creada correctamente');
              }
            } catch (err) {
              console.error('Error creando reserva:', err);
              alert(err.message || 'Error creando reserva');
            }
          }}
          currentPersona={currentPersona}
        />
      )}
    </div>
  );
}

/* ------------------- Modal Crear Reserva con QR previo --------------- */
function ReservarModal({ dark, dia, setDia, area, reservasDelDia, onCrear, currentPersona }){
  const tone = (l,d) => dark ? d : l;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { hora_ini: "14:00", hora_fin: "16:00", aceptoPago: false }
  });
  const hora_ini = watch("hora_ini");
  const hora_fin = watch("hora_fin");
  const aceptoPago = watch("aceptoPago");

  // opciones de horas cada hora completa
  const horas = [];
  for (let h=6; h<=23; h++){
    const hh = String(h).padStart(2,'0');
    horas.push(`${hh}:00`);
  }

  const calcularCosto = () => {
    if (!hora_ini || !hora_fin) return 0;
    const [hi, mi] = hora_ini.split(":").map(Number);
    const [hf, mf] = hora_fin.split(":").map(Number);
    const ini = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hi, mi);
    const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hf, mf);
    const hours = Math.max(0, (fin - ini) / 3600000);
    return Number(area?.costo_hora||0) * hours;
  };

  const conflicto = () => {
    if (!hora_ini || !hora_fin) return null;
    const [hi, mi] = hora_ini.split(":").map(Number);
    const [hf, mf] = hora_fin.split(":").map(Number);
    const ini = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hi, mi);
    const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hf, mf);
    for (const r of reservasDelDia) {
      const rIni = new Date(r.fecha_ini);
      const rFin = new Date(r.fecha_fin);
      if (overlap(ini, fin, rIni, rFin) && r.estado!=='cancelado') return r;
    }
    return null;
  };

  const submit = (data) => {
    const [hi, mi] = data.hora_ini.split(":").map(Number);
    const [hf, mf] = data.hora_fin.split(":").map(Number);
    const ini = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hi, mi);
    const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hf, mf);
    if (fin <= ini) { alert("La hora fin debe ser mayor que la hora inicio"); return; }
    const ch = conflicto();
    if (ch) { alert("Ese horario ya está ocupado por otra reserva."); return; }
    if (!data.aceptoPago) { alert("Debes marcar 'He pagado' antes de confirmar."); return; }

    const nueva = {
      fecha_ini: ini.toISOString(),
      fecha_fin: fin.toISOString(),
      costo_total: calcularCosto(),
    };
    // pago_confirmado según checkbox aceptoPago
    onCrear(nueva, Boolean(data.aceptoPago));
    setDia(null);
  };

  const QRBlock = () => {
    const [qrDataURL, setQrDataURL] = useState('');
    
    useEffect(() => {
      const generateQR = async () => {
        try {
          // Generar datos del pago para el QR
          const paymentData = {
            reserva_id: `temp_${Date.now()}`,
            area: area?.nombre,
            fecha: dia.toISOString().split('T')[0],
            hora_inicio: hora_ini,
            hora_fin: hora_fin,
            costo: calcularCosto(),
            timestamp: Date.now()
          };
          
          // Convertir a string JSON para el QR
          const qrText = JSON.stringify(paymentData);
          
          // Generar el QR code
          const url = await QRCode.toDataURL(qrText, {
            width: 192, // 48 * 4 (w-48 = 192px)
            margin: 1,
            color: {
              dark: tone('#1e293b', '#f1f5f9'), // slate-800 dark, slate-100 light
              light: tone('#f1f5f9', '#1e293b')  // slate-100 light, slate-800 dark
            }
          });
          
          setQrDataURL(url);
        } catch (error) {
          console.error('Error generando QR:', error);
        }
      };
      
      generateQR();
    }, [area, dia, hora_ini, hora_fin]);

    return (
      <div className="rounded-xl border p-3 text-sm dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <div className="font-medium">QR de pago</div>
        </div>
        <div className="grid place-items-center py-3">
          {qrDataURL ? (
            <img 
              src={qrDataURL} 
              alt="QR Code para pago" 
              className="w-48 h-48 rounded-lg border border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className={`w-48 h-48 rounded-lg ${tone('bg-slate-100','bg-slate-900/40')} flex items-center justify-center`}>
              <div className="text-sm opacity-70">Generando QR...</div>
            </div>
          )}
        </div>
        <div className="text-xs opacity-70">* Escanea este QR para realizar el pago</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <div className={`w-full max-w-2xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="text-lg font-semibold">Reservar — {area?.nombre} ({dia.toLocaleDateString()})</div>
          <button onClick={()=>setDia(null)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <form onSubmit={handleSubmit(submit)} className="p-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Hora inicio" dark={dark} register={register("hora_ini",{required:"Requerido"})} error={errors.hora_ini}>
                {Array.from(horas).map(h => <option key={h} value={h}>{h}</option>)}
              </Select>
              <Select label="Hora fin" dark={dark} register={register("hora_fin",{required:"Requerido"})} error={errors.hora_fin}>
                {Array.from(horas).map(h => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
            <div className="rounded-xl border px-3 py-2 text-sm dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <div className="opacity-70">Costo estimado</div>
                <div className="text-base font-semibold">BOB {calcularCosto().toFixed(2)}</div>
              </div>
              {conflicto() && (
                <div className="mt-2 text-xs text-red-500">⚠️ Ese rango choca con otra reserva ({HHmm(new Date(conflicto().fecha_ini))}–{HHmm(new Date(conflicto().fecha_fin))}).</div>
              )}
            </div>
          </div>

          <QRBlock />

          <div className="md:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("aceptoPago")} /> He pagado con el QR
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setDia(null)} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>Cerrar</button>
              <button type="submit" disabled={isSubmitting || !!conflicto() || !aceptoPago} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">Confirmar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------------- Mis Reservas --------------------------- */
function MisReservas({ dark, currentPersona, areas, reservas, setReservas }){
  const tone = (l,d) => dark ? d : l;
  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar mis reservas desde la API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reservasAPI.getMisReservas();
        if (res.success) {
          setMisReservas(res.data);
        }
      } catch (err) {
        console.error('Error cargando mis reservas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(()=>{
    return misReservas.sort((a,b)=> new Date(b.fecha_ini) - new Date(a.fecha_ini)); // más recientes primero
  }, [misReservas]);

  const setEstadoReserva = (id_reserva, nuevo)=>{
    setMisReservas(prev => prev.map(r => r.id_reserva === id_reserva ? { ...r, estado: nuevo } : r));
  };

  const cancelar = async (id_reserva)=>{
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    try {
      const res = await reservasAPI.updateEstado(id_reserva, 'cancelado');
      if (res.success) {
        setEstadoReserva(id_reserva, 'cancelado');
        alert('Reserva cancelada correctamente');
      }
    } catch (err) {
      console.error('Error cancelando reserva:', err);
      alert(err.message || 'Error cancelando reserva');
    }
  };

  const [ver, setVer] = useState(null); // reserva a ver
  const abrir = (r) => setVer(r);
  const cerrar = () => setVer(null);

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4">
          <div className="text-lg font-semibold">Mis reservas</div>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center opacity-70">Cargando reservas...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`border-b ${tone("border-slate-200 text-slate-500","border-slate-700/60 text-slate-400")} text-left`}>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id_reserva} className={`border-b ${tone("border-slate-100","border-slate-700/40")} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="px-4 py-3 font-medium">{r.codigo || r.id_reserva}</td>
                    <td className="px-4 py-3">{r.area_nombre || areas.find(a => a.id_area_comun===r.id_area_comun)?.nombre || "—"}</td>
                    <td className="px-4 py-3">{new Date(r.fecha_ini).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(r.fecha_fin).toLocaleString()}</td>
                    <td className="px-4 py-3">BOB {Number(r.costo_total||0).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge toneName={r.estado==='cancelado'?'red':'green'}>{r.estado}</Badge></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={()=>abrir(r)} className={`rounded-lg px-3 py-1.5 text-xs ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>Ver</button>
                      {r.estado!=='cancelado' && (
                        <button onClick={()=>cancelar(r.id_reserva)} className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center opacity-70">No tienes reservas.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {ver && (
        <FacturaModal
          dark={dark}
          reserva={ver}
          area={areas.find(a => a.id_area_comun===ver.id_area_comun)}
          onClose={cerrar}
        />
      )}
    </div>
  );
}

/* ------------------------- Factura / Detalle ------------------------ */
function FacturaModal({ dark, reserva, area, onClose }){
  const tone = (l,d) => dark ? d : l;
  const [qrDataURL, setQrDataURL] = useState('');
  
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Generar datos del pago para el QR
        const paymentData = {
          reserva_id: reserva.id_reserva,
          codigo: reserva.codigo,
          area: area?.nombre,
          fecha_inicio: reserva.fecha_ini,
          fecha_fin: reserva.fecha_fin,
          costo_total: reserva.costo_total,
          estado: reserva.estado,
          residente: {
            nombres: reserva.residente_nombres || reserva.residente?.nombres || '',
            apellidos: reserva.residente_apellidos || reserva.residente?.apellidos || ''
          },
          timestamp: Date.now()
        };
        
        // Convertir a string JSON para el QR
        const qrText = JSON.stringify(paymentData);
        
        // Generar el QR code
        const url = await QRCode.toDataURL(qrText, {
          width: 192, // 48 * 4 (w-48 = 192px)
          margin: 1,
          color: {
            dark: tone('#1e293b', '#f1f5f9'), // slate-800 dark, slate-100 light
            light: tone('#f1f5f9', '#1e293b')  // slate-100 light, slate-800 dark
          }
        });
        
        setQrDataURL(url);
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    };
    
    generateQR();
  }, [reserva, area]);

  const QRBlock = () => (
    <div className="rounded-xl border p-3 text-sm dark:border-slate-700/60">
      <div className="flex items-center justify-between">
        <div className="font-medium">QR de la reserva</div>
      </div>
      <div className="grid place-items-center py-3">
        {qrDataURL ? (
          <img 
            src={qrDataURL} 
            alt="QR Code de la reserva" 
            className="w-48 h-48 rounded-lg border border-slate-200 dark:border-slate-600"
          />
        ) : (
          <div className={`w-48 h-48 rounded-lg ${tone('bg-slate-100','bg-slate-900/40')} flex items-center justify-center`}>
            <div className="text-sm opacity-70">Generando QR...</div>
          </div>
        )}
      </div>
      <div className="text-xs opacity-70">* QR con información completa de la reserva</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <div className={`w-full max-w-3xl rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="text-lg font-semibold">Reserva {reserva.codigo}</div>
          <button onClick={onClose} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <div className="p-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-3 text-sm dark:border-slate-700/60">
            <div className="font-medium mb-2">Factura / Detalle</div>
            <ul className="space-y-1">
              <li>Reservado por: <b>{reserva.residente_nombres || reserva.residente?.nombres || '—'} {reserva.residente_apellidos || reserva.residente?.apellidos || ''}</b></li>
              <li>Área: <b>{area?.nombre}</b></li>
              <li>Ubicación: {area?.ubicacion || '—'}</li>
              <li>Descripción: {area?.descripcion || '—'}</li>
              <li>Inicio: {new Date(reserva.fecha_ini).toLocaleString()}</li>
              <li>Fin: {new Date(reserva.fecha_fin).toLocaleString()}</li>
              <li>Total: <b>BOB {Number(reserva.costo_total||0).toFixed(2)}</b></li>
              <li>Estado: <Badge toneName={reserva.estado==='cancelado'?'red':'green'}>{reserva.estado}</Badge></li>
            </ul>
          </div>
          <QRBlock />
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Página principal ------------------------- */
export default function ResidentReservasPageV2(){
  const [dark, setDark] = useState(false);
  const tone = (l,d) => dark ? d : l;
  const edificioName = "Torre Aura";

  // Usuario actual (residente) — MOCK
  const currentPersona = { id_persona: 501, nombres: "Carla", apellidos: "Mendoza", email: "carla@edificio.com", rol: "Residente" };
  const usuarioActual = { nombre: currentPersona.nombres, apellido: currentPersona.apellidos, email: currentPersona.email, rol: currentPersona.rol, avatar: "" };

  // Áreas (desde BD)
  const [areas, setAreas] = useState([]);
  const [reservas, setReservas] = useState({});
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [errorAreas, setErrorAreas] = useState(null);

  const [tab, setTab] = useState("calendario");

  const handleLogout = () => { alert("Logout (implementar con backend)"); };

  // Cargar áreas desde backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingAreas(true);
        const res = await areasAPI.getAreas();
        if (res.success) {
          setAreas(res.data);
          // cargar reservas por área (opcional: lazy load cuando se selecciona)
          const map = {};
          for (const a of res.data) {
            try {
              const rv = await areasAPI.getReservasArea(a.id_area_comun);
              map[a.id_area_comun] = rv.success ? rv.data : [];
            } catch(e){ map[a.id_area_comun] = []; }
          }
          setReservas(map);
        }
      } catch (err) {
        console.error('Error cargando áreas:', err);
        setErrorAreas(err.message || 'Error cargando áreas');
      } finally {
        setLoadingAreas(false);
      }
    };
    load();
  }, []);

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900","bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <main className="min-h-screen">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70","border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🧑‍🤝‍🧑</span>
                    <span className="font-medium">Reservas — Residente</span>
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

                    <button onClick={() => setDark(d => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100","border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                    <UserProfile dark={dark} usuarioActual={usuarioActual} edificioName={edificioName} onLogout={handleLogout} />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone("border-slate-200 bg-white/70","border-slate-700/60 bg-slate-900/50")}`}>
                {[
                  { id:'calendario', label:'Calendario de áreas' },
                  { id:'mias', label:'Mis reservas' },
                ].map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
              {tab==='calendario' && (
                <CalendarioResidente
                  dark={dark}
                  currentPersona={currentPersona}
                  areas={areas}
                  reservas={reservas}
                  setReservas={setReservas}
                />
              )}
              {tab==='mias' && (
                <MisReservas
                  dark={dark}
                  currentPersona={currentPersona}
                  areas={areas}
                  reservas={reservas}
                  setReservas={setReservas}
                />
              )}
            </div>
          </main>
      </div>
    </div>
  );
}
