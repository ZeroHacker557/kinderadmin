import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, UserX, Users, ListChecks, Download, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import type { AttendanceRecord, Child, GroupInfo } from '@/types';
import {
  saveAttendanceForDay,
  setAttendanceDayClosed,
  subscribeAttendanceByDate,
  subscribeAttendanceByDateRange,
  subscribeAttendanceDay,
  subscribeChildren,
  subscribeGroups,
} from '@/services/firestore';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { downloadCsv } from '@/utils/csv';
import { formatDateDisplay } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';

type AttendanceStatus = 'present' | 'absent' | 'late';

const ITEMS_PER_PAGE = 12;

export default function AttendancePage() {
  const { t } = useTranslation();
  const { kindergartenId } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [dayClosed, setDayClosed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [historyMode, setHistoryMode] = useState<'day' | 'month' | 'range' | 'all'>('day');
  const [historyRange, setHistoryRange] = useState<{ from: string; to: string }>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return { from: today, to: today };
  });
  const [historyStatus, setHistoryStatus] = useState<'' | AttendanceStatus>('');
  const [historyQuery, setHistoryQuery] = useState<string>('');
  const [historyOpenMobile, setHistoryOpenMobile] = useState(false);

  useEffect(() => {
    if (!kindergartenId) return;
    const unsubs = [subscribeChildren(kindergartenId, setChildren), subscribeGroups(kindergartenId, setGroups)];
    return () => unsubs.forEach((u) => u());
  }, [kindergartenId]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    if (!selectedGroupId) {
      setDayRecords([]);
      setDayClosed(false);
      setDraft({});
      return;
    }

    const unsubMeta = subscribeAttendanceDay(kindergartenId!, selectedGroupId, selectedDate, (meta: any) => {
      setDayClosed(Boolean(meta?.closed));
    });
    const unsubRecords = subscribeAttendanceByDate(kindergartenId!, selectedDate, (rows: AttendanceRecord[]) => {
      setDayRecords(rows.filter((r: AttendanceRecord) => r.groupId === selectedGroupId));
    });
    return () => {
      unsubMeta();
      unsubRecords();
    };
  }, [kindergartenId, selectedGroupId, selectedDate]);

  useEffect(() => {
    // history for this group and month (simple)
    if (!selectedGroupId) {
      setHistory([]);
      return;
    }
    const monthStart = `${selectedDate.slice(0, 7)}-01`;
    const monthEnd = new Date(
      Number(selectedDate.slice(0, 4)),
      Number(selectedDate.slice(5, 7)),
      0,
    )
      .toISOString()
      .slice(0, 10);

    const unsub = subscribeAttendanceByDateRange(kindergartenId!, monthStart, monthEnd, (rows: AttendanceRecord[]) => {
      setHistory(rows.filter((r: AttendanceRecord) => r.groupId === selectedGroupId));
    });
    return () => unsub();
  }, [kindergartenId, selectedGroupId, selectedDate]);

  const childrenInGroup = useMemo(
    () =>
      children
        .filter((c) => (selectedGroupId ? c.groupId === selectedGroupId : false))
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [children, selectedGroupId],
  );

  useEffect(() => {
    // reset draft from existing records
    const next: Record<string, AttendanceStatus> = {};
    childrenInGroup.forEach((c) => {
      const rec = dayRecords.find((r) => r.childId === c.id);
      next[c.id] = (rec?.status ?? 'absent') as AttendanceStatus;
    });
    setDraft(next);
  }, [childrenInGroup, dayRecords]);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  const todayRows = childrenInGroup.map((child) => ({
    child,
    status: draft[child.id] ?? 'absent',
  }));

  const handleToggleStatus = (childId: string, status: AttendanceStatus) => {
    if (!isToday || dayClosed) return;
    setSaveError(null);
    setDraft((prev) => ({ ...prev, [childId]: status }));
  };

  const handleReopenDay = async () => {
    if (!selectedGroup) return;
    setIsReopening(true);
    setSaveError(null);
    try {
      await setAttendanceDayClosed(kindergartenId!, {
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        date: selectedDate,
        closed: false,
      });
      toast.success(t('attendance.daily.reopened', "Davomat qayta ochildi"));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Davomatni ochishda xatolik";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsReopening(false);
    }
  };

  const handleSaveDay = async () => {
    if (!selectedGroup || !isToday || dayClosed) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveAttendanceForDay(kindergartenId!, {
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        date: selectedDate,
        rows: childrenInGroup.map((c) => ({
          childId: c.id,
          childName: `${c.firstName} ${c.lastName}`,
          status: (draft[c.id] ?? 'absent') as AttendanceRecord['status'],
        })),
      });
      toast.success(t('common.saved', "Saqlandi"));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Davomatni saqlashda xatolik";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const selected = selectedDate;
    const monthPrefix = selectedDate.slice(0, 7);
    const q = historyQuery.trim().toLowerCase();

    const inDateScope = (row: AttendanceRecord) => {
      const rowDate = row.date ?? row.checkIn.slice(0, 10);
      if (historyMode === 'all') return true;
      if (historyMode === 'day') return rowDate === selected;
      if (historyMode === 'month') return rowDate.startsWith(monthPrefix);
      // range
      const from = historyRange.from || selected;
      const to = historyRange.to || selected;
      return rowDate >= from && rowDate <= to;
    };

    return history
      .filter(inDateScope)
      .filter((r) => (historyStatus ? r.status === historyStatus : true))
      .filter((r) => (q ? (r.childName || '').toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [history, selectedDate, historyMode, historyRange.from, historyRange.to, historyStatus, historyQuery]);
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    filteredHistory.forEach((r) => {
      if (r.status === 'present') present += 1;
      else if (r.status === 'late') late += 1;
      else absent += 1;
    });
    const total = present + late + absent;
    const rate = total ? Math.round(((present + late) / total) * 100) : 0;
    return { present, late, absent, rate };
  }, [filteredHistory]);

  const formatDate = (dateStr: string) => formatDateDisplay(dateStr, 'dd.MM.yyyy');

  const isHistoryRangeMode = historyMode === 'range';
  const isHistoryRangeDirty =
    isHistoryRangeMode && (historyRange.from !== selectedDate || historyRange.to !== selectedDate);
  const showHistoryClear = historyMode !== 'day' || Boolean(historyStatus) || Boolean(historyQuery) || isHistoryRangeDirty;

  const handleExport = () => {
    if (!filteredHistory.length) {
      alert(t('common.noDataToExport', "Eksport uchun ma'lumot yo'q"));
      return;
    }
    const safeGroup = (selectedGroup?.name || 'group').replace(/[^\p{L}\p{N}._-]+/gu, '-');
    downloadCsv(
      `attendance-report-${safeGroup}-${selectedDate.slice(0, 7)}.csv`,
      filteredHistory.map((r) => ({
        date: r.date ?? r.checkIn.slice(0, 10),
        childName: r.childName,
        group: r.group,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut ?? '',
      })),
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
            {t('attendance.title', 'Davomat')}
          </h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
            {formatDate(selectedDate)} •{' '}
            {selectedGroup ? selectedGroup.name : t('attendance.chooseGroup', 'Guruhni tanlang')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredHistory.length}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {t('common.downloadReport', 'Hisobot')}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">
              {t('attendance.controls.date', 'Sana')}
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
          />
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">
              {t('attendance.controls.group', 'Guruh')}
            </p>
          </div>
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
          >
            <option value="">{t('attendance.chooseGroup', 'Guruhni tanlang')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">
              {t('attendance.summary.rate', 'Davomat darajasi')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${summary.rate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {summary.rate}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Daily table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-surface-primary rounded-2xl border border-border-default"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
            <ListChecks className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">
              {t('attendance.daily.title', 'Kunlik davomat')}
            </p>
            </div>
            {dayClosed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary border border-border-subtle whitespace-nowrap">
                {t('attendance.daily.closed', 'Yopilgan')}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {dayClosed && (
              <button
                onClick={handleReopenDay}
                disabled={!selectedGroupId || isReopening}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-primary text-text-secondary text-xs sm:text-sm font-semibold hover:bg-surface-secondary disabled:opacity-60 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                {isReopening ? t('attendance.daily.opening', 'Ochilyapti...') : t('attendance.daily.edit', 'Tahrirlash')}
              </button>
            )}
            <button
              onClick={handleSaveDay}
              disabled={!isToday || dayClosed || !selectedGroupId || isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 shadow-sm shadow-black/10 ring-1 ring-navy-900/10 disabled:opacity-60 transition-colors"
            >
              {isSaving
                ? t('attendance.daily.saving', 'Saqlanmoqda...')
                : t('attendance.daily.save', 'Saqlash')}
            </button>
          </div>
        </div>
        {saveError && (
          <div className="px-3 sm:px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">
            {saveError}
          </div>
        )}
        {!selectedGroupId ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-text-tertiary" />}
            title={t('attendance.empty.groupTitle', 'Guruh tanlanmagan')}
            description={t(
              'attendance.empty.groupDesc',
              'Avval chapdan guruhni tanlang, keyin davomatni belgilang.',
            )}
          />
        ) : childrenInGroup.length === 0 ? (
          <EmptyState
            icon={<UserX className="w-6 h-6 text-text-tertiary" />}
            title={t('attendance.empty.noChildrenTitle', 'Guruhda bola yo‘q')}
            description={t(
              'attendance.empty.noChildrenDesc',
              "Avval bolalarni shu guruhga biriktiring.",
            )}
          />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden p-3 space-y-2">
              {todayRows.map(({ child, status }) => {
                const statusBtn = (s: AttendanceStatus) => {
                  const isActive = status === s;
                  const base =
                    s === 'present'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : s === 'late'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-600 border-red-200';
                  return (
                    <button
                      key={s}
                      disabled={!isToday || dayClosed}
                      onClick={() => handleToggleStatus(child.id, s)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isActive
                          ? base
                          : 'bg-surface-secondary/30 text-text-secondary border-border-subtle active:bg-surface-secondary/60'
                      }`}
                    >
                      {s === 'present'
                        ? t('attendance.status.present', 'Keldi')
                        : s === 'late'
                          ? t('attendance.status.late', 'Kechikdi')
                          : t('attendance.status.absent', 'Kelmagan')}
                    </button>
                  );
                };

                return (
                  <div
                    key={child.id}
                    className="rounded-2xl border border-border-default bg-surface-primary p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {child.firstName} {child.lastName}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5 truncate">
                          {child.group}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : status === 'late'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {status === 'present'
                          ? t('attendance.status.present', 'Keldi')
                          : status === 'late'
                            ? t('attendance.status.late', 'Kechikdi')
                            : t('attendance.status.absent', 'Kelmagan')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {(['present', 'late', 'absent'] as AttendanceStatus[]).map(statusBtn)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {t('attendance.table.child', 'Bola')}
                    </th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {t('attendance.table.group', 'Guruh')}
                    </th>
                    <th className="text-center px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {t('attendance.table.status', 'Holat')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayRows.map(({ child, status }) => (
                    <tr
                      key={child.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-surface-secondary/40 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-text-primary">
                          {child.firstName} {child.lastName}
                        </p>
                      </td>
                      <td className="px-2 py-2.5 text-sm text-text-secondary">{child.group}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {(['present', 'late', 'absent'] as AttendanceStatus[]).map((s) => {
                            const isActive = status === s;
                            const base =
                              s === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : s === 'late'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-600 border-red-200';
                            return (
                              <button
                                key={s}
                                disabled={!isToday || dayClosed}
                                onClick={() => handleToggleStatus(child.id, s)}
                                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                                  isActive
                                    ? base
                                    : 'bg-transparent text-text-tertiary border-border-subtle hover:bg-surface-secondary'
                                }`}
                              >
                                {s === 'present'
                                  ? t('attendance.status.present', 'Keldi')
                                  : s === 'late'
                                    ? t('attendance.status.late', 'Kechikdi')
                                    : t('attendance.status.absent', 'Kelmagan')}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-surface-primary rounded-2xl border border-border-default"
      >
        <div className="flex flex-col gap-2 px-3 sm:px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">
              {t('attendance.history.title', 'Davomat tarixi')}
            </p>
          </div>
            <button
              type="button"
              onClick={() => setHistoryOpenMobile((v) => !v)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-default text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              {historyOpenMobile ? t('common.close', 'Yopish') : t('common.viewAll', "Ochish")}
              {historyOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('common.filter', 'Filtr')}:</span>
              <select
                value={historyMode}
                onChange={(e) => {
                  setHistoryMode(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
              >
                <option value="day">{t('attendance.history.mode.day', 'Tanlangan kun')}</option>
                <option value="month">{t('attendance.history.mode.month', 'Tanlangan oy')}</option>
                <option value="range">{t('attendance.history.mode.range', 'Oraliq')}</option>
                <option value="all">{t('attendance.history.mode.all', 'Barchasi')}</option>
              </select>

              <select
                value={historyStatus}
                onChange={(e) => {
                  setHistoryStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
              >
                <option value="">{t('attendance.history.status.all', 'Barcha holatlar')}</option>
                <option value="present">{t('attendance.status.present', 'Keldi')}</option>
                <option value="late">{t('attendance.status.late', 'Kechikdi')}</option>
                <option value="absent">{t('attendance.status.absent', 'Kelmagan')}</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('attendance.history.date', 'Sana')}:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
              />

              {historyMode === 'range' && (
                <>
                  <span className="text-xs text-text-tertiary">{t('attendance.history.from', 'dan')}</span>
                  <input
                    type="date"
                    value={historyRange.from}
                    onChange={(e) => {
                      setHistoryRange((prev) => ({ ...prev, from: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                  />
                  <span className="text-xs text-text-tertiary">{t('attendance.history.to', 'gacha')}</span>
                  <input
                    type="date"
                    value={historyRange.to}
                    onChange={(e) => {
                      setHistoryRange((prev) => ({ ...prev, to: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                  />
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('common.search', 'Qidirish')}:</span>
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => {
                  setHistoryQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('attendance.history.searchPlaceholder', 'Bola ismi...')}
                className="min-w-[180px] flex-1 px-3 py-2 sm:py-1.5 rounded-xl border border-border-default bg-surface-secondary/50 text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
              />

              {showHistoryClear && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryMode('day');
                    setHistoryStatus('');
                    setHistoryQuery('');
                    setHistoryRange({ from: selectedDate, to: selectedDate });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 sm:py-1.5 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  {t('common.clearFilters', 'Tozalash')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile collapsible body */}
        <div className={`sm:hidden ${historyOpenMobile ? '' : 'hidden'}`}>
          <div className="px-3 pb-3">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary">{t('common.filter', 'Filtr')}:</span>
                <select
                  value={historyMode}
                  onChange={(e) => {
                    setHistoryMode(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                >
                  <option value="day">{t('attendance.history.mode.day', 'Tanlangan kun')}</option>
                  <option value="month">{t('attendance.history.mode.month', 'Tanlangan oy')}</option>
                  <option value="range">{t('attendance.history.mode.range', 'Oraliq')}</option>
                  <option value="all">{t('attendance.history.mode.all', 'Barchasi')}</option>
                </select>

                <select
                  value={historyStatus}
                  onChange={(e) => {
                    setHistoryStatus(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                >
                  <option value="">{t('attendance.history.status.all', 'Barcha holatlar')}</option>
                  <option value="present">{t('attendance.status.present', 'Keldi')}</option>
                  <option value="late">{t('attendance.status.late', 'Kechikdi')}</option>
                  <option value="absent">{t('attendance.status.absent', 'Kelmagan')}</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary">{t('attendance.history.date', 'Sana')}:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                />

                {historyMode === 'range' && (
                  <>
                    <span className="text-xs text-text-tertiary">{t('attendance.history.from', 'dan')}</span>
                    <input
                      type="date"
                      value={historyRange.from}
                      onChange={(e) => {
                        setHistoryRange((prev) => ({ ...prev, from: e.target.value }));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                    />
                    <span className="text-xs text-text-tertiary">{t('attendance.history.to', 'gacha')}</span>
                    <input
                      type="date"
                      value={historyRange.to}
                      onChange={(e) => {
                        setHistoryRange((prev) => ({ ...prev, to: e.target.value }));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                    />
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary">{t('common.search', 'Qidirish')}:</span>
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => {
                    setHistoryQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t('attendance.history.searchPlaceholder', 'Bola ismi...')}
                  className="min-w-[180px] flex-1 px-3 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                />

                {showHistoryClear && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryMode('day');
                      setHistoryStatus('');
                      setHistoryQuery('');
                      setHistoryRange({ from: selectedDate, to: selectedDate });
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-border-default text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    {t('common.clearFilters', 'Tozalash')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={`${historyOpenMobile ? 'block' : 'hidden'} sm:block`}>
          {filteredHistory.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-6 h-6 text-text-tertiary" />}
              title={t('attendance.history.emptyTitle', 'Tarix topilmadi')}
              description={t(
                'attendance.history.emptyDesc',
                "Davomatni belgilang yoki boshqa kunni tanlang.",
              )}
            />
          ) : (
            <>
              {/* Mobile list */}
              <div className="sm:hidden divide-y divide-border-subtle">
                {paginatedHistory.map((r, index) => (
                  <motion.div
                    key={r.id + index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                    className="px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {r.childName}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {r.group}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold flex-shrink-0 ${
                          r.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {r.status === 'present'
                          ? t('attendance.status.present', 'Keldi')
                          : r.status === 'late'
                            ? t('attendance.status.late', 'Kechikdi')
                            : t('attendance.status.absent', 'Kelmagan')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                        {t('attendance.table.child', 'Bola')}
                      </th>
                      <th className="text-left px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                        {t('attendance.table.group', 'Guruh')}
                      </th>
                      <th className="text-center px-2 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                        {t('attendance.table.status', 'Holat')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.map((r, index) => (
                      <motion.tr
                        key={r.id + index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                        className="border-b border-border-subtle last:border-0 hover:bg-surface-secondary/40 transition-colors"
                      >
                        <td className="px-2 py-2.5 text-sm font-medium text-text-primary">
                          {r.childName}
                        </td>
                        <td className="px-2 py-2.5 text-sm text-text-secondary">{r.group}</td>
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              r.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700'
                                : r.status === 'late'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {r.status === 'present'
                              ? t('attendance.status.present', 'Keldi')
                              : r.status === 'late'
                              ? t('attendance.status.late', 'Kechikdi')
                              : t('attendance.status.absent', 'Kelmagan')}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredHistory.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

