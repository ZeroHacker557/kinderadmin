import type { SummaryCard, Transaction, AttendanceRecord, Notification } from '@/types';

export const summaryCards: SummaryCard[] = [
  {
    id: 'revenue',
    title: 'Umumiy daromad',
    value: '128,430,000 so\'m',
    change: 12.5,
    changeLabel: 'o\'tgan oyga nisbatan',
    trend: 'up',
    sparklineData: [31, 40, 28, 51, 42, 55, 64, 58, 71, 68, 75, 82],
    icon: 'DollarSign',
    accentColor: '#10b981',
  },
  {
    id: 'children',
    title: 'Faol bolalar',
    value: '247',
    change: 3.2,
    changeLabel: 'o\'tgan oyga nisbatan',
    trend: 'up',
    sparklineData: [220, 225, 218, 230, 235, 228, 240, 238, 242, 245, 244, 247],
    icon: 'Users',
    accentColor: '#6366f1',
  },
  {
    id: 'staff',
    title: 'Xodimlar soni',
    value: '34',
    change: 0,
    changeLabel: 'o\'zgarishsiz',
    trend: 'neutral',
    sparklineData: [32, 32, 33, 33, 34, 34, 34, 33, 34, 34, 34, 34],
    icon: 'UserCheck',
    accentColor: '#0ea5e9',
  },
  {
    id: 'pending',
    title: 'Kutilayotgan to\'lovlar',
    value: '8,240,000 so\'m',
    change: -5.1,
    changeLabel: 'o\'tgan oyga nisbatan',
    trend: 'down',
    sparklineData: [12000, 10500, 9800, 11200, 10100, 9200, 8800, 9500, 8900, 8600, 8400, 8240],
    icon: 'Clock',
    accentColor: '#f59e0b',
  },
];

export const recentTransactions: Transaction[] = [
  { id: 'txn-001', description: 'Oylik to\'lov — Emma Johnson', category: 'To\'lov', amount: 1250000, type: 'income', date: '2026-04-13', status: 'completed' },
  { id: 'txn-002', description: 'Xodim maoshi — Maria Rodriguez', category: 'Ish haqi', amount: 3200000, type: 'expense', date: '2026-04-12', status: 'completed' },
  { id: 'txn-003', description: 'Sinf jihozlari — B guruh', category: 'Xaridlar', amount: 485000, type: 'expense', date: '2026-04-12', status: 'pending' },
  { id: 'txn-004', description: 'Oylik to\'lov — Liam Chen', category: 'To\'lov', amount: 1250000, type: 'income', date: '2026-04-11', status: 'completed' },
  { id: 'txn-005', description: 'Kommunal xizmat — Elektr', category: 'Kommunal', amount: 720000, type: 'expense', date: '2026-04-10', status: 'completed' },
  { id: 'txn-006', description: 'Kechikish jarimasi — Sarah Williams', category: 'Jarima', amount: 50000, type: 'income', date: '2026-04-10', status: 'pending' },
];

export const todayAttendance: AttendanceRecord[] = [
  { id: 'att-001', childName: 'Emma Johnson', group: 'Quyoshlar', checkIn: '07:45', checkOut: null, status: 'present' },
  { id: 'att-002', childName: 'Liam Chen', group: 'Kapalaklar', checkIn: '08:02', checkOut: null, status: 'present' },
  { id: 'att-003', childName: 'Sophia Martinez', group: 'Quyoshlar', checkIn: '08:35', checkOut: null, status: 'late' },
  { id: 'att-004', childName: 'Noah Williams', group: 'Kamalaklar', checkIn: '—', checkOut: null, status: 'absent' },
  { id: 'att-005', childName: 'Olivia Brown', group: 'Kapalaklar', checkIn: '07:55', checkOut: null, status: 'present' },
  { id: 'att-006', childName: 'James Davis', group: 'Kamalaklar', checkIn: '08:10', checkOut: null, status: 'present' },
];

export const notifications: Notification[] = [
  { id: 'n-001', title: 'To\'lov qabul qilindi', message: 'Emma Johnson uchun oylik to\'lov amalga oshirildi.', type: 'success', timestamp: '2 daqiqa oldin', read: false },
  { id: 'n-002', title: 'Xodim ogohlantirishsi', message: 'Maria Rodriguez 18-aprel kuni dam olish so\'radi.', type: 'warning', timestamp: '15 daqiqa oldin', read: false },
  { id: 'n-003', title: 'Tizim yangilanishi', message: 'Bugun kechqurun soat 2:00 da texnik xizmat rejalashtirilgan.', type: 'info', timestamp: '1 soat oldin', read: true },
  { id: 'n-004', title: 'Muddati o\'tgan to\'lov', message: 'Sarah Williams ning 50,000 so\'m qarzdorligi mavjud.', type: 'error', timestamp: '3 soat oldin', read: true },
];
