import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, LayoutGrid, List,
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal,
  Eye, Edit, Trash2, Phone, AlertTriangle,
  Users as UsersIcon, X,
} from 'lucide-react';
import AddChildModal, { type AddChildFormData } from '@/components/children/AddChildModal';
import ChildDetailPanel from '@/components/children/ChildDetailPanel';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import type { Child, ChildFilters, SortConfig, SortField } from '@/types';
import { useTranslation } from 'react-i18next';
import { createChild, deleteChild, subscribeChildren, subscribeGroups, updateChild } from '@/services/firestore';
import type { GroupInfo } from '@/types';
import { downloadCsv } from '@/utils/csv';

function calculateAge(dob: string): number {
  const b = new Date(dob), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() - b.getMonth() < 0 || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

const ITEMS_PER_PAGE = 8;

export default function ChildrenPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupInfo[]>([]);

  const statusConfig = {
    active: { label: t('children.status.active', 'Faol'), bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { label: t('children.status.inactive', 'Faol emas'), bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    trial: { label: t('children.status.trial', 'Sinov'), bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    graduated: { label: t('children.status.graduated', 'Bitirgan'), bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  };

  const paymentStatusConfig = {
    paid: { label: t('common.paymentPaid', 'To\'langan'), bg: 'bg-emerald-50', text: 'text-emerald-700' },
    partial: { label: t('common.paymentPartial', 'Qisman'), bg: 'bg-amber-50', text: 'text-amber-700' },
    overdue: { label: t('common.paymentOverdue', 'Muddati o\'tgan'), bg: 'bg-red-50', text: 'text-red-600' },
    pending: { label: t('common.paymentPending', 'Kutilmoqda'), bg: 'bg-gray-100', text: 'text-gray-600' },
  };

  const formatAge = (dob: string): string => {
    const age = calculateAge(dob);
    const b = new Date(dob), n = new Date();
    let months = n.getMonth() - b.getMonth();
    if (months < 0) months += 12;
    if (age < 1) return `${months} ${t('common.months', 'oy')}`;
    return `${age} ${t('common.yearsShort', 'y')} ${months} ${t('common.months', 'oy')}`;
  };

  const [children, setChildren] = useState<Child[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChildFilters>({ search: '', group: '', status: '', gender: '', paymentStatus: '', ageRange: null });
  const [sort, setSort] = useState<SortConfig>({ field: 'name', direction: 'asc' });

  useEffect(() => {
    const unsubscribeChildren = subscribeChildren(setChildren);
    const unsubscribeGroups = subscribeGroups(setGroups);
    return () => {
      unsubscribeChildren();
      unsubscribeGroups();
    };
  }, []);

  const activeFilterCount = [filters.group, filters.status, filters.gender, filters.paymentStatus].filter(Boolean).length;
  const totalChildrenCount = children.length;
  const totalCapacity = groups.reduce((sum, g) => sum + g.capacity, 0);

  const groupsWithCounts = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        currentCount: children.filter(
          (c) => c.groupId === g.id || c.group === g.name,
        ).length,
      })),
    [groups, children],
  );

  const filteredChildren = useMemo(() => {
    let result = children.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) && !c.group.toLowerCase().includes(q) && !c.parents.some(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))) return false;
      }
      if (filters.group && c.groupId !== filters.group) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.gender && c.gender !== filters.gender) return false;
      if (filters.paymentStatus) { const l = c.payments[0]; if (!l || l.status !== filters.paymentStatus) return false; }
      return true;
    });
    result.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'name': return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'age': return dir * (new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime());
        case 'group': return dir * a.group.localeCompare(b.group);
        case 'enrollment': return dir * (new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime());
        case 'attendance': return dir * (a.attendanceRate - b.attendanceRate);
        case 'payment': { const o = { overdue: 0, partial: 1, pending: 2, paid: 3 } as const; return dir * ((o[a.payments[0]?.status || 'pending']) - (o[b.payments[0]?.status || 'pending'])); }
        default: return 0;
      }
    });
    return result;
  }, [children, filters, sort]);

  const totalPages = Math.ceil(filteredChildren.length / ITEMS_PER_PAGE);
  const paginatedChildren = filteredChildren.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => setSort(prev => prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' });
  const SortIcon = ({ field }: { field: SortField }) => { if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />; return sort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-text-primary" /> : <ArrowDown className="w-3 h-3 text-text-primary" />; };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelectedIds(selectedIds.size === paginatedChildren.length ? new Set() : new Set(paginatedChildren.map(c => c.id)));
  const clearFilters = () => { setFilters({ search: '', group: '', status: '', gender: '', paymentStatus: '', ageRange: null }); setCurrentPage(1); };
  const openDetail = (child: Child) => { setSelectedChild(child); setShowDetail(true); setContextMenu(null); };
  const closeModal = () => { setShowAddModal(false); setEditChild(null); };

  const toFormData = (child: Child): AddChildFormData => ({
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth,
    gender: child.gender,
    groupId: child.groupId,
    status: child.status,
    address: child.address ?? '',
    notes: child.notes ?? '',
    parents: child.parents.map(parent => ({
      firstName: parent.firstName,
      lastName: parent.lastName,
      relation: parent.relation,
      phone: parent.phone,
      occupation: parent.occupation ?? '',
    })),
    medical: {
      bloodType: child.medical.bloodType ?? '',
      allergies: child.medical.allergies.join(', '),
      medications: child.medical.medications.join(', '),
      conditions: child.medical.conditions.join(', '),
      emergencyContact: child.medical.emergencyContact,
      emergencyPhone: child.medical.emergencyPhone,
      doctorName: child.medical.doctorName ?? '',
      doctorPhone: child.medical.doctorPhone ?? '',
      notes: child.medical.notes ?? '',
    },
  });

  const splitList = (value: string) =>
    value.split(',').map(item => item.trim()).filter(Boolean);

  const handleAddOrEdit = async (data: AddChildFormData) => {
    const selectedGroup = groups.find(group => group.id === data.groupId);
    const normalizedChild: Child = editChild ? {
      ...editChild,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      groupId: data.groupId,
      group: selectedGroup?.name ?? editChild.group,
      status: data.status,
      address: data.address || undefined,
      notes: data.notes || undefined,
      parents: data.parents.map((parent, index) => ({
        id: editChild.parents[index]?.id ?? `p-${editChild.id}-${index + 1}`,
        firstName: parent.firstName,
        lastName: parent.lastName,
        relation: parent.relation,
        phone: parent.phone,
        email: editChild.parents[index]?.email ?? '',
        occupation: parent.occupation || undefined,
      })),
      medical: {
        ...editChild.medical,
        bloodType: data.medical.bloodType || undefined,
        allergies: splitList(data.medical.allergies),
        medications: splitList(data.medical.medications),
        conditions: splitList(data.medical.conditions),
        emergencyContact: data.medical.emergencyContact,
        emergencyPhone: data.medical.emergencyPhone,
        doctorName: data.medical.doctorName || undefined,
        doctorPhone: data.medical.doctorPhone || undefined,
        notes: data.medical.notes || undefined,
      },
    } : {
      id: `ch-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      groupId: data.groupId,
      group: selectedGroup?.name ?? '',
      status: data.status,
      enrollmentDate: new Date().toISOString().slice(0, 10),
      attendanceRate: 0,
      address: data.address || undefined,
      notes: data.notes || undefined,
      parents: data.parents.map((parent, index) => ({
        id: `p-${Date.now()}-${index + 1}`,
        firstName: parent.firstName,
        lastName: parent.lastName,
        relation: parent.relation,
        phone: parent.phone,
        email: '',
        occupation: parent.occupation || undefined,
      })),
      medical: {
        bloodType: data.medical.bloodType || undefined,
        allergies: splitList(data.medical.allergies),
        medications: splitList(data.medical.medications),
        conditions: splitList(data.medical.conditions),
        emergencyContact: data.medical.emergencyContact,
        emergencyPhone: data.medical.emergencyPhone,
        doctorName: data.medical.doctorName || undefined,
        doctorPhone: data.medical.doctorPhone || undefined,
        notes: data.medical.notes || undefined,
      },
      payments: [],
    };

    try {
      if (editChild) {
        await updateChild(normalizedChild);
        setChildren((prev) => prev.map((c) => (c.id === normalizedChild.id ? normalizedChild : c)));
      } else {
        const created = await createChild(stripIdFromEntity(normalizedChild));
        setChildren((prev) => {
          const next = [{ ...normalizedChild, id: created.id }, ...prev];
          const seen = new Set<string>();
          return next.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Bola saqlashda xatolik");
    }

    setSelectedChild(normalizedChild);
    setShowDetail(false);
    closeModal();
  };

  const stripIdFromEntity = <T extends { id: string }>(value: T): Omit<T, 'id'> => {
    const { id: _id, ...rest } = value;
    return rest;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChild(id);
      setChildren((prev) => prev.filter((c) => c.id !== id));
      setContextMenu(null);
      if (selectedChild?.id === id) setShowDetail(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "O'chirishda xatolik");
    }
  };

  const handleExport = () => {
    if (!filteredChildren.length) {
      alert(t('common.noDataToExport', "Eksport uchun ma'lumot yo'q"));
      return;
    }
    downloadCsv('children-report.csv', filteredChildren.map((child) => ({
      fullName: `${child.firstName} ${child.lastName}`,
      group: child.group,
      status: child.status,
      gender: child.gender,
      attendanceRate: child.attendanceRate,
      enrollmentDate: child.enrollmentDate,
      primaryParent: `${child.parents[0]?.firstName ?? ''} ${child.parents[0]?.lastName ?? ''}`.trim(),
      primaryPhone: child.parents[0]?.phone ?? '',
    })));
  };

  const handleEdit = (child: Child) => {
    setShowDetail(false);
    setEditChild(child);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{t('children.title')}</h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">{filteredChildren.length} {t('children.count', 'bola')}{filters.search || activeFilterCount > 0 ? ` (${t('common.filtered', 'filtrlangan')})` : ''} • {children.filter(c => c.status === 'active').length} {t('common.active', 'faol')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredChildren.length}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('common.downloadReport', 'Eksport')}</span>
          </button>
          <button onClick={() => { setEditChild(null); setShowAddModal(true); }} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden xs:inline">{t('children.addChild')}</span></button>
        </div>
      </motion.div>

      {/* Quick group filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => { setFilters(prev => ({ ...prev, group: '' })); setCurrentPage(1); }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
            filters.group === '' ? 'bg-navy-900 text-white border-navy-900' : 'bg-surface-primary border-border-default hover:border-navy-200 hover:shadow-sm'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: filters.group === '' ? '#fff' : '#94a3b8' }} />
          <div className="min-w-0">
            <p className={`text-xs font-semibold truncate ${filters.group === '' ? 'text-white' : 'text-text-primary'}`}>
              {t('children.quickFilters.allChildren', 'Barcha bolalar')}
            </p>
            <p className={`text-[10px] ${filters.group === '' ? 'text-white/60' : 'text-text-tertiary'}`}>
              {totalChildrenCount}/{totalCapacity}
            </p>
          </div>
        </button>

        {groupsWithCounts.map(group => (
          <button key={group.id} onClick={() => { setFilters(prev => ({ ...prev, group: prev.group === group.id ? '' : group.id })); setCurrentPage(1); }} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${filters.group === group.id ? 'bg-navy-900 text-white border-navy-900' : 'bg-surface-primary border-border-default hover:border-navy-200 hover:shadow-sm'}`}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: filters.group === group.id ? '#fff' : group.color }} />
            <div className="min-w-0"><p className={`text-xs font-semibold truncate ${filters.group === group.id ? 'text-white' : 'text-text-primary'}`}>{group.name}</p><p className={`text-[10px] ${filters.group === group.id ? 'text-white/60' : 'text-text-tertiary'}`}>{group.currentCount}/{group.capacity}</p></div>
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-surface-primary rounded-2xl border border-border-default">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border-subtle">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input type="text" value={filters.search} onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setCurrentPage(1); }} placeholder={t('common.search', "Qidirish...")} className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/20 transition-all duration-200" />
            {filters.search && <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${showFilters || activeFilterCount > 0 ? 'bg-navy-900 text-white border-navy-900' : 'border-border-default text-text-secondary hover:bg-surface-secondary'}`}>
            <Filter className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('common.filter', 'Filtr')}</span>
            {activeFilterCount > 0 && <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${showFilters ? 'bg-surface-primary text-text-primary' : 'bg-navy-900 text-white'}`}>{activeFilterCount}</span>}
          </button>
          <div className="hidden sm:flex items-center border border-border-default rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`} aria-label={t('common.listView', 'Ro\'yxat')}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`} aria-label={t('common.gridView', 'Katak')}><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-3 sm:px-4 py-3 border-b border-border-subtle bg-surface-secondary/20">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select value={filters.status} onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value as ChildFilters['status'] })); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10">
                <option value="">{t('common.allStatuses', 'Barcha holatlar')}</option><option value="active">{t('children.status.active', 'Faol')}</option><option value="trial">{t('children.status.trial', 'Sinov')}</option><option value="inactive">{t('children.status.inactive', 'Faol emas')}</option><option value="graduated">{t('children.status.graduated', 'Bitirgan')}</option>
              </select>
              <select value={filters.gender} onChange={(e) => { setFilters(prev => ({ ...prev, gender: e.target.value as ChildFilters['gender'] })); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10">
                <option value="">{t('common.allGenders', 'Barcha jinslar')}</option><option value="male">{t('children.addModal.male', 'O\'g\'il')}</option><option value="female">{t('children.addModal.female', 'Qiz')}</option>
              </select>
              <select value={filters.paymentStatus} onChange={(e) => { setFilters(prev => ({ ...prev, paymentStatus: e.target.value as ChildFilters['paymentStatus'] })); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10">
                <option value="">{t('common.allPayments', 'Barcha to\'lovlar')}</option><option value="paid">{t('common.paymentPaid', 'To\'langan')}</option><option value="partial">{t('common.paymentPartial', 'Qisman')}</option><option value="overdue">{t('common.paymentOverdue', 'Muddati o\'tgan')}</option><option value="pending">{t('common.paymentPending', 'Kutilmoqda')}</option>
              </select>
              {activeFilterCount > 0 && <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">{t('common.clearFilters', 'Tozalash')}</button>}
            </div>
          </motion.div>
        )}

        {selectedIds.size > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-3 sm:px-4 py-2.5 border-b border-border-subtle bg-surface-secondary/50 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-text-primary font-medium">{selectedIds.size} {t('common.selectedCount', 'ta tanlangan')}</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-secondary border border-border-default transition-colors">{t('common.changeGroup', 'Guruhni o\'zgartirish')}</button>
              <button onClick={async () => {
                await Promise.all(Array.from(selectedIds).map((id) => deleteChild(id)));
                setChildren((prev) => prev.filter((c) => !selectedIds.has(c.id)));
                setSelectedIds(new Set());
              }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors">{t('common.delete', 'O\'chirish')}</button>
              <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}

        {viewMode === 'list' && filteredChildren.length > 0 && (
          <>
            {/* Mobile */}
            <div className="sm:hidden divide-y divide-border-subtle">
              {paginatedChildren.map((child, index) => {
                const latestPay = child.payments[0]; const payStatus = latestPay ? paymentStatusConfig[latestPay.status] : null; const st = statusConfig[child.status];
                return (
                  <motion.div key={child.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03, duration: 0.3 }} onClick={() => openDetail(child)} className="px-3 py-3 hover:bg-surface-secondary/50 active:bg-surface-secondary transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary truncate">{child.firstName} {child.lastName}</p><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} /></div><div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-text-tertiary">{child.group}</span><span className="text-xs text-text-tertiary">•</span><span className="text-xs text-text-tertiary">{formatAge(child.dateOfBirth)}</span>{child.medical.allergies.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}</div></div>
                      <div className="text-right flex-shrink-0"><p className="text-sm font-semibold text-text-primary">{child.attendanceRate}%</p>{payStatus && <span className={`text-[10px] font-semibold ${payStatus.text}`}>{payStatus.label}</span>}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border-subtle">
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={selectedIds.size === paginatedChildren.length && paginatedChildren.length > 0} onChange={toggleSelectAll} className="rounded border-border-default" /></th>
                  <th className="text-left"><button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">{t('dashboard.table.child', 'Bola')} <SortIcon field="name" /></button></th>
                  <th className="text-left hidden lg:table-cell"><button onClick={() => toggleSort('age')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">{t('common.age', 'Yoshi')} <SortIcon field="age" /></button></th>
                  <th className="text-left"><button onClick={() => toggleSort('group')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">{t('dashboard.table.group', 'Guruh')} <SortIcon field="group" /></button></th>
                  <th className="text-left hidden md:table-cell"><span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3">{t('children.table.parent', 'Ota-ona')}</span></th>
                  <th className="text-center hidden lg:table-cell"><button onClick={() => toggleSort('attendance')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors mx-auto">{t('dashboard.stats.todayAttendance', 'Davomat')} <SortIcon field="attendance" /></button></th>
                  <th className="text-left"><button onClick={() => toggleSort('payment')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">{t('children.table.payment', 'To\'lov')} <SortIcon field="payment" /></button></th>
                  <th className="w-12 px-2 py-3" />
                </tr></thead>
                <tbody>{paginatedChildren.map((child, index) => {
                  const st = statusConfig[child.status]; const latestPay = child.payments[0]; const payStatus = latestPay ? paymentStatusConfig[latestPay.status] : null; const primaryParent = child.parents[0]; const groupColor = groups.find(g => g.id === child.groupId)?.color || '#94a3b8';
                  return (
                    <motion.tr key={child.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03, duration: 0.25 }} onClick={() => openDetail(child)} className={`border-b border-border-subtle last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer group ${selectedIds.has(child.id) ? 'bg-surface-secondary/30' : ''}`}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(child.id)} onChange={() => toggleSelect(child.id)} className="rounded border-border-default" /></td>
                      <td className="px-2 py-3"><div className="flex items-center gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary truncate">{child.firstName} {child.lastName}</p>{child.medical.allergies.length > 0 && <span title={t('common.hasAllergies', 'Allergiyasi bor')}><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /></span>}</div><span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${st.text}`}><span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}</span></div></div></td>
                      <td className="px-2 py-3 hidden lg:table-cell"><span className="text-sm text-text-secondary">{formatAge(child.dateOfBirth)}</span></td>
                      <td className="px-2 py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: groupColor }} /><span className="text-sm text-text-secondary">{child.group}</span></div></td>
                      <td className="px-2 py-3 hidden md:table-cell">{primaryParent && <div className="min-w-0"><p className="text-sm text-text-secondary truncate max-w-[160px]">{primaryParent.firstName} {primaryParent.lastName}</p><p className="text-xs text-text-tertiary truncate max-w-[160px]">{primaryParent.phone}</p></div>}</td>
                      <td className="px-2 py-3 text-center hidden lg:table-cell"><div className="flex items-center justify-center gap-1.5"><div className="w-16 h-1.5 rounded-full bg-surface-tertiary overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${child.attendanceRate}%`, backgroundColor: child.attendanceRate >= 95 ? '#10b981' : child.attendanceRate >= 85 ? '#f59e0b' : '#ef4444' }} /></div><span className="text-xs font-medium text-text-secondary">{child.attendanceRate}%</span></div></td>
                      <td className="px-2 py-3">{payStatus && <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${payStatus.bg} ${payStatus.text}`}>{payStatus.label}</span>}</td>
                      <td className="px-2 py-3 relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setContextMenu(contextMenu === child.id ? null : child.id)} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                        {contextMenu === child.id && (
                          <div className="absolute right-2 top-full mt-1 w-48 bg-surface-primary rounded-xl shadow-lg border border-border-default py-1 z-20">
                            <button onClick={() => openDetail(child)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> {t('common.viewProfile', 'Profilni ko\'rish')}</button>
                            <button onClick={() => handleEdit(child)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2"><Edit className="w-3.5 h-3.5" /> {t('common.edit', 'Tahrirlash')}</button>
                            <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {t('common.callParent', 'Ota-onaga qo\'ng\'iroq')}</button>
                            <div className="border-t border-border-subtle my-1" />
                            <button onClick={() => handleDelete(child.id)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> {t('common.delete', 'O\'chirish')}</button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}</tbody>
              </table>
            </div>
          </>
        )}

        {viewMode === 'grid' && filteredChildren.length > 0 && (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paginatedChildren.map((child, index) => {
              const st = statusConfig[child.status]; const latestPay = child.payments[0]; const payStatus = latestPay ? paymentStatusConfig[latestPay.status] : null; const groupColor = groups.find(g => g.id === child.groupId)?.color || '#94a3b8';
              return (
                <motion.div key={child.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }} onClick={() => openDetail(child)} className="p-4 rounded-xl border border-border-default hover:shadow-md hover:shadow-black/[0.04] transition-all duration-200 cursor-pointer group bg-surface-primary">
                  <div className="flex items-start justify-end mb-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.bg} ${st.text}`}><span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}</span></div>
                  <h4 className="text-sm font-semibold text-text-primary">{child.firstName} {child.lastName}</h4>
                  <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColor }} /><span className="text-xs text-text-tertiary">{child.group}</span><span className="text-xs text-text-tertiary">•</span><span className="text-xs text-text-tertiary">{formatAge(child.dateOfBirth)}</span></div>
                  {child.medical.allergies.length > 0 && <div className="flex items-center gap-1 mt-2 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" />{child.medical.allergies.join(', ')}</div>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-1.5"><div className="w-12 h-1.5 rounded-full bg-surface-tertiary overflow-hidden"><div className="h-full rounded-full" style={{ width: `${child.attendanceRate}%`, backgroundColor: child.attendanceRate >= 95 ? '#10b981' : child.attendanceRate >= 85 ? '#f59e0b' : '#ef4444' }} /></div><span className="text-xs font-medium text-text-secondary">{child.attendanceRate}%</span></div>
                    {payStatus && <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${payStatus.bg} ${payStatus.text}`}>{payStatus.label}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredChildren.length === 0 && (
          <EmptyState icon={<UsersIcon className="w-6 h-6 text-text-tertiary" />} title={t('children.notFoundTitle', 'Bolalar topilmadi')} description={filters.search || activeFilterCount > 0 ? t('children.notFoundDescFilter', 'Qidiruv yoki filtrlarni o\'zgartirib ko\'ring.') : t('children.notFoundDescNew', '"Bola qo\'shish" tugmasi orqali birinchi bolani ro\'yxatga oling.')}
            action={filters.search || activeFilterCount > 0 ? <button onClick={clearFilters} className="px-4 py-2 rounded-xl border border-border-default text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.clearFilters', 'Filtrlarni tozalash')}</button> : <button onClick={() => { setEditChild(null); setShowAddModal(true); }} className="px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"><Plus className="w-4 h-4 inline mr-1.5" />{t('children.registerFirst', 'Birinchi bolani ro\'yxatga olish')}</button>}
          />
        )}

        {filteredChildren.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredChildren.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />}
      </motion.div>

      <AddChildModal
        isOpen={showAddModal}
        onClose={closeModal}
        onSubmit={handleAddOrEdit}
        groups={groups}
        mode={editChild ? 'edit' : 'add'}
        initialData={editChild ? toFormData(editChild) : null}
      />
      <ChildDetailPanel child={selectedChild} isOpen={showDetail} onClose={() => setShowDetail(false)} onEdit={handleEdit} />
    </div>
  );
}
