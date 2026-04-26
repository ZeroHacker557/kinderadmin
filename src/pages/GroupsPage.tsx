import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, Plus, MoreHorizontal,
  TrendingUp, ChevronRight, GraduationCap, Search, Trash2, Check,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import type { Child, Employee, GroupInfo } from '@/types';
import { createGroup, deleteGroup, subscribeChildren, subscribeEmployees, subscribeGroups, updateEmployee, updateGroup } from '@/services/firestore';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kiritilishi shart'),
  ageRange: z.string().min(1, 'Yosh oralig\'i kiritilishi shart'),
  capacity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Sig\'im kamida 1 bo\'lishi kerak',
  }),
  teacher: z.string().optional(),
  color: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

function AddGroupModal({
  isOpen,
  onClose,
  onSubmit,
  employees,
  mode = 'add',
  initialGroup = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<GroupInfo, 'id'>, selectedStaffIds: string[]) => Promise<unknown>;
  employees: Employee[];
  mode?: 'add' | 'edit';
  initialGroup?: GroupInfo | null;
}) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: initialGroup?.name ?? '',
      ageRange: initialGroup?.ageRange ?? '',
      capacity: initialGroup ? String(initialGroup.capacity) : '',
      teacher: initialGroup?.teacher ?? '',
      color: initialGroup?.color ?? '#3b82f6',
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: initialGroup?.name ?? '',
      ageRange: initialGroup?.ageRange ?? '',
      capacity: initialGroup ? String(initialGroup.capacity) : '',
      teacher: initialGroup?.teacher ?? '',
      color: initialGroup?.color ?? '#3b82f6',
    });
    setSelectedStaffIds(() => {
      if (!initialGroup) return [];
      return employees
        .filter((e) => e.assignedGroupId === initialGroup.id || e.assignedGroup === initialGroup.name)
        .map((e) => e.id);
    });
    setSubmitError(null);
  }, [employees, initialGroup, isOpen, reset]);

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200';

  const colorOptions = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#06b6d4', '#ec4899', '#ef4444', '#84cc16'];
  const filteredStaff = employees.filter(employee => {
    const query = staffSearch.trim().toLowerCase();
    if (!query) return true;
    return `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query) || employee.position.toLowerCase().includes(query);
  });
  const handleCreate = async (data: GroupFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        ageRange: data.ageRange.trim(),
        capacity: Number(data.capacity),
        currentCount: 0,
        teacher: data.teacher?.trim() || '',
        color: data.color || '#3b82f6',
      }, selectedStaffIds);
      setSubmitError(null);
      setSelectedStaffIds([]);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Guruh yaratishda xatolik");
    }
  };
  const toggleStaff = (employeeId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? t('common.edit', 'Tahrirlash') : t('groups.addModal.title', 'Yangi guruh yaratish')}
      subtitle={mode === 'edit' ? t('groups.detail.aboutTitle', 'Guruh haqida') : t('groups.addModal.subtitle', "Guruh ma'lumotlarini to'ldiring")}
      size="lg"
      footer={
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 pb-[max(env(safe-area-inset-bottom),16px)]">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel', 'Bekor qilish')}</Button>
          <Button type="button" onClick={handleSubmit(handleCreate)} isLoading={isSubmitting}>{t('groups.addModal.create', 'Guruh yaratish')}</Button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-5 space-y-4 pb-6">
        {submitError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <form id="add-group-form" onSubmit={handleSubmit(handleCreate)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label={t('groups.addModal.name', 'Guruh nomi') + ' *'} placeholder={t('groups.addModal.namePlaceholder', 'Masalan: Quyoshlar')} {...register('name')} error={errors.name?.message} />
            <Input label={t('groups.addModal.ageRange', "Yosh oralig'i") + ' *'} placeholder={t('groups.addModal.ageRangePlaceholder', 'Masalan: 3-4')} {...register('ageRange')} error={errors.ageRange?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label={t('groups.addModal.capacity', "Sig'imi") + ' *'} type="number" placeholder={t('groups.addModal.capacityPlaceholder', '20')} {...register('capacity')} error={errors.capacity?.message} />
            <Input label={t('groups.addModal.mainTeacher', 'Asosiy tarbiyachi')} placeholder={t('groups.addModal.fullName', "To'liq ism")} {...register('teacher')} error={errors.teacher?.message} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('groups.addModal.color', 'Guruh rangi')}</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button type="button" key={c} onClick={() => setValue('color', c)} className={`w-8 h-8 rounded-xl transition-all duration-200 ${watch('color') === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </form>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-text-primary">
              {t('groups.addModal.assignedEmployees', 'Biriktiriladigan xodimlar')}
            </p>
            <span className="text-xs text-text-tertiary">
              {t('groups.addModal.selectedEmployees', '{{count}} ta tanlangan', { count: selectedStaffIds.length })}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder={t('groups.addModal.searchEmployees', 'Xodimni ism yoki lavozim bo‘yicha qidiring')}
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-border-default divide-y divide-border-subtle bg-surface-primary">
            {filteredStaff.map(employee => {
              const checked = selectedStaffIds.includes(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => toggleStaff(employee.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    checked ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-navy-900 border-navy-900' : 'border-border-default'}`}>
                    {checked ? <Check className="w-3 h-3 text-white" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{employee.firstName} {employee.lastName}</p>
                    <p className="text-xs text-text-tertiary truncate">{employee.position}</p>
                  </div>
                </button>
              );
            })}
            {filteredStaff.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-tertiary">{t('groups.addModal.noEmployeesFound', 'Mos xodim topilmadi')}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const { kindergartenId } = useAuth();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupInfo | null>(null);
  const [groupMenuId, setGroupMenuId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!kindergartenId) return;
    let refs = 0;
    const checkState = () => {
      refs++;
      if (refs >= 3) setIsLoading(false);
    };

    const unsubs = [
      subscribeGroups(kindergartenId, (d: GroupInfo[]) => { setGroups(d); checkState(); }),
      subscribeChildren(kindergartenId, (d: Child[]) => { setChildren(d); checkState(); }),
      subscribeEmployees(kindergartenId, (d: Employee[]) => { setEmployees(d); checkState(); }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [kindergartenId]);

  const groupsWithCounts = useMemo(
    () =>
      groups.map((g) => {
        const childrenInGroup = children.filter(
          (c) => c.groupId === g.id || c.group === g.name,
        );
        const count = childrenInGroup.length;
        const totalAttendance = childrenInGroup.reduce(
          (sum, c) => sum + c.attendanceRate,
          0,
        );
        return {
          ...g,
          currentCount: count,
          avgAttendance: Math.round(
            totalAttendance / Math.max(count, 1),
          ),
        };
      }),
    [groups, children],
  );

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groupsWithCounts.find((g) => g.id === selectedGroupId) ?? null;
  }, [groupsWithCounts, selectedGroupId]);

  const selectedGroupChildren = useMemo(() => {
    if (!selectedGroup) return [];
    return children
      .filter((c) => c.groupId === selectedGroup.id || c.group === selectedGroup.name)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [children, selectedGroup]);

  const selectedGroupStaff = useMemo(() => {
    if (!selectedGroup) return [];
    return employees
      .filter((e) => e.assignedGroupId === selectedGroup.id || e.assignedGroup === selectedGroup.name)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [employees, selectedGroup]);

  const totalChildren = children.length;
  const totalCapacity = groupsWithCounts.reduce((sum, g) => sum + g.capacity, 0);
  const avgAttendance = Math.round(children.reduce((sum, c) => sum + c.attendanceRate, 0) / Math.max(children.length, 1));
  const handleCreateGroup = async (payload: Omit<GroupInfo, 'id'>, selectedStaffIds: string[]) => {
    const created = await createGroup(kindergartenId!, payload);
    const groupId = created.id;
    const groupName = payload.name;

    await Promise.all(
      selectedStaffIds.map(async (employeeId) => {
        const employee = employees.find((e) => e.id === employeeId);
        if (!employee) return;
        await updateEmployee(kindergartenId!, {
          ...employee,
          assignedGroupId: groupId,
          assignedGroup: groupName,
        });
      }),
    );
    // onSnapshot listener (subscribeGroups) will auto-add the new group to state
    toast.success(t('common.added', "Ajoyib! Yangi guruh qo'shildi"));
  };

  const handleUpdateGroup = async (payload: Omit<GroupInfo, 'id'>, selectedStaffIds: string[]) => {
    if (!editGroup) return;
    await updateGroup(kindergartenId!, { ...payload, id: editGroup.id });

    // Update staff assignments (best-effort)
    await Promise.all(
      employees.map(async (employee) => {
        const shouldBeAssigned = selectedStaffIds.includes(employee.id);
        const isAssigned =
          employee.assignedGroupId === editGroup.id || employee.assignedGroup === editGroup.name;

        if (shouldBeAssigned && !isAssigned) {
          await updateEmployee(kindergartenId!, {
            ...employee,
            assignedGroupId: editGroup.id,
            assignedGroup: payload.name,
          });
        }
        if (!shouldBeAssigned && isAssigned) {
          await updateEmployee(kindergartenId!, {
            ...employee,
            assignedGroupId: undefined,
            assignedGroup: undefined,
          });
        }
      }),
    );

    setShowEditModal(false);
    setEditGroup(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{t('groups.title')}</h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
            {t('groups.page.subtitle', '{{groups}} ta guruh • {{children}} bola', { groups: groupsWithCounts.length, children: totalChildren })}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t('groups.addGroup', 'Yangi guruh')}
        </button>
      </motion.div>

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 text-center">
          <GraduationCap className="w-5 h-5 text-navy-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{groupsWithCounts.length}</p>
          <p className="text-xs text-text-tertiary">{t('groups.page.stats.totalGroups', 'Jami guruhlar')}</p>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 text-center">
          <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{totalChildren}</p>
          <p className="text-xs text-text-tertiary">{t('groups.page.stats.totalChildren', 'Jami bolalar')}</p>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 text-center">
          <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{avgAttendance}%</p>
          <p className="text-xs text-text-tertiary">{t('groups.page.stats.avgAttendance', "O'rtacha davomat")}</p>
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-default p-4 text-center">
          <UserCheck className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{totalCapacity - totalChildren}</p>
          <p className="text-xs text-text-tertiary">{t('groups.summary.freeSpots', "Bo'sh joylar")}</p>
        </div>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <CardSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {groupsWithCounts.map((group, index) => {
          const occupancy = Math.round((group.currentCount / group.capacity) * 100);
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              onClick={() => {
                setSelectedGroupId(group.id);
                setIsDetailOpen(true);
              }}
              className="bg-surface-primary rounded-2xl border border-border-default p-5 hover:shadow-lg hover:shadow-black/[0.05] transition-all duration-300 cursor-pointer group"
            >
              {/* Group header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: group.color }}>
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary group-hover:text-text-primary transition-colors">{group.name}</h3>
                    <p className="text-xs text-text-tertiary">{group.ageRange} {t('common.years', 'yosh')}</p>
                  </div>
                </div>
                <div className="relative flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupMenuId((prev) => (prev === group.id ? null : group.id));
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const childCount = children.filter(
                        (c) => c.groupId === group.id || c.group === group.name,
                      ).length;
                      const message = childCount > 0
                        ? t('groups.confirmDeleteWithChildren', `"${group.name}" guruhida ${childCount} ta bola bor. Haqiqatan o'chirmoqchimisiz?`)
                        : t('groups.confirmDelete', `"${group.name}" guruhini o'chirmoqchimisiz?`);
                      if (!confirm(message)) return;
                      try {
                        await deleteGroup(kindergartenId!, group.id);
                        // onSnapshot listener will auto-remove from state
                        toast.success(t('common.deleted', "Muvaffaqiyatli o'chirildi"));
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Guruh o'chirishda xatolik");
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {groupMenuId === group.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-9 w-56 bg-surface-primary rounded-xl shadow-lg border border-border-default py-1 z-30 origin-top-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setGroupMenuId(null);
                            setEditGroup(group as any);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                        >
                          {t('common.edit', 'Tahrirlash')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-tertiary">{t('groups.detail.occupancy', "To'lganlik")}</span>
                  <span className="font-semibold text-text-primary">{group.currentCount}/{group.capacity} ({occupancy}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancy}%` }}
                    transition={{ delay: index * 0.06 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: occupancy >= 90 ? '#ef4444' : occupancy >= 70 ? '#f59e0b' : group.color,
                    }}
                  />
                </div>
              </div>

              {/* Teacher */}
              <div className="flex items-center gap-2.5 mb-4 p-2.5 rounded-xl bg-surface-secondary/50">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{group.teacher}</p>
                  <p className="text-[10px] text-text-tertiary">{t('groups.detail.mainTeacher', 'Asosiy tarbiyachi')}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-text-secondary">{group.avgAttendance}% {t('groups.detail.attendanceLabel', 'davomat')}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-tertiary group-hover:text-text-primary transition-colors">
                  {t('common.viewAll', 'Batafsil')} <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Add group card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupsWithCounts.length * 0.06, duration: 0.4 }}
          onClick={() => setShowAddModal(true)}
          className="bg-surface-primary rounded-2xl border-2 border-dashed border-border-default p-5 hover:border-navy-300 hover:shadow-sm transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[240px] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3 group-hover:bg-surface-tertiary transition-colors">
            <Plus className="w-6 h-6 text-text-tertiary group-hover:text-text-primary transition-colors" />
          </div>
          <p className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{t('groups.addCard.title', 'Yangi guruh yaratish')}</p>
          <p className="text-xs text-text-tertiary mt-1">{t('groups.addCard.subtitle', 'Bolalar uchun yangi guruh oching')}</p>
        </motion.div>
      </div>
      )}

      <Modal
        isOpen={isDetailOpen && Boolean(selectedGroup)}
        onClose={() => setIsDetailOpen(false)}
        title={selectedGroup?.name ?? t('groups.detail.aboutTitle', 'Guruh haqida')}
        subtitle={selectedGroup ? `${selectedGroup.ageRange} ${t('common.years', 'yosh')}` : undefined}
        size="lg"
      >
        {selectedGroup && (
          <div className="px-4 sm:px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border-default bg-surface-secondary/20 p-3">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('groups.detail.occupancy', "To'lganlik")}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1">
                  {selectedGroup.currentCount}/{selectedGroup.capacity}
                </p>
              </div>
              <div className="rounded-xl border border-border-default bg-surface-secondary/20 p-3">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('groups.detail.mainTeacher', 'Asosiy tarbiyachi')}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1">
                  {selectedGroup.teacher || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border-default bg-surface-secondary/20 p-3">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  {t('groups.detail.attendanceLabel', 'davomat')}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1">
                  {(selectedGroup as any).avgAttendance ?? 0}%
                </p>
              </div>
            </div>

            {selectedGroupStaff.length > 0 && (
              <div className="rounded-xl border border-border-default overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface-secondary/20">
                  <p className="text-xs font-semibold text-text-tertiary">
                    {t('groups.addModal.assignedEmployees', 'Biriktiriladigan xodimlar')}
                  </p>
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedGroupStaff.map((e) => (
                    <div key={e.id} className="px-3.5 py-2.5">
                      <p className="text-sm font-medium text-text-primary">
                        {e.firstName} {e.lastName}
                      </p>
                      <p className="text-xs text-text-tertiary">{e.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border-default overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface-secondary/20 flex items-center justify-between">
                <p className="text-xs font-semibold text-text-tertiary">
                  {t('groups.detail.tabs.children', 'Bolalar ({{count}})', { count: selectedGroupChildren.length })}
                </p>
              </div>

              {selectedGroupChildren.length === 0 ? (
                <div className="px-3.5 py-4 text-xs text-text-tertiary">
                  {t('groups.detail.noChildren', 'Bu guruhda hali bolalar yo‘q')}
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {selectedGroupChildren.map((c) => (
                    <div key={c.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {t('common.status', 'Holat')}: {t(`children.status.${c.status}` as any, c.status)}
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-text-secondary flex-shrink-0">
                        {c.attendanceRate}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <AddGroupModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleCreateGroup} employees={employees} mode="add" initialGroup={null} />
      <AddGroupModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditGroup(null); }} onSubmit={handleUpdateGroup} employees={employees} mode="edit" initialGroup={editGroup} />
    </div>
  );
}
