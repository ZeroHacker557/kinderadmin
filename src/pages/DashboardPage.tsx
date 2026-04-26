import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, UserCheck, Clock, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttendanceRecord, Child, Employee, FinanceTransaction } from '@/types';
import { subscribeAttendance, subscribeChildren, subscribeEmployees, subscribeTransactions } from '@/services/firestore';
import { downloadCsv } from '@/utils/csv';
import { formatDateDisplay } from '@/utils/date';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { kindergartenId } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!kindergartenId) return;
    let checks = 0;
    const checkOff = () => {
      checks++;
      if (checks >= 4) {
        setIsLoading(false);
      }
    };

    const unsubs = [
      subscribeChildren(kindergartenId, (d) => { setChildren(d); checkOff(); }),
      subscribeEmployees(kindergartenId, (d) => { setEmployees(d); checkOff(); }),
      subscribeTransactions(kindergartenId, (d) => { setTransactions(d); checkOff(); }),
      subscribeAttendance(kindergartenId, new Date().toISOString().slice(0, 10), (d: any) => { setAttendance(d); checkOff(); }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [kindergartenId]);

  const currentDate = new Date().toLocaleDateString(t('dashboard.locale', 'uz-UZ'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const monthTx = transactions.filter((tx) => tx.date.startsWith(currentMonth));
    const completedIncome = monthTx.filter((tx) => tx.type === 'income' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
    const completedExpense = monthTx.filter((tx) => tx.type === 'expense' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
    const pendingPayments = monthTx.filter((tx) => tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);
    const activeChildren = children.filter((c) => c.status === 'active').length;
    const activeEmployees = employees.filter((e) => e.status === 'active').length;

    // Previous month comparison
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);
    const prevMonthTx = transactions.filter((tx) => tx.date.startsWith(prevMonth));
    const prevIncome = prevMonthTx.filter((tx) => tx.type === 'income' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
    const prevPending = prevMonthTx.filter((tx) => tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);

    const incomeChange = prevIncome > 0 ? Math.round(((completedIncome - prevIncome) / prevIncome) * 100) : completedIncome > 0 ? 100 : 0;
    const pendingChange = prevPending > 0 ? Math.round(((pendingPayments - prevPending) / prevPending) * 100) : pendingPayments > 0 ? 100 : 0;

    return { completedIncome, completedExpense, pendingPayments, activeChildren, activeEmployees, incomeChange, pendingChange };
  }, [children, employees, transactions, currentMonth]);

  const recentTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(
    () => attendance.filter((a) => (a.date || a.checkIn?.slice(0, 10)) === today).slice(0, 6),
    [attendance, today],
  );
  const attendanceSummary = useMemo(() => {
    const activeChildrenCount = stats.activeChildren;
    if (!activeChildrenCount) {
      return { todayPercent: 0, changeFromYesterday: 0 };
    }

    const getDateFromAttendance = (record: AttendanceRecord) => record.date || record.checkIn?.slice(0, 10) || '';
    const isPresentToday = (record: AttendanceRecord) => record.status === 'present' || record.status === 'late';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    const todayPresentCount = attendance.filter((record) => getDateFromAttendance(record) === today && isPresentToday(record)).length;
    const yesterdayPresentCount = attendance.filter((record) => getDateFromAttendance(record) === yesterdayDate && isPresentToday(record)).length;

    const todayPercent = Math.round((todayPresentCount / activeChildrenCount) * 100);
    const yesterdayPercent = Math.round((yesterdayPresentCount / activeChildrenCount) * 100);

    return {
      todayPercent,
      changeFromYesterday: todayPercent - yesterdayPercent,
    };
  }, [attendance, today, stats.activeChildren]);

  const last7Days = useMemo(() => {
    // Last 7 days chart (completed transactions)
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const map = new Map<string, { income: number; expense: number }>();
    days.forEach((d) => map.set(d, { income: 0, expense: 0 }));
    transactions.forEach((tx) => {
      if (tx.status !== 'completed') return;
      if (!map.has(tx.date)) return;
      const current = map.get(tx.date)!;
      if (tx.type === 'income') current.income += tx.amount;
      else current.expense += tx.amount;
    });

    return days.map((d) => ({
      date: d,
      label: d.slice(5).replace('-', '.'),
      income: map.get(d)!.income,
      expense: map.get(d)!.expense,
    }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }

    const map = new Map<string, { income: number; expense: number }>();
    months.forEach(m => map.set(m, { income: 0, expense: 0 }));

    transactions.forEach(tx => {
      if (tx.status !== 'completed') return;
      const m = tx.date.slice(0, 7);
      if (!map.has(m)) return;
      const current = map.get(m)!;
      if (tx.type === 'income') current.income += tx.amount;
      else current.expense += tx.amount;
    });

    return months.map(m => {
      const dateObj = new Date(m + '-01');
      const monthName = dateObj.toLocaleDateString('uz-UZ', { month: 'short' });
      return {
        name: monthName,
        Daromad: map.get(m)!.income,
        Xarajat: map.get(m)!.expense,
      };
    });
  }, [transactions]);

  const childrenGenderData = useMemo(() => {
    const male = children.filter(c => c.gender === 'male').length;
    const female = children.filter(c => c.gender === 'female').length;
    return [
      { name: "O'g'il bolalar", value: male, color: '#3b82f6' },
      { name: 'Qiz bolalar', value: female, color: '#ec4899' },
    ];
  }, [children]);

  const exportDashboard = () => {
    downloadCsv(`dashboard-report-${currentMonth}.csv`, [
      {
        activeChildren: stats.activeChildren,
        activeEmployees: stats.activeEmployees,
        monthlyIncome: stats.completedIncome,
        pendingPayments: stats.pendingPayments,
      },
    ]);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden rounded-3xl border border-border-default bg-surface-primary"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-emerald-500/5 to-purple-500/8" />
        <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
              {t('dashboard.title', 'Boshqaruv paneli')}
            </h1>
            <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">
              {currentDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportDashboard}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default bg-surface-primary/60 backdrop-blur text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden xs:inline">{t('common.downloadReport', 'Hisobot')}</span>
            </button>
          </div>
        </div>

        {/* Mini chart */}
        <div className="relative px-4 sm:px-6 pb-5 sm:pb-6">
          <div className="rounded-2xl border border-border-subtle bg-surface-primary/60 backdrop-blur p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('dashboard.charts.incomeExpense', 'Daromad va Xarajat')}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">
                  {t('dashboard.charts.last7Days', "So'nggi 7 kun")}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('dashboard.charts.income', 'Daromad')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> {t('dashboard.charts.expense', 'Xarajat')}
                </span>
              </div>
            </div>

            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
                    labelFormatter={(v) => String(v)}
                    formatter={(value: any) => [`${value.toLocaleString()} so'm`]}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#dashIncome)" dot={false} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#dashExpense)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.totalChildren', 'Jami bolalar')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1">{stats.activeChildren}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-tertiary">{t('common.status', 'Holat')}</span>
              <span className="font-semibold text-emerald-700">{t('children.status.active', 'Faol')}</span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('employees.page.stats.activeEmployees', 'Faol xodimlar')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1">{stats.activeEmployees}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-tertiary">{t('common.total', 'Jami')}</span>
              <span className="font-semibold text-text-secondary">{employees.length}</span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.monthlyIncome', 'Oylik daromad')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 truncate">
                  {stats.completedIncome.toLocaleString()} {t('common.currency', "so'm")}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-tertiary">{t('dashboard.stats.vsLastMonth', "O'tgan oyga nisbatan")}</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${stats.incomeChange >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {stats.incomeChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {stats.incomeChange > 0 ? '+' : ''}{stats.incomeChange}%
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.todayAttendance', "Bugungi davomat")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 truncate">
                  {attendanceSummary.todayPercent}%
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-tertiary">{t('dashboard.fromYesterday', 'kechagidan')}</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  attendanceSummary.changeFromYesterday > 0
                    ? 'text-emerald-700'
                    : attendanceSummary.changeFromYesterday < 0
                      ? 'text-red-600'
                      : 'text-text-secondary'
                }`}
              >
                {attendanceSummary.changeFromYesterday > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : attendanceSummary.changeFromYesterday < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : null}
                {attendanceSummary.changeFromYesterday > 0 ? '+' : ''}
                {attendanceSummary.changeFromYesterday}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">Oylik moliyaviy hisobot</h3>
            <p className="text-xs text-text-tertiary">Oxirgi 6 oylik daromad va xarajatlar tahlili</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                  formatter={(value: any) => [`${value.toLocaleString()} so'm`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Daromad" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Xarajat" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">Bolalar tarkibi</h3>
            <p className="text-xs text-text-tertiary">O'g'il va qiz bolalar nisbati</p>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={childrenGenderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {childrenGenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                  formatter={(value: any) => [`${value} nafar`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Lists */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        <div className="xl:col-span-3 bg-surface-primary rounded-2xl border border-border-default overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">{t('dashboard.recentTransactions', 'Oxirgi tranzaksiyalar')}</h3>
              <p className="text-xs text-text-tertiary mt-0.5">{t('dashboard.recentDesc', 'Oxirgi moliyaviy faoliyat')}</p>
            </div>
          </div>
          <div className="divide-y divide-border-subtle">
            {recentTransactions.length === 0 ? (
              <div className="px-4 sm:px-5 py-6 text-sm text-text-tertiary">{t('common.empty', "Ma'lumot topilmadi")}</div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="px-4 sm:px-5 py-3 hover:bg-surface-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{formatDateDisplay(tx.date, 'dd.MM.yyyy')}</p>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {tx.amount.toLocaleString()} {t('common.currency', "so'm")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-surface-primary rounded-2xl border border-border-default overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle">
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">{t('dashboard.stats.todayAttendance', 'Bugungi davomat')}</h3>
            <p className="text-xs text-text-tertiary mt-0.5">{t('dashboard.attendanceDesc', "Davomat (oxirgi yozuvlar)")}</p>
          </div>
          <div className="divide-y divide-border-subtle">
            {todayAttendance.length === 0 ? (
              <div className="px-4 sm:px-5 py-6 text-sm text-text-tertiary">{t('common.empty', "Ma'lumot topilmadi")}</div>
            ) : (
              todayAttendance.map((a) => (
                <div key={a.id} className="px-4 sm:px-5 py-3 hover:bg-surface-secondary/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{a.childName}</p>
                      <p className="text-xs text-text-tertiary truncate mt-0.5">{a.group}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        a.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.status === 'late'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {a.status === 'present'
                        ? t('common.statusPresent', 'Keldi')
                        : a.status === 'late'
                          ? t('common.statusLate', 'Kechikdi')
                          : t('common.statusAbsent', 'Kelmadi')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
