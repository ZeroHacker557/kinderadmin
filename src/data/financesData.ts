import type { FinanceTransaction, MonthlyFinanceSummary, CategorySummary } from '@/types';

// ============================================
// Category Labels & Colors
// ============================================

export const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  // Income
  tuition:       { label: 'Oylik to\'lov',              color: '#10b981', icon: '💰' },
  registration:  { label: 'Ro\'yxatdan o\'tish',        color: '#06b6d4', icon: '📋' },
  extra_classes:  { label: 'Qo\'shimcha mashg\'ulotlar', color: '#8b5cf6', icon: '📚' },
  events:        { label: 'Tadbirlar',                   color: '#f59e0b', icon: '🎉' },
  other_income:  { label: 'Boshqa daromad',              color: '#64748b', icon: '💵' },
  // Expense
  salary:        { label: 'Ish haqi',      color: '#ef4444', icon: '👥' },
  rent:          { label: 'Ijara',         color: '#f97316', icon: '🏢' },
  utilities:     { label: 'Kommunal',      color: '#eab308', icon: '⚡' },
  food:          { label: 'Ovqatlanish',   color: '#84cc16', icon: '🍽️' },
  supplies:      { label: 'Jihozlar',      color: '#3b82f6', icon: '🪑' },
  maintenance:   { label: 'Ta\'mirlash',   color: '#a855f7', icon: '🔧' },
  marketing:     { label: 'Marketing',     color: '#ec4899', icon: '📢' },
  taxes:         { label: 'Soliqlar',      color: '#6366f1', icon: '🏛️' },
  insurance:     { label: 'Sug\'urta',     color: '#14b8a6', icon: '🛡️' },
  other_expense: { label: 'Boshqa xarajat', color: '#94a3b8', icon: '📌' },
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: 'O\'tkazma',
  auto: 'Avtomatik',
};

// ============================================
// Transactions
// ============================================

export const transactionsData: FinanceTransaction[] = [
  // === APRIL 2026 ===
  { id: 'txn-001', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Alisher Karimov', amount: 2500000, date: '2026-04-13', status: 'completed', childName: 'Alisher Karimov', childId: 'child-001', paymentMethod: 'card', receiptNumber: 'RCP-2604-001' },
  { id: 'txn-002', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Madina Toshmatova', amount: 2500000, date: '2026-04-13', status: 'completed', childName: 'Madina Toshmatova', childId: 'child-002', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-002' },
  { id: 'txn-003', type: 'expense', category: 'salary', description: 'Xodim maoshi — Maria Rodriguez', amount: 5500000, date: '2026-04-12', status: 'completed', employeeName: 'Maria Rodriguez', employeeId: 'emp-001', paymentMethod: 'transfer' },
  { id: 'txn-004', type: 'expense', category: 'salary', description: 'Xodim maoshi — Sarah Johnson', amount: 4800000, date: '2026-04-12', status: 'completed', employeeName: 'Sarah Johnson', employeeId: 'emp-002', paymentMethod: 'transfer' },
  { id: 'txn-005', type: 'expense', category: 'food', description: 'Oshxona uchun oziq-ovqat xaridi', amount: 3200000, date: '2026-04-12', status: 'completed', paymentMethod: 'card', receiptNumber: 'RCP-2604-005' },
  { id: 'txn-006', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Jasur Rahimov', amount: 2500000, date: '2026-04-11', status: 'completed', childName: 'Jasur Rahimov', childId: 'child-003', paymentMethod: 'cash', receiptNumber: 'RCP-2604-006' },
  { id: 'txn-007', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Nodira Azimova', amount: 2500000, date: '2026-04-11', status: 'pending', childName: 'Nodira Azimova', childId: 'child-004', paymentMethod: 'transfer' },
  { id: 'txn-008', type: 'expense', category: 'utilities', description: 'Elektr energiya to\'lovi', amount: 1850000, date: '2026-04-10', status: 'completed', paymentMethod: 'auto', receiptNumber: 'RCP-2604-008' },
  { id: 'txn-009', type: 'expense', category: 'utilities', description: 'Gaz to\'lovi', amount: 720000, date: '2026-04-10', status: 'completed', paymentMethod: 'auto', receiptNumber: 'RCP-2604-009' },
  { id: 'txn-010', type: 'income', category: 'extra_classes', description: 'Ingliz tili kursi — 8 ta bola', amount: 4000000, date: '2026-04-10', status: 'completed', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-010' },
  { id: 'txn-011', type: 'expense', category: 'supplies', description: 'Sinf jihozlari — ruchka, daftar, bo\'yoqlar', amount: 1450000, date: '2026-04-09', status: 'completed', paymentMethod: 'card' },
  { id: 'txn-012', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Shaxzod Mirzayev', amount: 2500000, date: '2026-04-09', status: 'completed', childName: 'Shaxzod Mirzayev', childId: 'child-005', paymentMethod: 'card', receiptNumber: 'RCP-2604-012' },
  { id: 'txn-013', type: 'expense', category: 'salary', description: 'Xodim maoshi — Emily Davis', amount: 5800000, date: '2026-04-08', status: 'completed', employeeName: 'Emily Davis', employeeId: 'emp-003', paymentMethod: 'transfer' },
  { id: 'txn-014', type: 'expense', category: 'salary', description: 'Xodim maoshi — Alexander Petrov', amount: 12000000, date: '2026-04-08', status: 'completed', employeeName: 'Alexander Petrov', employeeId: 'emp-007', paymentMethod: 'transfer' },
  { id: 'txn-015', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Kamola Usmanova', amount: 2500000, date: '2026-04-08', status: 'completed', childName: 'Kamola Usmanova', childId: 'child-006', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-015' },
  { id: 'txn-016', type: 'expense', category: 'maintenance', description: 'O\'yin maydonchasi ta\'mirlash', amount: 4500000, date: '2026-04-07', status: 'completed', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-016' },
  { id: 'txn-017', type: 'income', category: 'events', description: 'Bahorgi bayram tadbiriga to\'lov', amount: 1500000, date: '2026-04-07', status: 'completed', paymentMethod: 'cash', receiptNumber: 'RCP-2604-017' },
  { id: 'txn-018', type: 'expense', category: 'food', description: 'Haftalik oziq-ovqat ta\'minoti', amount: 2800000, date: '2026-04-06', status: 'completed', paymentMethod: 'card' },
  { id: 'txn-019', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Zafar Yo\'ldoshev', amount: 2500000, date: '2026-04-06', status: 'failed', childName: 'Zafar Yo\'ldoshev', childId: 'child-007', paymentMethod: 'card', notes: 'Kartada mablag\' yetarli emas' },
  { id: 'txn-020', type: 'expense', category: 'marketing', description: 'Instagram reklama kampaniyasi', amount: 2000000, date: '2026-04-05', status: 'completed', paymentMethod: 'card', receiptNumber: 'RCP-2604-020' },
  { id: 'txn-021', type: 'income', category: 'registration', description: 'Yangi bola ro\'yxatdan o\'tishi — Dilshod Xasanov', amount: 500000, date: '2026-04-05', status: 'completed', childName: 'Dilshod Xasanov', paymentMethod: 'cash', receiptNumber: 'RCP-2604-021' },
  { id: 'txn-022', type: 'expense', category: 'salary', description: 'Xodim maoshi — Bobur Alimov (Oshpaz)', amount: 3800000, date: '2026-04-04', status: 'completed', employeeName: 'Bobur Alimov', employeeId: 'emp-009', paymentMethod: 'transfer' },
  { id: 'txn-023', type: 'expense', category: 'salary', description: 'Xodim maoshi — Dilnoza Yusupova', amount: 4200000, date: '2026-04-04', status: 'completed', employeeName: 'Dilnoza Yusupova', employeeId: 'emp-010', paymentMethod: 'transfer' },
  { id: 'txn-024', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Sardor Nurmatov', amount: 2500000, date: '2026-04-03', status: 'completed', childName: 'Sardor Nurmatov', childId: 'child-008', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-024' },
  { id: 'txn-025', type: 'expense', category: 'rent', description: 'Bino ijarasi — Aprel', amount: 15000000, date: '2026-04-01', status: 'completed', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-025' },
  { id: 'txn-026', type: 'expense', category: 'insurance', description: 'Yillik sug\'urta to\'lovi (chorak)', amount: 3500000, date: '2026-04-01', status: 'completed', paymentMethod: 'transfer', receiptNumber: 'RCP-2604-026' },
  { id: 'txn-027', type: 'income', category: 'tuition', description: 'Oylik to\'lov — Hurshida Karimova', amount: 2500000, date: '2026-04-01', status: 'completed', childName: 'Hurshida Karimova', childId: 'child-009', paymentMethod: 'auto', receiptNumber: 'RCP-2604-027' },

  // === MARCH 2026 ===
  { id: 'txn-028', type: 'income', category: 'tuition', description: 'Oylik to\'lovlar yig\'indisi — Mart', amount: 52500000, date: '2026-03-28', status: 'completed', paymentMethod: 'transfer', receiptNumber: 'RCP-2603-BATCH' },
  { id: 'txn-029', type: 'expense', category: 'salary', description: 'Barcha xodimlar maoshi — Mart', amount: 48600000, date: '2026-03-25', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-030', type: 'expense', category: 'food', description: 'Mart oyi ovqatlanish xarajatlari', amount: 11200000, date: '2026-03-20', status: 'completed', paymentMethod: 'card' },
  { id: 'txn-031', type: 'expense', category: 'utilities', description: 'Kommunal to\'lovlar — Mart', amount: 4100000, date: '2026-03-15', status: 'completed', paymentMethod: 'auto' },
  { id: 'txn-032', type: 'income', category: 'extra_classes', description: 'Qo\'shimcha darslar — Mart', amount: 8500000, date: '2026-03-10', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-033', type: 'expense', category: 'rent', description: 'Bino ijarasi — Mart', amount: 15000000, date: '2026-03-01', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-034', type: 'expense', category: 'taxes', description: 'Choraklik soliq to\'lovi', amount: 7800000, date: '2026-03-31', status: 'completed', paymentMethod: 'transfer' },

  // === FEBRUARY 2026 ===
  { id: 'txn-035', type: 'income', category: 'tuition', description: 'Oylik to\'lovlar yig\'indisi — Fevral', amount: 50000000, date: '2026-02-28', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-036', type: 'expense', category: 'salary', description: 'Barcha xodimlar maoshi — Fevral', amount: 47200000, date: '2026-02-25', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-037', type: 'expense', category: 'supplies', description: '8-Mart tayyorgarlik jihozlari', amount: 2800000, date: '2026-02-20', status: 'completed', paymentMethod: 'card' },
  { id: 'txn-038', type: 'expense', category: 'food', description: 'Fevral oyi ovqatlanish', amount: 10500000, date: '2026-02-18', status: 'completed', paymentMethod: 'card' },
  { id: 'txn-039', type: 'income', category: 'events', description: '23-Fevral bayrami — ota-onalar hissasi', amount: 2000000, date: '2026-02-22', status: 'completed', paymentMethod: 'cash' },
  { id: 'txn-040', type: 'expense', category: 'utilities', description: 'Kommunal — Fevral', amount: 5200000, date: '2026-02-10', status: 'completed', paymentMethod: 'auto' },

  // === JANUARY 2026 ===
  { id: 'txn-041', type: 'income', category: 'tuition', description: 'Oylik to\'lovlar yig\'indisi — Yanvar', amount: 47500000, date: '2026-01-28', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-042', type: 'expense', category: 'salary', description: 'Barcha xodimlar maoshi — Yanvar', amount: 46800000, date: '2026-01-25', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-043', type: 'expense', category: 'rent', description: 'Bino ijarasi — Yanvar', amount: 15000000, date: '2026-01-01', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-044', type: 'expense', category: 'maintenance', description: 'Qishki ta\'mirlash ishlari', amount: 6500000, date: '2026-01-15', status: 'completed', paymentMethod: 'transfer' },
  { id: 'txn-045', type: 'income', category: 'registration', description: 'Yangi bolalar ro\'yxatdan o\'tishi — 5 ta', amount: 2500000, date: '2026-01-10', status: 'completed', paymentMethod: 'cash' },
];

// ============================================
// Monthly Summary (for charts)
// ============================================

export const monthlyData: MonthlyFinanceSummary[] = [
  { month: '2025-07', monthLabel: 'Iyul',   income: 58000000,  expense: 62000000,  profit: -4000000 },
  { month: '2025-08', monthLabel: 'Avg',    income: 42000000,  expense: 38000000,  profit: 4000000 },
  { month: '2025-09', monthLabel: 'Sen',    income: 72000000,  expense: 65000000,  profit: 7000000 },
  { month: '2025-10', monthLabel: 'Okt',    income: 68000000,  expense: 61000000,  profit: 7000000 },
  { month: '2025-11', monthLabel: 'Noy',    income: 65000000,  expense: 63000000,  profit: 2000000 },
  { month: '2025-12', monthLabel: 'Dek',    income: 71000000,  expense: 70000000,  profit: 1000000 },
  { month: '2026-01', monthLabel: 'Yan',    income: 50000000,  expense: 68300000,  profit: -18300000 },
  { month: '2026-02', monthLabel: 'Fev',    income: 52000000,  expense: 65700000,  profit: -13700000 },
  { month: '2026-03', monthLabel: 'Mart',   income: 61000000,  expense: 86700000,  profit: -25700000 },
  { month: '2026-04', monthLabel: 'Aprel',  income: 28000000,  expense: 45620000,  profit: -17620000 },
];

// ============================================
// Category Summaries (current month)
// ============================================

export function getCategorySummaries(transactions: FinanceTransaction[], type: 'income' | 'expense'): CategorySummary[] {
  const filtered = transactions.filter(t => t.type === type && t.status === 'completed');
  const grouped: Record<string, { amount: number; count: number }> = {};

  filtered.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = { amount: 0, count: 0 };
    grouped[t.category].amount += t.amount;
    grouped[t.category].count += 1;
  });

  const totalAmount = Object.values(grouped).reduce((sum, g) => sum + g.amount, 0);

  return Object.entries(grouped)
    .map(([cat, data]) => ({
      category: cat as any,
      label: categoryConfig[cat]?.label || cat,
      amount: data.amount,
      color: categoryConfig[cat]?.color || '#94a3b8',
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}
