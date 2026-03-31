'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';
import { getRolls, seedDemoData, Roll } from '../lib/demoData';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  created:   { label: 'In Production', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: '📋' },
  warehouse: { label: 'Ready to Ship',  color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🏬' },
  truck:     { label: 'On the Way',    color: '#facc15', bg: 'rgba(250,204,21,0.12)',  icon: '🚛' },
  port:      { label: 'At Port',       color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: '⚓' },
  delivered: { label: 'Delivered',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '✅' },
};

const BRAND_SHIPMENTS = [
  { mill: 'Apex Textiles Ltd.', po: 'PO-2026-001', lot: 'LOT-A001', customer: 'H&M Sourcing', style: 'Classic Cotton Twill', color: 'Navy Blue', totalRolls: 5, eta: 'Mar 24, 2026', rollStatuses: ['delivered', 'delivered', 'port', 'truck', 'warehouse'] },
  { mill: 'Apex Textiles Ltd.', po: 'PO-2026-002', lot: 'LOT-A002', customer: 'Zara Global', style: 'Premium Linen Blend', color: 'Cream White', totalRolls: 3, eta: 'Apr 05, 2026', rollStatuses: ['warehouse', 'created', 'created'] },
  { mill: 'Blue River Mills', po: 'PO-2026-011', lot: 'LOT-B001', customer: 'H&M Sourcing', style: 'Stretch Jersey', color: 'Olive Green', totalRolls: 8, eta: 'Apr 10, 2026', rollStatuses: ['truck', 'truck', 'truck', 'warehouse', 'warehouse', 'created', 'created', 'created'] },
  { mill: 'Sunrise Fabrics', po: 'PO-2026-022', lot: 'LOT-S001', customer: 'Gap Inc.', style: 'Organic Cotton Poplin', color: 'Sky Blue', totalRolls: 6, eta: 'Apr 18, 2026', rollStatuses: ['created', 'created', 'created', 'created', 'created', 'created'] },
  { mill: 'Blue River Mills', po: 'PO-2026-012', lot: 'LOT-B002', customer: 'Nordstrom', style: 'Silk Charmeuse', color: 'Ivory', totalRolls: 4, eta: 'Apr 02, 2026', rollStatuses: ['port', 'port', 'port', 'delivered'] },
];

function getOverallStatus(statuses: string[]): string {
  const ORDER = ['delivered', 'port', 'truck', 'warehouse', 'created'];
  for (const s of ORDER) {
    if (statuses.some(r => r === s)) return s;
  }
  return 'created';
}

export default function BrandPage() {
  const router = useRouter();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [filterMill, setFilterMill] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    seedDemoData();
    setRolls(getRolls());
  }, [router]);

  const mills = ['all', ...Array.from(new Set(BRAND_SHIPMENTS.map(s => s.mill)))];

  const filtered = BRAND_SHIPMENTS.filter(s => {
    if (filterMill !== 'all' && s.mill !== filterMill) return false;
    if (filterStatus !== 'all' && getOverallStatus(s.rollStatuses) !== filterStatus) return false;
    return true;
  });

  const totalRolls = BRAND_SHIPMENTS.reduce((a, s) => a + s.totalRolls, 0);
  const inTransit = BRAND_SHIPMENTS.filter(s => ['truck', 'port'].includes(getOverallStatus(s.rollStatuses))).length;
  const delivered = BRAND_SHIPMENTS.filter(s => getOverallStatus(s.rollStatuses) === 'delivered').length;
  const atRisk = BRAND_SHIPMENTS.filter(s => getOverallStatus(s.rollStatuses) === 'port').length;

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Brand Console</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.88rem' }}>Nordstrom Sourcing · Live shipment visibility across all supplier mills</p>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Rolls', value: totalRolls, color: '#9ca3af', sub: 'across all mills' },
            { label: 'Shipments', value: BRAND_SHIPMENTS.length, color: '#38bdf8', sub: 'open POs' },
            { label: 'In Transit', value: inTransit, color: '#facc15', sub: 'truck or port' },
            { label: 'Delivered', value: delivered, color: '#22c55e', sub: 'this season' },
            { label: 'At Port', value: atRisk, color: '#f97316', sub: 'watch closely' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#e5e7eb', fontWeight: 600, marginTop: '0.15rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.1rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {mills.map(m => (
              <button key={m} onClick={() => setFilterMill(m)} style={{
                padding: '0.35rem 0.75rem',
                background: filterMill === m ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                border: filterMill === m ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, color: filterMill === m ? '#22c55e' : '#9ca3af',
                fontSize: '0.78rem', fontWeight: filterMill === m ? 600 : 400, cursor: 'pointer',
              }}>{m === 'all' ? 'All Mills' : m}</button>
            ))}
          </div>
        </div>

        {/* Shipment Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((shipment, i) => {
            const overallStatus = getOverallStatus(shipment.rollStatuses);
            const meta = STATUS_META[overallStatus];
            const deliveredCount = shipment.rollStatuses.filter(s => s === 'delivered').length;
            const pct = Math.round((deliveredCount / shipment.totalRolls) * 100);

            return (
              <div key={i} style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '1.5rem',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>{shipment.po}</span>
                      <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>·</span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{shipment.lot}</span>
                      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`, borderRadius: 99, padding: '0.15rem 0.55rem' }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.2rem' }}>{shipment.style}</div>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>🏭 {shipment.mill}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>🛍️ {shipment.customer}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>🎨 {shipment.color}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>📅 ETA {shipment.eta}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ fontSize: '0.72rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Roll Progress</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb' }}>{deliveredCount} / {shipment.totalRolls} delivered</div>
                    <div style={{ marginTop: '0.5rem', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '0.25rem' }}>{pct}% complete</div>
                  </div>
                </div>

                {/* Roll status mini-dots */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  {shipment.rollStatuses.map((s, idx) => {
                    const m = STATUS_META[s];
                    return (
                      <div key={idx} title={`Roll ${idx + 1}: ${m.label}`} style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: m.bg,
                        border: `1px solid ${m.color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}>{m.icon}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
            <div>No shipments found for the selected filters</div>
          </div>
        )}
      </div>
    </div>
  );
}
