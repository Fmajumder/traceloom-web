'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getRolls, saveRolls, getLots } from '../lib/demoData';
import { getDemoUser } from '../lib/auth';
import type { Roll, Lot } from '../lib/demoData';

// ─── Status progression (matches Roll.status in demoData.ts) ─────────────
const STATUS_ORDER = ['created', 'warehouse', 'truck', 'port', 'delivered'] as const;
type RollStatus = typeof STATUS_ORDER[number];

const STATUS_META: Record<RollStatus, { label: string; bengali: string; color: string; next: RollStatus | null }> = {
  created:   { label: 'Created',       bengali: 'তৈরি',         color: '#6b7280', next: 'warehouse' },
  warehouse: { label: 'In Warehouse',  bengali: 'গুদামঘর',      color: '#a78bfa', next: 'truck'     },
  truck:     { label: 'On Truck',      bengali: 'ট্রাকে লোড',   color: '#60a5fa', next: 'port'      },
  port:      { label: 'At Port',       bengali: 'বন্দরে',        color: '#f59e0b', next: 'delivered' },
  delivered: { label: 'Delivered',     bengali: 'ডেলিভারি',     color: '#22c55e', next: null        },
};

// ─── Scan history entry ───────────────────────────────────────────────────
interface ScanEntry {
  id: string; rollId: string; status: string; time: string; success: boolean; lot: string;
}

function nowStr() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Main component ───────────────────────────────────────────────────────
export default function WorkerPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getDemoUser();
    if (!user) router.push('/login');
  }, [router]);

  const [rolls, setRolls]           = useState<Roll[]>([]);
  const [lots, setLots]             = useState<Lot[]>([]);
  const [scanInput, setScanInput]   = useState('');
  const [scanning, setScanning]     = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; roll?: Roll; message: string } | null>(null);
  const [history, setHistory]       = useState<ScanEntry[]>([]);
  const [bengali, setBengali]       = useState(false);
  const [tab, setTab]               = useState<'scan' | 'lots' | 'history'>('scan');
  const [scanCount, setScanCount]   = useState(0);
  const [shiftStart]                = useState('6:00 AM');
  const inputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRolls(getRolls());
    setLots(getLots());
  }, []);

  // ── Simulate camera scan (picks a random non-delivered roll) ─────────
  function handleCameraScan() {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setScanning(false);
      const eligible = rolls.filter(r => r.status !== 'delivered');
      if (eligible.length === 0) {
        setScanResult({ success: false, message: bengali ? 'কোনো স্ক্যানযোগ্য রোল নেই' : 'No scannable rolls found' });
        return;
      }
      const roll = eligible[Math.floor(Math.random() * eligible.length)];
      processScan(roll.id, rolls);
    }, 1500);
  }

  // ── Advance a roll to its next status ────────────────────────────────
  function processScan(id: string, currentRolls: Roll[]) {
    const trimmed = id.trim().toUpperCase();
    const roll = currentRolls.find(r => r.id === trimmed);

    if (!roll) {
      setScanResult({ success: false, message: bengali ? 'রোল পাওয়া যায়নি: ' + trimmed : 'Roll not found: ' + trimmed });
      addToHistory(trimmed, '—', '—', false);
      return;
    }
    if (roll.status === 'delivered') {
      setScanResult({ success: false, roll, message: bengali ? 'ইতিমধ্যে ডেলিভারি হয়েছে' : 'Already delivered — no action needed' });
      addToHistory(roll.id, roll.status, roll.lot, false);
      return;
    }

    const meta = STATUS_META[roll.status as RollStatus];
    const nextStatus = meta?.next;
    if (!nextStatus) {
      setScanResult({ success: false, roll, message: 'Already at final status' });
      return;
    }

    const updated: Roll[] = currentRolls.map(r =>
      r.id === roll.id
        ? {
            ...r,
            status: nextStatus,
            events: [
              ...r.events,
              {
                status:    nextStatus,
                label:     STATUS_META[nextStatus].label,
                timestamp: new Date().toISOString(),
                location:  'Floor Scan — TraceLoom',
                operator:  'Karim Hassan',
              },
            ],
          }
        : r
    );

    saveRolls(updated);
    setRolls(updated);
    setScanCount(c => c + 1);
    setScanInput('');

    const updatedRoll = updated.find(r => r.id === roll.id)!;
    setScanResult({ success: true, roll: updatedRoll, message: bengali ? 'স্ক্যান সফল হয়েছে ✓' : 'Scan successful ✓' });
    addToHistory(roll.id, nextStatus, roll.lot, true);
  }

  function addToHistory(rollId: string, status: string, lot: string, success: boolean) {
    setHistory(h => [{ id: Date.now().toString(), rollId, status, time: nowStr(), success, lot }, ...h.slice(0, 19)]);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scanInput.trim()) return;
    processScan(scanInput, rolls);
  }

  // Lot progress: match rolls by lot field
  const lotsWithProgress = lots.map(lot => {
    const lotRolls = rolls.filter(r => r.lot === lot.lotId);
    const done = lotRolls.filter(r => r.status === 'delivered').length;
    const pct  = lotRolls.length ? Math.round((done / lotRolls.length) * 100) : 0;
    return { ...lot, rolls: lotRolls, done, pct };
  });

  const pendingCount = rolls.filter(r => r.status !== 'delivered').length;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#070c15',
      color: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
      maxWidth: 440, margin: '0 auto',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        background: 'rgba(7,12,21,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.75rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🧵</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1 }}>TraceLoom</div>
            <div style={{ fontSize: '0.58rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {bengali ? 'ফ্লোর ওয়ার্কার' : 'Floor Worker'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setBengali(b => !b)}
            style={{
              padding: '0.22rem 0.6rem', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
              background: bengali ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${bengali ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: bengali ? '#60a5fa' : '#9ca3af',
            }}
          >
            {bengali ? 'EN' : 'বাং'}
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '0.22rem 0.6rem', borderRadius: 6, fontSize: '0.68rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', cursor: 'pointer' }}>
            ← {bengali ? 'ড্যাশ' : 'Back'}
          </button>
        </div>
      </div>

      {/* ── Shift summary strip ── */}
      <div style={{
        background: 'rgba(34,197,94,0.06)',
        borderBottom: '1px solid rgba(34,197,94,0.15)',
        padding: '0.55rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
          🕐 {bengali ? 'শিফট:' : 'Shift:'} {shiftStart}
        </div>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          {[
            { val: scanCount,     label: bengali ? 'স্ক্যান'  : 'scanned',  color: '#22c55e' },
            { val: pendingCount,  label: bengali ? 'বাকি'     : 'pending',   color: '#f59e0b' },
            { val: rolls.length,  label: bengali ? 'মোট'      : 'total',     color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.57rem', color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {(['scan', 'lots', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.72rem 0', fontSize: '0.77rem', fontWeight: tab === t ? 700 : 400,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? '#22c55e' : '#6b7280',
            borderBottom: `2px solid ${tab === t ? '#22c55e' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            {t === 'scan'    ? (bengali ? '📷 স্ক্যান' : '📷 Scan')    :
             t === 'lots'    ? (bengali ? '📦 লট'      : '📦 Lots')    :
                               (bengali ? '🕐 ইতিহাস'  : '🕐 History')}
          </button>
        ))}
      </div>

      {/* ══════════════════════ SCAN TAB ══════════════════════════════ */}
      {tab === 'scan' && (
        <div style={{ flex: 1, padding: '1.1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Camera viewfinder */}
          <button
            onClick={handleCameraScan}
            disabled={scanning}
            style={{
              width: '100%', aspectRatio: '1 / 1',
              background: scanning ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
              border: `2px dashed ${scanning ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', cursor: scanning ? 'wait' : 'pointer',
              transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 14, left: 14,   borderTop: true,  borderLeft: true,  borderBottom: false, borderRight: false },
              { top: 14, right: 14,  borderTop: true,  borderLeft: false, borderBottom: false, borderRight: true  },
              { bottom: 14, left: 14,  borderTop: false, borderLeft: true,  borderBottom: true,  borderRight: false },
              { bottom: 14, right: 14, borderTop: false, borderLeft: false, borderBottom: true,  borderRight: true  },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: c.top, left: 'left' in c ? c.left : 'auto',
                right: 'right' in c ? c.right : 'auto',
                bottom: 'bottom' in c ? c.bottom : 'auto',
                width: 26, height: 26,
                borderTop:    c.borderTop    ? `3px solid ${scanning ? '#22c55e' : '#374151'}` : 'none',
                borderLeft:   c.borderLeft   ? `3px solid ${scanning ? '#22c55e' : '#374151'}` : 'none',
                borderBottom: c.borderBottom ? `3px solid ${scanning ? '#22c55e' : '#374151'}` : 'none',
                borderRight:  c.borderRight  ? `3px solid ${scanning ? '#22c55e' : '#374151'}` : 'none',
              }} />
            ))}

            {/* Scanning line */}
            {scanning && (
              <div style={{
                position: 'absolute', left: '12%', right: '12%', height: 2,
                background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                animation: 'scanLine 1.1s ease-in-out infinite',
              }} />
            )}

            {scanning ? (
              <>
                <div style={{ fontSize: '2.5rem', animation: 'tlPulse 0.8s ease-in-out infinite' }}>📷</div>
                <div style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 700 }}>
                  {bengali ? 'স্ক্যান করা হচ্ছে...' : 'Scanning...'}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem' }}>📷</div>
                <div style={{ fontSize: '0.95rem', color: '#9ca3af', fontWeight: 600 }}>
                  {bengali ? 'ট্যাপ করুন QR স্ক্যান করতে' : 'Tap to scan QR code'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#374151' }}>
                  {bengali ? 'রোলের QR কোডে ক্যামেরা রাখুন' : 'Point camera at roll QR code'}
                </div>
              </>
            )}
          </button>

          {/* Manual entry */}
          <form onSubmit={handleManualSubmit}>
            <div style={{ fontSize: '0.67rem', color: '#6b7280', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {bengali ? 'ম্যানুয়াল এন্ট্রি' : 'Manual entry'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                value={scanInput}
                onChange={e => setScanInput(e.target.value.toUpperCase())}
                placeholder={bengali ? 'রোল ID লিখুন...' : 'Type roll ID (e.g. TL-A001-003)'}
                style={{
                  flex: 1, padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, color: '#f9fafb', fontSize: '0.95rem',
                  fontFamily: 'system-ui, monospace', letterSpacing: '0.04em', outline: 'none',
                }}
              />
              <button type="submit" style={{
                padding: '0.85rem 1.25rem',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: 12,
                color: '#022c22', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
              }}>✓</button>
            </div>
          </form>

          {/* Scan result */}
          {scanResult && (
            <div style={{
              borderRadius: 16, padding: '1rem 1.1rem',
              background: scanResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${scanResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              animation: 'slideUp 0.2s ease',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{scanResult.success ? '✅' : '❌'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: scanResult.success ? '#22c55e' : '#ef4444', marginBottom: '0.35rem' }}>
                {scanResult.message}
              </div>
              {scanResult.roll && (
                <>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.25rem' }}>
                    {scanResult.roll.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{bengali ? 'স্ট্যাটাস:' : 'Status:'}</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700,
                      color: STATUS_META[scanResult.roll.status]?.color ?? '#9ca3af',
                      background: (STATUS_META[scanResult.roll.status]?.color ?? '#9ca3af') + '18',
                      border: `1px solid ${(STATUS_META[scanResult.roll.status]?.color ?? '#9ca3af')}44`,
                      borderRadius: 99, padding: '0.15rem 0.5rem',
                    }}>
                      {bengali
                        ? STATUS_META[scanResult.roll.status]?.bengali ?? scanResult.roll.status
                        : STATUS_META[scanResult.roll.status]?.label   ?? scanResult.roll.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {bengali ? 'লট:' : 'Lot:'} {scanResult.roll.lot} · PO: {scanResult.roll.po}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick-tap rolls */}
          <div>
            <div style={{ fontSize: '0.65rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem', fontWeight: 600 }}>
              {bengali ? 'দ্রুত ট্যাপ' : 'Quick-tap to scan'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {rolls.filter(r => r.status !== 'delivered').slice(0, 9).map(r => {
                const meta = STATUS_META[r.status];
                return (
                  <button key={r.id}
                    onClick={() => processScan(r.id, rolls)}
                    style={{
                      padding: '0.38rem 0.7rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)',
                      borderTop:    `1px solid rgba(255,255,255,0.1)`,
                      borderRight:  `1px solid rgba(255,255,255,0.1)`,
                      borderBottom: `1px solid rgba(255,255,255,0.1)`,
                      borderLeft:   `3px solid ${meta?.color ?? '#6b7280'}`,
                      color: '#d1d5db', cursor: 'pointer',
                    }}>
                    {r.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ LOTS TAB ══════════════════════════════ */}
      {tab === 'lots' && (
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {bengali ? 'লটের অগ্রগতি' : 'Lot progress'}
          </div>
          {lotsWithProgress.map(lot => (
            <div key={lot.lotId} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '0.9rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{lot.lotId}</div>
                  <div style={{ fontSize: '0.67rem', color: '#6b7280', marginTop: '0.1rem' }}>
                    {lot.poNumber} · {lot.customer}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1, color: lot.pct === 100 ? '#22c55e' : '#f9fafb' }}>
                    {lot.pct}%
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>
                    {lot.done}/{lot.rolls.length} {bengali ? 'রোল' : 'rolls'}
                  </div>
                </div>
              </div>

              <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.55rem' }}>
                <div style={{
                  width: `${lot.pct}%`, height: '100%', borderRadius: 99,
                  background: lot.pct === 100 ? '#22c55e' : lot.pct > 60 ? '#60a5fa' : '#f59e0b',
                  transition: 'width 0.5s',
                }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {lot.rolls.map(r => {
                  const meta = STATUS_META[r.status];
                  return (
                    <button key={r.id}
                      onClick={() => { setTab('scan'); processScan(r.id, rolls); }}
                      title={`${r.id} · ${meta?.label ?? r.status}`}
                      style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: '0.58rem', fontWeight: 700,
                        background: (meta?.color ?? '#6b7280') + '15',
                        border: `1.5px solid ${meta?.color ?? '#6b7280'}55`,
                        color: meta?.color ?? '#6b7280', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {r.id.split('-').pop()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════ HISTORY TAB ══════════════════════════ */}
      {tab === 'history' && (
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.65rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.75rem' }}>
            {bengali ? 'এই শিফটের স্ক্যান ইতিহাস' : "This shift's scan history"}
          </div>

          {history.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#374151', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📋</span>
              <span style={{ fontSize: '0.8rem' }}>{bengali ? 'এখনো কোনো স্ক্যান নেই' : 'No scans yet this shift'}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {history.map(h => (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem',
                  padding: '0.6rem 0.8rem',
                  background: h.success ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${h.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: '0.95rem' }}>{h.success ? '✅' : '❌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{h.rollId}</div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>
                      {h.lot !== '—' ? `${bengali ? 'লট:' : 'Lot:'} ${h.lot} · ` : ''}
                      {h.status !== '—'
                        ? (STATUS_META[h.status as RollStatus]?.label ?? h.status)
                        : (bengali ? 'পাওয়া যায়নি' : 'Not found')}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#4b5563', whiteSpace: 'nowrap' }}>{h.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom CTA (scan tab only) ── */}
      {tab === 'scan' && (
        <div style={{
          padding: '0.8rem 1rem',
          background: 'rgba(7,12,21,0.97)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: '0.5rem',
          position: 'sticky', bottom: 0,
        }}>
          <button
            onClick={handleCameraScan}
            disabled={scanning}
            style={{
              flex: 1, padding: '0.95rem',
              background: scanning ? 'rgba(34,197,94,0.25)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', borderRadius: 14,
              color: '#022c22', fontWeight: 800, fontSize: '0.95rem',
              cursor: scanning ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: scanning ? 'none' : '0 4px 20px rgba(34,197,94,0.3)',
              transition: 'all 0.2s',
            }}
          >
            📷 {scanning
              ? (bengali ? 'স্ক্যান করা হচ্ছে...' : 'Scanning...')
              : (bengali ? 'QR স্ক্যান করুন' : 'Scan QR Code')}
          </button>
          <button
            onClick={() => inputRef.current?.focus()}
            style={{
              padding: '0.95rem 1.1rem', borderRadius: 14,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer',
            }}
            title={bengali ? 'ম্যানুয়াল এন্ট্রি' : 'Manual entry'}
          >⌨️</button>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 12%; }
          50%  { top: 80%; }
          100% { top: 12%; }
        }
        @keyframes tlPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.6; transform:scale(0.93); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input::placeholder { color:#374151; }
        input:focus { border-color:rgba(34,197,94,0.45) !important; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
      `}</style>
    </main>
  );
}
