'use client';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

type ZoneStatus = 'optimal' | 'warning' | 'critical';

interface ZoneRoll {
  id: string;
  color: string;
  yards: number;
  statusLabel: string;
}

interface Zone {
  id: string;
  name: string;
  icon: string;
  x: number; y: number; w: number; h: number; // % of floor plan
  status: ZoneStatus;
  activeRolls: number;
  efficiency: number;
  workers: number;
  machine: string;
  rolls: ZoneRoll[];
  effHistory: number[];
}

interface Mill {
  id: string;
  name: string;
  location: string;
  zones: Zone[];
}

const STATUS_CFG: Record<ZoneStatus, { color: string; glowRgb: string; label: string; pulse: boolean }> = {
  optimal:  { color: '#22c55e', glowRgb: '34,197,94',  label: 'OPTIMAL',  pulse: false },
  warning:  { color: '#f59e0b', glowRgb: '245,158,11', label: 'WARNING',  pulse: true  },
  critical: { color: '#ef4444', glowRgb: '239,68,68',  label: 'CRITICAL', pulse: true  },
};

const MILLS: Mill[] = [
  {
    id: 'argon1',
    name: 'Argon Unit 1',
    location: 'Gazipur, Dhaka',
    zones: [
      {
        id: 'a1z1', name: 'Warping & Sizing', icon: '⚙️',
        x: 4, y: 8, w: 27, h: 36,
        status: 'optimal', activeRolls: 14, efficiency: 94, workers: 6, machine: 'Benninger Warp',
        rolls: [
          { id: 'RL-0041', color: '#3b82f6', yards: 420, statusLabel: 'In Progress' },
          { id: 'RL-0042', color: '#22c55e', yards: 380, statusLabel: 'Queued' },
          { id: 'RL-0043', color: '#f59e0b', yards: 510, statusLabel: 'In Progress' },
        ],
        effHistory: [88, 91, 89, 93, 94, 92, 95, 94],
      },
      {
        id: 'a1z2', name: 'Weaving Floor', icon: '🏭',
        x: 35, y: 8, w: 38, h: 56,
        status: 'warning', activeRolls: 31, efficiency: 77, workers: 18, machine: '42× Picanol OptiMax',
        rolls: [
          { id: 'RL-0051', color: '#ef4444', yards: 290, statusLabel: 'Delayed' },
          { id: 'RL-0052', color: '#3b82f6', yards: 440, statusLabel: 'In Progress' },
          { id: 'RL-0053', color: '#22c55e', yards: 380, statusLabel: 'In Progress' },
          { id: 'RL-0054', color: '#a855f7', yards: 510, statusLabel: 'Queued' },
        ],
        effHistory: [85, 82, 79, 81, 78, 76, 77, 77],
      },
      {
        id: 'a1z3', name: 'Grey Fabric Store', icon: '📦',
        x: 77, y: 8, w: 20, h: 36,
        status: 'optimal', activeRolls: 88, efficiency: 99, workers: 4, machine: 'Auto Racking System',
        rolls: [
          { id: 'RL-0061', color: '#6b7280', yards: 600, statusLabel: 'Stored' },
          { id: 'RL-0062', color: '#6b7280', yards: 580, statusLabel: 'Stored' },
        ],
        effHistory: [98, 99, 99, 100, 99, 98, 99, 99],
      },
      {
        id: 'a1z4', name: 'Quality Control Lab', icon: '🔬',
        x: 4, y: 56, w: 27, h: 36,
        status: 'optimal', activeRolls: 5, efficiency: 91, workers: 3, machine: 'USTER Tester 6',
        rolls: [
          { id: 'RL-0071', color: '#22c55e', yards: 200, statusLabel: 'Testing' },
          { id: 'RL-0072', color: '#3b82f6', yards: 320, statusLabel: 'Testing' },
        ],
        effHistory: [89, 90, 92, 91, 93, 90, 91, 91],
      },
      {
        id: 'a1z5', name: 'Dispatch Bay', icon: '🚚',
        x: 77, y: 56, w: 20, h: 36,
        status: 'optimal', activeRolls: 12, efficiency: 96, workers: 5, machine: 'Loading Dock A',
        rolls: [
          { id: 'RL-0081', color: '#22c55e', yards: 450, statusLabel: 'Ready' },
          { id: 'RL-0082', color: '#3b82f6', yards: 390, statusLabel: 'Loading' },
        ],
        effHistory: [93, 95, 96, 94, 97, 96, 95, 96],
      },
    ],
  },
  {
    id: 'argon2',
    name: 'Argon Unit 2',
    location: 'Narayanganj, Dhaka',
    zones: [
      {
        id: 'a2z1', name: 'Spinning Section', icon: '🌀',
        x: 4, y: 8, w: 43, h: 43,
        status: 'critical', activeRolls: 7, efficiency: 52, workers: 12, machine: 'Rieter G 38',
        rolls: [
          { id: 'RL-0101', color: '#ef4444', yards: 180, statusLabel: 'Halted' },
          { id: 'RL-0102', color: '#ef4444', yards: 220, statusLabel: 'Halted' },
        ],
        effHistory: [78, 71, 65, 60, 55, 53, 51, 52],
      },
      {
        id: 'a2z2', name: 'Winding Room', icon: '🔄',
        x: 51, y: 8, w: 45, h: 43,
        status: 'warning', activeRolls: 19, efficiency: 73, workers: 8, machine: 'Savio Orion-M',
        rolls: [
          { id: 'RL-0111', color: '#f59e0b', yards: 340, statusLabel: 'In Progress' },
          { id: 'RL-0112', color: '#3b82f6', yards: 410, statusLabel: 'In Progress' },
          { id: 'RL-0113', color: '#22c55e', yards: 290, statusLabel: 'Queued' },
        ],
        effHistory: [82, 79, 75, 74, 72, 73, 74, 73],
      },
      {
        id: 'a2z3', name: 'Packing & Export', icon: '📤',
        x: 4, y: 57, w: 92, h: 35,
        status: 'optimal', activeRolls: 44, efficiency: 88, workers: 10, machine: 'Auto Baler + Conveyor',
        rolls: [
          { id: 'RL-0121', color: '#22c55e', yards: 500, statusLabel: 'Packed' },
          { id: 'RL-0122', color: '#22c55e', yards: 480, statusLabel: 'Packed' },
          { id: 'RL-0123', color: '#3b82f6', yards: 420, statusLabel: 'Packing' },
        ],
        effHistory: [84, 86, 87, 88, 86, 89, 88, 88],
      },
    ],
  },
  {
    id: 'evince',
    name: 'Evince Textiles',
    location: 'Chattogram EPZ',
    zones: [
      {
        id: 'evz1', name: 'Dyeing Plant', icon: '🎨',
        x: 4, y: 8, w: 30, h: 84,
        status: 'optimal', activeRolls: 22, efficiency: 91, workers: 14, machine: 'Thies Eco-Soft',
        rolls: [
          { id: 'RL-0201', color: '#3b82f6', yards: 500, statusLabel: 'Dyeing' },
          { id: 'RL-0202', color: '#ef4444', yards: 430, statusLabel: 'Dyeing' },
          { id: 'RL-0203', color: '#22c55e', yards: 380, statusLabel: 'Queued' },
        ],
        effHistory: [88, 90, 91, 93, 90, 92, 91, 91],
      },
      {
        id: 'evz2', name: 'Finishing Line', icon: '✨',
        x: 38, y: 8, w: 28, h: 42,
        status: 'warning', activeRolls: 16, efficiency: 69, workers: 9, machine: 'Monforts Montex',
        rolls: [
          { id: 'RL-0211', color: '#f59e0b', yards: 310, statusLabel: 'Stalled' },
          { id: 'RL-0212', color: '#3b82f6', yards: 420, statusLabel: 'In Progress' },
        ],
        effHistory: [80, 76, 73, 71, 70, 68, 69, 69],
      },
      {
        id: 'evz3', name: 'Print Studio', icon: '🖨️',
        x: 38, y: 54, w: 28, h: 38,
        status: 'optimal', activeRolls: 9, efficiency: 95, workers: 6, machine: 'Reggiani Bolt',
        rolls: [
          { id: 'RL-0221', color: '#a855f7', yards: 260, statusLabel: 'Printing' },
          { id: 'RL-0222', color: '#ec4899', yards: 300, statusLabel: 'Printing' },
        ],
        effHistory: [91, 93, 94, 95, 96, 94, 95, 95],
      },
      {
        id: 'evz4', name: 'Export Packing', icon: '📦',
        x: 70, y: 8, w: 27, h: 84,
        status: 'critical', activeRolls: 3, efficiency: 41, workers: 2, machine: 'Dock B — Offline',
        rolls: [
          { id: 'RL-0231', color: '#ef4444', yards: 100, statusLabel: 'Blocked' },
        ],
        effHistory: [75, 68, 60, 52, 47, 43, 42, 41],
      },
    ],
  },
];

function EffChart({ data, zoneId }: { data: number[]; zoneId: string }) {
  const W = 232, H = 48;
  const mn = Math.min(...data) - 4;
  const mx = Math.max(...data) + 2;
  const range = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - mn) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastY = H - ((data[data.length - 1] - mn) / range) * H;
  const gradId = `cg-${zoneId}`;
  const trendUp = data[data.length - 1] >= data[0];
  const lineColor = trendUp ? '#22c55e' : '#ef4444';
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={`url(#${gradId})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={W} cy={lastY.toFixed(1)} r={3} fill={lineColor} />
    </svg>
  );
}

export default function FactoryPage() {
  const [selectedMill, setSelectedMill] = useState<Mill>(MILLS[0]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [fading, setFading] = useState(false);
  const [hudTick, setHudTick] = useState(0);
  const [scanY, setScanY] = useState(0);

  function switchMill(mill: Mill) {
    if (mill.id === selectedMill.id) return;
    setFading(true);
    setSelectedZone(null);
    setTimeout(() => {
      setSelectedMill(mill);
      setFading(false);
    }, 280);
  }

  // HUD ticker
  useEffect(() => {
    const t = setInterval(() => setHudTick(n => (n + 1) % 999), 1600);
    return () => clearInterval(t);
  }, []);

  // Scan line animation
  useEffect(() => {
    let raf: number;
    let y = 0;
    let dir = 1;
    const step = () => {
      y += dir * 0.6;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setScanY(y);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const overallStatus: ZoneStatus =
    selectedMill.zones.some(z => z.status === 'critical') ? 'critical' :
    selectedMill.zones.some(z => z.status === 'warning')  ? 'warning'  : 'optimal';
  const osCfg = STATUS_CFG[overallStatus];
  const totalRolls = selectedMill.zones.reduce((s, z) => s + z.activeRolls, 0);
  const avgEff = Math.round(selectedMill.zones.reduce((s, z) => s + z.efficiency, 0) / selectedMill.zones.length);
  const critCount = selectedMill.zones.filter(z => z.status === 'critical').length;
  const warnCount = selectedMill.zones.filter(z => z.status === 'warning').length;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <Navbar />

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* ══ LEFT SIDEBAR ══ */}
        <aside style={{
          width: 224, flexShrink: 0,
          background: 'rgba(255,255,255,0.018)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>

          {/* HUD block */}
          <div style={{ padding: '14px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{
              position: 'relative',
              background: '#07080a',
              borderTop: `1px solid rgba(${osCfg.glowRgb},0.35)`,
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 7,
              padding: '10px 11px 11px',
              overflow: 'hidden',
              fontFamily: '"Courier New", Courier, monospace',
            }}>
              {/* Animated scan line */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2,
                top: `${scanY}%`,
                background: `linear-gradient(90deg, transparent 0%, rgba(${osCfg.glowRgb},0.5) 50%, transparent 100%)`,
                pointerEvents: 'none',
                transition: 'top 0.05s linear',
              }} />

              <div style={{ fontSize: '0.58rem', color: '#374151', letterSpacing: '0.12em', marginBottom: 5 }}>
                ▶ SYSTEM STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: osCfg.color,
                  boxShadow: `0 0 10px rgba(${osCfg.glowRgb},0.9)`,
                  animation: overallStatus !== 'optimal' ? 'hudPulse 1s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: osCfg.color, letterSpacing: '0.1em' }}>
                  {osCfg.label}
                </span>
              </div>

              <div style={{ marginTop: 10, fontSize: '0.6rem', lineHeight: 1.9, color: '#4b5563' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ROLLS ACTIVE</span>
                  <span style={{ color: '#d1d5db' }}>{totalRolls}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>AVG EFFICIENCY</span>
                  <span style={{ color: avgEff >= 80 ? '#22c55e' : avgEff >= 60 ? '#f59e0b' : '#ef4444' }}>{avgEff}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CRITICAL ZONES</span>
                  <span style={{ color: critCount > 0 ? '#ef4444' : '#6b7280' }}>{critCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>WARNINGS</span>
                  <span style={{ color: warnCount > 0 ? '#f59e0b' : '#6b7280' }}>{warnCount}</span>
                </div>
              </div>

              {/* Flicker ticker */}
              <div style={{ marginTop: 8, fontSize: '0.52rem', color: '#1f2937', letterSpacing: '0.06em' }}>
                {hudTick % 3 === 0
                  ? `> TICK ${String(hudTick).padStart(4, '0')} █`
                  : hudTick % 3 === 1
                  ? `> TICK ${String(hudTick).padStart(4, '0')} ▌`
                  : `> TICK ${String(hudTick).padStart(4, '0')}  `}
              </div>
            </div>
          </div>

          {/* Mill list */}
          <div style={{ padding: '12px 12px 8px' }}>
            <div style={{ fontSize: '0.56rem', color: '#374151', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
              Production Units
            </div>
            {MILLS.map(mill => {
              const ms: ZoneStatus =
                mill.zones.some(z => z.status === 'critical') ? 'critical' :
                mill.zones.some(z => z.status === 'warning')  ? 'warning'  : 'optimal';
              const mc = STATUS_CFG[ms];
              const active = mill.id === selectedMill.id;
              const rollTotal = mill.zones.reduce((s, z) => s + z.activeRolls, 0);
              return (
                <button key={mill.id} onClick={() => switchMill(mill)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '9px 10px',
                  marginBottom: 5,
                  background: active ? `rgba(${mc.glowRgb},0.07)` : 'rgba(255,255,255,0.015)',
                  borderTop: active ? `1px solid rgba(${mc.glowRgb},0.4)` : '1px solid rgba(255,255,255,0.04)',
                  borderLeft: `2px solid ${active ? mc.color : 'transparent'}`,
                  borderRight: active ? `1px solid rgba(${mc.glowRgb},0.15)` : '1px solid rgba(255,255,255,0.04)',
                  borderBottom: active ? `1px solid rgba(${mc.glowRgb},0.15)` : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 7,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 400, color: active ? '#f1f5f9' : '#9ca3af' }}>
                      {mill.name}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: mc.color,
                      boxShadow: `0 0 7px rgba(${mc.glowRgb},0.8)`,
                      animation: ms !== 'optimal' ? 'hudPulse 1.4s ease-in-out infinite' : 'none',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#4b5563', marginTop: 2 }}>{mill.location}</div>
                  <div style={{ fontSize: '0.58rem', color: '#374151', marginTop: 4 }}>
                    {mill.zones.length} zones · {rollTotal} rolls
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.56rem', color: '#374151', letterSpacing: '0.12em', marginBottom: 8 }}>ZONE STATUS</div>
            {(['optimal', 'warning', 'critical'] as ZoneStatus[]).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: STATUS_CFG[s].color,
                  boxShadow: `0 0 6px rgba(${STATUS_CFG[s].glowRgb},0.7)`,
                }} />
                <span style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.05em' }}>
                  {STATUS_CFG[s].label}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ══ MAIN FLOOR AREA ══ */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Top title bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
            padding: '10px 18px',
            background: 'linear-gradient(to bottom, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            pointerEvents: 'none',
          }}>
            <div>
              <div style={{ fontSize: '0.58rem', color: '#374151', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Virtual Factory Floor
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', marginTop: 1 }}>
                {selectedMill.name}
                <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#4b5563', marginLeft: 8 }}>
                  — {selectedMill.location}
                </span>
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#374151', textAlign: 'right', lineHeight: 1.8 }}>
              <div>{selectedMill.zones.length} ZONES MONITORED</div>
              <div style={{ color: '#1f2937' }}>FEED: LIVE · LATENCY: 12ms</div>
            </div>
          </div>

          {/* Floor plan */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
            `,
            backgroundSize: '52px 52px',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.28s ease',
          }}>
            {/* Building outline */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              preserveAspectRatio="none"
            >
              <rect x="2.5%" y="4%" width="95%" height="90%"
                rx="5" fill="none"
                stroke="rgba(255,255,255,0.07)" strokeWidth="1"
                strokeDasharray="6 4"
              />
              {/* Corner accents */}
              {(['2.5%', '97.5%'] as string[]).flatMap(cx =>
                (['4%', '94%'] as string[]).map((cy, j) => (
                  <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="3.5"
                    fill="none"
                    stroke={`rgba(${osCfg.glowRgb},0.4)`}
                    strokeWidth="1"
                  />
                ))
              )}
              {/* Center cross-hair */}
              <line x1="50%" y1="46%" x2="50%" y2="54%"
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="47%" y1="50%" x2="53%" y2="50%"
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </svg>

            {/* Zone cards */}
            {selectedMill.zones.map(zone => {
              const cfg = STATUS_CFG[zone.status];
              const isActive = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  style={{
                    position: 'absolute',
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.w}%`,
                    height: `${zone.h}%`,
                    padding: 5,
                  }}
                >
                  <div
                    onClick={() => setSelectedZone(isActive ? null : zone)}
                    style={{
                      width: '100%', height: '100%',
                      background: isActive
                        ? `rgba(${cfg.glowRgb},0.07)`
                        : 'rgba(8,9,12,0.82)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      borderTop: `1px solid ${isActive ? cfg.color : `rgba(${cfg.glowRgb},0.35)`}`,
                      borderLeft: `1px solid rgba(255,255,255,${isActive ? '0.1' : '0.05'})`,
                      borderRight: `1px solid rgba(255,255,255,${isActive ? '0.1' : '0.05'})`,
                      borderBottom: `1px solid rgba(255,255,255,${isActive ? '0.1' : '0.05'})`,
                      borderRadius: 9,
                      boxShadow: isActive
                        ? `0 0 28px rgba(${cfg.glowRgb},0.22), inset 0 1px 0 rgba(255,255,255,0.07)`
                        : `0 0 12px rgba(${cfg.glowRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.03)`,
                      cursor: 'pointer',
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 5,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e5e7eb', lineHeight: 1.25, flex: 1 }}>
                        {zone.icon} {zone.name}
                      </div>
                      {/* Status orb */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                        background: cfg.color,
                        boxShadow: `0 0 10px rgba(${cfg.glowRgb},1)`,
                        animation: cfg.pulse ? 'orbPulse 1.3s ease-in-out infinite' : 'none',
                      }} />
                    </div>

                    {/* Efficiency bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.54rem', color: '#4b5563', letterSpacing: '0.07em' }}>EFFICIENCY</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: cfg.color }}>{zone.efficiency}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <div style={{
                          height: '100%',
                          width: `${zone.efficiency}%`,
                          background: `linear-gradient(90deg, rgba(${cfg.glowRgb},0.6), ${cfg.color})`,
                          borderRadius: 2,
                          boxShadow: `0 0 8px rgba(${cfg.glowRgb},0.5)`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ fontSize: '0.57rem', color: '#4b5563' }}>
                        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{zone.activeRolls}</span> rolls
                      </div>
                      <div style={{ fontSize: '0.57rem', color: '#4b5563' }}>
                        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{zone.workers}</span> workers
                      </div>
                    </div>

                    {/* Machine */}
                    <div style={{ fontSize: '0.5rem', color: '#2d3748', marginTop: 'auto', letterSpacing: '0.04em' }}>
                      {zone.machine}
                    </div>

                    {/* Click hint */}
                    {!isActive && (
                      <div style={{ fontSize: '0.48rem', color: '#1f2937', letterSpacing: '0.04em' }}>
                        click to inspect ›
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ══ RIGHT SLIDE-OUT PANEL ══ */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 308,
            transform: selectedZone ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
            background: 'rgba(5,6,8,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 20,
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {selectedZone && (() => {
              const cfg = STATUS_CFG[selectedZone.status];
              return (
                <>
                  {/* Panel header */}
                  <div style={{
                    padding: '14px 16px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: `rgba(${cfg.glowRgb},0.04)`,
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.56rem', color: '#374151', letterSpacing: '0.12em', marginBottom: 3 }}>
                          ZONE DETAIL
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
                          {selectedZone.icon} {selectedZone.name}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedZone(null)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(255,255,255,0.04)',
                          borderTop: '1px solid rgba(255,255,255,0.1)',
                          borderLeft: '1px solid rgba(255,255,255,0.06)',
                          borderRight: '1px solid rgba(255,255,255,0.06)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          color: '#6b7280', fontSize: '1rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >×</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: cfg.color,
                        boxShadow: `0 0 9px rgba(${cfg.glowRgb},0.9)`,
                        animation: cfg.pulse ? 'hudPulse 1s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.09em' }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '0.58rem', color: '#374151', marginLeft: 2 }}>
                        {selectedZone.machine}
                      </span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
                    {[
                      { label: 'Efficiency',   val: `${selectedZone.efficiency}%`, color: cfg.color },
                      { label: 'Active Rolls', val: `${selectedZone.activeRolls}`, color: '#e5e7eb' },
                      { label: 'Workers',      val: `${selectedZone.workers}`,      color: '#e5e7eb' },
                      { label: 'Status',       val: cfg.label,                      color: cfg.color },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 7,
                        padding: '9px 11px',
                      }}>
                        <div style={{ fontSize: '0.54rem', color: '#374151', letterSpacing: '0.09em', marginBottom: 4 }}>
                          {stat.label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: stat.color }}>
                          {stat.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Efficiency chart */}
                  <div style={{ padding: '0 14px 14px', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.56rem', color: '#374151', letterSpacing: '0.1em', marginBottom: 8 }}>
                      PRODUCTION EFFICIENCY — LAST 8 INTERVALS
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 7,
                      padding: '10px 10px 8px',
                    }}>
                      <EffChart data={selectedZone.effHistory} zoneId={selectedZone.id} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <span style={{ fontSize: '0.5rem', color: '#374151' }}>8 intervals ago</span>
                        <span style={{ fontSize: '0.5rem', color: '#374151' }}>Now</span>
                      </div>
                    </div>
                  </div>

                  {/* Active rolls */}
                  <div style={{ padding: '0 14px', flex: 1 }}>
                    <div style={{ fontSize: '0.56rem', color: '#374151', letterSpacing: '0.1em', marginBottom: 8 }}>
                      ACTIVE ROLLS ({selectedZone.rolls.length})
                    </div>
                    {selectedZone.rolls.map(roll => {
                      const badColor =
                        ['Halted','Blocked','Delayed'].includes(roll.statusLabel) ? '#ef4444' :
                        ['Queued','Stalled'].includes(roll.statusLabel)           ? '#f59e0b' : '#22c55e';
                      return (
                        <div key={roll.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', marginBottom: 5,
                          background: 'rgba(255,255,255,0.02)',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          borderLeft: `2px solid ${roll.color}`,
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          borderRadius: 6,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: roll.color, flexShrink: 0,
                            boxShadow: `0 0 5px ${roll.color}88`,
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e5e7eb' }}>{roll.id}</div>
                            <div style={{ fontSize: '0.57rem', color: '#4b5563' }}>{roll.yards} yds</div>
                          </div>
                          <div style={{
                            fontSize: '0.55rem', fontWeight: 700,
                            color: badColor, letterSpacing: '0.04em',
                          }}>
                            {roll.statusLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ height: 20 }} />
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.7); }
        }
        @keyframes hudPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
