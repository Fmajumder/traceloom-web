'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import Navbar from '../../components/Navbar';
import { getRolls, seedDemoData, Roll } from '../../lib/demoData';

const STATUS_ORDER = ['created', 'warehouse', 'truck', 'port', 'delivered'];
const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string; desc: string; next: string }> = {
  created:   { label: 'Created',   color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: '📋', desc: 'Roll registered in TraceLoom',        next: 'warehouse' },
  warehouse: { label: 'Warehouse', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🏬', desc: 'Moved to warehouse for staging',       next: 'truck' },
  truck:     { label: 'On Truck',  color: '#facc15', bg: 'rgba(250,204,21,0.12)',  icon: '🚛', desc: 'Loaded onto transport truck',          next: 'port' },
  port:      { label: 'At Port',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: '⚓', desc: 'Checked in at export port',            next: 'delivered' },
  delivered: { label: 'Delivered', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '✅', desc: 'Received by buyer at destination',     next: '' },
};

export default function RollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  const [roll, setRoll] = useState<Roll | null | undefined>(undefined);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    seedDemoData();
    setBaseUrl(window.location.origin);
    const rolls = getRolls();
    const found = rolls.find(r => r.id === code);
    setRoll(found || null);
  }, [code]);

  if (roll === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#070c15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontFamily: 'system-ui' }}>Loading…</div>
      </div>
    );
  }

  if (roll === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <div style={{ color: '#f9fafb', fontSize: '1.2rem', fontWeight: 700 }}>Roll Not Found</div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>No roll found with ID: <code style={{ color: '#38bdf8' }}>{code}</code></div>
          <button onClick={() => router.push('/dashboard')} style={{ marginTop: '0.5rem', padding: '0.6rem 1.2rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[roll.status];
  const stepIdx = STATUS_ORDER.indexOf(roll.status);
  const qrUrl = `${baseUrl}/roll/${roll.id}`;

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Back + Header */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.25rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{roll.id}</h1>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}44`, borderRadius: 99, padding: '0.25rem 0.75rem' }}>
                {meta.icon} {meta.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <span>📦 {roll.po}</span>
              <span>🗂️ {roll.lot}</span>
              <span>🎨 {roll.color}</span>
              <span>📏 {roll.yards} yds</span>
              <span>🏭 {roll.mill}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>

          {/* Left: Progress + Timeline */}
          <div>
            {/* Step progress bar */}
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Journey Progress</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {STATUS_ORDER.map((s, idx) => {
                  const m = STATUS_META[s];
                  const done = idx <= stepIdx;
                  const current = idx === stepIdx;
                  return (
                    <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', margin: '0 auto 0.4rem',
                        background: done ? m.color + '22' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${done ? m.color : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                        boxShadow: current ? `0 0 12px ${m.color}44` : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {done ? m.icon : '○'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: done ? m.color : '#4b5563', fontWeight: done ? 600 : 400, lineHeight: 1.2 }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
              {/* Connecting line */}
              <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, margin: '-2.4rem 18px 1.25rem', zIndex: 0 }}>
                <div style={{ height: '100%', width: `${(stepIdx / (STATUS_ORDER.length - 1)) * 100}%`, background: `linear-gradient(90deg, #9ca3af, ${meta.color})`, borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Event Timeline */}
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>Audit Trail</div>

              <div style={{ position: 'relative' }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {roll.events.map((ev, i) => {
                    const m = STATUS_META[ev.status] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: '•' };
                    const isLast = i === roll.events.length - 1;
                    return (
                      <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: isLast ? 0 : '1.5rem' }}>
                        {/* Dot */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: m.bg,
                          border: `2px solid ${m.color}66`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem',
                          zIndex: 1,
                          boxShadow: isLast ? `0 0 10px ${m.color}33` : 'none',
                        }}>
                          {m.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, paddingTop: '0.3rem' }}>
                          <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{ev.label}</div>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>📍 {ev.location}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>👤 {ev.operator}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '0.2rem' }}>{fmt(ev.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {roll.status !== 'delivered' && (
                <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                    Next checkpoint: <span style={{ color: STATUS_META[STATUS_META[roll.status].next || 'delivered']?.color || '#9ca3af', fontWeight: 600 }}>
                      {STATUS_META[STATUS_META[roll.status].next || 'delivered']?.label || 'Delivered'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: QR + Details */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Roll QR Code</div>
              <div style={{ background: '#fff', padding: '0.85rem', borderRadius: 10, display: 'inline-block', marginBottom: '0.75rem' }}>
                <QRCode value={qrUrl} size={160} level="M" />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-all' }}>{qrUrl}</div>
            </div>

            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Roll Details</div>
              {[
                { label: 'Roll ID', value: roll.id, mono: true },
                { label: 'PO', value: roll.po, mono: true },
                { label: 'Lot', value: roll.lot, mono: true },
                { label: 'Color', value: roll.color },
                { label: 'Yards', value: `${roll.yards} yds` },
                { label: 'Mill', value: roll.mill },
                { label: 'Created', value: new Date(roll.createdAt).toLocaleDateString() },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: 600, fontFamily: row.mono ? 'monospace' : 'inherit', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Emissions card */}
            {roll.transport && (() => {
              const FACTORS: Record<string, number> = { sea: 0.016, air: 1.640, truck: 0.200 };
              const weight = (roll.weightKg || 70) / 1000;
              const productionCO2 = (roll.productionKwh || 440) * 0.65;
              const transportCO2 = (roll.transportKm || 13200) * weight * FACTORS[roll.transport];
              const totalCO2 = productionCO2 + transportCO2;
              const modeLabels: Record<string, string> = { sea: '🚢 Sea', air: '✈️ Air', truck: '🚛 Truck' };
              const modeColors: Record<string, string> = { sea: '#38bdf8', air: '#f97316', truck: '#facc15' };
              const color = modeColors[roll.transport];
              return (
                <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>🌿 Carbon Footprint</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e', marginBottom: '0.2rem' }}>{totalCO2.toFixed(1)} <span style={{ fontSize: '0.85rem' }}>kg CO₂e</span></div>
                  <div style={{ fontSize: '0.72rem', color: '#4b5563', marginBottom: '1rem' }}>{(totalCO2 / roll.yards).toFixed(2)} kg per yard</div>
                  {[
                    { label: '⚡ Production', value: productionCO2, color: '#a78bfa' },
                    { label: `${modeLabels[roll.transport]} Transport`, value: transportCO2, color },
                  ].map(row => (
                    <div key={row.label} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{row.label}</span>
                        <span style={{ fontSize: '0.72rem', color: row.color, fontWeight: 700 }}>{row.value.toFixed(1)} kg</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(row.value / totalCO2) * 100}%`, background: row.color, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}
