'use client';
import { useRouter, usePathname } from 'next/navigation';
import { getDemoUser, clearDemoUser, DemoUser } from '../lib/auth';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Mill Dashboard', roles: ['mill', 'worker'] },
  { href: '/brand',     label: 'Brand Console',  roles: ['brand'] },
  { href: '/map',       label: '🗺️ Live Map',    roles: ['mill', 'brand'] },
  { href: '/emissions', label: '🌿 Emissions',   roles: ['mill', 'brand'] },
  { href: '/scorecard', label: '🏆 Scorecards',  roles: ['mill', 'brand'] },
  { href: '/create',    label: 'Create PO',       roles: ['mill'] },
  { href: '/scan',      label: 'Scan Rolls',      roles: ['mill', 'worker'] },
  { href: '/worker',    label: '📱 Worker App',   roles: ['mill', 'worker'] },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  mill:   { label: 'Mill Admin',    color: '#22c55e' },
  brand:  { label: 'Brand Buyer',   color: '#3b82f6' },
  worker: { label: 'Floor Worker',  color: '#f59e0b' },
};

// Critical alert count — hardcoded for demo (matches alerts page)
const CRITICAL_COUNT = 3;

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [bellPulse, setBellPulse] = useState(false);

  useEffect(() => {
    setUser(getDemoUser());
  }, [pathname]);

  // Pulse the bell every 45s to simulate new alert
  useEffect(() => {
    const t = setInterval(() => {
      setBellPulse(true);
      setTimeout(() => setBellPulse(false), 2000);
    }, 45000);
    return () => clearInterval(t);
  }, []);

  function handleLogout() {
    clearDemoUser();
    router.push('/login');
  }

  if (!user) return null;

  const badge = ROLE_BADGE[user.role];
  const links = NAV_LINKS.filter(l => l.roles.includes(user.role));
  const onAlerts = pathname === '/alerts';

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(7,12,21,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 1.5rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🧵</div>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f9fafb', letterSpacing: '-0.02em' }}>
          Trace<span style={{ color: '#22c55e' }}>Loom</span>
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
        {links.map(link => {
          const active = pathname === link.href;
          return (
            <button key={link.href} onClick={() => router.push(link.href)} style={{
              padding: '0.35rem 0.75rem',
              background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
              border: active ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
              borderRadius: 7,
              color: active ? '#22c55e' : '#9ca3af',
              fontSize: '0.82rem',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
              {link.label}
            </button>
          );
        })}
      </div>

      {/* Right side: Bell + User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        {/* Alert Bell */}
        <button
          onClick={() => router.push('/alerts')}
          title="Live Alerts"
          style={{
            position: 'relative',
            width: 36, height: 36,
            background: onAlerts ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${onAlerts ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 9,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
            transition: 'all 0.15s',
            animation: bellPulse ? 'bellShake 0.4s ease' : 'none',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
          }}
          onMouseLeave={e => {
            if (!onAlerts) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }
          }}
        >
          🔔
          {/* Badge */}
          <div style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 17, height: 17,
            background: '#ef4444',
            borderRadius: 99,
            border: '2px solid #070c15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.58rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 8px rgba(239,68,68,0.6)',
            animation: 'badgePulse 2s ease-in-out infinite',
          }}>
            {CRITICAL_COUNT}
          </div>
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: badge.color + '22', border: `1.5px solid ${badge.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: badge.color }}>
            {user.avatar}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb', lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: '0.65rem', color: badge.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{badge.label}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{ padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
          Log out
        </button>
      </div>

      <style>{`
        @keyframes bellShake {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(-12deg); }
          60%      { transform: rotate(12deg); }
          80%      { transform: rotate(-6deg); }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.6); }
          50%      { box-shadow: 0 0 14px rgba(239,68,68,0.9); }
        }
      `}</style>
    </nav>
  );
}
