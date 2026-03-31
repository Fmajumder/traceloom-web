'use client';
import { useRouter } from 'next/navigation';
import { setDemoUser, UserRole } from '../lib/auth';
import { seedDemoData } from '../lib/demoData';

const roles: {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  name: string;
  company: string;
  redirect: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}[] = [
  {
    role: 'mill',
    title: 'Mill Admin',
    subtitle: 'Production & Shipment Control',
    description: 'Create POs, assign rolls, generate QR codes, and track every fabric roll from floor to freight.',
    name: 'Reza Ahmed',
    company: 'Apex Textiles Ltd.',
    redirect: '/dashboard',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.25)',
    icon: '🏭',
  },
  {
    role: 'brand',
    title: 'Brand Buyer',
    subtitle: 'Multi-Mill Visibility',
    description: 'See real-time shipment status across all your supplier mills. No more WhatsApp chases.',
    name: 'Sarah Chen',
    company: 'Nordstrom Sourcing',
    redirect: '/brand',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.25)',
    icon: '🛍️',
  },
  {
    role: 'worker',
    title: 'Floor Worker',
    subtitle: 'QR Scan & Status Update',
    description: 'Scan QR codes on rolls to log status changes — warehouse, truck, port — in real time.',
    name: 'Karim Hassan',
    company: 'Apex Textiles Ltd.',
    redirect: '/scan',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    icon: '📱',
  },
];

export default function LoginPage() {
  const router = useRouter();

  function handleLogin(role: UserRole, redirect: string) {
    seedDemoData();
    setDemoUser(role);
    router.push(redirect);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 0%, #0d1f3c 0%, #070c15 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 0 24px rgba(34,197,94,0.4)',
          }}>🧵</div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.03em' }}>
            Trace<span style={{ color: '#22c55e' }}>Loom</span>
          </span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto' }}>
          Roll-level traceability for textile supply chains.<br />
          <span style={{ color: '#9ca3af' }}>Select a role to explore the demo.</span>
        </p>
      </div>

      {/* Role Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        maxWidth: 960,
        width: '100%',
      }}>
        {roles.map((r) => (
          <div
            key={r.role}
            onClick={() => handleLogin(r.role, r.redirect)}
            style={{
              background: r.bg,
              border: `1px solid ${r.border}`,
              borderRadius: 16,
              padding: '1.75rem',
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${r.color}22`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            {/* Glow blob */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 120, height: 120,
              borderRadius: '50%',
              background: r.color,
              opacity: 0.06,
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{r.icon}</div>

            <div style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f9fafb' }}>{r.title}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 600,
                background: r.color + '22',
                color: r.color,
                border: `1px solid ${r.color}44`,
                borderRadius: 99, padding: '0.15rem 0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Demo</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: r.color, fontWeight: 600, marginBottom: '0.75rem' }}>{r.subtitle}</div>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.55, marginBottom: '1.25rem' }}>{r.description}</p>

            {/* User badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.85rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: r.color + '33',
                border: `1.5px solid ${r.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: r.color,
              }}>
                {r.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e5e7eb' }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{r.company}</div>
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '0.65rem',
              background: r.color,
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}>
              Sign in as {r.title} →
            </button>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '2.5rem', fontSize: '0.78rem', color: '#374151' }}>
        This is a demo environment · No real data · <span style={{ color: '#22c55e' }}>TraceLoom © 2026</span>
      </p>
    </div>
  );
}
