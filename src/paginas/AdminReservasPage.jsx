import React, { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Sidebar from "../components/Sidebar/Sidebar";
import UserProfile from "../components/UserProfile/UserProfile";
import QRCode from "qrcode";
import { areasAPI, reservasAPI } from "../services/api";


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
const Textarea = ({ label, error, register, dark, className = "", rows=4, ...props }) => {
  const tone = (l,d) => dark ? d : l;
  return (
    <label className={`block ${className}`}>
      {label && <span className={`text-xs font-medium ${tone("text-slate-600","text-slate-300")}`}>{label}</span>}
      <textarea
        rows={rows}
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
function AreasGallery({ dark, areas, selectedId, onSelect = null, onEdit = null, onDelete = null }){
  const tone = (l,d) => dark ? d : l;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map(a => (
        <div
          key={a.id_area_comun}
          className={`rounded-2xl border overflow-hidden ${selectedId===a.id_area_comun ? 'ring-2 ring-blue-500' : ''} ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}
        >
          <div className={`h-36 w-full ${tone('bg-slate-100','bg-slate-900/40')} grid place-items-center`}>
            <div className="text-5xl">🏷️</div>
          </div>
          <div className="p-4">
            <div className="text-lg font-semibold">{a.nombre}</div>
            <div className="text-sm opacity-80 dark:text-slate-400 mt-1">Ubicacion: {a.ubicacion||'—'}</div>
            <div className="text-sm opacity-80 mt-2 line-clamp-2">{a.descripcion||'Sin descripción'}</div>
            <div className="mt-2 text-sm">Costo/hora: <b>BOB {Number(a.costo_hora||0).toFixed(2)}</b></div>
            <div className="pt-3 flex gap-2 justify-end">
              {onSelect && <button onClick={()=>onSelect(a.id_area_comun)} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">
                Ver calendario
              </button>}
              {onEdit && <button onClick={()=>onEdit(a)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 flex items-center gap-1">
                ✏️ Editar
              </button>}
              {onDelete && <button onClick={()=>onDelete(a.id_area_comun)} className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 flex items-center gap-1">
                🗑️ Eliminar
              </button>}
            </div>
          </div>
        </div>
      ))}
      {areas.length===0 && (
        <Card dark={dark}><div className="p-4 text-sm opacity-70">No hay áreas. Crea una nueva.</div></Card>
      )}
    </div>
  );
}

/* ------------------------ Calendario + Gestión ---------------------- */
function CalendarioAdmin({ dark, areas, reservas, setReservas }){
  const tone = (l,d) => dark ? d : l;
  const [areaSel, setAreaSel] = useState(areas[0]?.id_area_comun || "");
  const [mes, setMes] = useState((new Date()).getMonth());
  const [anio, setAnio] = useState((new Date()).getFullYear());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const matrix = useMemo(()=>getMonthMatrix(anio, mes), [anio, mes]);

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
          <div className="mb-3 text-lg font-semibold">Selecciona un área</div>
          <AreasGallery
            dark={dark}
            areas={areas}
            selectedId={areaSel}
            onSelect={cambiarArea}
          />
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{d.getDate()}</span>
                    </div>
                  <div className="mt-1 space-y-1">
                    {res.slice(0,3).map(r => (
                      <div key={r.id_reserva} className="truncate text-[11px] rounded-md px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {HHmm(new Date(r.fecha_ini))} · {r.nombres || r.residente?.nombres || "Residente"}
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
        <PanelDia
          dark={dark}
          dia={diaSeleccionado}
          setDia={setDiaSeleccionado}
          area={areas.find(a=>a.id_area_comun===areaSel)}
          reservasDelDia={(reservas[areaSel]||[]).filter(r=> sameDay(new Date(r.fecha_ini), diaSeleccionado) && r.estado !== 'cancelado')}
        />
      )}
    </div>
  );
}

/* --------------------- Panel lateral de día (admin) ----------------- */
function PanelDia({ dark, dia, setDia, area, reservasDelDia }){
  const tone = (l,d) => dark ? d : l;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-end">
      <div className={`w-full max-w-md h-full overflow-auto rounded-l-2xl border-l ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-2xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="text-lg font-semibold">{area?.nombre} — {dia.toLocaleDateString()}</div>
          <button onClick={()=>setDia(null)} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-sm font-medium">Reservas</div>
          <ul className="space-y-2">
            {reservasDelDia.length===0 && <li className="opacity-70 text-sm">No hay reservas.</li>}
            {reservasDelDia.map(r => (
              <li key={r.id_reserva} className={`rounded-xl border p-3 ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{HHmm(new Date(r.fecha_ini))}–{HHmm(new Date(r.fecha_fin))}</div>
                  <Badge toneName={r.estado==='cancelado'?'red':'green'}>{r.estado}</Badge>
                </div>
                <div className="text-xs opacity-80">Residente: {r.residente?.nombres || '—'} {r.residente?.apellidos || ''}</div>
                <div className="text-xs">Monto: BOB {Number(r.costo_total||0).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Mis Reservas (Admin) ------------------- */
function ReservasAdmin({ dark, areas, reservas, setReservas }){
  const tone = (l,d) => dark ? d : l;
  const [estado, setEstado] = useState("");
  const [todasReservas, setTodasReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar todas las reservas desde la API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const allReservas = [];
        // Cargar reservas de todas las áreas
        for (const area of areas) {
          try {
            const res = await areasAPI.getReservasArea(area.id_area_comun);
            if (res.success) {
              allReservas.push(...res.data.map(r => ({ ...r, id_area_comun: area.id_area_comun })));
            }
          } catch (err) {
            console.error(`Error cargando reservas del área ${area.nombre}:`, err);
          }
        }
        setTodasReservas(allReservas);
      } catch (err) {
        console.error('Error cargando reservas:', err);
      } finally {
        setLoading(false);
      }
    };
    if (areas.length > 0) {
      load();
    }
  }, [areas]);

  const rows = useMemo(()=>{
    let r = todasReservas;
    if (estado) r = r.filter(x => x.estado===estado);
    return r.sort((a,b)=> new Date(b.fecha_ini) - new Date(a.fecha_ini));
  }, [todasReservas, estado]);

  const setEstadoReserva = (id_reserva, nuevo)=>{
    setTodasReservas(prev => prev.map(r => r.id_reserva === id_reserva ? { ...r, estado: nuevo } : r));
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
        <div className="p-4 flex items-center gap-3">
          <div className="text-lg font-semibold">Todas las Reservas</div>
          <select value={estado} onChange={(e)=>setEstado(e.target.value)} className={`ms-auto rounded-xl border px-3 py-2 text-sm ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")}`}>
            <option value="">Estado: todos</option>
            {['pagado','cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
                  <th className="px-4 py-3">Residente</th>
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
                    <td className="px-4 py-3">{(r.nombres || r.residente?.nombres) ? `${r.nombres || r.residente?.nombres} ${r.apellidos || r.residente?.apellidos || ''}` : '—'}</td>
               
                    <td className="px-4 py-3">{areas.find(a => a.id_area_comun===r.id_area_comun)?.nombre || "—"}</td>
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
                {rows.length===0 && <tr><td colSpan={8} className="px-4 py-8 text-center opacity-70">No hay reservas.</td></tr>}
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
            nombres: reserva.nombres || reserva.residente?.nombres || '',
            apellidos: reserva.apellidos || reserva.residente?.apellidos || ''
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
              <li>Reservado por: <b>{reserva.nombres || reserva.residente?.nombres || '—'} {reserva.apellidos || reserva.residente?.apellidos || ''}</b></li>
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

/* -------------------- CRUD Áreas (crear/editar) --------------------- */
function AreasCRUD({ dark, areas, setAreas, setAreaSelForCalendar, id_edificio = 1 }){
  const tone = (l,d) => dark ? d : l;
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { nombre:"", ubicacion:"", descripcion:"", costo_hora:0 }
  });

  const openCreate = ()=>{ setEditing(null); reset({ nombre:"", ubicacion:"", descripcion:"", costo_hora:0 }); setShow(true); setError(null); };
  const openEdit = (a)=>{ setEditing(a); reset({ nombre:a.nombre, ubicacion:a.ubicacion||"", descripcion:a.descripcion||"", costo_hora:a.costo_hora||0 }); setShow(true); setError(null); };
  const close = ()=> { setShow(false); setError(null); };

  const onSubmit = async (data)=>{
    setLoading(true);
    setError(null);
    try {
      if (editing){
        // Actualizar área existente
        const response = await areasAPI.updateArea(editing.id_area_comun, data);
        if (response.success) {
          setAreas(prev => prev.map(a => a.id_area_comun===editing.id_area_comun ? response.data : a));
          setShow(false);
          alert('Área actualizada exitosamente');
        }
      } else {
        // Crear nueva área (sin id_edificio por ahora)
        const response = await areasAPI.createArea(data);
        if (response.success) {
          setAreas(prev => [...prev, response.data]);
          setAreaSelForCalendar && setAreaSelForCalendar(response.data.id_area_comun);
          setShow(false);
          alert('Área creada exitosamente');
        }
      }
    } catch (err) {
      console.error('Error guardando área:', err);
      setError(err.message || 'Error al guardar el área');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id_area_comun)=>{
    if (!confirm('¿Estás seguro de eliminar esta área? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await areasAPI.deleteArea(id_area_comun);
      if (response.success) {
        setAreas(prev => prev.filter(a => a.id_area_comun!==id_area_comun));
        alert('Área eliminada exitosamente');
      }
    } catch (err) {
      console.error('Error eliminando área:', err);
      alert(err.message || 'Error al eliminar el área');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card dark={dark}>
        <div className="p-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Áreas comunes</div>
          <button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">+ Nueva área</button>
        </div>
      </Card>

      <Card dark={dark}>
        <div className="p-4">
          <AreasGallery
            dark={dark}
            areas={areas}
            selectedId={null}
            onEdit={openEdit}
            onDelete={eliminar}
          />
        </div>
      </Card>

      {show && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className={`w-full max-w-lg rounded-2xl border ${tone("border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-lg font-semibold">{editing?"Editar área":"Nueva área"}</h4>
              <button onClick={close} disabled={loading} className={`rounded-lg px-2 py-1 text-sm ${tone("border border-slate-200","border-slate-600 border")}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <Input label="Nombre" dark={dark} register={register("nombre",{required:"Requerido"})} error={errors.nombre} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Ubicación" dark={dark} register={register("ubicacion")} />
                <Input label="Costo por hora (BOB)" type="number" step="0.01" dark={dark} register={register("costo_hora",{valueAsNumber:true})} />
              </div>
              <Textarea label="Descripción" dark={dark} rows={4} register={register("descripcion")} />
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={close} disabled={loading} className={`rounded-xl px-4 py-2 text-sm ${tone("border border-slate-200 bg-white","border-slate-700/60 bg-slate-800")} disabled:opacity-50`}>Cancelar</button>
                <button type="submit" disabled={loading || isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-50">
                  {loading ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Página principal ------------------------- */
export default function AdminReservasPageV2(){
  const [dark, setDark] = useState(false);
  const tone = (l,d) => dark ? d : l;
  const edificioName = "Torre Aura";
  const usuarioActual = { nombre: "Luis", apellido: "Pérez", email: "admin@edificio.com", rol: "Administrador", avatar: "" };
  const id_edificio = 1; // TODO: Obtener del contexto o usuario

  // Áreas - ahora se cargan desde la BD
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [errorAreas, setErrorAreas] = useState(null);

  // Cargar áreas al montar el componente
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoadingAreas(true);
        setErrorAreas(null);
        // Llamar sin filtro de edificio por ahora para simplificar
        const response = await areasAPI.getAreas();
        console.log('✅ Respuesta de áreas:', response);
        if (response.success) {
          setAreas(response.data);
          
          // Cargar reservas por área
          const reservasMap = {};
          for (const area of response.data) {
            try {
              const resReservas = await areasAPI.getReservasArea(area.id_area_comun);
              if (resReservas.success) {
                reservasMap[area.id_area_comun] = resReservas.data;
              }
            } catch (err) {
              console.error(`Error cargando reservas del área ${area.nombre}:`, err);
              reservasMap[area.id_area_comun] = [];
            }
          }
          setReservas(reservasMap);
        }
      } catch (err) {
        console.error('Error cargando áreas:', err);
        setErrorAreas(err.message || 'Error al cargar las áreas');
      } finally {
        setLoadingAreas(false);
      }
    };
    
    loadAreas();
  }, [id_edificio]);

  // Reservas por área (se cargan desde la API)
  const [reservas, setReservas] = useState({});

  const [tab, setTab] = useState("calendario");
  const [areaSelForCalendar, setAreaSelForCalendar] = useState(1);

  const handleLogout = () => { alert("Logout (implementar con backend)"); };

  return (
    <div className={(dark ? "dark" : "") + " min-h-screen"}>
      <div className={tone("bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900","bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100") + " min-h-screen"}>
        <div className="flex min-h-screen">
          <Sidebar dark={dark} edificioName={edificioName} totalDepartamentos={0} currentPage="reservas_admin_v2" />
          <main className="flex-1">
            {/* Topbar */}
            <header className={`sticky top-0 z-10 border-b ${tone("border-slate-200 bg-white/70","border-slate-700/60 bg-slate-900/60")} backdrop-blur`}>
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800">
                    <span className="text-slate-500">🛠️</span>
                    <span className="font-medium">Reservas — Administrador</span>
                  </div>
                  <div className="ms-auto flex items-center gap-2">
                    <button onClick={() => setDark(d => !d)} className={`rounded-xl px-3 py-2 text-sm ${tone("border border-slate-200 bg-white hover:bg-slate-100","border border-slate-700/60 bg-slate-800 hover:bg-slate-700/40")}`}>{dark ? "☾ Claro" : "☀︎ Oscuro"}</button>
                    <UserProfile dark={dark} usuarioActual={{...usuarioActual}} edificioName={edificioName} onLogout={handleLogout} />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <div className="mx-auto max-w-7xl px-4 pt-4">
              <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 ${tone("border-slate-200 bg-white/70","border-slate-700/60 bg-slate-900/50")}`}>
                {[
                  { id:'calendario', label:'Calendario de áreas' },
                  { id:'reservas', label:'Reservas' },
                  { id:'areas', label:'Crear áreas' },
                ].map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab===t.id ? 'bg-blue-600 text-white' : tone('border border-slate-200 bg-white','border border-slate-700/60 bg-slate-800')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
              {loadingAreas && (
                <Card dark={dark}>
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm opacity-70">Cargando áreas...</p>
                  </div>
                </Card>
              )}
              
              {errorAreas && (
                <Card dark={dark}>
                  <div className="p-8 text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-600 dark:text-red-400">{errorAreas}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
                    >
                      Reintentar
                    </button>
                  </div>
                </Card>
              )}
              
              {!loadingAreas && !errorAreas && (
                <>
                  {tab==='calendario' && (
                    <CalendarioAdmin
                      dark={dark}
                      areas={areas}
                      reservas={reservas}
                      setReservas={setReservas}
                    />
                  )}
                  {tab==='reservas' && (
                    <ReservasAdmin
                      dark={dark}
                      areas={areas}
                      reservas={reservas}
                      setReservas={setReservas}
                    />
                  )}
                  {tab==='areas' && (
                    <AreasCRUD
                      dark={dark}
                      areas={areas}
                      setAreas={setAreas}
                      setAreaSelForCalendar={setAreaSelForCalendar}
                      id_edificio={id_edificio}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}






