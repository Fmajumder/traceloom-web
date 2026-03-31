'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';
import { getLots, getRolls, seedDemoData, Lot, Roll } from '../lib/demoData';

export default function ScanPage() {
  const router = useRouter();
  const [lots, setLots] = useState<Lot[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    seedDemoData();
    setLots(getLots());
    setRolls(getRolls());
  }, [router]);

  const filtered = lots.filter(l =>
    l.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    l.lotId.toLowerCase().includes(search.toLowerCase()) ||
    l.customer.toLowerCase().includes(search.toLowerCase())
  );

  function getLotRolls(lotId: string): Roll[] {
    return rolls.filter(r => r.lot === lotId);
  }

  const statusColor: Record<string, string> = {
    created: '#9ca3af', warehouse: '#38bdf8', truck: '#facc15', port: '#f97316', delivered: '#22c55e',
  };
  const statusIcon: Record<string, string> = {
    created: '📋', warehouse: '🏬', truck: '🚛', port: '⚓', delivered: '✅',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Scan Station</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.88rem' }}>Select a lot to view its rolls and scan QR codes.</p>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by PO, Lot, or Customer..."
          style={{
            width: '100%', padding: '0.75rem 1rem', marginBottom: '1.5rem',
            background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#f9fafb', fontSize: '0.9rem', outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Lot Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
              <div style={{ marginBottom: '1rem' }}>No lots found.</div>
              <button onClick={() => router.push('/create')} style={{ padding: '0.6rem 1.2rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Create a Lot →
              </button>
            </div>
          )}

          {filtered.map((lot, i) => {
            const lotRolls = getLotRolls(lot.lotId);
            const deliveredCount = lotRolls.filter(r => r.status === 'delivered').length;
            const pct = lotRolls.length > 0 ? Math.round((deliveredCount / lotRolls.length) * 100) : 0;

            return (
              <div key={i} style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '1.5rem',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>{lot.poNumber}</span>
                      <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>·</span>
                      <span style={{ fontFamily: 'monospace', color: '#9ca3af', fontSize: '0.82rem' }}>{lot.lotId}</span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '1rem', marginBottom: '0.2rem' }}>{lot.style}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#6b7280', flexWrap: 'wrap' }}>
                      <span>🛍️ {lot.customer}</span>
                      <span>🎨 {lot.color}</span>
                      <span>📅 {new Date(lot.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f9fafb' }}>{lotRolls.length} <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}>rolls</span></div>
                    <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>{deliveredCount} delivered ({pct}%)</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>

                {/* Roll pills */}
                {lotRolls.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    {lotRolls.map(r => (
                      <div
                        key={r.id}
                        onClick={() => router.push(`/roll/${r.id}`)}
                        title={`${r.id} – ${r.status}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          background: statusColor[r.status] + '15',
                          border: `1px solid ${statusColor[r.status]}33`,
                          borderRadius: 6, cursor: 'pointer',
                          fontSize: '0.7rem', fontFamily: 'monospace', color: statusColor[r.status],
                          fontWeight: 600, transition: 'opacity 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.7'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                      >
                        {statusIcon[r.status]} {r.id}
                      </div>
                    ))}
                  </div>
                )}

                {lot.notes && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 7, fontSize: '0.78rem', color: '#d97706', marginBottom: '1rem' }}>
                    📝 {lot.notes}
                  </div>
                )}

                <button
                  onClick={() => router.push('/dashboard')}
                  style={{ padding: '0.5rem 1rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  → Manage in Dashboard
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`input::placeholder { color: #4b5563; } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
