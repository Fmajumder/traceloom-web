'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';
import { getLots, saveLots, seedDemoData, Lot } from '../lib/demoData';

const BLANK: Omit<Lot, 'createdAt' | 'mill'> = {
  poNumber: '', lotId: '', customer: '', style: '', color: '', rollCount: 6, notes: '',
};

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({ ...BLANK });
  const [saved, setSaved] = useState<Lot | null>(null);
  const [existingLots, setExistingLots] = useState<Lot[]>([]);

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    seedDemoData();
    setExistingLots(getLots());
  }, [router]);

  function handleSave() {
    if (!form.poNumber || !form.lotId || !form.customer || !form.style || !form.color) return;
    const newLot: Lot = { ...form, createdAt: new Date().toISOString(), mill: 'Apex Textiles Ltd.' };
    const updated = [newLot, ...existingLots];
    saveLots(updated);
    setExistingLots(updated);
    setSaved(newLot);
    setForm({ ...BLANK });
  }

  const rollNums = Array.from({ length: Math.min(form.rollCount, 12) }, (_, i) => i + 1);

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Create PO / Lot</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.88rem' }}>Define a purchase order and assign rolls — QR codes will be generated for each roll.</p>
        </div>

        {/* Success banner */}
        {saved && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem' }}>✓ Lot saved successfully</div>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {saved.poNumber} · {saved.lotId} · {saved.rollCount} rolls · {saved.customer}
              </div>
            </div>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '0.45rem 0.9rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, color: '#22c55e', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
              → View Dashboard
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* Form */}
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#f9fafb', fontWeight: 700, fontSize: '1.1rem' }}>Order Details</h2>

            {[
              { key: 'poNumber', label: 'PO Number', placeholder: 'PO-2026-004' },
              { key: 'lotId', label: 'Lot ID', placeholder: 'LOT-A004' },
              { key: 'customer', label: 'Customer / Brand', placeholder: 'H&M Sourcing' },
              { key: 'style', label: 'Style / Fabric', placeholder: 'Classic Cotton Twill' },
              { key: 'color', label: 'Color', placeholder: 'Navy Blue' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form] as string}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Roll Count: <span style={{ color: '#22c55e' }}>{form.rollCount}</span>
              </label>
              <input
                type="range" min={1} max={30}
                value={form.rollCount}
                onChange={e => setForm({ ...form, rollCount: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#22c55e' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4b5563', marginTop: '0.2rem' }}>
                <span>1</span><span>30</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Rush order, air freight required..."
                rows={3}
                style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!form.poNumber || !form.lotId || !form.customer || !form.style || !form.color}
              style={{
                width: '100%', padding: '0.8rem',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#000', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                opacity: (!form.poNumber || !form.lotId || !form.customer || !form.style || !form.color) ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              Save Lot & Generate Roll IDs
            </button>
          </div>

          {/* Preview */}
          <div>
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '2rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 1.25rem', color: '#f9fafb', fontWeight: 700, fontSize: '1.1rem' }}>Live Preview</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'PO', value: form.poNumber || '—' },
                  { label: 'Lot', value: form.lotId || '—' },
                  { label: 'Customer', value: form.customer || '—' },
                  { label: 'Style', value: form.style || '—' },
                  { label: 'Color', value: form.color || '—' },
                  { label: 'Rolls', value: form.rollCount },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: '0.82rem', color: '#e5e7eb', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {form.notes && (
                <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, fontSize: '0.78rem', color: '#d97706', marginBottom: '1.25rem' }}>
                  📝 {form.notes}
                </div>
              )}

              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                Roll IDs Preview
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {rollNums.map(n => {
                  const lotShort = (form.lotId || 'AXXX').replace('LOT-', '');
                  const id = `TL-${lotShort}-${String(n).padStart(3, '0')}`;
                  return (
                    <span key={n} style={{
                      fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600,
                      padding: '0.2rem 0.5rem', borderRadius: 5,
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      color: '#38bdf8',
                    }}>{id}</span>
                  );
                })}
                {form.rollCount > 12 && (
                  <span style={{ fontSize: '0.72rem', color: '#4b5563', alignSelf: 'center' }}>+{form.rollCount - 12} more</span>
                )}
              </div>
            </div>

            {/* Existing lots */}
            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#f9fafb', fontWeight: 700, fontSize: '0.95rem' }}>Recent Lots ({existingLots.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {existingLots.slice(0, 4).map((lot, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e5e7eb' }}>{lot.poNumber} · {lot.lotId}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{lot.customer} · {lot.rollCount} rolls</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>{new Date(lot.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {existingLots.length === 0 && <div style={{ fontSize: '0.83rem', color: '#4b5563' }}>No lots saved yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`input::placeholder, textarea::placeholder { color: #4b5563; } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
