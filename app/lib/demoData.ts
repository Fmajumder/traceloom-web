export interface Roll {
  id: string;
  po: string;
  lot: string;
  color: string;
  yards: number;
  status: 'created' | 'warehouse' | 'truck' | 'port' | 'delivered';
  mill: string;
  createdAt: string;
  events: RollEvent[];
  transport?: 'sea' | 'air' | 'truck';
  productionKwh?: number;
  transportKm?: number;
  weightKg?: number;
}

export interface RollEvent {
  status: string;
  label: string;
  timestamp: string;
  location: string;
  operator: string;
}

export interface Lot {
  poNumber: string;
  lotId: string;
  customer: string;
  style: string;
  color: string;
  rollCount: number;
  notes: string;
  createdAt: string;
  mill: string;
}

const ROLL_EVENTS: Record<string, RollEvent[]> = {
  'TL-A001-001': [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-15T08:12:00Z', location: 'Production Floor A', operator: 'Karim Hassan' },
    { status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-16T10:30:00Z', location: 'Warehouse Bay 3', operator: 'Karim Hassan' },
    { status: 'truck', label: 'Loaded onto Truck', timestamp: '2026-03-18T06:00:00Z', location: 'Loading Dock 2', operator: 'Reza Ahmed' },
    { status: 'port', label: 'Arrived at Port', timestamp: '2026-03-19T14:22:00Z', location: 'Chittagong Port – Gate 7', operator: 'Logistics Team' },
    { status: 'delivered', label: 'Delivered to Buyer', timestamp: '2026-03-24T09:05:00Z', location: 'H&M DC – Rotterdam', operator: 'H&M Receiving' },
  ],
  'TL-A001-002': [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-15T08:35:00Z', location: 'Production Floor A', operator: 'Karim Hassan' },
    { status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-16T11:00:00Z', location: 'Warehouse Bay 3', operator: 'Karim Hassan' },
    { status: 'truck', label: 'Loaded onto Truck', timestamp: '2026-03-18T06:00:00Z', location: 'Loading Dock 2', operator: 'Reza Ahmed' },
    { status: 'port', label: 'Arrived at Port', timestamp: '2026-03-19T14:45:00Z', location: 'Chittagong Port – Gate 7', operator: 'Logistics Team' },
    { status: 'delivered', label: 'Delivered to Buyer', timestamp: '2026-03-24T09:05:00Z', location: 'H&M DC – Rotterdam', operator: 'H&M Receiving' },
  ],
  'TL-A001-003': [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-15T09:00:00Z', location: 'Production Floor B', operator: 'Karim Hassan' },
    { status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-16T13:15:00Z', location: 'Warehouse Bay 3', operator: 'Karim Hassan' },
    { status: 'truck', label: 'Loaded onto Truck', timestamp: '2026-03-18T06:00:00Z', location: 'Loading Dock 2', operator: 'Reza Ahmed' },
    { status: 'port', label: 'Arrived at Port', timestamp: '2026-03-19T15:10:00Z', location: 'Chittagong Port – Gate 7', operator: 'Logistics Team' },
  ],
  'TL-A001-004': [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-15T09:22:00Z', location: 'Production Floor B', operator: 'Karim Hassan' },
    { status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-16T14:00:00Z', location: 'Warehouse Bay 3', operator: 'Karim Hassan' },
    { status: 'truck', label: 'Loaded onto Truck', timestamp: '2026-03-18T06:00:00Z', location: 'Loading Dock 2', operator: 'Reza Ahmed' },
  ],
  'TL-A001-005': [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-15T10:00:00Z', location: 'Production Floor A', operator: 'Karim Hassan' },
    { status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-17T09:00:00Z', location: 'Warehouse Bay 4', operator: 'Karim Hassan' },
  ],
};

function getDefaultEvents(rollId: string, status: string): RollEvent[] {
  const base: RollEvent[] = [
    { status: 'created', label: 'Roll Created', timestamp: '2026-03-20T08:00:00Z', location: 'Production Floor A', operator: 'Karim Hassan' },
  ];
  if (['warehouse', 'truck', 'port', 'delivered'].includes(status)) {
    base.push({ status: 'warehouse', label: 'Moved to Warehouse', timestamp: '2026-03-21T10:00:00Z', location: 'Warehouse Bay 2', operator: 'Karim Hassan' });
  }
  if (['truck', 'port', 'delivered'].includes(status)) {
    base.push({ status: 'truck', label: 'Loaded onto Truck', timestamp: '2026-03-22T06:00:00Z', location: 'Loading Dock 1', operator: 'Reza Ahmed' });
  }
  if (['port', 'delivered'].includes(status)) {
    base.push({ status: 'port', label: 'Arrived at Port', timestamp: '2026-03-23T14:00:00Z', location: 'Chittagong Port', operator: 'Logistics Team' });
  }
  if (status === 'delivered') {
    base.push({ status: 'delivered', label: 'Delivered to Buyer', timestamp: '2026-03-25T09:00:00Z', location: 'Buyer DC', operator: 'Buyer Receiving' });
  }
  return base;
}

const SEED_ROLLS: Roll[] = [
  { id: 'TL-A001-001', po: 'PO-2026-001', lot: 'LOT-A001', color: 'Navy Blue', yards: 185, status: 'delivered', mill: 'Apex Textiles Ltd.', createdAt: '2026-03-15T08:12:00Z', events: ROLL_EVENTS['TL-A001-001'], transport: 'sea',   productionKwh: 450, transportKm: 13200, weightKg: 74 },
  { id: 'TL-A001-002', po: 'PO-2026-001', lot: 'LOT-A001', color: 'Navy Blue', yards: 192, status: 'delivered', mill: 'Apex Textiles Ltd.', createdAt: '2026-03-15T08:35:00Z', events: ROLL_EVENTS['TL-A001-002'], transport: 'sea',   productionKwh: 480, transportKm: 13200, weightKg: 77 },
  { id: 'TL-A001-003', po: 'PO-2026-001', lot: 'LOT-A001', color: 'Navy Blue', yards: 178, status: 'port',      mill: 'Apex Textiles Ltd.', createdAt: '2026-03-15T09:00:00Z', events: ROLL_EVENTS['TL-A001-003'], transport: 'air',   productionKwh: 420, transportKm: 8100,  weightKg: 71 },
  { id: 'TL-A001-004', po: 'PO-2026-001', lot: 'LOT-A001', color: 'Navy Blue', yards: 201, status: 'truck',     mill: 'Apex Textiles Ltd.', createdAt: '2026-03-15T09:22:00Z', events: ROLL_EVENTS['TL-A001-004'], transport: 'air',   productionKwh: 510, transportKm: 8100,  weightKg: 80 },
  { id: 'TL-A001-005', po: 'PO-2026-001', lot: 'LOT-A001', color: 'Navy Blue', yards: 195, status: 'warehouse', mill: 'Apex Textiles Ltd.', createdAt: '2026-03-15T10:00:00Z', events: ROLL_EVENTS['TL-A001-005'], transport: 'sea',   productionKwh: 460, transportKm: 13200, weightKg: 78 },
  { id: 'TL-A002-001', po: 'PO-2026-002', lot: 'LOT-A002', color: 'Cream White', yards: 210, status: 'warehouse', mill: 'Apex Textiles Ltd.', createdAt: '2026-03-18T09:00:00Z', events: getDefaultEvents('TL-A002-001', 'warehouse'), transport: 'sea',   productionKwh: 520, transportKm: 13200, weightKg: 84 },
  { id: 'TL-A002-002', po: 'PO-2026-002', lot: 'LOT-A002', color: 'Cream White', yards: 198, status: 'created',   mill: 'Apex Textiles Ltd.', createdAt: '2026-03-18T09:30:00Z', events: getDefaultEvents('TL-A002-002', 'created'),   transport: 'sea',   productionKwh: 490, transportKm: 13200, weightKg: 79 },
  { id: 'TL-A002-003', po: 'PO-2026-002', lot: 'LOT-A002', color: 'Cream White', yards: 205, status: 'created',   mill: 'Apex Textiles Ltd.', createdAt: '2026-03-18T10:00:00Z', events: getDefaultEvents('TL-A002-003', 'created'),   transport: 'truck', productionKwh: 505, transportKm: 280,   weightKg: 82 },
  { id: 'TL-A003-001', po: 'PO-2026-003', lot: 'LOT-A003', color: 'Indigo Wash', yards: 175, status: 'created',   mill: 'Apex Textiles Ltd.', createdAt: '2026-03-20T08:00:00Z', events: getDefaultEvents('TL-A003-001', 'created'),   transport: 'truck', productionKwh: 430, transportKm: 280,   weightKg: 70 },
  { id: 'TL-A003-002', po: 'PO-2026-003', lot: 'LOT-A003', color: 'Indigo Wash', yards: 183, status: 'created',   mill: 'Apex Textiles Ltd.', createdAt: '2026-03-20T08:20:00Z', events: getDefaultEvents('TL-A003-002', 'created'),   transport: 'truck', productionKwh: 445, transportKm: 280,   weightKg: 73 },
];

const SEED_LOTS: Lot[] = [
  { poNumber: 'PO-2026-001', lotId: 'LOT-A001', customer: 'H&M Sourcing', style: 'Classic Cotton Twill', color: 'Navy Blue', rollCount: 5, notes: 'Rush order – air freight required', createdAt: '2026-03-15T07:00:00Z', mill: 'Apex Textiles Ltd.' },
  { poNumber: 'PO-2026-002', lotId: 'LOT-A002', customer: 'Zara Global', style: 'Premium Linen Blend', color: 'Cream White', rollCount: 3, notes: 'Sea freight – standard delivery', createdAt: '2026-03-18T08:00:00Z', mill: 'Apex Textiles Ltd.' },
  { poNumber: 'PO-2026-003', lotId: 'LOT-A003', customer: 'Gap Inc.', style: 'Stretch Denim', color: 'Indigo Wash', rollCount: 2, notes: '', createdAt: '2026-03-20T07:30:00Z', mill: 'Apex Textiles Ltd.' },
];

export function seedDemoData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('tl_seeded_v2')) return;

  localStorage.setItem('traceloom-po-lots', JSON.stringify(SEED_LOTS));
  localStorage.setItem('traceloom-rolls', JSON.stringify(SEED_ROLLS));
  localStorage.setItem('tl_seeded_v2', 'true');
}

export function getRolls(): Roll[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('traceloom-rolls') || '[]');
  } catch { return []; }
}

export function saveRolls(rolls: Roll[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('traceloom-rolls', JSON.stringify(rolls));
}

export function getLots(): Lot[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('traceloom-po-lots') || '[]');
  } catch { return []; }
}

export function saveLots(lots: Lot[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('traceloom-po-lots', JSON.stringify(lots));
}
