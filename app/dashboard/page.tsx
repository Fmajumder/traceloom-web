'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';
import { getRolls, saveRolls, seedDemoData, Roll } from '../lib/demoData';

const STATUS_ORDER = ['created', 'warehouse', 'truck', 'port', 'delivered'];
const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string; next: string }> = {
  created:   { label: 'Created',   color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: '📋', next: 'warehouse' },
  warehouse: { label: 'Warehouse', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🏬', next: 'truck' },
  truck:     { label: 'On Truck',  color: '#facc15', bg: 'rgba(250,204,21,0.12)',  icon: '🚛', next: 'port' },
  port:      { label: 'At Port',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: '⚓', next: 'delivered' },
  delivered: { label: 'Delivered', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '✅', next: '' },
};

const BLANK_FORM = { po: '', lot: '', color: '', yards: '' };

export default function DashboardPage() {
  const router = useRouter();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [qrRoll, setQrRoll] = useState<Roll | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rolls' | 'scan'>('rolls');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    seedDemoData();
    setRolls(getRolls());
  }, [router]);

  function createRoll() {
    if (!form.po || !form.lot || !form.color || !form.yards) return;
    const count = rolls.filter(r => r.lot === form.lot).length + 1;
    const padded = String(count).padStart(3, '0');
    const lotShort = form.lot.replace('LOT-', '');
    const id = `TL-${lotShort}-${padded}`;
    const newRoll: Roll = {
      id,
      po: form.po,
      lot: form.lot,
      color: form.color,
      yards: parseFloat(form.yards),
      status: 'created',
      mill: 'Apex Textiles Ltd.',
      createdAt: new Date().toISOString(),
      events: [{ status: 'created', label: 'Roll Created', timestamp: new Date().toISOString(), location: 'Production Floor', operator: 'Mill Admin' }],
    };
    const updated = [newRoll, ...rolls];
    setRolls(updated);
    saveRolls(updated);
    setForm(BLANK_FORM);
    setShowCreate(false);
  }

  function advanceStatus(rollId: string) {
    const updated = rolls.map(r => {
      if (r.id !== rollId) return r;
      const meta = STATUS_META[r.status];
      if (!meta.next) return r;
      const nextStatus = meta.next as Roll['status'];
      const nextMeta = STATUS_META[nextStatus];
      const labels: Record<string, string> = {
        warehouse: 'Moved to Warehouse',
        truck: 'Loaded onto Truck',
        port: 'Arrived at Port',
        delivered: 'Delivered to Buyer',
      };
      return {
        ...r,
        status: nextStatus,
        events: [...r.events, {
          status: nextStatus,
          label: labels[nextStatus] || nextMeta.label,
          timestamp: new Date().toISOString(),
          location: 'Scanned by Mill Admin',
          operator: 'Reza Ahmed',
        }],
      };
    });
    setRolls(updated);
    saveRolls(updated);
  }

  function handleScan() {
    const roll = rolls.find(r => r.id === scanInput.trim());
    if (!roll) { setScanStatus('not_found'); return; }
    advanceStatus(roll.id);
    setScanStatus('success');
    setScanInput('');
    setTimeout(() => setScanStatus(null), 3000);
  }

  const filtered = filterStatus === 'all' ? rolls : rolls.filter(r => r.status === filterStatus);

  const stats = {
    total: rolls.length,
    warehouse: rolls.filter(r => r.status === 'warehouse').length,
    truck: rolls.filter(r => r.status === 'truck').length,
    port: rolls.filter(r => r.status === 'port').length,
    delivered: rolls.filter(r => r.status === 'delivered').length,
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Mill Control Center</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.88rem' }}>Apex Textiles Ltd. · Real-time roll tracking</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#000', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            }}
          >+ New Roll</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Rolls', value: stats.total, color: '#9ca3af', key: 'all' },
            { label: 'In Warehouse', value: stats.warehouse, color: '#38bdf8', key: 'warehouse' },
            { label: 'On Truck', value: stats.truck, color: '#facc15', key: 'truck' },
            { label: 'At Port', value: stats.port, color: '#f97316', key: 'port' },
            { label: 'Delivered', value: stats.delivered, color: '#22c55e', key: 'delivered' },
          ].map(s => (
            <div
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              style={{
                background: filterStatus === s.key ? s.color + '18' : '#111827',
                border: `1px solid ${filterStatus === s.key ? s.color + '50' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '0.2rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['rolls', 'scan'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.45rem 1rem',
              background: activeTab === tab ? 'rgba(34,197,94,0.12)' : 'transparent',
              border: activeTab === tab ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, cursor: 'pointer',
              color: activeTab === tab ? '#22c55e' : '#6b7280',
              fontSize: '0.85rem', fontWeight: activeTab === tab ? 600 : 400,
            }}>
              {tab === 'rolls' ? '📋 Roll List' : '📷 Scan Station'}
            </button>
          ))}
        </div>

        {/* Roll Table */}
        {activeTab === 'rolls' && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Roll ID', 'PO / Lot', 'Color', 'Yards', 'Status', 'Progress', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#4b5563', fontSize: '0.9rem' }}>No rolls found</td></tr>
                  )}
                  {filtered.map((roll, i) => {
                    const meta = STATUS_META[roll.status];
                    const stepIdx = STATUS_ORDER.indexOf(roll.status);
                    const nextMeta = meta.next ? STATUS_META[meta.next] : null;
                    return (
                      <tr key={roll.id}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => router.push(`/roll/${roll.id}`)}>{roll.id}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontSize: '0.82rem', color: '#e5e7eb', fontWeight: 500 }}>{roll.po}</div>
                          <div style={{ fontSize: '0.73rem', color: '#6b7280' }}>{roll.lot}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.83rem', color: '#d1d5db' }}>{roll.color}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.83rem', color: '#d1d5db' }}>{roll.yards} yds</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.73rem', fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`, borderRadius: 99, padding: '0.2rem 0.6rem', whiteSpace: 'nowrap' }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', minWidth: 110 }}>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {STATUS_ORDER.map((s, idx) => (
                              <div key={s} style={{ flex: 1, height: 5, borderRadius: 99, background: idx <= stepIdx ? STATUS_META[s].color : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button onClick={() => setQrRoll(roll)} style={{ padding: '0.28rem 0.6rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 6, color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>QR</button>
                            {nextMeta && (
                              <button onClick={() => advanceStatus(roll.id)} style={{ padding: '0.28rem 0.6rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, color: '#22c55e', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                → {nextMeta.label}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scan Station */}
        {activeTab === 'scan' && (
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '2rem', maxWidth: 480 }}>
            <h3 style={{ color: '#f9fafb', margin: '0 0 0.5rem', fontWeight: 700 }}>QR Scan Station</h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter a roll ID or scan a QR code to advance its status.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="e.g. TL-A001-003"
                style={{ flex: 1, padding: '0.7rem 1rem', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none' }}
              />
              <button onClick={handleScan} style={{ padding: '0.7rem 1.2rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>Scan</button>
            </div>
            {scanStatus === 'success' && <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>✓ Roll status updated successfully</div>}
            {scanStatus === 'not_found' && <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, color: '#f97316', fontSize: '0.85rem', fontWeight: 600 }}>✗ Roll ID not found — check and try again</div>}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 460 }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#f9fafb', fontWeight: 800 }}>Create New Roll</h2>
            {[
              { key: 'po', label: 'PO Number', placeholder: 'PO-2026-004' },
              { key: 'lot', label: 'Lot ID', placeholder: 'LOT-A004' },
              { key: 'color', label: 'Color', placeholder: 'Navy Blue' },
              { key: 'yards', label: 'Yards', placeholder: '185', type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={createRoll} style={{ flex: 2, padding: '0.7rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Create Roll</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrRoll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setQrRoll(null)}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '2rem', textAlign: 'center', maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Scan to Track Roll</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', marginBottom: '0.2rem', fontFamily: 'monospace' }}>{qrRoll.id}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1.5rem' }}>{qrRoll.po} · {qrRoll.color} · {qrRoll.yards} yds</div>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, display: 'inline-block', marginBottom: '1rem' }}>
              <QRCode value={`${baseUrl}/roll/${qrRoll.id}`} size={180} level="M" />
            </div>
            <div style={{ fontSize: '0.68rem', color: '#374151', fontFamily: 'monospace', marginBottom: '1.5rem', wordBreak: 'break-all' }}>{baseUrl}/roll/{qrRoll.id}</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setQrRoll(null)} style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>Close</button>
              <button onClick={() => router.push(`/roll/${qrRoll.id}`)} style={{ flex: 1, padding: '0.65rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}>View →</button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: #4b5563; } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
