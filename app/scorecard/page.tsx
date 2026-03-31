'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { getDemoUser } from '../lib/auth';

interface MillMetric {
  label: string;
  value: number;
  unit: string;
  benchmark: number;
  higherIsBetter: boolean;
  weight: number; // scoring weight
}

interface Mill {
  name: string;
  country: string;
  flag: string;
  city: string;
  since: string;
  activePos: number;
  totalRolls: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  certifications: string[];
  metrics: MillMetric[];
  alerts: { type: 'warning' | 'critical' | 'info'; message: string }[];
}

const MILLS: Mill[] = [
  {
    name: 'Apex Textiles Ltd.',
    country: 'Bangladesh',
    flag: '🇧🇩',
    city: 'Dhaka',
    since: 'Jan 2025',
    activePos: 3,
    totalRolls: 10,
    trend: 'up',
    trendValue: '+4pts this quarter',
    certifications: ['OEKO-TEX 100', 'GOTS', 'BCI', 'ISO 9001'],
    alerts: [
      { type: 'info', message: '2 rolls on air freight — consider switching to sea for Q2' },
    ],
    metrics: [
      { label: 'On-Time Delivery', value: 94, unit: '%', benchmark: 85, higherIsBetter: true, weight: 25 },
      { label: 'Shipment Accuracy', value: 98, unit: '%', benchmark: 90, higherIsBetter: true, weight: 20 },
      { label: 'Carbon Efficiency', value: 1.42, unit: 'kg CO₂/yd', benchmark: 1.80, higherIsBetter: false, weight: 20 },
      { label: 'Defect Rate', value: 1.2, unit: '%', benchmark: 3.0, higherIsBetter: false, weight: 15 },
      { label: 'Scan Response Time', value: 2.3, unit: 'hrs', benchmark: 6.0, higherIsBetter: false, weight: 10 },
      { label: 'Compliance Score', value: 96, unit: '%', benchmark: 80, higherIsBetter: true, weight: 10 },
    ],
  },
  {
    name: 'Blue River Mills',
    country: 'Vietnam',
    flag: '🇻🇳',
    city: 'Ho Chi Minh City',
    since: 'Mar 2025',
    activePos: 5,
    totalRolls: 18,
    trend: 'stable',
    trendValue: '±0pts this quarter',
    certifications: ['OEKO-TEX 100', 'ISO 9001'],
    alerts: [
      { type: 'warning', message: 'On-time delivery dropped 8% vs last quarter' },
      { type: 'warning', message: 'Scan response time above 6hr benchmark' },
    ],
    metrics: [
      { label: 'On-Time Delivery', value: 78, unit: '%', benchmark: 85, higherIsBetter: true, weight: 25 },
      { label: 'Shipment Accuracy', value: 89, unit: '%', benchmark: 90, higherIsBetter: true, weight: 20 },
      { label: 'Carbon Efficiency', value: 2.10, unit: 'kg CO₂/yd', benchmark: 1.80, higherIsBetter: false, weight: 20 },
      { label: 'Defect Rate', value: 3.8, unit: '%', benchmark: 3.0, higherIsBetter: false, weight: 15 },
      { label: 'Scan Response Time', value: 6.1, unit: 'hrs', benchmark: 6.0, higherIsBetter: false, weight: 10 },
      { label: 'Compliance Score', value: 82, unit: '%', benchmark: 80, higherIsBetter: true, weight: 10 },
    ],
  },
  {
    name: 'Sunrise Fabrics',
    country: 'India',
    flag: '🇮🇳',
    city: 'Surat',
    since: 'Jun 2025',
    activePos: 2,
    totalRolls: 6,
    trend: 'down',
    trendValue: '−7pts this quarter',
    certifications: ['ISO 9001'],
    alerts: [
      { type: 'critical', message: 'On-time delivery at 62% — below acceptable threshold' },
      { type: 'critical', message: 'Defect rate 5.2% — quality audit recommended' },
      { type: 'warning', message: 'Only 1 certification — OEKO-TEX renewal overdue' },
    ],
    metrics: [
      { label: 'On-Time Delivery', value: 62, unit: '%', benchmark: 85, higherIsBetter: true, weight: 25 },
      { label: 'Shipment Accuracy', value: 91, unit: '%', benchmark: 90, higherIsBetter: true, weight: 20 },
      { label: 'Carbon Efficiency', value: 2.80, unit: 'kg CO₂/yd', benchmark: 1.80, higherIsBetter: false, weight: 20 },
      { label: 'Defect Rate', value: 5.2, unit: '%', benchmark: 3.0, higherIsBetter: false, weight: 15 },
      { label: 'Scan Response Time', value: 12.4, unit: 'hrs', benchmark: 6.0, higherIsBetter: false, weight: 10 },
      { label: 'Compliance Score', value: 74, unit: '%', benchmark: 80, higherIsBetter: true, weight: 10 },
    ],
  },
];

function scoreMetric(m: MillMetric): number {
  if (m.higherIsBetter) {
    return Math.min(100, Math.round((m.value / m.benchmark) * 85));
  } else {
    const ratio = m.benchmark / m.value;
    return Math.min(100, Math.round(ratio * 85));
  }
}

function calcOverallScore(mill: Mill): number {
  const total = mill.metrics.reduce((acc, m) => acc + scoreMetric(m) * m.weight, 0);
  const totalWeight = mill.metrics.reduce((acc, m) => acc + m.weight, 0);
  return Math.round(total / totalWeight);
}

function metricStatus(m: MillMetric): 'good' | 'warn' | 'bad' {
  const score = scoreMetric(m);
  if (score >= 85) return 'good';
  if (score >= 65) return 'warn';
  return 'bad';
}

const STATUS_COLOR = { good: '#22c55e', warn: '#f59e0b', bad: '#ef4444' };
const STATUS_BG    = { good: 'rgba(34,197,94,0.1)', warn: 'rgba(245,158,11,0.1)', bad: 'rgba(239,68,68,0.1)' };
const ALERT_COLOR  = { info: '#38bdf8', warning: '#f59e0b', critical: '#ef4444' };
const ALERT_BG     = { info: 'rgba(56,189,248,0.08)', warning: 'rgba(245,158,11,0.08)', critical: 'rgba(239,68,68,0.08)' };
const ALERT_ICON   = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };
const MEDALS       = ['🥇', '🥈', '🥉'];
const TREND_ICON   = { up: '↑', down: '↓', stable: '→' };
const TREND_COLOR  = { up: '#22c55e', down: '#ef4444', stable: '#9ca3af' };

// Circular score SVG
function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={size * 0.22} fontWeight="800">{score}</text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" fill="#6b7280" fontSize={size * 0.11}>/ 100</text>
    </svg>
  );
}

export default function ScorecardPage() {
  const router = useRouter();
  const [selectedMill, setSelectedMill] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const user = getDemoUser();
    if (!user) { router.push('/login'); return; }
    // Trigger animation after mount
    setTimeout(() => setAnimating(true), 100);
  }, [router]);

  const sorted = [...MILLS].sort((a, b) => calcOverallScore(b) - calcOverallScore(a));
  const selected = selectedMill ? MILLS.find(m => m.name === selectedMill) : null;
  const networkAvg = Math.round(sorted.reduce((a, m) => a + calcOverallScore(m), 0) / sorted.length);

  return (
    <div style={{ minHeight: '100vh', background: '#070c15', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏆</div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>Supplier Scorecard</h1>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>
              Objective performance ranking across {sorted.length} mills · Q1 2026 · Updated live
            </p>
          </div>
          {/* Network average badge */}
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.85rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Network Average</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{networkAvg}<span style={{ fontSize: '0.9rem', color: '#6b7280' }}>/100</span></div>
          </div>
        </div>

        {/* Mill Ranking Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {sorted.map((mill, rank) => {
            const score = calcOverallScore(mill);
            const scoreColor = score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
            const isSelected = selectedMill === mill.name;
            const criticalAlerts = mill.alerts.filter(a => a.type === 'critical').length;

            return (
              <div
                key={mill.name}
                onClick={() => setSelectedMill(isSelected ? null : mill.name)}
                style={{
                  background: isSelected ? `${scoreColor}0a` : '#111827',
                  border: `1px solid ${isSelected ? scoreColor + '44' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                {/* Rank medal */}
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: '1.4rem' }}>{MEDALS[rank]}</div>

                {/* Mill info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <ScoreRing score={score} size={80} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#f9fafb', fontSize: '0.95rem', marginBottom: '0.2rem', paddingRight: '2rem' }}>{mill.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.35rem' }}>{mill.flag} {mill.city}, {mill.country}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: TREND_COLOR[mill.trend],
                      background: TREND_COLOR[mill.trend] + '15',
                      border: `1px solid ${TREND_COLOR[mill.trend]}33`,
                      borderRadius: 99, padding: '0.15rem 0.5rem',
                    }}>
                      {TREND_ICON[mill.trend]} {mill.trendValue}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Active POs', value: mill.activePos },
                    { label: 'Total Rolls', value: mill.totalRolls },
                    { label: 'Since', value: mill.since },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb' }}>{s.value}</div>
                      <div style={{ fontSize: '0.62rem', color: '#4b5563' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Metric mini bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {mill.metrics.slice(0, 4).map(m => {
                    const status = metricStatus(m);
                    const barWidth = Math.min(scoreMetric(m), 100);
                    return (
                      <div key={m.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.67rem', color: '#6b7280' }}>{m.label}</span>
                          <span style={{ fontSize: '0.67rem', fontWeight: 700, color: STATUS_COLOR[status] }}>{m.value}{m.unit}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: animating ? `${barWidth}%` : '0%', background: STATUS_COLOR[status], borderRadius: 99, transition: `width 0.8s ease ${rank * 0.15}s` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alert count */}
                {mill.alerts.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {criticalAlerts > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 99, padding: '0.15rem 0.5rem' }}>
                        🚨 {criticalAlerts} critical
                      </span>
                    )}
                    {mill.alerts.filter(a => a.type === 'warning').length > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '0.15rem 0.5rem' }}>
                        ⚠️ {mill.alerts.filter(a => a.type === 'warning').length} warnings
                      </span>
                    )}
                    {mill.alerts.filter(a => a.type === 'info').length > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 99, padding: '0.15rem 0.5rem' }}>
                        ℹ️ {mill.alerts.filter(a => a.type === 'info').length} tips
                      </span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: '#4b5563', textAlign: 'center' }}>
                  {isSelected ? '▲ Click to collapse' : '▼ Click for full breakdown'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Detail Panel */}
        {selected && (
          <div style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#f9fafb', fontWeight: 800, fontSize: '1.2rem' }}>{selected.name} — Full Breakdown</h2>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.3rem' }}>{selected.flag} {selected.city}, {selected.country} · Partner since {selected.since}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selected.certifications.map(cert => (
                  <span key={cert} style={{ fontSize: '0.7rem', fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '0.2rem 0.55rem' }}>
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Full metrics comparison */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Metric Breakdown vs Benchmark</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {selected.metrics.map(m => {
                  const status = metricStatus(m);
                  const score = scoreMetric(m);
                  const isBetter = m.higherIsBetter
                    ? m.value >= m.benchmark
                    : m.value <= m.benchmark;
                  return (
                    <div key={m.label} style={{ background: STATUS_BG[status], border: `1px solid ${STATUS_COLOR[status]}22`, borderRadius: 12, padding: '1.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb', marginBottom: '0.15rem' }}>{m.label}</div>
                          <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Benchmark: {m.benchmark}{m.unit}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: STATUS_COLOR[status] }}>{m.value}<span style={{ fontSize: '0.7rem' }}>{m.unit}</span></div>
                          <div style={{ fontSize: '0.65rem', color: isBetter ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                            {isBetter ? '✓ Above benchmark' : '✗ Below benchmark'}
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: STATUS_COLOR[status], borderRadius: 99, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${STATUS_COLOR[status]}44` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>Score</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: STATUS_COLOR[status] }}>{score}/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            {selected.alerts.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Active Alerts & Recommendations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selected.alerts.map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: ALERT_BG[alert.type], border: `1px solid ${ALERT_COLOR[alert.type]}33`, borderRadius: 9 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ALERT_ICON[alert.type]}</span>
                      <span style={{ fontSize: '0.82rem', color: ALERT_COLOR[alert.type], fontWeight: 600 }}>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full side-by-side comparison table */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.95rem' }}>Side-by-Side Comparison</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>All metrics across all supplier mills · Green = above benchmark · Red = below</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metric</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af' }}>Benchmark</th>
                  {sorted.map(m => (
                    <th key={m.name} style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#e5e7eb' }}>
                      {MEDALS[sorted.indexOf(m)]} {m.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MILLS[0].metrics.map((metric, mi) => (
                  <tr key={metric.label} style={{ borderBottom: mi < MILLS[0].metrics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.8rem', color: '#e5e7eb', fontWeight: 600 }}>{metric.label}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>{metric.benchmark}{metric.unit}</td>
                    {sorted.map(mill => {
                      const m = mill.metrics[mi];
                      const status = metricStatus(m);
                      return (
                        <td key={mill.name} style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: STATUS_COLOR[status], background: STATUS_BG[status], borderRadius: 6, padding: '0.2rem 0.5rem' }}>
                            {m.value}{m.unit}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Overall score row */}
                <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: '#f9fafb', fontWeight: 800 }}>Overall Score</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>—</td>
                  {sorted.map((mill, rank) => {
                    const score = calcOverallScore(mill);
                    const color = score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
                    return (
                      <td key={mill.name} style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>{MEDALS[rank]}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{score}</span>
                          <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>/ 100</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom insight */}
        <div style={{ marginTop: '1.25rem', padding: '1.1rem 1.5rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem' }}>TraceLoom Insight</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.55 }}>
              Shifting 20% of volume from <strong style={{ color: '#ef4444' }}>Sunrise Fabrics</strong> to <strong style={{ color: '#22c55e' }}>Apex Textiles</strong> would improve your network's on-time delivery rate from <strong style={{ color: '#f9fafb' }}>{networkAvg}%</strong> to an estimated <strong style={{ color: '#22c55e' }}>87%</strong> — and reduce your Scope 3 carbon exposure by 31%.
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
