import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, UserCheck, Clock, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttendanceRecord, Child, Employee, FinanceTransaction } from '@/types';
import { subscribeAttendance, subscribeChildren, subscribeEmployees, subscribeTransactions } from '@/services/firestore';
import { downloadCsv } from '@/utils/csv';
import { formatDateDisplay } from '@/utils/date';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [children, setChildren] = useState<Child[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeChildren(setChildren),
      subscribeEmployees(setEmployees),
      subscribeTransactions(setTransactions),
      subscribeAttendance(setAttendance),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  const currentDate = new Date().toLocaleDateString(t('dashboard.locale', 'uz-UZ'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const monthTx = transactions.filter((tx) => tx.date.startsWith(currentMonth));
    const completedIncome = monthTx.filter((tx) => tx.type === 'income' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
    const pendingPayments = monthTx.filter((tx) => tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);
    const activeChildren = children.filter((c) => c.status === 'active').length;
    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    return { completedIncome, pendingPayments, activeChildren, activeEmployees };
  }, [children, employees, transactions, currentMonth]);

  const recentTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);
  const todayAttendance = useMemo(() => attendance.slice(0, 6), [attendance]);

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
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/8 via-emerald-500/5 to-purple-500/8" />
        <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-navy-900/10 blur-3xl" />

        <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
              {t('dashboard.title')}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                    labelFormatter={(v) => String(v)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.totalChildren')}</p>
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
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.activeGroups', 'Faol xodimlar')}</p>
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
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.monthlyIncome')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 truncate">
                {stats.completedIncome.toLocaleString()} {t('common.currency', "so'm")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-text-tertiary">{t('finances.status.completed', 'Bajarildi')}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {t('dashboard.noChange', 'Без изменений')}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-surface-primary rounded-2xl border border-border-default p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.05] transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('dashboard.stats.todayAttendance', "Kutilayotgan to'lovlar")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 truncate">
                {stats.pendingPayments.toLocaleString()} {t('common.currency', "so'm")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-text-tertiary">{t('finances.status.pending', 'Kutilmoqda')}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {t('dashboard.noChange', 'Без изменений')}
            </span>
          </div>
        </div>
      </div>

      {/* Lists */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        <div className="xl:col-span-3 bg-surface-primary rounded-2xl border border-border-default overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">{t('dashboard.recentTransactions')}</h3>
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
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">{t('dashboard.stats.todayAttendance')}</h3>
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
