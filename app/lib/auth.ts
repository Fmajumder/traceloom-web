'use client';

export type UserRole = 'mill' | 'brand' | 'worker';

export interface DemoUser {
  name: string;
  role: UserRole;
  company: string;
  email: string;
  avatar: string;
}

const DEMO_USERS: Record<UserRole, DemoUser> = {
  mill: {
    name: 'Reza Ahmed',
    role: 'mill',
    company: 'Apex Textiles Ltd.',
    email: 'reza@apextextiles.com',
    avatar: 'RA',
  },
  brand: {
    name: 'Sarah Chen',
    role: 'brand',
    company: 'Nordstrom Sourcing',
    email: 'schen@nordstrom.com',
    avatar: 'SC',
  },
  worker: {
    name: 'Karim Hassan',
    role: 'worker',
    company: 'Apex Textiles Ltd.',
    email: 'karim@apextextiles.com',
    avatar: 'KH',
  },
};

export function setDemoUser(role: UserRole) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('tl_user', JSON.stringify(DEMO_USERS[role]));
  }
}

export function getDemoUser(): DemoUser | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('tl_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
  }
  return null;
}

export function clearDemoUser() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('tl_user');
  }
}
