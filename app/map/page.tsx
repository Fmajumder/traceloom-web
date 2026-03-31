'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

// ─── Equirectangular projection (viewBox 0 0 1000 500) ────────────────────
function proj(lon: number, lat: number): [number, number] {
  return [(lon + 180) * (1000 / 360), (90 - lat) * (500 / 180)];
}

// ─── Quadratic bezier helpers ─────────────────────────────────────────────
function bezierPt(
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  t: number
): [number, number] {
  const mt = 1 - t;
  return [mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
          mt * mt * y1 + 2 * mt * t * cy + t * t * y2];
}

function routeInfo(
  from: [number, number],
  to:   [number, number],
  mode: 'sea' | 'air' | 'truck'
): { d: string; cx: number; cy: number } {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2;
  const baseCy = (y1 + y2) / 2;
  const cy = mode === 'sea'   ? baseCy + 130
           : mode === 'air'   ? baseCy - 110
           :                    baseCy - 25;
  return { d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, cx, cy };
}

// ─── Static data ──────────────────────────────────────────────────────────
interface Mill {
  id: string; name: string; city: string; country: string;
  lon: number; lat: number; score: number; scoreColor: string; rolls: number;
}
interface Brand { id: string; name: string; city: string; lon: number; lat: number; }
interface Shipment {
  id: string; po: string; fromId: string; toId: string;
  mode: 'sea' | 'air' | 'truck'; rolls: number; progress: number;
  status: string; co2: number; eta: string; delay?: string;
}

const MILLS: Mill[] = [
  { id: 'apex',      name: 'Apex Textiles',   city: 'Dhaka',     country: 'Bangladesh', lon: 90.4,  lat: 23.7, score: 91, scoreColor: '#22c55e', rolls: 48 },
  { id: 'blueriver', name: 'Blue River Mills', city: 'Chittagong',country: 'Bangladesh', lon: 91.8,  lat: 22.3, score: 71, scoreColor: '#f59e0b', rolls: 32 },
  { id: 'sunrise',   name: 'Sunrise Fabrics',  city: 'Istanbul',  country: 'Turkey',     lon: 28.9,  lat: 41.0, score: 58, scoreColor: '#ef4444', rolls: 24 },
];

const BRANDS: Brand[] = [
  { id: 'hm',        name: 'H&M',       city: 'Stockholm',   lon: 18.1,   lat: 59.3 },
  { id: 'nordstrom', name: 'Nordstrom', city: 'New York',    lon: -74.0,  lat: 40.7 },
  { id: 'zara',      name: 'Zara',      city: 'London',      lon: -0.1,   lat: 51.5 },
  { id: 'gap',       name: 'GAP',       city: 'Los Angeles', lon: -118.2, lat: 34.0 },
];

const SHIPMENTS: Shipment[] = [
  { id: 'S1', po: 'PO-2024-001', fromId: 'apex',      toId: 'nordstrom', mode: 'sea',   rolls: 12, progress: 0.45, status: 'In Transit',    co2: 8.4,  eta: 'Apr 12' },
  { id: 'S2', po: 'PO-2024-002', fromId: 'apex',      toId: 'hm',        mode: 'sea',   rolls:  8, progress: 0.72, status: 'In Transit',    co2: 5.2,  eta: 'Apr 4'  },
  { id: 'S3', po: 'PO-2024-003', fromId: 'blueriver', toId: 'zara',      mode: 'air',   rolls:  6, progress: 0.30, status: 'Delayed',       co2: 31.8, eta: 'Apr 8', delay: '+4 days' },
  { id: 'S4', po: 'PO-2024-004', fromId: 'sunrise',   toId: 'gap',       mode: 'sea',   rolls: 10, progress: 0.88, status: 'Near Delivery', co2: 14.2, eta: 'Apr 1'  },
  { id: 'S5', po: 'PO-2024-005', fromId: 'sunrise',   toId: 'hm',        mode: 'truck', rolls: 14, progress: 1.00, status: 'Delivered',     co2: 9.8,  eta: 'Mar 28' },
];

const MODE_COLORS = { sea: '#60a5fa', air: '#f59e0b', truck: '#a78bfa' } as const;
const MODE_ICONS  = { sea: '🚢', air: '✈️', truck: '🚛' } as const;
const MODE_SPEEDS = { sea: 0.04, air: 0.09, truck: 0.06 } as const;

// Simplified continent land paths (1000×500 equirectangular)
const LAND_PATHS = [
  // North America
  'M 55,92 L 92,55 L 222,50 L 333,64 L 361,95 L 347,130 L 317,145 L 308,186 L 272,214 L 242,200 L 217,175 L 160,155 L 112,132 L 72,110 Z',
  // South America
  'M 242,200 L 272,214 L 307,204 L 312,228 L 406,240 L 399,272 L 383,317 L 358,356 L 323,406 L 296,390 L 272,350 L 263,305 L 258,255 Z',
  // Europe
  'M 469,153 L 472,112 L 495,90 L 530,64 L 558,54 L 614,64 L 622,100 L 608,122 L 586,138 L 558,150 L 530,153 L 505,140 L 484,153 Z',
  // Africa
  'M 469,155 L 530,150 L 586,156 L 613,188 L 601,233 L 586,286 L 562,339 L 530,371 L 495,381 L 461,358 L 447,312 L 450,252 L 453,208 L 462,172 Z',
  // Asia (main body incl. Bangladesh & Turkey)
  'M 614,64 L 838,47 L 880,78 L 864,120 L 836,157 L 803,175 L 769,183 L 753,188 L 736,178 L 708,165 L 686,180 L 664,162 L 636,142 L 622,100 Z',
  // Indian subcontinent
  'M 708,165 L 736,178 L 769,183 L 764,226 L 744,242 L 722,227 L 714,200 Z',
  // SE Asia peninsula
  'M 778,178 L 803,175 L 810,202 L 800,226 L 778,231 L 764,214 L 764,194 Z',
  // Australia
  'M 725,272 L 817,262 L 850,283 L 844,331 L 819,358 L 781,367 L 739,355 L 719,328 L 719,298 Z',
];

// ─── Main component ───────────────────────────────────────────────────────
export default function MapPage() {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(SHIPMENTS[0]);
  const [selectedMill, setSelectedMill]         = useState<Mill | null>(null);
  const [activeFilter, setActiveFilter]         = useState<'all' | 'sea' | 'air' | 'truck'>('all');
  const [animTime, setAnimTime]                 = useState(0);

  // Tick for animated dot movement (~20 fps)
  useEffect(() => {
    const id = setInterval(() => setAnimTime(t => t + 0.016), 50);
    return () => clearInterval(id);
  }, []);

  const millById  = Object.fromEntries(MILLS.map(m  => [m.id,  m]));
  const brandById = Object.fromEntries(BRANDS.map(b => [b.id,  b]));

  const visibleShipments = activeFilter === 'all'
    ? SHIPMENTS
    : SHIPMENTS.filter(s => s.mode === activeFilter);

  const totalRolls    = SHIPMENTS.reduce((a, s) => a + s.rolls, 0);
  const totalCO2      = SHIPMENTS.reduce((a, s) => a + s.co2, 0).toFixed(1);
  const activeCount   = SHIPMENTS.filter(s => s.status !== 'Delivered').length;
  const delayedCount  = SHIPMENTS.filter(s => s.status === 'Delayed').length;

  return (
    <main style={{ minHeight: '100vh', background: '#070c15', color: '#f9fafb', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Page header ── */}
      <div style={{ padding: '1.25rem 2rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>
              🗺️ Live Supply Chain Map
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
              Real-time roll-level visibility across all mills, shipments and brand destinations
            </p>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.65rem', fontWeight: 700, color: '#22c55e',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 99, padding: '0.25rem 0.7rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'tlPulse 2s ease-in-out infinite' }} />
            LIVE
          </span>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {[
            { icon: '📦', val: String(activeCount),  label: 'Active shipments', color: '#60a5fa'  },
            { icon: '🧵', val: String(totalRolls),   label: 'Rolls in transit', color: '#22c55e'  },
            { icon: '🌿', val: `${totalCO2} kg`,     label: 'Total CO₂',        color: '#a78bfa'  },
            { icon: '🏭', val: '3',                  label: 'Mills active',     color: '#f59e0b'  },
            { icon: '⚠️', val: String(delayedCount), label: 'Delayed',          color: '#ef4444'  },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '0.45rem 0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.45rem',
            }}>
              <span style={{ fontSize: '0.95rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.1rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map + Sidebar ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 460 }}>

        {/* ── SVG MAP ── */}
        <div style={{ position: 'relative', background: '#040810', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>

          {/* Mode filter pills */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: '0.4rem' }}>
            {(['all', 'sea', 'air', 'truck'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '0.22rem 0.65rem', borderRadius: 99,
                fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                background: activeFilter === f
                  ? (f === 'all' ? '#22c55e' : MODE_COLORS[f])
                  : 'rgba(4,8,16,0.85)',
                border: `1px solid ${activeFilter === f ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                color: activeFilter === f ? '#000' : '#9ca3af',
                transition: 'all 0.15s',
              }}>
                {f === 'all' ? 'All routes' : `${MODE_ICONS[f]} ${f}`}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glowG" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glowB" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glowR" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <pattern id="mapDots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="0.7" fill="rgba(255,255,255,0.07)" />
              </pattern>
            </defs>

            {/* Ocean + dot grid */}
            <rect width="1000" height="500" fill="rgba(8,18,38,0.6)" />
            <rect width="1000" height="500" fill="url(#mapDots)" />

            {/* Continent land masses */}
            {LAND_PATHS.map((d, i) => (
              <path key={i} d={d}
                fill="rgba(25,42,72,0.75)"
                stroke="rgba(80,120,180,0.18)"
                strokeWidth="0.9"
              />
            ))}

            {/* ── Shipping routes ── */}
            {SHIPMENTS.map(s => {
              const mill  = millById[s.fromId]  as Mill  | undefined;
              const brand = brandById[s.toId]   as Brand | undefined;
              if (!mill || !brand) return null;

              const from  = proj(mill.lon, mill.lat);
              const to    = proj(brand.lon, brand.lat);
              const { d, cx, cy } = routeInfo(from, to, s.mode);
              const color  = MODE_COLORS[s.mode];
              const hidden = activeFilter !== 'all' && s.mode !== activeFilter;
              if (hidden) return null;

              const isSelected  = selectedShipment?.id === s.id;
              const isDelivered = s.status === 'Delivered';
              const isDelayed   = s.status === 'Delayed';

              // Moving dot: cycles 0→1 continuously
              const speed = MODE_SPEEDS[s.mode];
              const t = (animTime * speed) % 1;
              const [dx, dy] = bezierPt(from[0], from[1], cx, cy, to[0], to[1], t);

              // "Trail" dot slightly behind main dot
              const t2 = ((animTime * speed) - 0.05 + 1) % 1;
              const [dx2, dy2] = bezierPt(from[0], from[1], cx, cy, to[0], to[1], t2);

              const dashArr = s.mode === 'air' ? '10 5' : s.mode === 'truck' ? '5 4' : 'none';

              return (
                <g key={s.id} onClick={() => setSelectedShipment(isSelected ? null : s)} style={{ cursor: 'pointer' }}>
                  {/* Route base line */}
                  <path d={d} fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isDelivered ? 0.15 : isSelected ? 0.55 : 0.22}
                    strokeDasharray={dashArr}
                  />
                  {/* Glowing highlight on selected */}
                  {isSelected && !isDelivered && (
                    <path d={d} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.08} />
                  )}

                  {/* Moving dots (skip if delivered) */}
                  {!isDelivered && (
                    <>
                      {/* Trail */}
                      <circle cx={dx2} cy={dy2} r={3} fill={color} opacity={0.3} />
                      {/* Main dot */}
                      <circle cx={dx} cy={dy} r={isSelected ? 6 : 4.5}
                        fill={color} opacity={0.95}
                        filter={s.mode === 'air' ? 'url(#glowR)' : 'url(#glowB)'}
                      />
                      <circle cx={dx} cy={dy} r={isSelected ? 11 : 8} fill={color} opacity={0.12} />
                    </>
                  )}

                  {/* Delay badge on dot */}
                  {isDelayed && !isDelivered && (
                    <text x={dx} y={dy - 12} textAnchor="middle"
                      fill="#ef4444" fontSize={11} fontWeight="900"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>!</text>
                  )}
                </g>
              );
            })}

            {/* ── Brand destination nodes ── */}
            {BRANDS.map(b => {
              const [x, y] = proj(b.lon, b.lat);
              const hasSH = visibleShipments.some(s => s.toId === b.id && s.status !== 'Delivered');
              return (
                <g key={b.id}>
                  {hasSH && (
                    <circle cx={x} cy={y} r={12} fill="none" stroke="#60a5fa" strokeWidth={1} opacity={0.25}>
                      <animate attributeName="r"       values="8;18;8"     dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0;0.35" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={5} fill="#60a5fa" filter="url(#glowB)" />
                  <circle cx={x} cy={y} r={5} fill="none" stroke="#93c5fd" strokeWidth={1} />
                  <text x={x} y={y - 9} textAnchor="middle" fill="#93c5fd" fontSize={9} fontWeight="600"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>{b.name}</text>
                  <text x={x} y={y + 17} textAnchor="middle" fill="#374151" fontSize={7.5}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>{b.city}</text>
                </g>
              );
            })}

            {/* ── Mill nodes ── */}
            {MILLS.map(m => {
              const [x, y] = proj(m.lon, m.lat);
              const isSel  = selectedMill?.id === m.id;
              const sc     = m.scoreColor;
              return (
                <g key={m.id} onClick={() => setSelectedMill(isSel ? null : m)} style={{ cursor: 'pointer' }}>
                  {/* Outer glow halo */}
                  <circle cx={x} cy={y} r={22} fill="none" stroke={sc} strokeWidth={0.7} opacity={0.2} />
                  {/* Animated pulse */}
                  <circle cx={x} cy={y} r={13} fill="none" stroke={sc} strokeWidth={1.2} opacity={0.4}>
                    <animate attributeName="r"       values="9;20;9"     dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5"  dur="2.8s" repeatCount="indefinite" />
                  </circle>
                  {/* Core dot */}
                  <circle cx={x} cy={y} r={7.5} fill={sc} filter="url(#glowG)" />
                  <circle cx={x} cy={y} r={7.5} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />

                  {/* Score popup on click */}
                  {isSel && (
                    <>
                      <rect x={x - 20} y={y - 38} width={40} height={18} rx={5} fill={sc} opacity={0.92} />
                      <text x={x} y={y - 25} textAnchor="middle" fill="#000" fontSize={9.5} fontWeight="800"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>{m.score}/100</text>
                    </>
                  )}

                  {/* Labels */}
                  <text x={x + 11} y={y + 3} fill="#f9fafb" fontSize={9.5} fontWeight="700"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>{m.name}</text>
                  <text x={x + 11} y={y + 14} fill="#6b7280" fontSize={7.5}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>{m.city}</text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: 'rgba(4,8,16,0.92)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '0.65rem 0.9rem', backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Transport mode</div>
            {(['sea', 'air', 'truck'] as const).map(mode => (
              <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.28rem' }}>
                <svg width="22" height="8">
                  <line x1="0" y1="4" x2="22" y2="4"
                    stroke={MODE_COLORS[mode]} strokeWidth="2"
                    strokeDasharray={mode === 'air' ? '6 3' : mode === 'truck' ? '4 2' : 'none'}
                  />
                </svg>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'capitalize' }}>
                  {MODE_ICONS[mode]} {mode}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
              {[{ col: '#22c55e', lbl: 'Mill (click for score)' }, { col: '#60a5fa', lbl: 'Brand destination' }].map(r => (
                <div key={r.lbl} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.col, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{r.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Side panel ── */}
        <div style={{ overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#070c15', padding: '1rem' }}>

          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.75rem' }}>
            Active Shipments ({SHIPMENTS.length})
          </div>

          {SHIPMENTS.map(s => {
            const mill  = millById[s.fromId]  as Mill  | undefined;
            const brand = brandById[s.toId]   as Brand | undefined;
            const isSel = selectedShipment?.id === s.id;
            const color = MODE_COLORS[s.mode];
            const statusColor =
              s.status === 'Delivered'     ? '#22c55e' :
              s.status === 'Delayed'       ? '#ef4444' :
              s.status === 'Near Delivery' ? '#22c55e' : '#60a5fa';

            return (
              <div key={s.id}
                onClick={() => setSelectedShipment(isSel ? null : s)}
                style={{
                  background: isSel ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  borderTop:    `1px solid ${isSel ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                  borderRight:  `1px solid ${isSel ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                  borderBottom: `1px solid ${isSel ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                  borderLeft: `3px solid ${s.status === 'Delayed' ? '#ef4444' : color}`,
                  borderRadius: 10, padding: '0.72rem', marginBottom: '0.55rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                      {MODE_ICONS[s.mode]} {s.po}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: '#6b7280', marginTop: '0.1rem' }}>
                      {mill?.city ?? ''} → {brand?.name ?? ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, whiteSpace: 'nowrap',
                    color: statusColor, background: statusColor + '15',
                    border: `1px solid ${statusColor}33`,
                    borderRadius: 99, padding: '0.15rem 0.5rem',
                  }}>
                    {s.status}{s.delay ? ` ${s.delay}` : ''}
                  </span>
                </div>

                {/* Progress */}
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{
                    width: `${s.progress * 100}%`, height: '100%', borderRadius: 99,
                    background: s.status === 'Delayed' ? '#ef4444' : color,
                    transition: 'width 0.5s',
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#6b7280' }}>
                  <span>{s.rolls} rolls · {s.co2} kg CO₂</span>
                  <span>ETA {s.eta}</span>
                </div>

                <div style={{ marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.6rem', color, background: color + '15', border: `1px solid ${color}30`, borderRadius: 99, padding: '0.1rem 0.45rem' }}>
                    {s.mode}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#4b5563', marginLeft: '0.35rem' }}>
                    {Math.round(s.progress * 100)}% complete
                  </span>
                </div>
              </div>
            );
          })}

          {/* Selected mill info */}
          {selectedMill && (
            <div style={{
              marginTop: '0.5rem', padding: '0.75rem',
              background: `${selectedMill.scoreColor}0f`,
              border: `1px solid ${selectedMill.scoreColor}30`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedMill.scoreColor, marginBottom: '0.3rem' }}>
                🏭 {selectedMill.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#d1d5db' }}>{selectedMill.city}, {selectedMill.country}</div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.7rem' }}>
                <span style={{ color: selectedMill.scoreColor }}>Score: {selectedMill.score}/100</span>
                <span style={{ color: '#4b5563' }}>·</span>
                <span style={{ color: '#9ca3af' }}>{selectedMill.rolls} rolls active</span>
              </div>
              <Link href="/scorecard" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.7rem', color: selectedMill.scoreColor, textDecoration: 'none' }}>
                Full scorecard →
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div style={{
            marginTop: '1rem', padding: '0.75rem',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
          }}>
            <div style={{ fontSize: '0.65rem', color: '#4b5563', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick links</div>
            {[
              { href: '/alerts',    icon: '🔔', label: 'Live Alerts Feed'    },
              { href: '/emissions', icon: '🌿', label: 'Emissions Dashboard' },
              { href: '/scorecard', icon: '🏆', label: 'Supplier Scorecards' },
              { href: '/dashboard', icon: '🏭', label: 'Mill Control Center' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.32rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                textDecoration: 'none', fontSize: '0.73rem', color: '#9ca3af',
              }}>
                <span>{l.icon}</span>
                <span>{l.label}</span>
                <span style={{ marginLeft: 'auto', opacity: 0.35, fontSize: '0.8rem' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tlPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </main>
  );
}
