'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/* ─── Animated counter hook ─── */
function useCounter(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

/* ─── Intersection observer hook ─── */
function useVisible(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Stat card with animated counter ─── */
function StatCard({ value, suffix, label, color }: { value: number; suffix: string; label: string; color: string }) {
  const { ref, visible } = useVisible(0.3);
  const count = useCounter(value, 1600, visible);
  return (
    <div ref={ref} style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '1.1rem 1.4rem',
      minWidth: 140,
      flex: '1 1 140px',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

/* ─── Feature pillar card ─── */
function FeatureCard({
  icon, title, description, tag, tagColor, tagBg, href, cta, bullets,
}: {
  icon: string; title: string; description: string;
  tag: string; tagColor: string; tagBg: string;
  href: string; cta: string;
  bullets: string[];
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.2s',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: tagColor, background: tagBg,
          border: `1px solid ${tagColor}44`, borderRadius: 99, padding: '0.2rem 0.6rem',
        }}>{tag}</span>
      </div>
      <div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.3rem' }}>{title}</div>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>{description}</div>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {bullets.map(b => (
          <li key={b} style={{ fontSize: '0.78rem', color: '#d1d5db', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <span style={{ color: tagColor, marginTop: '0.05rem', flexShrink: 0 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <Link href={href} style={{
        marginTop: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: tagColor,
        textDecoration: 'none',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {cta} <span style={{ fontSize: '0.9rem' }}>→</span>
      </Link>
    </div>
  );
}

/* ─── Timeline step ─── */
function TimelineStep({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e22, #22c55e44)',
        border: '1px solid #22c55e66',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', flexShrink: 0,
      }}>{num}</div>
      <div style={{ paddingTop: '0.3rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f9fafb', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}

/* ─── Bar row (ARR chart) ─── */
function BarRow({ year, value, percent, animate }: { year: string; value: string; percent: number; animate: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setW(percent), 80);
      return () => clearTimeout(t);
    }
  }, [animate, percent]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
      <div style={{ minWidth: 80 }}>
        <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{year}</div>
        <div style={{ fontWeight: 700, color: '#f9fafb' }}>{value}</div>
      </div>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{
          width: `${w}%`, height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #22c55e, #16a34a)',
          transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
    </div>
  );
}

/* ─── Alert preview row ─── */
function AlertRow({ sev, msg, mill, time }: { sev: 'critical' | 'warning' | 'info'; msg: string; mill: string; time: string }) {
  const colors = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const icons = { critical: '🔴', warning: '🟡', info: '🔵' };
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
      padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ width: 3, height: 36, borderRadius: 99, background: colors[sev], flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', color: '#e5e7eb', lineHeight: 1.4 }}>{icons[sev]} {msg}</div>
        <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.15rem' }}>{mill} · {time}</div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function LandingPage() {
  const growthRef = useRef<HTMLDivElement>(null);
  const [growthVisible, setGrowthVisible] = useState(false);

  useEffect(() => {
    const el = growthRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setGrowthVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#070c15',
      color: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,12,21,0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 5vw',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div style={{
            width: 26, height: 26,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
          }}>🧵</div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            Trace<span style={{ color: '#22c55e' }}>Loom</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[
            { href: '#features', label: 'Features' },
            { href: '#market', label: 'Market' },
            { href: '#growth', label: 'Growth' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: '0.82rem', color: '#9ca3af', textDecoration: 'none',
              padding: '0.3rem 0.6rem', borderRadius: 6,
            }}>{l.label}</a>
          ))}
          <Link href="/login" style={{
            padding: '0.4rem 1rem',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 99,
            color: '#022c22', fontSize: '0.82rem', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Enter Demo →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '5rem 5vw 3rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 99, padding: '0.3rem 0.9rem',
          fontSize: '0.72rem', fontWeight: 600, color: '#22c55e',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          ESG + Operations Intelligence for Textile Supply Chains
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 4rem)',
          fontWeight: 900, lineHeight: 1.05,
          letterSpacing: '-0.03em',
          maxWidth: '800px',
          marginBottom: '1.2rem',
        }}>
          Every roll. Every gram of{' '}
          <span style={{ color: '#22c55e' }}>CO₂</span>.{' '}
          Every supplier score.{' '}
          <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Live.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
          color: '#9ca3af', lineHeight: 1.7, maxWidth: '600px', marginBottom: '2rem',
        }}>
          TraceLoom is the real-time intelligence layer that mills and brands use to track fabric rolls, monitor carbon emissions, score supplier performance, and stay ahead of EU Digital Product Passport compliance — all in one platform.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '3.5rem' }}>
          <Link href="/login" style={{
            padding: '0.75rem 1.8rem',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 99, color: '#022c22',
            fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
            boxShadow: '0 0 30px rgba(34,197,94,0.25)',
          }}>
            Explore Live Demo →
          </Link>
          <a href="#features" style={{
            padding: '0.75rem 1.8rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 99, color: '#e5e7eb',
            fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none',
          }}>
            See all features
          </a>
        </div>

        {/* Hero stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <StatCard value={80} suffix="%" label="Mis-ship reduction target" color="#22c55e" />
          <StatCard value={250} suffix="k" label="Rolls tracked / mill (yr 3)" color="#60a5fa" />
          <StatCard value={45} suffix="%" label="Avg CO₂ reduction with What-If" color="#a78bfa" />
          <StatCard value={95} suffix="%" label="Target logo retention" color="#f59e0b" />
        </div>
      </section>

      {/* ── FEATURE PILLARS ── */}
      <section id="features" style={{ padding: '4rem 5vw', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Platform capabilities</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Four pillars. One platform.
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', maxWidth: 500 }}>
            TraceLoom consolidates everything a mill or brand needs to prove compliance, cut costs, and win on sustainability.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          <FeatureCard
            icon="🧵"
            title="Roll-Level QR Tracking"
            description="Every fabric roll gets a unique QR code and a live 5-stage journey from production to delivery. Scan to verify, resolve disputes instantly."
            tag="Core"
            tagColor="#22c55e"
            tagBg="rgba(34,197,94,0.08)"
            href="/dashboard"
            cta="Explore Mill Dashboard"
            bullets={[
              'Unique QR per roll — scan from any device',
              'Full audit trail: weaving → cutting → loading → delivery',
              'Real-time status & mis-ship detection',
            ]}
          />
          <FeatureCard
            icon="🌿"
            title="Emissions Intelligence"
            description="CO₂ per yard, transport mode breakdowns, What-If scenario modeling (air vs. sea), and EU Digital Product Passport readiness built in."
            tag="ESG"
            tagColor="#a78bfa"
            tagBg="rgba(167,139,250,0.08)"
            href="/emissions"
            cta="View Emissions Dashboard"
            bullets={[
              'Real-time CO₂ per PO, per roll, per transport mode',
              'What-If: switching air→sea saves avg. 45% carbon',
              'EU DPP compliance reporting out of the box',
            ]}
          />
          <FeatureCard
            icon="🏆"
            title="Supplier Scorecard"
            description="Objective 0–100 rankings across 6 dimensions: delivery, quality, compliance, sustainability, cost, and responsiveness. No more gut-feel sourcing."
            tag="Analytics"
            tagColor="#f59e0b"
            tagBg="rgba(245,158,11,0.08)"
            href="/scorecard"
            cta="See Scorecards"
            bullets={[
              'Animated score rings with trend indicators',
              'Side-by-side mill comparison table',
              'Auto-generated sourcing recommendations',
            ]}
          />
          <FeatureCard
            icon="🔔"
            title="Live Alerts Feed"
            description="Real-time notifications for delayed shipments, emission spikes, compliance violations, quality issues, and payment risks — triaged by severity."
            tag="Live"
            tagColor="#ef4444"
            tagBg="rgba(239,68,68,0.08)"
            href="/alerts"
            cta="Open Alerts Feed"
            bullets={[
              '5 alert categories: shipment, emissions, compliance, quality, finance',
              'Severity tiers: critical / warning / info',
              'Resolve & archive workflow with per-mill filters',
            ]}
          />
        </div>
      </section>

      {/* ── PRODUCT PREVIEW PANELS ── */}
      <section style={{ padding: '2rem 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Emissions preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)',
          gap: '2rem',
          alignItems: 'center',
          marginBottom: '4rem',
          background: 'rgba(167,139,250,0.04)',
          border: '1px solid rgba(167,139,250,0.12)',
          borderRadius: 20,
          padding: '2rem',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>🌿 Emissions Intelligence</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Know your carbon footprint at roll level
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.7, marginBottom: '1.2rem' }}>
              TraceLoom calculates production CO₂ using your grid factor (kWh × 0.65 for Bangladesh), and transport emissions by mode (sea: 0.016, truck: 0.200, air: 1.640 kg CO₂/tonne-km). The What-If calculator shows exactly what switching shipping modes saves.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.2rem' }}>
              {['CO₂ per yard', 'Mode breakdown', 'What-If modeling', 'EU DPP ready'].map(tag => (
                <span key={tag} style={{
                  padding: '0.2rem 0.65rem', borderRadius: 99,
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                  fontSize: '0.72rem', color: '#c4b5fd',
                }}>{tag}</span>
              ))}
            </div>
            <Link href="/emissions" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.85rem', fontWeight: 600, color: '#a78bfa', textDecoration: 'none',
            }}>
              Explore Emissions Dashboard →
            </Link>
          </div>

          {/* Mini emissions widget */}
          <div style={{
            background: 'rgba(7,12,21,0.8)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '1.2rem', fontSize: '0.8rem',
          }}>
            <div style={{ color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.8rem' }}>CO₂ by Transport Mode</div>
            {[
              { label: 'Sea freight', val: '12.4 kg', pct: 18, color: '#22c55e' },
              { label: 'Truck', val: '28.7 kg', pct: 42, color: '#f59e0b' },
              { label: 'Air freight', val: '27.2 kg', pct: 40, color: '#ef4444' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#d1d5db' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.val}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 99, opacity: 0.75 }} />
                </div>
              </div>
            ))}
            <div style={{
              marginTop: '1rem', padding: '0.7rem',
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>What-If: Switch air → sea</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e', marginTop: '0.2rem' }}>−45.3% CO₂</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>saves ~12.3 kg CO₂ per roll</div>
            </div>
          </div>
        </div>

        {/* Alerts + Scorecard preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '1.5rem',
        }}>
          {/* Alerts preview */}
          <div style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.12)',
            borderRadius: 20, padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>🔔</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Alerts Feed</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                background: '#ef4444', borderRadius: 99, padding: '0.1rem 0.45rem',
                animation: 'pulse 2s ease-in-out infinite',
              }}>LIVE</span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Real-time issue detection</h3>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: '1rem' }}>
              Critical delays, emission spikes, and compliance violations surface instantly — triaged so teams act on what matters most.
            </p>
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              <AlertRow sev="critical" msg="PO-2024-003 delayed 4+ days — 12 rolls stuck at port" mill="Apex Textiles" time="2 min ago" />
              <AlertRow sev="critical" msg="Air freight CO₂ spike: 3× above sea baseline" mill="Blue River Mills" time="18 min ago" />
              <AlertRow sev="warning" msg="Roll TL-008 weight variance exceeds ±3% spec" mill="Sunrise Fabrics" time="1 hr ago" />
              <AlertRow sev="info" msg="Shipment TL-042 cleared customs — ETA confirmed" mill="Apex Textiles" time="3 hr ago" />
            </div>
            <Link href="/alerts" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem',
              fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', textDecoration: 'none',
            }}>
              Open Alerts Feed →
            </Link>
          </div>

          {/* Scorecard preview */}
          <div style={{
            background: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.12)',
            borderRadius: 20, padding: '1.5rem',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>🏆 Supplier Scorecard</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Objective mill rankings</h3>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: '1rem' }}>
              Six dimensions, zero guesswork. Know which mills to grow and which to put on notice — before it affects your margins.
            </p>
            {[
              { name: 'Apex Textiles', score: 91, color: '#22c55e', medal: '🥇' },
              { name: 'Blue River Mills', score: 71, color: '#f59e0b', medal: '🥈' },
              { name: 'Sunrise Fabrics', score: 58, color: '#ef4444', medal: '🥉' },
            ].map(m => (
              <div key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '0.7rem',
              }}>
                <span style={{ fontSize: '1rem' }}>{m.medal}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e5e7eb' }}>{m.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.color }}>{m.score}/100</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${m.score}%`, height: '100%', background: m.color, borderRadius: 99, opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            ))}
            <Link href="/scorecard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem',
              fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', textDecoration: 'none',
            }}>
              See Full Scorecards →
            </Link>
          </div>
        </div>
      </section>

      {/* ── EU DPP COMPLIANCE BANNER ── */}
      <section style={{ padding: '0 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(129,140,248,0.06))',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 20, padding: '2rem',
          display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🇪🇺</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>EU Digital Product Passport</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Compliance-ready from day one
            </h3>
            <p style={{ fontSize: '0.83rem', color: '#9ca3af', lineHeight: 1.7 }}>
              The EU DPP regulation requires brands to track and report full material traceability and carbon footprint data by 2026. TraceLoom generates the exact data structure needed — so our customers are already compliant while competitors scramble.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '0 0 auto' }}>
            {[
              { label: 'Roll-level material origin', checked: true },
              { label: 'Carbon footprint per unit', checked: true },
              { label: 'Full audit trail with timestamps', checked: true },
              { label: 'Supplier certification tracking', checked: true },
              { label: 'Export-ready compliance report', checked: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e55',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: '#22c55e', flexShrink: 0,
                }}>✓</span>
                <span style={{ color: '#d1d5db' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '0 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            From roll creation to brand dashboard in 3 steps
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
          }}>
            <TimelineStep num="1" title="Mill creates a PO & assigns rolls" body="The mill admin creates a Purchase Order, sets roll count and spec, and TraceLoom auto-generates unique QR codes for every roll in seconds." />
            <TimelineStep num="2" title="Floor workers scan at each stage" body="As rolls move from weaving → cutting → loading → port, workers scan QR codes. Each scan timestamps the journey and flags any anomalies automatically." />
            <TimelineStep num="3" title="Brands see live data & scores" body="Brand buyers get real-time roll status, carbon reports, supplier scores, and alert feeds — no more chasing emails or waiting for spreadsheets." />
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '1.5rem',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Role-based access</div>
            {[
              { role: 'Mill Admin', color: '#22c55e', desc: 'Full control: create POs, manage rolls, view all analytics, export DPP reports' },
              { role: 'Brand Buyer', color: '#3b82f6', desc: 'Brand console: live shipment tracking, supplier scorecards, emissions data per order' },
              { role: 'Floor Worker', color: '#f59e0b', desc: 'Scan station: QR scan, advance roll status, view lot progress in real time' },
            ].map(r => (
              <div key={r.role} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                marginBottom: '1rem', padding: '0.75rem',
                background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                border: `1px solid ${r.color}22`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${r.color}18`, border: `1.5px solid ${r.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: r.color, flexShrink: 0,
                }}>
                  {r.role[0]}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: r.color, marginBottom: '0.2rem' }}>{r.role}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              </div>
            ))}
            <Link href="/login" style={{
              display: 'block', textAlign: 'center',
              padding: '0.6rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e22, #22c55e11)',
              border: '1px solid #22c55e33',
              color: '#22c55e', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Try any role in the demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARKET NEED ── */}
      <section id="market" style={{ padding: '0 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Market opportunity</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            The gap no one else is filling
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#9ca3af', maxWidth: '520px' }}>
            Between production, warehouse, and truck loading, most supply chains are completely blind. TraceLoom provides the first roll-level layer of visibility at mill scale.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { num: '8k+', label: 'Export-oriented mills', sub: 'South Asia + Turkey denim/woven clusters', color: '#22c55e' },
            { num: '$12–30k', label: 'Addressable ARR per mill', sub: 'Per-site SaaS + brand analytics add-ons', color: '#60a5fa' },
            { num: '1B+', label: 'Rolls shipped per year', sub: 'Each roll is a unit of risk today', color: '#a78bfa' },
            { num: '2026', label: 'EU DPP deadline', sub: 'Mandatory traceability for fashion brands', color: '#f59e0b' },
          ].map(c => (
            <div key={c.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '1.2rem',
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{c.num}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e5e7eb', margin: '0.3rem 0 0.2rem' }}>{c.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {[
            { label: 'TAM', val: '$1.5B+', note: 'Global mills & brands' },
            { label: 'Beachhead SAM', val: '$50–80M', note: 'Top 500 export mills' },
            { label: 'Phase 1 goal', val: '100 mills', note: '$1–2M ARR path' },
          ].map(b => (
            <div key={b.label} style={{
              flex: '1 1 160px', background: '#020617',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              padding: '0.9rem 1.1rem',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{b.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f9fafb', margin: '0.2rem 0 0.1rem' }}>{b.val}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{b.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GROWTH CHART ── */}
      <section id="growth" style={{ padding: '0 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div ref={growthRef} style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)',
          gap: '2rem', alignItems: 'stretch',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Projected ARR</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>Growth expectations (illustrative)</div>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>USD · model</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <BarRow year="Year 1" value="$120k" percent={12} animate={growthVisible} />
              <BarRow year="Year 2" value="$450k" percent={30} animate={growthVisible} />
              <BarRow year="Year 3" value="$1.2M" percent={55} animate={growthVisible} />
              <BarRow year="Year 4" value="$2.4M" percent={78} animate={growthVisible} />
              <BarRow year="Year 5" value="$4M+" percent={100} animate={growthVisible} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Growth levers</div>
            {[
              { title: 'Land-and-expand via brands', body: 'Once a brand standardizes TraceLoom at 1–2 mills, all other suppliers are pulled in to keep visibility consistent.' },
              { title: 'Unit-economic focus', body: 'High-margin SaaS — roll-level data upsells brand analytics without any additional floor hardware.' },
              { title: 'Data moat', body: 'Every scanned roll strengthens anomaly detection, on-time predictions, and cross-network benchmarking.' },
              { title: 'ESG regulatory tailwind', body: 'EU DPP (2026) and mandatory carbon reporting make TraceLoom a compliance requirement, not just nice-to-have.' },
            ].map(n => (
              <div key={n.title} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '0.85rem 1rem',
                display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: '0.35rem' }} />
                <div>
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '0.15rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.77rem', color: '#9ca3af', lineHeight: 1.55 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NETWORK FLYWHEEL ── */}
      <section style={{ padding: '0 5vw 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(22,163,74,0.03))',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 20, padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Network effect</div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              The flywheel that compounds
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {[
              '1 mill proves lower mis-ships',
              'Brand requests TraceLoom at partner mills',
              'Shared roll data across suppliers',
              'Stronger benchmarks & pricing power',
              '→ repeat',
            ].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {i > 0 && <span style={{ color: '#22c55e', fontSize: '1.1rem', opacity: 0.7 }}>→</span>}
                <div style={{
                  background: i === 4 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${i === 4 ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 99, padding: '0.4rem 0.9rem',
                  fontSize: '0.78rem', color: i === 4 ? '#22c55e' : '#d1d5db',
                  fontWeight: i === 4 ? 700 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {[
              { label: 'Mill ACV range', val: '$12–30k' },
              { label: 'Brand analytics add-on', val: '+20–35%' },
              { label: 'Target logo retention', val: '95%+' },
              { label: 'Gross margin target', val: '82%' },
            ].map(m => (
              <div key={m.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '0.65rem 1.1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f9fafb', marginTop: '0.1rem' }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '0 5vw 6rem', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 70%)',
          borderRadius: 24, padding: '3.5rem 2rem',
          border: '1px solid rgba(34,197,94,0.12)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧵</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Ready to explore TraceLoom?
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Pick a role and explore the full platform — Mill Dashboard, Brand Console, Emissions, Scorecards, and Live Alerts — all running on live demo data.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="/login" style={{
              padding: '0.8rem 2rem',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              borderRadius: 99, color: '#022c22',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
              boxShadow: '0 0 40px rgba(34,197,94,0.3)',
            }}>
              Enter the Demo →
            </Link>
            <Link href="/emissions" style={{
              padding: '0.8rem 1.5rem',
              background: 'transparent', border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 99, color: '#a78bfa',
              fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
            }}>
              🌿 View Emissions
            </Link>
            <Link href="/scorecard" style={{
              padding: '0.8rem 1.5rem',
              background: 'transparent', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 99, color: '#f59e0b',
              fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
            }}>
              🏆 See Scorecards
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 5vw',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1rem' }}>🧵</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Trace<span style={{ color: '#22c55e' }}>Loom</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>· Demo prototype · {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { href: '/dashboard', label: 'Mill Dashboard' },
            { href: '/brand', label: 'Brand Console' },
            { href: '/emissions', label: 'Emissions' },
            { href: '/scorecard', label: 'Scorecards' },
            { href: '/alerts', label: 'Alerts' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: '0.75rem', color: '#6b7280', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
