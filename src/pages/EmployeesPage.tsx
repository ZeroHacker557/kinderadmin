import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Download, LayoutGrid, List,
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal,
  Eye, Edit, Trash2, Phone,
  Users as UsersIcon, X, Star, XCircle,
  UserCheck, DollarSign,
} from 'lucide-react';
import AddEmployeeModal, { type EmployeeFormData } from '@/components/employees/AddEmployeeModal';
import EmployeeDetailPanel from '@/components/employees/EmployeeDetailPanel';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import type { Department, Employee, EmployeeFilters, EmployeeSortConfig, EmployeeSortField } from '@/types';
import { useTranslation } from 'react-i18next';
import { createDepartment, createEmployee, deleteDepartment, deleteEmployee, subscribeDepartments, subscribeEmployees, updateEmployee } from '@/services/firestore';
import { downloadCsv } from '@/utils/csv';

function formatSalary(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  return (amount / 1000).toFixed(0) + 'K';
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : i <= rating ? 'text-amber-400 fill-amber-200' : 'text-gray-200 fill-gray-100'}`}
        />
      ))}
    </div>
  );
}

const ITEMS_PER_PAGE = 8;
const FIXED_DEPARTMENTS: Department[] = [
  { id: 'director', name: 'Direktor', color: '#0ea5e9', headCount: 0 },
  { id: 'administrator', name: 'Administrator', color: '#8b5cf6', headCount: 0 },
  { id: 'teachers', name: 'Tarbiyachi', color: '#10b981', headCount: 0 },
  { id: 'assistant_teachers', name: 'Yordamchi tarbiyachi', color: '#f59e0b', headCount: 0 },
  { id: 'chef', name: 'Oshpaz', color: '#f97316', headCount: 0 },
  { id: 'methodist', name: 'Metodist', color: '#06b6d4', headCount: 0 },
  { id: 'nurse', name: 'Shifokor', color: '#ef4444', headCount: 0 },
];

export default function EmployeesPage() {
  const { t } = useTranslation();
  const locale = t('common.locale', 'uz-UZ');
  const currency = t('common.currency', "so'm");

  const statusConfig = {
    active: { label: t('employees.status.active', 'Faol'), bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
    on_leave: { label: t('employees.status.on_leave', "Ta'tilda"), bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
    terminated: { label: t('employees.status.terminated', "Ishdan bo'shagan"), bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-200' },
  } as const;

  const formatFullSalary = (amount: number): string =>
    amount.toLocaleString(locale) + ' ' + currency;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customDepartments, setCustomDepartments] = useState<Department[]>([]);
  const departmentOptions = useMemo(() => {
    const merged = [...FIXED_DEPARTMENTS, ...customDepartments];
    const seen = new Set<string>();
    return merged.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [customDepartments]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [prefillDepartmentId, setPrefillDepartmentId] = useState<string | null>(null);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({ search: '', department: '', status: '', position: '' });
  const [sort, setSort] = useState<EmployeeSortConfig>({ field: 'name', direction: 'asc' });

  useEffect(() => {
    const unsubscribeEmployees = subscribeEmployees(setEmployees);
    const unsubscribeDepartments = subscribeDepartments((rows) => {
      setCustomDepartments(rows.filter((d) => !FIXED_DEPARTMENTS.some((f) => f.id === d.id)));
    });
    return () => {
      unsubscribeEmployees();
      unsubscribeDepartments();
    };
  }, []);
  const createAddInitialData = (departmentId: string): EmployeeFormData => ({
    firstName: '',
    lastName: '',
    position: '',
    departmentId,
    phone: '',
    salary: '',
    hireDate: '',
    workSchedule: '',
    education: '',
    experience: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
  });

  const stripIdFromEntity = <T extends { id: string }>(value: T): Omit<T, 'id'> => {
    const { id: _id, ...rest } = value;
    return rest;
  };


  const activeFilterCount = [filters.department, filters.status, filters.position].filter(Boolean).length;

  // Get unique positions for filter
  const uniquePositions = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.position))).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let result = employees.filter(e => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !`${e.firstName} ${e.lastName}`.toLowerCase().includes(q) &&
          !e.position.toLowerCase().includes(q) &&
          !e.department.toLowerCase().includes(q) &&
          !e.phone.includes(q)
        ) return false;
      }
      if (filters.department && e.departmentId !== filters.department) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.position && e.position !== filters.position) return false;
      return true;
    });

    result.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'name': return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'department': return dir * a.department.localeCompare(b.department);
        case 'position': return dir * a.position.localeCompare(b.position);
        case 'hireDate': return dir * (new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime());
        case 'salary': return dir * (a.salary - b.salary);
        case 'rating': return dir * (a.performanceRating - b.performanceRating);
        default: return 0;
      }
    });
    return result;
  }, [employees, filters, sort]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSort = (field: EmployeeSortField) =>
    setSort(prev => prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' });

  const SortIcon = ({ field }: { field: EmployeeSortField }) => {
    if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />;
    return sort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-text-primary" /> : <ArrowDown className="w-3 h-3 text-text-primary" />;
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.size === paginatedEmployees.length ? new Set() : new Set(paginatedEmployees.map(e => e.id)));
  const clearFilters = () => { setFilters({ search: '', department: '', status: '', position: '' }); setCurrentPage(1); };
  const openDetail = (emp: Employee) => { setSelectedEmployee(emp); setShowDetail(true); setContextMenu(null); };
  const toFormData = (emp: Employee): EmployeeFormData => ({
    firstName: emp.firstName ?? '',
    lastName: emp.lastName ?? '',
    position: emp.position ?? '',
    departmentId: emp.departmentId ?? '',
    phone: emp.phone ?? '',
    salary: String(emp.salary ?? ''),
    hireDate: emp.hireDate ?? '',
    workSchedule: emp.workSchedule ?? '',
    education: emp.education ?? '',
    experience: emp.experience ?? '',
    address: emp.address ?? '',
    emergencyContact: emp.emergencyContact ?? '',
    emergencyPhone: emp.emergencyPhone ?? '',
    notes: emp.notes ?? '',
  });

  const handleAdd = async (data: EmployeeFormData) => {
    const dept = departmentOptions.find(d => d.id === data.departmentId);
    const payload: Omit<Employee, 'id'> = {
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      department: dept?.name ?? '',
      departmentId: data.departmentId,
      status: 'active',
      phone: data.phone,
      email: '',
      hireDate: data.hireDate,
      salary: Number(data.salary || 0),
      workSchedule: data.workSchedule,
      education: data.education,
      experience: data.experience,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      documents: [],
      skills: [],
      notes: data.notes,
      leaveBalance: { annual: 24, used: 0, sick: 5, usedSick: 0 },
      performanceRating: 0,
    };
    try {
      const created = await createEmployee(payload);
      setEmployees((prev) => {
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
      throw new Error(error instanceof Error ? error.message : "Xodim qo'shishda xatolik");
    }
  };

  const handleEditSubmit = async (data: EmployeeFormData) => {
    if (!editEmployee) return;
    const dept = departmentOptions.find(d => d.id === data.departmentId);
    const updated: Employee = {
      ...editEmployee,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      departmentId: data.departmentId,
      department: dept?.name ?? editEmployee.department,
      position: data.position,
      salary: Number(data.salary || editEmployee.salary),
      hireDate: data.hireDate,
      workSchedule: data.workSchedule,
      education: data.education,
      experience: data.experience,
      notes: data.notes,
    };
    try {
      await updateEmployee(updated);
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditEmployee(null);
      setShowAddModal(false);
      setShowDetail(false);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Xodim tahrirlashda xatolik");
    }
  };

  const handleAddNewType = async () => {
    const name = newTypeName.trim();
    if (!name) return;
    const existing = departmentOptions.find((d) => d.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setFilters((prev) => ({ ...prev, department: existing.id }));
      setShowAddType(false);
      setNewTypeName('');
      return;
    }

    const palette = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];
    const newDept: Department = {
      id: `custom-${Date.now()}`,
      name,
      color: palette[departmentOptions.length % palette.length],
      headCount: 0,
    };
    await createDepartment(stripIdFromEntity(newDept));
    setCustomDepartments((prev) => [...prev, newDept]);
    setShowAddType(false);
    setNewTypeName('');
    setPrefillDepartmentId(newDept.id);
    setEditEmployee(null);
    setShowAddModal(true);
  };

  const handleDeleteType = async (departmentId: string) => {
    const linkedEmployees = employees.filter((e) => e.departmentId === departmentId).length;
    if (linkedEmployees > 0) {
      alert(`Bu turga ${linkedEmployees} ta xodim biriktirilgan. Avval ularni boshqa turga o'tkazing.`);
      return;
    }
    try {
      await deleteDepartment(departmentId);
      setCustomDepartments((prev) => prev.filter((d) => d.id !== departmentId));
      if (filters.department === departmentId) {
        setFilters((prev) => ({ ...prev, department: '' }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Turni o'chirishda xatolik");
    }
  };

  // Summary stats
  const activeCount = employees.filter(e => e.status === 'active').length;
  const avgSalary = Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length);
  const avgRating = (employees.reduce((s, e) => s + e.performanceRating, 0) / employees.length).toFixed(1);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{t('employees.title')}</h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
            {filteredEmployees.length} {t('employees.page.employeesCount', 'xodim')}
            {filters.search || activeFilterCount > 0 ? t('employees.page.filteredSuffix', ' (filtrlangan)') : ''}
            {' • '}
            {activeCount} {t('employees.page.activeCountLabel', 'faol')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCsv('employees-report.csv', filteredEmployees.map((e) => ({ name: `${e.firstName} ${e.lastName}`, department: e.department, position: e.position, phone: e.phone, salary: e.salary, status: e.status })))} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('employees.page.export', 'Eksport')}</span>
          </button>
          <button onClick={() => { setEditEmployee(null); setPrefillDepartmentId(null); setShowAddModal(true); }} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{t('employees.addEmployee')}</span>
          </button>
        </div>
      </motion.div>

      {/* Summary stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-5 h-5 text-navy-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{employees.length}</p>
              <p className="text-xs text-text-tertiary">{t('employees.page.stats.totalEmployees', 'Jami xodimlar')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{activeCount}</p>
              <p className="text-xs text-text-tertiary">{t('employees.page.stats.activeEmployees', 'Faol xodimlar')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{formatSalary(avgSalary)}</p>
              <p className="text-xs text-text-tertiary">{t('employees.page.stats.avgSalary', "O'rtacha maosh")}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{avgRating}</p>
              <p className="text-xs text-text-tertiary">{t('employees.page.stats.avgRating', "O'rtacha baholash")}</p>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <button
          onClick={() => setShowAddType(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-default text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('employees.page.addType', "Yangi tur qo'shish")}
        </button>
        {showAddType && (
          <>
            <input
              type="text"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              placeholder={t('employees.page.addTypePlaceholder', "Masalan: Logistika")}
              className="px-3 py-2 rounded-xl border border-border-default bg-surface-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
            />
            <button
              onClick={handleAddNewType}
              className="px-3 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors"
            >
              {t('common.save', 'Saqlash')}
            </button>
          </>
        )}
      </div>

      {/* Department filter chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => { setFilters(prev => ({ ...prev, department: '' })); setCurrentPage(1); }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
            !filters.department
              ? 'bg-navy-900 text-white border-navy-900'
              : 'bg-surface-primary border-border-default text-text-secondary hover:border-navy-200 hover:shadow-sm'
          }`}
        >
          <UsersIcon className="w-3.5 h-3.5" />
          {t('common.all', 'Barchasi')}
          <span className={`text-[10px] font-bold ${!filters.department ? 'text-white/60' : 'text-text-tertiary'}`}>{employees.length}</span>
        </button>
        {departmentOptions.map(dept => {
          const count = employees.filter(e => e.departmentId === dept.id).length;
          const isCustom = customDepartments.some((d) => d.id === dept.id);
          return (
            <div key={dept.id} className="inline-flex items-center">
              <button
                onClick={() => { setFilters(prev => ({ ...prev, department: prev.department === dept.id ? '' : dept.id })); setCurrentPage(1); }}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filters.department === dept.id
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-surface-primary border-border-default text-text-secondary hover:border-navy-200 hover:shadow-sm'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: filters.department === dept.id ? '#fff' : dept.color }} />
                <span className="hidden sm:inline">{dept.name}</span>
                <span className="sm:hidden">{dept.name.split(' ')[0]}</span>
                <span className={`text-[10px] font-bold ${filters.department === dept.id ? 'text-white/60' : 'text-text-tertiary'}`}>{count}</span>
              </button>
              {isCustom && (
                <button
                  onClick={() => handleDeleteType(dept.id)}
                  className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded-lg"
                  title={t('common.delete', "O'chirish")}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </motion.div>
      {/* Main table card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
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
              placeholder={t('employees.page.searchPlaceholder', "Ism, lavozim yoki telefon bo'yicha qidiring...")}
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
              showFilters || activeFilterCount > 0
                ? 'bg-navy-900 text-white border-navy-900'
                : 'border-border-default text-text-secondary hover:bg-surface-secondary'
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
          <div className="hidden sm:flex items-center border border-border-default rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`} aria-label={t('employees.page.view.list', "Ro'yxat")}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-navy-900 text-white' : 'text-text-tertiary hover:text-text-primary'}`} aria-label={t('employees.page.view.grid', 'Katak')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-3 sm:px-4 py-3 border-b border-border-subtle bg-surface-secondary/20"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={filters.status}
                onChange={e => { setFilters(prev => ({ ...prev, status: e.target.value as EmployeeFilters['status'] })); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              >
                <option value="">{t('employees.page.filters.allStatuses', 'Barcha holatlar')}</option>
                <option value="active">{t('employees.status.active', 'Faol')}</option>
                <option value="on_leave">{t('employees.status.on_leave', "Ta'tilda")}</option>
                <option value="terminated">{t('employees.status.terminated', "Ishdan bo'shagan")}</option>
              </select>
              <select
                value={filters.position}
                onChange={e => { setFilters(prev => ({ ...prev, position: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs sm:text-sm text-text-secondary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              >
                <option value="">{t('employees.page.filters.allPositions', 'Barcha lavozimlar')}</option>
                {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                  {t('common.clearFilters', 'Tozalash')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Bulk selection bar */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-3 sm:px-4 py-2.5 border-b border-border-subtle bg-surface-secondary/50 flex items-center justify-between"
          >
            <p className="text-xs sm:text-sm text-text-primary font-medium">{selectedIds.size} {t('employees.page.bulk.selected', 'ta tanlangan')}</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-secondary border border-border-default transition-colors">
                {t('employees.page.bulk.changeDepartment', "Bo'limni o'zgartirish")}
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                {t('common.delete', "O'chirish")}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && filteredEmployees.length > 0 && (
          <>
            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-border-subtle">
              {paginatedEmployees.map((emp, index) => {
                const st = statusConfig[emp.status];
                const deptColor = departmentOptions.find(d => d.id === emp.departmentId)?.color || '#94a3b8';
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    onClick={() => openDetail(emp)}
                    className="px-3 py-3 hover:bg-surface-secondary/50 active:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary truncate">{emp.firstName} {emp.lastName}</p>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: deptColor }} />
                          <span className="text-xs text-text-tertiary truncate">{emp.position}</span>
                          <span className="text-xs text-text-tertiary">•</span>
                          <span className="text-xs text-text-tertiary">{emp.department}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-text-primary">{formatSalary(emp.salary)}</p>
                        <RatingStars rating={emp.performanceRating} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selectedIds.size === paginatedEmployees.length && paginatedEmployees.length > 0} onChange={toggleSelectAll} className="rounded border-border-default" />
                    </th>
                    <th className="text-left">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                        {t('employees.page.table.employee', 'Xodim')} <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left">
                      <button onClick={() => toggleSort('department')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                        {t('employees.page.table.department', "Bo'lim")} <SortIcon field="department" />
                      </button>
                    </th>
                    <th className="text-left hidden lg:table-cell">
                      <button onClick={() => toggleSort('position')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                        {t('employees.page.table.position', 'Lavozim')} <SortIcon field="position" />
                      </button>
                    </th>
                    <th className="text-left hidden md:table-cell">
                      <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3">{t('employees.page.table.contact', 'Aloqa')}</span>
                    </th>
                    <th className="text-center hidden lg:table-cell">
                      <button onClick={() => toggleSort('rating')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors mx-auto">
                        {t('employees.page.table.rating', 'Baholash')} <SortIcon field="rating" />
                      </button>
                    </th>
                    <th className="text-left">
                      <button onClick={() => toggleSort('salary')} className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 py-3 hover:text-text-primary transition-colors">
                        {t('employees.page.table.salary', 'Maosh')} <SortIcon field="salary" />
                      </button>
                    </th>
                    <th className="w-12 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp, index) => {
                    const st = statusConfig[emp.status];
                    const deptColor = departmentOptions.find(d => d.id === emp.departmentId)?.color || '#94a3b8';
                    return (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                        onClick={() => openDetail(emp)}
                        className={`border-b border-border-subtle last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer group ${selectedIds.has(emp.id) ? 'bg-surface-secondary/30' : ''}`}
                      >
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleSelect(emp.id)} className="rounded border-border-default" />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-text-primary truncate">{emp.firstName} {emp.lastName}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${st.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: deptColor }} />
                            <span className="text-sm text-text-secondary">{emp.department}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 hidden lg:table-cell">
                          <span className="text-sm text-text-secondary">{emp.position}</span>
                        </td>
                        <td className="px-2 py-3 hidden md:table-cell">
                          <div className="min-w-0">
                            <p className="text-sm text-text-secondary truncate max-w-[160px]">{emp.phone}</p>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-1.5">
                            <RatingStars rating={emp.performanceRating} />
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="text-sm font-semibold text-text-primary">{formatFullSalary(emp.salary)}</span>
                        </td>
                        <td className="px-2 py-3 relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setContextMenu(contextMenu === emp.id ? null : emp.id)}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {contextMenu === emp.id && (
                            <div className="absolute right-2 top-full mt-1 w-52 bg-surface-primary rounded-xl shadow-lg border border-border-default py-1 z-20">
                              <button onClick={() => openDetail(emp)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" /> {t('employees.page.actions.viewProfile', "Profilni ko'rish")}
                              </button>
                              <button onClick={() => {
                                setEditEmployee(emp);
                                setShowDetail(false);
                                setShowAddModal(true);
                              }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                                <Edit className="w-3.5 h-3.5" /> {t('common.edit', 'Tahrirlash')}
                              </button>
                              <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5" /> {t('employees.page.actions.call', "Qo'ng'iroq qilish")}
                              </button>
                              <div className="border-t border-border-subtle my-1" />
                              <button onClick={async () => {
                                await deleteEmployee(emp.id);
                                setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
                              }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete', "O'chirish")}
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
          </>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && filteredEmployees.length > 0 && (
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paginatedEmployees.map((emp, index) => {
              const st = statusConfig[emp.status];
              const deptColor = departmentOptions.find(d => d.id === emp.departmentId)?.color || '#94a3b8';
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  onClick={() => openDetail(emp)}
                  className="p-4 rounded-xl border border-border-default hover:shadow-md hover:shadow-black/[0.04] transition-all duration-200 cursor-pointer group bg-surface-primary"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-end mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${st.bg} ${st.text} border ${st.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>

                  {/* Name & position */}
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-text-primary transition-colors">{emp.firstName} {emp.lastName}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{emp.position}</p>

                  {/* Department */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deptColor }} />
                    <span className="text-xs text-text-tertiary">{emp.department}</span>
                  </div>

                  {/* Contact */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{emp.phone}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                    <RatingStars rating={emp.performanceRating} />
                    <span className="text-xs font-bold text-emerald-700">{formatSalary(emp.salary)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredEmployees.length === 0 && (
          <EmptyState
            icon={<UsersIcon className="w-6 h-6 text-text-tertiary" />}
            title={t('employees.page.empty.title', 'Xodimlar topilmadi')}
            description={filters.search || activeFilterCount > 0
              ? t('employees.page.empty.filteredDesc', "Qidiruv yoki filtrlarni o'zgartirib ko'ring.")
              : t('employees.page.empty.newDesc', "\"Xodim qo'shish\" tugmasi orqali birinchi xodimni ro'yxatga oling.")}
            action={
              filters.search || activeFilterCount > 0
                ? <button onClick={clearFilters} className="px-4 py-2 rounded-xl border border-border-default text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.clearFilters', 'Filtrlarni tozalash')}</button>
                : <button onClick={() => { setEditEmployee(null); setPrefillDepartmentId(null); setShowAddModal(true); }} className="px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"><Plus className="w-4 h-4 inline mr-1.5" />{t('employees.page.empty.addFirst', "Birinchi xodimni qo'shish")}</button>
            }
          />
        )}

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditEmployee(null); setPrefillDepartmentId(null); }}
        onSubmit={editEmployee ? handleEditSubmit : handleAdd}
        mode={editEmployee ? 'edit' : 'add'}
        initialData={editEmployee ? toFormData(editEmployee) : prefillDepartmentId ? createAddInitialData(prefillDepartmentId) : undefined}
        departmentOptions={departmentOptions}
      />
      <EmployeeDetailPanel
        employee={selectedEmployee}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={(emp) => {
          setPrefillDepartmentId(null);
          setEditEmployee(emp);
          setShowDetail(false);
          setShowAddModal(true);
        }}
      />
    </div>
  );
}
