import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search, Plus, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, TrendingDown, DollarSign, Wallet, Clock,
  ArrowDownRight, ArrowUpRight, MoreHorizontal, Eye, FileText,
  X, Receipt, CheckCircle2, XCircle, AlertCircle, Ban,
} from 'lucide-react';
import {
  categoryConfig,
  getCategorySummaries, paymentMethodLabels,
} from '@/data/financesData';
import AddTransactionModal, { type TransactionFormData } from '@/components/finances/AddTransactionModal';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import type {
  Child,
  ChildPayment,
  Employee,
  FinanceTransaction, FinanceFilters, FinanceSortConfig, FinanceSortField,
} from '@/types';
import { createTransaction, subscribeChildren, subscribeEmployees, subscribeTransactions, updateChild, updateEmployee } from '@/services/firestore';
import { downloadCsv } from '@/utils/csv';
import { formatDateDisplay } from '@/utils/date';

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1000000000) return sign + (abs / 1000000000).toFixed(1) + ' mlrd';
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(0) + 'K';
  return sign + abs.toString();
}

function isInRange(dateStr: string, range: string): boolean {
  if (range === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  switch (range) {
    case 'today': return d.toDateString() === now.toDateString();
    case 'week': { const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }
    case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case 'quarter': { const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); return d >= qStart; }
    default: return true;
  }
}

const ITEMS_PER_PAGE = 10;
const childLinkedIncomeCategories = new Set(['tuition', 'registration']);
const employeeLinkedExpenseCategories = new Set(['salary']);

// ============================================
// MAIN PAGE
// ============================================

export default function FinancesPage() {
  const { t } = useTranslation();
  const locale = t('common.locale', 'uz-UZ');
  const currency = t('common.currency', "so'm");

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeTransactions(setTransactions),
      subscribeChildren(setChildren),
      subscribeEmployees(setEmployees),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const chartMonthlyData = useMemo(() => {
    const formatMonthLabel = (month: string) => {
      // month is in "YYYY-MM" format in data
      const d = new Date(`${month}-01T00:00:00`);
      if (Number.isNaN(d.getTime())) return month;
      return d.toLocaleDateString(locale, { month: 'short' });
    };

    const grouped = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      if (tx.status !== 'completed') return;
      const month = tx.date.slice(0, 7);
      const current = grouped.get(month) ?? { income: 0, expense: 0 };
      if (tx.type === 'income') current.income += tx.amount;
      else current.expense += tx.amount;
      grouped.set(month, current);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        income: values.income,
        expense: values.expense,
        profit: values.income - values.expense,
      }));
  }, [locale, transactions]);

  const statusConfig = {
    completed: { label: t('finances.status.completed', 'Bajarildi'), bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
    pending:   { label: t('finances.status.pending', 'Kutilmoqda'), bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    failed:    { label: t('finances.status.failed', 'Muvaffaqiyatsiz'), bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
    cancelled: { label: t('finances.status.cancelled', 'Bekor qilingan'), bg: 'bg-gray-100', text: 'text-gray-600', icon: Ban },
  } as const;

  const dateRangeLabels: Record<string, string> = {
    all: t('finances.dateRanges.all', 'Barchasi'),
    today: t('finances.dateRanges.today', 'Bugun'),
    week: t('finances.dateRanges.week', 'Shu hafta'),
    month: t('finances.dateRanges.month', 'Shu oy'),
    quarter: t('finances.dateRanges.quarter', 'Shu chorak'),
  };

  const formatFullAmount = (amount: number): string =>
    amount.toLocaleString(locale) + ' ' + currency;

  const formatDate = (dateStr: string): string => formatDateDisplay(dateStr, 'dd.MM.yyyy');

  function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
      <div className="bg-surface-primary rounded-xl shadow-lg border border-border-default p-3 text-xs">
        <p className="font-semibold text-text-primary mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 py-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-text-tertiary">
              {p.name === 'income'
                ? t('finances.types.income', 'Daromad')
                : p.name === 'expense'
                  ? t('finances.types.expense', 'Xarajat')
                  : t('finances.types.profit', 'Foyda')}
              :
            </span>
            <span className="font-semibold text-text-primary">{formatFullAmount(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area');
  const [filters, setFilters] = useState<FinanceFilters>({
    search: '', type: '', category: '', status: '', dateRange: 'all', paymentMethod: '',
  });
  const [sort, setSort] = useState<FinanceSortConfig>({ field: 'date', direction: 'desc' });

  const activeFilterCount = [filters.type, filters.category, filters.status, filters.paymentMethod, filters.dateRange !== 'all' ? filters.dateRange : ''].filter(Boolean).length;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.description.toLowerCase().includes(q) &&
          !(t.childName || '').toLowerCase().includes(q) &&
          !(t.employeeName || '').toLowerCase().includes(q) &&
          !(t.receiptNumber || '').toLowerCase().includes(q)
        ) return false;
      }
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false;
      if (!isInRange(t.date, filters.dateRange)) return false;
      return true;
    });
    result.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'date': return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'amount': return dir * (a.amount - b.amount);
        case 'category': return dir * a.category.localeCompare(b.category);
        case 'status': return dir * a.status.localeCompare(b.status);
        case 'description': return dir * a.description.localeCompare(b.description);
        default: return 0;
      }
    });
    return result;
  }, [transactions, filters, sort]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSort = (field: FinanceSortField) =>
    setSort(prev => prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'desc' });
  const SortIcon = ({ field }: { field: FinanceSortField }) => {
    if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />;
    return sort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-text-primary" /> : <ArrowDown className="w-3 h-3 text-text-primary" />;
  };
  const clearFilters = () => { setFilters({ search: '', type: '', category: '', status: '', dateRange: 'all', paymentMethod: '' }); setCurrentPage(1); };
  const handleExport = () => {
    if (!filteredTransactions.length) {
      alert(t('common.noDataToExport', "Eksport uchun ma'lumot yo'q"));
      return;
    }
    downloadCsv('finance-report.csv', filteredTransactions.map((t) => ({
      date: t.date,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: t.amount,
      status: t.status,
      paymentMethod: t.paymentMethod ?? '',
      receiptNumber: t.receiptNumber ?? '',
    })));
  };

  const handleCreateTransaction = async (data: TransactionFormData) => {
    if (!data.category) return;
    const amount = Number(data.amount || 0);
    const shouldLinkChild = data.type === 'income' && childLinkedIncomeCategories.has(data.category);
    const selectedChild = shouldLinkChild && data.childId ? children.find((child) => child.id === data.childId) : undefined;
    const resolvedChildName = selectedChild
      ? `${selectedChild.firstName} ${selectedChild.lastName}`
      : (data.childName || undefined);
    const shouldLinkEmployee = data.type === 'expense' && employeeLinkedExpenseCategories.has(data.category);
    const selectedEmployee = shouldLinkEmployee && data.employeeId ? employees.find((employee) => employee.id === data.employeeId) : undefined;
    const resolvedEmployeeName = selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : (data.employeeName || undefined);

    try {
      const payload: Omit<FinanceTransaction, 'id'> = {
        type: data.type,
        category: data.category as FinanceTransaction['category'],
        description: data.description,
        amount,
        date: data.date,
        status: 'completed',
        childId: selectedChild?.id,
        childName: resolvedChildName,
        employeeId: selectedEmployee?.id,
        employeeName: resolvedEmployeeName,
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber || undefined,
        notes: data.notes || undefined,
      };
      const created = await createTransaction(payload);

      if (shouldLinkChild && selectedChild && amount > 0) {
        const month = data.date.slice(0, 7);
        const lastDayOfMonth = new Date(new Date(data.date).getFullYear(), new Date(data.date).getMonth() + 1, 0)
          .toISOString()
          .slice(0, 10);
        const existingPayment = selectedChild.payments.find((payment) => payment.month === month);

        const nextPayments: ChildPayment[] = existingPayment
          ? selectedChild.payments.map((payment) => {
              if (payment.month !== month) return payment;
              const nextPaidAmount = payment.paidAmount + amount;
              const targetAmount = Math.max(payment.amount, amount);
              return {
                ...payment,
                amount: targetAmount,
                paidAmount: nextPaidAmount,
                status: (nextPaidAmount >= targetAmount ? 'paid' : 'partial') as ChildPayment['status'],
                paidDate: data.date,
              };
            })
          : [
              {
                id: `pay-${Date.now()}`,
                month,
                amount,
                paidAmount: amount,
                status: 'paid' as const,
                dueDate: lastDayOfMonth,
                paidDate: data.date,
              },
              ...selectedChild.payments,
            ];

        const updatedChild: Child = {
          ...selectedChild,
          payments: [...nextPayments].sort((a, b) => b.month.localeCompare(a.month)),
        };
        await updateChild(updatedChild);
      }

      if (shouldLinkEmployee && selectedEmployee && amount > 0) {
        await updateEmployee({
          ...selectedEmployee,
          lastSalaryPaymentDate: data.date,
          lastSalaryPaymentAmount: amount,
        });
      }

      setTransactions((prev) => {
        const next = [{ ...payload, id: created.id }, ...prev];
        const seen = new Set<string>();
        return next.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
      setShowAddModal(false);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Tranzaksiya saqlashda xatolik");
    }
  };

  // Summary stats
  const currentMonthTransactions = transactions.filter(t => isInRange(t.date, 'month'));
  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;
  const pendingAmount = currentMonthTransactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  // Category summaries
  const incomeSummaries = getCategorySummaries(currentMonthTransactions, 'income');
  const expenseSummaries = getCategorySummaries(currentMonthTransactions, 'expense');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{t('finances.title')}</h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
            {t('finances.currentPeriodLabel', 'Aprel 2026')} • {currentMonthTransactions.length} {t('finances.transactionsCount', 'ta tranzaksiya')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredTransactions.length}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('common.downloadReport')}</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{t('finances.addTransaction')}</span>
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 truncate">{formatAmount(totalIncome)}</p>
              <p className="text-[10px] sm:text-xs text-text-tertiary">{t('finances.stats.totalIncome')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatAmount(totalExpense)}</p>
              <p className="text-[10px] sm:text-xs text-text-tertiary">{t('finances.stats.totalExpense')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${profit >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
              <Wallet className={`w-5 h-5 ${profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-lg sm:text-2xl font-bold truncate ${profit >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {profit >= 0 ? '+' : ''}{formatAmount(profit)}
              </p>
              <p className="text-[10px] sm:text-xs text-text-tertiary">{t('finances.stats.netProfit')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-purple-700 truncate">{formatAmount(pendingAmount)}</p>
              <p className="text-[10px] sm:text-xs text-text-tertiary">{t('finances.stats.pending')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">{t('finances.charts.incomeExpense', 'Daromad va Xarajat')}</h3>
              <p className="text-xs text-text-tertiary mt-0.5">{t('finances.charts.last10Months', "So'nggi 10 oy")}</p>
            </div>
            <div className="flex items-center border border-border-default rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveChart('area')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === 'area' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                {t('finances.chartTypes.line')}
              </button>
              <button
                onClick={() => setActiveChart('bar')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === 'bar' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                {t('finances.chartTypes.bar')}
              </button>
            </div>
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'area' ? (
                <AreaChart data={chartMonthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatAmount(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="income" name="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="expense" name="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#ef4444' }} />
                </AreaChart>
              ) : (
                <BarChart data={chartMonthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatAmount(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-text-tertiary">{t('finances.types.income')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-text-tertiary">{t('finances.types.expense')}</span>
            </div>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5"
        >
          <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-4">{t('finances.categoriesTitle')}</h3>

          {/* Income categories */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{t('finances.types.income')}</span>
            </div>
            <div className="space-y-2">
              {incomeSummaries.slice(0, 4).map(cat => (
                <div key={cat.category} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <span>{categoryConfig[cat.category]?.icon}</span>
                      {cat.label}
                    </span>
                    <span className="font-semibold text-text-primary">{formatAmount(cat.amount)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">{t('finances.types.expense')}</span>
            </div>
            <div className="space-y-2">
              {expenseSummaries.slice(0, 5).map(cat => (
                <div key={cat.category} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <span>{categoryConfig[cat.category]?.icon}</span>
                      {cat.label}
                    </span>
                    <span className="font-semibold text-text-primary">{formatAmount(cat.amount)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Date range quick filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        {Object.entries(dateRangeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilters(prev => ({ ...prev, dateRange: key as any })); setCurrentPage(1); }}
            className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
              filters.dateRange === key
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-surface-primary border-border-default text-text-secondary hover:border-navy-200'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setFilters(prev => ({ ...prev, type: prev.type === 'income' ? '' : 'income' })); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              filters.type === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border-default text-emerald-700 hover:border-emerald-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> {t('finances.types.income')}
          </button>
          <button
            onClick={() => { setFilters(prev => ({ ...prev, type: prev.type === 'expense' ? '' : 'expense' })); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              filters.type === 'expense' ? 'bg-red-600 text-white border-red-600' : 'border-border-default text-red-600 hover:border-red-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> {t('finances.types.expense')}
          </button>
        </div>
      </motion.div>

      {/* Transactions table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-surface-primary rounded-2xl border border-border-default"
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border-subtle">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={e => { setFilters(prev => ({ ...prev, search: e.target.value })); setCurrentPage(1); }}
              placeholder={t('finances.searchPlaceholder', "Tranzaksiya, bola yoki xodim bo'yicha qidiring...")}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/20 transition-all duration-200"
            />
            {filters.search && (
              <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
              showFilters || activeFilterCount > 0 ? 'bg-navy-900 text-white border-navy-900' : 'border-border-default text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('common.filter')}</span>
            {activeFilterCount > 0 && (
              <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${showFilters ? 'bg-surface-primary text-text-primary' : 'bg-navy-900 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-3 sm:px-4 py-3 border-b border-border-subtle bg-surface-secondary/20">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={filters.status}
                onChange={e => { setFilters(prev => ({ ...prev, status: e.target.value as any })); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              >
                <option value="">{t('finances.filters.allStatuses', 'Barcha holatlar')}</option>
                <option value="completed">{t('finances.status.completed', 'Bajarildi')}</option>
                <option value="pending">{t('finances.status.pending', 'Kutilmoqda')}</option>
                <option value="failed">{t('finances.status.failed', 'Muvaffaqiyatsiz')}</option>
                <option value="cancelled">{t('finances.status.cancelled', 'Bekor qilingan')}</option>
              </select>
              <select
                value={filters.category}
                onChange={e => { setFilters(prev => ({ ...prev, category: e.target.value as any })); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              >
                <option value="">{t('finances.filters.allCategories', 'Barcha kategoriyalar')}</option>
                <optgroup label={t('finances.types.income', 'Daromad')}>
                  {['tuition', 'registration', 'extra_classes', 'events', 'other_income'].map(c => (
                    <option key={c} value={c}>{categoryConfig[c]?.icon} {categoryConfig[c]?.label}</option>
                  ))}
                </optgroup>
                <optgroup label={t('finances.types.expense', 'Xarajat')}>
                  {['salary', 'rent', 'utilities', 'food', 'supplies', 'maintenance', 'marketing', 'taxes', 'insurance', 'other_expense'].map(c => (
                    <option key={c} value={c}>{categoryConfig[c]?.icon} {categoryConfig[c]?.label}</option>
                  ))}
                </optgroup>
              </select>
              <select
                value={filters.paymentMethod}
                onChange={e => { setFilters(prev => ({ ...prev, paymentMethod: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              >
                <option value="">{t('finances.filters.allMethods', 'Barcha usullar')}</option>
                <option value="cash">{t('finances.methods.cash', '💵 Naqd')}</option>
                <option value="card">{t('finances.methods.card', '💳 Karta')}</option>
                <option value="transfer">{t('finances.methods.transfer', "🏦 O'tkazma")}</option>
                <option value="auto">{t('finances.methods.auto', '⚡ Avtomatik')}</option>
              </select>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                  {t('common.clearFilters')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-border-subtle">
          {filteredTransactions.length > 0 ? (
            paginatedTransactions.map((txn, index) => {
              const st = statusConfig[txn.status];
              const catConf = categoryConfig[txn.category];
              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className="px-3 py-3 hover:bg-surface-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${txn.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {catConf?.icon || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-tertiary">{formatDate(txn.date)}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{st.label}</span>
                      </div>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${txn.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatAmount(txn.amount)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : null}
        </div>

        {/* Desktop table */}
        {filteredTransactions.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left">
                    <button onClick={() => toggleSort('date')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-4 py-3 hover:text-text-primary transition-colors">
                      {t('finances.table.date', 'Sana')} <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-left">
                    <button onClick={() => toggleSort('description')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                      {t('finances.table.description', 'Tavsif')} <SortIcon field="description" />
                    </button>
                  </th>
                  <th className="text-left hidden lg:table-cell">
                    <button onClick={() => toggleSort('category')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                      {t('finances.table.category', 'Kategoriya')} <SortIcon field="category" />
                    </button>
                  </th>
                  <th className="text-left hidden md:table-cell">
                    <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3">{t('finances.table.method', 'Usul')}</span>
                  </th>
                  <th className="text-center">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors mx-auto">
                      {t('finances.table.status', 'Holat')} <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button onClick={() => toggleSort('amount')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-4 py-3 hover:text-text-primary transition-colors ml-auto">
                      {t('finances.table.amount', 'Summa')} <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn, index) => {
                  const st = statusConfig[txn.status];
                  const catConf = categoryConfig[txn.category];
                  const StatusIcon = st.icon;
                  return (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025, duration: 0.25 }}
                      className="border-b border-border-subtle last:border-0 hover:bg-surface-secondary/50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">{formatDate(txn.date)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${txn.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {catConf?.icon || '💰'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate max-w-[220px] lg:max-w-[300px]">{txn.description}</p>
                            {txn.receiptNumber && (
                              <p className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1">
                                <Receipt className="w-3 h-3" /> {txn.receiptNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border-subtle" style={{ color: catConf?.color, backgroundColor: catConf?.color + '10' }}>
                          {catConf?.label || txn.category}
                        </span>
                      </td>
                      <td className="px-2 py-3 hidden md:table-cell">
                        <span className="text-xs text-text-secondary">
                          {txn.paymentMethod ? paymentMethodLabels[txn.paymentMethod] || txn.paymentMethod : '—'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.bg} ${st.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${txn.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                          {txn.type === 'income' ? '+' : '-'}{formatFullAmount(txn.amount)}
                        </span>
                      </td>
                      <td className="px-2 py-3 relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setContextMenu(contextMenu === txn.id ? null : txn.id)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {contextMenu === txn.id && (
                          <div className="absolute right-2 top-full mt-1 w-48 bg-surface-primary rounded-xl shadow-lg border border-border-default py-1 z-20">
                            <button onClick={() => setContextMenu(null)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                              <Eye className="w-3.5 h-3.5" /> {t('common.viewAll', "Batafsil ko'rish")}
                            </button>
                            <button onClick={() => setContextMenu(null)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" /> {t('finances.actions.downloadReceipt', 'Kvitansiya yuklab olish')}
                            </button>
                            <button onClick={() => setContextMenu(null)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5" /> {t('finances.actions.reportIssue', 'Muammoni xabar qilish')}
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {filteredTransactions.length === 0 && (
          <EmptyState
            icon={<DollarSign className="w-6 h-6 text-text-tertiary" />}
            title={t('finances.empty.title', 'Tranzaksiyalar topilmadi')}
            description={filters.search || activeFilterCount > 0
              ? t('finances.empty.filteredDesc', "Qidiruv yoki filtrlarni o'zgartirib ko'ring.")
              : t('finances.empty.newDesc', "\"Tranzaksiya\" tugmasi orqali birinchi tranzaksiyani kiriting.")}
            action={
              filters.search || activeFilterCount > 0
                ? <button onClick={clearFilters} className="px-4 py-2 rounded-xl border border-border-default text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.clearFilters', 'Filtrlarni tozalash')}</button>
                : <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"><Plus className="w-4 h-4 inline mr-1.5" />{t('finances.empty.addFirst', "Birinchi tranzaksiyani qo'shish")}</button>
            }
          />
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>

      {/* Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTransaction}
        children={children}
        employees={employees}
      />
    </div>
  );
}
