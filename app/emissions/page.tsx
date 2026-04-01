'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';
import { getRolls, seedDemoData, Roll } from '../lib/demoData';

// Emission factors (kg CO2 per tonne-km)
const FACTORS = {
  sea:   0.016,
  air:   1.640,
  truck: 0.200,
};
// Bangladesh grid: kg CO2 per kWh
const GRID_FACTOR = 0.65;

interface RollEmissions {
  roll: Roll;
  productionCO2: number;
  transportCO2: number;
  totalCO2: number;
}

function calcEmissions(roll: Roll): RollEmissions {
  const weight = (roll.weightKg || 70) / 1000; // tonnes
  const kwh = roll.productionKwh || 440;
  const km = roll.transportKm || 13200;
  const mode = roll.transport || 'sea';

  const productionCO2 = kwh * GRID_FACTOR;
  const transportCO2 = km * weight * FACTORS[mode];
  return {
    roll,
    productionCO2: Math.round(productionCO2 * 10) / 10,
    transportCO2: Math.round(transportCO2 * 10) / 10,
    totalCO2: Math.round((productionCO2 + transportCO2) * 10) / 10,
  };
}

// Donut chart using SVG
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 60;
  const cx = 80, cy = 80;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={20} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={20}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px', transition: 'stroke-dasharray 0.5s ease' }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f9fafb" fontSize="13" fontWeight="bold">
        {(total / 1000).toFixed(2)}t
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize="9">
        CO₂e total
      </text>
    </svg>
  );
}

// Horizontal bar chart
function BarChart({ bars }: { bars: { label: string; value: number; max: number; color: string; sub?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {bars.map((b, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#e5e7eb', fontWeight: 600 }}>{b.label}</span>
            <span style={{ fontSize: '0.75rem', color: b.color, fontWeight: 700 }}>{b.value.toFixed(1)} kg</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((b.value / b.max) * 100, 100)}%`,
              background: b.color,
              borderRadius: 99,
              transition: 'width 0.6s ease',
            }} />
          </div>
          {b.sub && <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.2rem' }}>{b.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// Animated counter
function Counter({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const step = 16;
    const increment = (end / (duration / step));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

const TRANSPORT_COLORS: Record<string, string> = {
  sea: '#38bdf8',
  air: '#f97316',
  truck: '#facc15',
};
const TRANSPORT_LABELS: Record<string, string> = {
  sea: '🚢 Sea Freight',
  air: '✈️ Air Freight',
  truck: '🚛 Road / Truck',
};

export default function EmissionsPage() {
  const router = useRouter();
  const [data, setData] = useState<RollEmissions[]>([]);
  const [whatIfMode, setWhatIfMode] = useState(true);
  // What-If slider state (must sum to 100)
  const [wfSea,   setWfSea]   = useState(60);
  const [wfAir,   setWfAir]   = useState(20);
  const [wfTruck, setWfTruck] = useState(20);

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    seedDemoData();
    const rolls = getRolls();
    setData(rolls.map(calcEmissions));
  }, [router]);

  if (!data.length) return (
    <div style={{ minHeight: '100vh', background: '#070c15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontFamily: 'system-ui' }}>Loading emissions data…</div>
    </div>
  );

  // Aggregates
  const totalCO2 = data.reduce((a, d) => a + d.totalCO2, 0);
  const totalProduction = data.reduce((a, d) => a + d.productionCO2, 0);
  const totalTransport = data.reduce((a, d) => a + d.transportCO2, 0);
  const avgPerRoll = totalCO2 / data.length;
  const avgPerYard = totalCO2 / data.reduce((a, d) => a + d.roll.yards, 0);

  // Transport breakdown
  const byMode: Record<string, number> = { sea: 0, air: 0, truck: 0 };
  data.forEach(d => { byMode[d.roll.transport || 'sea'] += d.totalCO2; });

  // Air rolls potential sea saving
  const airRolls = data.filter(d => d.roll.transport === 'air');
  const airSaving = airRolls.reduce((acc, d) => {
    const seaCO2 = (d.roll.transportKm || 8100) * ((d.roll.weightKg || 70) / 1000) * FACTORS.sea;
    return acc + (d.transportCO2 - seaCO2);
  }, 0);

  // By PO
  const byPO: Record<string, number> = {};
  data.forEach(d => { byPO[d.roll.po] = (byPO[d.roll.po] || 0) + d.totalCO2; });
  const maxPO = Math.max(...Object.values(byPO));

  // Donut segments
  const donutSegments = Object.entries(byMode)
    .filter(([, v]) => v > 0)
    .map(([mode, value]) => ({ value, color: TRANSPORT_COLORS[mode], label: TRANSPORT_LABELS[mode] }));

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🌿</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Emissions Intelligence</h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>
            Real-time Scope 3 carbon tracking · Apex Textiles Ltd. · Q1 2026 · {data.length} rolls tracked
          </p>
        </div>

        {/* Hero metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            {
              label: 'Total CO₂ This Quarter',
              value: <><Counter value={totalCO2 / 1000} decimals={2} /> <span style={{ fontSize: '0.9rem' }}>tonnes</span></>,
              sub: 'CO₂e across all rolls',
              color: '#22c55e',
              icon: '🌍',
            },
            {
              label: 'Avg CO₂ per Roll',
              value: <><Counter value={avgPerRoll} decimals={0} /> <span style={{ fontSize: '0.9rem' }}>kg</span></>,
              sub: 'production + transport',
              color: '#38bdf8',
              icon: '🧵',
            },
            {
              label: 'CO₂ per Yard',
              value: <><Counter value={avgPerYard} decimals={2} /> <span style={{ fontSize: '0.9rem' }}>kg</span></>,
              sub: 'industry avg: 1.8 kg/yd',
              color: '#a78bfa',
              icon: '📏',
            },
            {
              label: 'Potential Savings',
              value: <><Counter value={airSaving / 1000} decimals={2} /> <span style={{ fontSize: '0.9rem' }}>tonnes</span></>,
              sub: 'switch air → sea freight',
              color: '#f59e0b',
              icon: '💡',
            },
          ].map(card => (
            <div key={card.label} style={{ background: '#111827', border: `1px solid ${card.color}22`, borderRadius: 14, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '3.5rem', opacity: 0.06, filter: 'blur(2px)' }}>{card.icon}</div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{card.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color, lineHeight: 1.1, marginBottom: '0.3rem' }}>{card.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Main charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Transport mode donut */}
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>CO₂ by Transport Mode</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <DonutChart segments={donutSegments} />
              <div style={{ flex: 1 }}>
                {donutSegments.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{(s.value / totalCO2 * 100).toFixed(0)}% · {(s.value / 1000).toFixed(2)}t</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Production vs Transport split */}
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>Production vs Transport</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>⚡ Production Emissions</span>
                <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 700 }}>{(totalProduction / 1000).toFixed(2)}t</span>
              </div>
              <div style={{ height: 28, background: 'rgba(167,139,250,0.08)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(167,139,250,0.15)', marginBottom: '0.35rem' }}>
                <div style={{ height: '100%', width: `${(totalProduction / totalCO2) * 100}%`, background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>{(totalProduction / totalCO2 * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563' }}>Mill energy consumption · {GRID_FACTOR} kg CO₂/kWh (BD grid)</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 600 }}>🚢 Transport Emissions</span>
                <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 700 }}>{(totalTransport / 1000).toFixed(2)}t</span>
              </div>
              <div style={{ height: 28, background: 'rgba(249,115,22,0.08)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(249,115,22,0.15)' }}>
                <div style={{ height: '100%', width: `${(totalTransport / totalCO2) * 100}%`, background: 'linear-gradient(90deg, #f97316, #dc2626)', borderRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>{(totalTransport / totalCO2 * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.35rem' }}>Freight logistics · sea / air / truck</div>
            </div>

            {/* Key insight */}
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 700, marginBottom: '0.2rem' }}>⚠️ Air freight alert</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', lineHeight: 1.5 }}>
                {airRolls.length} rolls shipped by air. Switching to sea would save <strong style={{ color: '#22c55e' }}>{(airSaving / 1000).toFixed(2)} tonnes CO₂</strong> — equivalent to planting {Math.round(airSaving / 21)} trees.
              </div>
            </div>
          </div>

          {/* CO2 by PO */}
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>CO₂ by Purchase Order</div>
            <BarChart bars={Object.entries(byPO).map(([po, val]) => ({
              label: po,
              value: val,
              max: maxPO * 1.1,
              color: val === maxPO ? '#f97316' : '#22c55e',
              sub: `${data.filter(d => d.roll.po === po).length} rolls · ${(val / 1000).toFixed(2)}t CO₂e`,
            }))} />

            {/* Scope 3 badge */}
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>✓</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>Scope 3 Ready</div>
                <div style={{ fontSize: '0.68rem', color: '#4b5563' }}>100% roll coverage · GHG Protocol aligned</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Enhanced Interactive What-If Calculator ── */}
        {(() => {
          // Scenario calculations
          const totalKmWeight = data.reduce((a, d) =>
            a + (d.roll.transportKm || 13200) * ((d.roll.weightKg || 70) / 1000), 0);
          const scenarioFactor = (wfSea * FACTORS.sea + wfAir * FACTORS.air + wfTruck * FACTORS.truck) / 100;
          const scenarioTransportCO2 = scenarioFactor * totalKmWeight;
          const co2Saved = totalTransport - scenarioTransportCO2;
          const pctSaved = totalCO2 > 0 ? (co2Saved / totalCO2) * 100 : 0;
          const treesEq = Math.max(0, Math.round(co2Saved / 21));
          const freightSave = Math.max(0, Math.round(
            (wfAir / 100) < (data.filter(d => d.roll.transport === 'air').length / data.length)
              ? (data.filter(d => d.roll.transport === 'air').length - Math.round(data.length * wfAir / 100)) * 1200
              : 0
          ));
          const totalSlider = wfSea + wfAir + wfTruck;

          // Slider handler: adjusting one mode proportionally redistributes the others
          function handleSlider(mode: 'sea' | 'air' | 'truck', val: number) {
            const clamped = Math.min(100, Math.max(0, val));
            const remainder = 100 - clamped;
            if (mode === 'sea') {
              const tot = wfAir + wfTruck || 1;
              setWfSea(clamped);
              setWfAir(Math.round((wfAir / tot) * remainder));
              setWfTruck(remainder - Math.round((wfAir / tot) * remainder));
            } else if (mode === 'air') {
              const tot = wfSea + wfTruck || 1;
              setWfAir(clamped);
              setWfSea(Math.round((wfSea / tot) * remainder));
              setWfTruck(remainder - Math.round((wfSea / tot) * remainder));
            } else {
              const tot = wfSea + wfAir || 1;
              setWfTruck(clamped);
              setWfSea(Math.round((wfSea / tot) * remainder));
              setWfAir(remainder - Math.round((wfSea / tot) * remainder));
            }
          }

          // Actual current mix %
          const actualTotal = byMode.sea + byMode.air + byMode.truck || 1;
          const actualSeaPct   = Math.round((byMode.sea   / actualTotal) * 100);
          const actualAirPct   = Math.round((byMode.air   / actualTotal) * 100);
          const actualTruckPct = Math.round((byMode.truck / actualTotal) * 100);

          const SLIDER_COLORS = { sea: '#38bdf8', air: '#f97316', truck: '#facc15' };
          const SLIDER_LABELS = { sea: '🚢 Sea Freight', air: '✈️ Air Freight', truck: '🚛 Road / Truck' };

          return (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(16,185,129,0.02))',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb' }}>💡 What-If Scenario Calculator</span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, color: '#22c55e',
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 99, padding: '0.15rem 0.5rem', letterSpacing: '0.06em',
                    }}>LIVE</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Drag the sliders to model any transport mix — CO₂ savings update instantly
                  </div>
                </div>
                {/* Reset button */}
                <button
                  onClick={() => { setWfSea(actualSeaPct); setWfAir(actualAirPct); setWfTruck(actualTruckPct); }}
                  style={{
                    padding: '0.35rem 0.85rem', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >↺ Reset to actual</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: '2rem' }}>

                {/* LEFT — Sliders */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '1rem' }}>
                    Scenario transport mix
                  </div>

                  {(['sea', 'air', 'truck'] as const).map(mode => (
                    <div key={mode} style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: SLIDER_COLORS[mode], flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: '#e5e7eb', fontWeight: 500 }}>{SLIDER_LABELS[mode]}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>
                            was {mode === 'sea' ? actualSeaPct : mode === 'air' ? actualAirPct : actualTruckPct}%
                          </span>
                          <span style={{
                            fontSize: '0.9rem', fontWeight: 800,
                            color: SLIDER_COLORS[mode], minWidth: 42, textAlign: 'right',
                          }}>
                            {mode === 'sea' ? wfSea : mode === 'air' ? wfAir : wfTruck}%
                          </span>
                        </div>
                      </div>
                      <input
                        type="range" min={0} max={100}
                        value={mode === 'sea' ? wfSea : mode === 'air' ? wfAir : wfTruck}
                        onChange={e => handleSlider(mode, Number(e.target.value))}
                        style={{ width: '100%', accentColor: SLIDER_COLORS[mode], cursor: 'pointer', height: 4 }}
                      />
                      {/* Mini bar showing scenario vs actual */}
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem' }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            background: SLIDER_COLORS[mode] + '60',
                            width: `${mode === 'sea' ? actualSeaPct : mode === 'air' ? actualAirPct : actualTruckPct}%`,
                          }} />
                        </div>
                        <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            background: SLIDER_COLORS[mode],
                            width: `${mode === 'sea' ? wfSea : mode === 'air' ? wfAir : wfTruck}%`,
                            transition: 'width 0.2s',
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#374151', marginTop: '0.15rem' }}>
                        <span>actual</span><span>scenario</span>
                      </div>
                    </div>
                  ))}

                  {/* Total indicator */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: 8, marginTop: '0.25rem',
                    background: totalSlider === 100 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                    border: `1px solid ${totalSlider === 100 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Mix total</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: totalSlider === 100 ? '#22c55e' : '#ef4444' }}>
                      {totalSlider}% {totalSlider === 100 ? '✓' : '— adjust sliders'}
                    </span>
                  </div>
                </div>

                {/* RIGHT — Live results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Impact of this scenario
                  </div>

                  {/* Big CO₂ saved number */}
                  <div style={{
                    background: co2Saved > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${co2Saved > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    borderRadius: 12, padding: '1rem', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      {co2Saved >= 0 ? 'CO₂ Saved vs. current' : 'CO₂ Added vs. current'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: co2Saved >= 0 ? '#22c55e' : '#ef4444', letterSpacing: '-0.03em' }}>
                      {co2Saved >= 0 ? '' : '+'}{Math.abs(co2Saved) >= 1000
                        ? `${(Math.abs(co2Saved) / 1000).toFixed(2)}t`
                        : `${Math.abs(co2Saved).toFixed(1)} kg`}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: co2Saved >= 0 ? '#22c55e' : '#ef4444', marginTop: '0.2rem' }}>
                      {Math.abs(pctSaved).toFixed(1)}% {co2Saved >= 0 ? 'reduction' : 'increase'}
                    </div>
                  </div>

                  {/* Current vs Scenario comparison bar */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#4b5563', marginBottom: '0.6rem' }}>Current vs Scenario</div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                        <span>Current</span>
                        <span style={{ color: '#f97316' }}>{totalTransport.toFixed(1)} kg</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #f97316, #facc15)', borderRadius: 99 }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                        <span>Scenario</span>
                        <span style={{ color: co2Saved >= 0 ? '#22c55e' : '#ef4444' }}>{scenarioTransportCO2.toFixed(1)} kg</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (scenarioTransportCO2 / totalTransport) * 100)}%`,
                          height: '100%',
                          background: co2Saved >= 0 ? '#22c55e' : '#ef4444',
                          borderRadius: 99, transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Equivalent metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { icon: '🌳', val: treesEq.toLocaleString(), label: 'trees equiv.', color: '#4ade80', show: co2Saved > 0 },
                      { icon: '💰', val: `$${(data.filter(d=>d.roll.transport==='air').length * Math.max(0,(wfAir/100 < data.filter(d=>d.roll.transport==='air').length/data.length ? 1 : 0)) * 1200).toLocaleString()}`, label: 'freight saved', color: '#f59e0b', show: co2Saved > 0 },
                      { icon: '🏭', val: `${Math.abs(pctSaved).toFixed(0)}%`, label: co2Saved >= 0 ? 'less CO₂' : 'more CO₂', color: co2Saved >= 0 ? '#22c55e' : '#ef4444', show: true },
                      { icon: '📋', val: totalSlider === 100 ? 'Valid' : 'Adjust', label: 'scenario status', color: totalSlider === 100 ? '#22c55e' : '#ef4444', show: true },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8, padding: '0.6rem 0.7rem', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1rem' }}>{m.icon}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
                        <div style={{ fontSize: '0.6rem', color: '#4b5563', marginTop: '0.15rem' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Insight line */}
                  {totalSlider === 100 && (
                    <div style={{
                      padding: '0.65rem 0.85rem', borderRadius: 8,
                      background: co2Saved > 0 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                      border: `1px solid ${co2Saved > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      fontSize: '0.75rem',
                      color: co2Saved > 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {co2Saved > 0
                        ? `✓ This mix saves ${(co2Saved).toFixed(1)} kg CO₂ — equivalent to planting ${treesEq} trees.`
                        : `⚠ This mix increases emissions by ${Math.abs(co2Saved).toFixed(1)} kg CO₂ vs. your current mix.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Roll-level breakdown table */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.95rem' }}>Roll-Level Carbon Breakdown</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>Every roll tracked · GHG Protocol Scope 3 Category 1 & 4</div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '0.25rem 0.6rem' }}>
              100% Coverage
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Roll ID', 'PO / Lot', 'Transport', 'Weight', 'Production CO₂', 'Transport CO₂', 'Total CO₂', 'Intensity'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sort((a, b) => b.totalCO2 - a.totalCO2).map((d, i) => {
                  const mode = d.roll.transport || 'sea';
                  const modeColor = TRANSPORT_COLORS[mode];
                  const intensity = d.totalCO2 / d.roll.yards;
                  const isHighEmitter = mode === 'air';
                  return (
                    <tr key={d.roll.id}
                      style={{ borderBottom: i < data.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isHighEmitter ? 'rgba(249,115,22,0.02)' : 'transparent', cursor: 'pointer' }}
                      onClick={() => router.push(`/roll/${d.roll.id}`)}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = isHighEmitter ? 'rgba(249,115,22,0.02)' : 'transparent'}
                    >
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>{d.roll.id}</span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <div style={{ fontSize: '0.78rem', color: '#e5e7eb', fontWeight: 500 }}>{d.roll.po}</div>
                        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{d.roll.lot}</div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: modeColor, background: modeColor + '15', border: `1px solid ${modeColor}33`, borderRadius: 99, padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>
                          {TRANSPORT_LABELS[mode]}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', color: '#d1d5db' }}>{d.roll.weightKg || 70} kg</td>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>{d.productionCO2.toFixed(1)} kg</td>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', color: isHighEmitter ? '#f97316' : '#38bdf8', fontWeight: 600 }}>{d.transportCO2.toFixed(1)} kg</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isHighEmitter ? '#f97316' : '#22c55e' }}>{d.totalCO2.toFixed(1)} kg</span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: '#6b7280' }}>{intensity.toFixed(2)} kg/yd</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Totals: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{totalProduction.toFixed(1)} kg production</span> + <span style={{ color: '#f97316', fontWeight: 600 }}>{totalTransport.toFixed(1)} kg transport</span>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e' }}>
              Grand Total: {totalCO2.toFixed(1)} kg CO₂e = {(totalCO2 / 1000).toFixed(3)} tonnes
            </div>
          </div>
        </div>

        {/* DPP Teaser */}
        <div style={{ marginTop: '1.25rem', padding: '1.25rem 1.5rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.95rem', marginBottom: '0.2rem' }}>🇪🇺 EU Digital Product Passport Ready</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>All roll-level carbon data is DPP-compliant. One-click export for brand audit submissions — coming soon.</div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}>
            Regulation 2024/1781 · In scope
          </div>
        </div>

      </div>
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}
