'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';

type Severity = 'critical' | 'warning' | 'info' | 'success';
type AlertCategory = 'shipment' | 'emissions' | 'compliance' | 'quality' | 'finance';

interface Alert {
  id: string;
  severity: Severity;
  category: AlertCategory;
  title: string;
  message: string;
  mill: string;
  po?: string;
  rollId?: string;
  timestamp: Date;
  resolved: boolean;
  isNew?: boolean;
}

const SEV_META: Record<Severity, { color: string; bg: string; border: string; icon: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  icon: '🚨', label: 'Critical' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '⚠️', label: 'Warning'  },
  info:     { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)', icon: 'ℹ️', label: 'Info'     },
  success:  { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  icon: '✅', label: 'Success'  },
};

const CAT_META: Record<AlertCategory, { icon: string; label: string }> = {
  shipment:   { icon: '🚢', label: 'Shipment'   },
  emissions:  { icon: '🌿', label: 'Emissions'  },
  compliance: { icon: '📋', label: 'Compliance' },
  quality:    { icon: '🔍', label: 'Quality'    },
  finance:    { icon: '💰', label: 'Finance'    },
};

function makeAlerts(): Alert[] {
  const now = new Date();
  const ago = (mins: number) => new Date(now.getTime() - mins * 60 * 1000);

  return [
    {
      id: 'a1', severity: 'critical', category: 'shipment',
      title: 'Roll missed port checkpoint',
      message: 'TL-A001-003 was expected at Chittagong Port by 14:00 UTC. No scan recorded in 52 hours. Shipment may be delayed.',
      mill: 'Apex Textiles Ltd.', po: 'PO-2026-001', rollId: 'TL-A001-003',
      timestamp: ago(8), resolved: false,
    },
    {
      id: 'a2', severity: 'critical', category: 'quality',
      title: 'Defect rate above threshold — Sunrise Fabrics',
      message: 'Defect rate reached 5.2% this quarter, exceeding the 3% acceptable threshold. Quality audit recommended before next PO allocation.',
      mill: 'Sunrise Fabrics',
      timestamp: ago(22), resolved: false,
    },
    {
      id: 'a3', severity: 'critical', category: 'compliance',
      title: 'OEKO-TEX certification expired',
      message: 'Sunrise Fabrics OEKO-TEX Standard 100 certificate expired 14 days ago. Rolls from this mill cannot be sold in EU markets until renewed.',
      mill: 'Sunrise Fabrics',
      timestamp: ago(60), resolved: false,
    },
    {
      id: 'a4', severity: 'warning', category: 'shipment',
      title: 'PO-2026-001 running 3 days behind schedule',
      message: '3 of 5 rolls still in transit. Scheduled delivery to H&M DC Rotterdam was March 24. ETA now March 27.',
      mill: 'Apex Textiles Ltd.', po: 'PO-2026-001',
      timestamp: ago(35), resolved: false,
    },
    {
      id: 'a5', severity: 'warning', category: 'emissions',
      title: 'Air freight detected on sea freight PO',
      message: 'TL-A001-003 and TL-A001-004 flagged as air freight on PO-2026-001. This adds 1.86t CO₂e vs sea equivalent. Approval required.',
      mill: 'Apex Textiles Ltd.', po: 'PO-2026-001',
      timestamp: ago(90), resolved: false,
    },
    {
      id: 'a6', severity: 'warning', category: 'shipment',
      title: 'Blue River Mills on-time rate dropping',
      message: 'On-time delivery at 78% this quarter, down from 86% last quarter. 3 open POs at risk of delay. Review logistics partner.',
      mill: 'Blue River Mills',
      timestamp: ago(180), resolved: false,
    },
    {
      id: 'a7', severity: 'warning', category: 'compliance',
      title: 'GOTS certification renewal due in 30 days',
      message: 'Apex Textiles GOTS certification expires April 28, 2026. Initiate renewal with Control Union to avoid supply chain disruption.',
      mill: 'Apex Textiles Ltd.',
      timestamp: ago(240), resolved: false,
    },
    {
      id: 'a8', severity: 'info', category: 'shipment',
      title: 'Scan response time improving — Apex Textiles',
      message: 'Average scan response time dropped from 4.1hrs to 2.3hrs this quarter. QR adoption on the floor is up 68%.',
      mill: 'Apex Textiles Ltd.',
      timestamp: ago(300), resolved: false,
    },
    {
      id: 'a9', severity: 'info', category: 'emissions',
      title: 'Carbon intensity 21% below industry average',
      message: 'Apex Textiles averaging 1.42 kg CO₂/yard vs industry benchmark of 1.80 kg CO₂/yard. Eligible for H&M Scope 3 Green Supplier badge.',
      mill: 'Apex Textiles Ltd.',
      timestamp: ago(400), resolved: false,
    },
    {
      id: 'a10', severity: 'info', category: 'finance',
      title: 'Freight cost savings opportunity identified',
      message: 'Switching 2 air freight rolls to sea on PO-2026-001 saves an estimated $2,400 in freight costs and 1.86t CO₂e.',
      mill: 'Apex Textiles Ltd.', po: 'PO-2026-001',
      timestamp: ago(500), resolved: false,
    },
    {
      id: 'a11', severity: 'success', category: 'shipment',
      title: 'PO-2026-001 rolls TL-A001-001 & TL-A001-002 delivered',
      message: '2 rolls delivered to H&M DC Rotterdam. Signed off by H&M Receiving at 09:05 UTC. Full audit trail available.',
      mill: 'Apex Textiles Ltd.', po: 'PO-2026-001',
      timestamp: ago(720), resolved: false,
    },
    {
      id: 'a12', severity: 'success', category: 'compliance',
      title: 'ISO 9001 audit passed — Apex Textiles',
      message: 'Apex Textiles passed annual ISO 9001 audit with zero non-conformances. Certificate valid through March 2027.',
      mill: 'Apex Textiles Ltd.',
      timestamp: ago(1440), resolved: false,
    },
  ];
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [catFilter, setCatFilter] = useState<'all' | AlertCategory>('all');
  const [millFilter, setMillFilter] = useState('all');
  const [tick, setTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [newAlertFlash, setNewAlertFlash] = useState(false);

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    setAlerts(makeAlerts());
  }, [router]);

  // Live clock tick every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Simulate a new alert arriving every 45s
  useEffect(() => {
    const t = setInterval(() => {
      setAlerts(prev => {
        const simulatedNew: Alert = {
          id: `live-${Date.now()}`,
          severity: 'warning',
          category: 'shipment',
          title: 'Roll scan overdue — live update',
          message: 'TL-A001-004 has been on truck for 28 hours without a port scan. Expected at Chittagong by now.',
          mill: 'Apex Textiles Ltd.', po: 'PO-2026-001', rollId: 'TL-A001-004',
          timestamp: new Date(),
          resolved: false,
          isNew: true,
        };
        return [simulatedNew, ...prev];
      });
      setLastRefresh(new Date());
      setNewAlertFlash(true);
      setTimeout(() => setNewAlertFlash(false), 3000);
    }, 45000);
    return () => clearInterval(t);
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }, []);

  const mills = ['all', ...Array.from(new Set(alerts.map(a => a.mill)))];

  const filtered = alerts.filter(a => {
    if (a.resolved) return false;
    if (filter !== 'all' && a.severity !== filter) return false;
    if (catFilter !== 'all' && a.category !== catFilter) return false;
    if (millFilter !== 'all' && a.mill !== millFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter(a => !a.resolved && a.severity === 'critical').length,
    warning:  alerts.filter(a => !a.resolved && a.severity === 'warning').length,
    info:     alerts.filter(a => !a.resolved && a.severity === 'info').length,
    success:  alerts.filter(a => !a.resolved && a.severity === 'success').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🔔</div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Live Alerts Feed</h1>
              {/* LIVE badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                  boxShadow: '0 0 6px #ef4444',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em' }}>LIVE</span>
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
              Last updated: {timeAgo(lastRefresh)} · Auto-refreshing every 30s
            </p>
          </div>

          {/* Flash notification */}
          {newAlertFlash && (
            <div style={{
              padding: '0.6rem 1rem',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 9,
              fontSize: '0.8rem',
              color: '#f59e0b',
              fontWeight: 600,
              animation: 'slideIn 0.3s ease',
            }}>
              ⚡ New alert received
            </div>
          )}
        </div>

        {/* Summary stat chips */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(['all', 'critical', 'warning', 'info', 'success'] as const).map(sev => {
            const count = sev === 'all' ? alerts.filter(a => !a.resolved).length : counts[sev] ?? 0;
            const meta = sev === 'all'
              ? { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', icon: '📬', label: 'All' }
              : SEV_META[sev];
            const active = filter === sev;
            return (
              <button key={sev} onClick={() => setFilter(sev)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8, cursor: 'pointer',
                color: active ? meta.color : '#6b7280',
                fontSize: '0.8rem', fontWeight: active ? 700 : 400,
                transition: 'all 0.15s',
              }}>
                <span>{meta.icon}</span>
                <span>{sev === 'all' ? 'All' : meta.label}</span>
                <span style={{
                  minWidth: 20, height: 20, borderRadius: 99,
                  background: active ? meta.color + '33' : 'rgba(255,255,255,0.05)',
                  color: active ? meta.color : '#4b5563',
                  fontSize: '0.68rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {/* Category filter */}
          {(['all', 'shipment', 'emissions', 'compliance', 'quality', 'finance'] as const).map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{
              padding: '0.3rem 0.65rem',
              background: catFilter === cat ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${catFilter === cat ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6, cursor: 'pointer',
              color: catFilter === cat ? '#38bdf8' : '#6b7280',
              fontSize: '0.73rem', fontWeight: catFilter === cat ? 600 : 400,
            }}>
              {cat === 'all' ? '🗂 All types' : `${CAT_META[cat].icon} ${CAT_META[cat].label}`}
            </button>
          ))}

          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0.25rem' }} />

          {/* Mill filter */}
          {mills.map(m => (
            <button key={m} onClick={() => setMillFilter(m)} style={{
              padding: '0.3rem 0.65rem',
              background: millFilter === m ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${millFilter === m ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6, cursor: 'pointer',
              color: millFilter === m ? '#22c55e' : '#6b7280',
              fontSize: '0.73rem', fontWeight: millFilter === m ? 600 : 400,
            }}>
              {m === 'all' ? '🏭 All mills' : m.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>No alerts match your filters</div>
              <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '0.4rem' }}>All clear — or try adjusting the filters above</div>
            </div>
          )}

          {filtered.map((alert, i) => {
            const meta = SEV_META[alert.severity];
            const cat = CAT_META[alert.category];
            return (
              <div
                key={alert.id}
                style={{
                  background: alert.isNew ? meta.bg : '#111827',
                  border: `1px solid ${alert.isNew ? meta.border : alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 13,
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  animation: alert.isNew ? 'slideIn 0.35s ease' : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = meta.border}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}
              >
                {/* Left severity bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.color, borderRadius: '13px 0 0 13px' }} />

                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {alert.isNew && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '0.1rem 0.45rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>NEW</span>
                      )}
                      <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem' }}>{alert.title}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(alert.timestamp)}</span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 0.75rem', lineHeight: 1.55 }}>{alert.message}</p>

                  {/* Tags row */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 99, padding: '0.12rem 0.5rem' }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6b7280', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 99, padding: '0.12rem 0.5rem' }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#4b5563', padding: '0.12rem 0' }}>🏭 {alert.mill}</span>
                    {alert.po && (
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#38bdf8' }}>{alert.po}</span>
                    )}
                    {alert.rollId && (
                      <button
                        onClick={() => router.push(`/roll/${alert.rollId}`)}
                        style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        {alert.rollId} →
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolve button */}
                <button
                  onClick={() => resolveAlert(alert.id)}
                  title="Mark as resolved"
                  style={{
                    flexShrink: 0,
                    width: 30, height: 30,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                    color: '#4b5563',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#22c55e';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#4b5563';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >✓</button>
              </div>
            );
          })}
        </div>

        {/* Resolved section */}
        {alerts.some(a => a.resolved) && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
              ✓ Resolved ({alerts.filter(a => a.resolved).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alerts.filter(a => a.resolved).map(alert => (
                <div key={alert.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#4b5563', textDecoration: 'line-through' }}>{alert.title}</span>
                  <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600 }}>✓ Resolved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}
