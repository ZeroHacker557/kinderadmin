import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, MapPin, Calendar, Briefcase, Clock,
  GraduationCap, Star, Shield, Award,
  Users, ChevronRight, TrendingUp,
} from 'lucide-react';
import type { Employee } from '@/types';
import { useTranslation } from 'react-i18next';
import { formatDateDisplay } from '@/utils/date';

interface EmployeeDetailPanelProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
}

function calculateTenure(hireDate: string, units: { month: string; year: string }): string {
  const start = new Date(hireDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} ${units.month}`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} ${units.year} ${m} ${units.month}` : `${y} ${units.year}`;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : i <= rating ? 'text-amber-400 fill-amber-200' : 'text-gray-200 fill-gray-100'}`}
        />
      ))}
      <span className="text-xs font-semibold text-text-secondary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function EmployeeDetailPanel({ employee, isOpen, onClose, onEdit }: EmployeeDetailPanelProps) {
  if (!employee) return null;

  const { t } = useTranslation();
  const locale = t('common.locale', 'uz-UZ');
  const currency = t('common.currency', "so'm");

  const statusConfig = {
    active: { label: t('employees.status.active', 'Faol'), bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
    on_leave: { label: t('employees.status.on_leave', "Ta'tilda"), bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
    terminated: { label: t('employees.status.terminated', "Ishdan bo'shagan"), bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-200' },
  } as const;

  const formatSalary = (amount: number): string =>
    amount.toLocaleString(locale) + ' ' + currency;

  const formatDate = (dateStr: string): string => formatDateDisplay(dateStr, 'dd.MM.yyyy');

  const status = statusConfig[employee.status];
  const leaveUsedPercent = Math.round((employee.leaveBalance.used / employee.leaveBalance.annual) * 100);
  const sickUsedPercent = Math.round((employee.leaveBalance.usedSick / employee.leaveBalance.sick) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[500px] lg:w-[540px] bg-surface-primary shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border-default flex-shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">{t('employees.detail.title', 'Xodim profili')}</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all" aria-label={t('common.close', 'Yopish')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile header */}
              <div className="px-5 sm:px-6 py-5 bg-gradient-to-br from-surface-secondary to-surface-primary">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-text-primary">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-text-secondary mt-0.5">{employee.position}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <span className="text-xs text-text-tertiary">{employee.department}</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{employee.performanceRating.toFixed(1)}</p>
                    <p className="text-[10px] text-text-tertiary">{t('employees.detail.quickStats.rating', 'Baholash')}</p>
                  </div>
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{calculateTenure(employee.hireDate, { month: t('employees.detail.tenure.month', 'oy'), year: t('employees.detail.tenure.year', 'yil') })}</p>
                    <p className="text-[10px] text-text-tertiary">{t('employees.detail.quickStats.tenure', 'Staj')}</p>
                  </div>
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{employee.experience}</p>
                    <p className="text-[10px] text-text-tertiary">{t('employees.detail.quickStats.experience', 'Tajriba')}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-5 space-y-6">
                {/* Contact info */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.contact', "Aloqa ma'lumotlari")}
                  </h4>
                  <div className="space-y-2">
                    <a href={`tel:${employee.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-border-default hover:bg-surface-secondary/50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-tertiary">{t('employees.detail.fields.phone', 'Telefon')}</p>
                        <p className="text-sm font-medium text-text-primary group-hover:text-text-primary transition-colors">{employee.phone}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border-default">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-tertiary">{t('employees.detail.fields.address', 'Manzil')}</p>
                        <p className="text-sm font-medium text-text-primary">{employee.address}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Work info */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.work', "Ish ma'lumotlari")}
                  </h4>
                  <div className="rounded-xl border border-border-default overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-border-subtle">
                      <div className="p-3.5">
                        <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.department', "Bo'lim")}</p>
                        <p className="text-sm font-medium text-text-primary">{employee.department}</p>
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.position', 'Lavozim')}</p>
                        <p className="text-sm font-medium text-text-primary">{employee.position}</p>
                      </div>
                    </div>
                    <div className="border-t border-border-subtle grid grid-cols-2 divide-x divide-border-subtle">
                      <div className="p-3.5">
                        <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.workSchedule', 'Ish grafigi')}</p>
                        <p className="text-sm font-medium text-text-primary">{employee.workSchedule}</p>
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.salary', 'Ish haqi')}</p>
                        <p className="text-sm font-bold text-emerald-700">{formatSalary(employee.salary)}</p>
                      </div>
                    </div>
                    <div className="border-t border-border-subtle grid grid-cols-2 divide-x divide-border-subtle">
                      <div className="p-3.5">
                        <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.hireDate', 'Ishga kirgan sana')}</p>
                        <p className="text-sm font-medium text-text-primary">{formatDate(employee.hireDate)}</p>
                      </div>
                      {employee.assignedGroup && (
                        <div className="p-3.5">
                          <p className="text-xs text-text-tertiary mb-1">{t('employees.detail.fields.assignedGroup', 'Biriktirilgan guruh')}</p>
                          <p className="text-sm font-medium text-text-primary">{employee.assignedGroup}</p>
                        </div>
                      )}
                    </div>
                    {(employee.lastSalaryPaymentAmount || employee.lastSalaryPaymentDate) && (
                      <div className="border-t border-border-subtle grid grid-cols-2 divide-x divide-border-subtle">
                        <div className="p-3.5">
                          <p className="text-xs text-text-tertiary mb-1">Oxirgi ish haqi to'lovi</p>
                          <p className="text-sm font-semibold text-emerald-700">
                            {employee.lastSalaryPaymentAmount
                              ? formatSalary(employee.lastSalaryPaymentAmount)
                              : '—'}
                          </p>
                        </div>
                        <div className="p-3.5">
                          <p className="text-xs text-text-tertiary mb-1">To'langan sana</p>
                          <p className="text-sm font-medium text-text-primary">
                            {employee.lastSalaryPaymentDate ? formatDate(employee.lastSalaryPaymentDate) : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Education */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.education', "Ma'lumoti")}
                  </h4>
                  <div className="p-3.5 rounded-xl border border-border-default bg-surface-secondary/30">
                    <p className="text-sm text-text-primary font-medium">{employee.education}</p>
                    <p className="text-xs text-text-tertiary mt-1">{t('employees.detail.experienceLabel', 'Tajriba:')} {employee.experience}</p>
                  </div>
                </section>

                {/* Performance rating */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.performance', 'Ish samaradorligi')}
                  </h4>
                  <div className="p-3.5 rounded-xl border border-border-default">
                    <div className="flex items-center justify-between mb-2">
                      <RatingStars rating={employee.performanceRating} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        employee.performanceRating >= 4.5 ? 'bg-emerald-50 text-emerald-700' :
                        employee.performanceRating >= 3.5 ? 'bg-blue-50 text-blue-700' :
                        employee.performanceRating >= 2.5 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {employee.performanceRating >= 4.5 ? t('employees.detail.performanceGrades.excellent', "A'lo") :
                         employee.performanceRating >= 3.5 ? t('employees.detail.performanceGrades.good', 'Yaxshi') :
                         employee.performanceRating >= 2.5 ? t('employees.detail.performanceGrades.average', "O'rtacha") : t('employees.detail.performanceGrades.low', 'Past')}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(employee.performanceRating / 5) * 100}%`,
                          backgroundColor: employee.performanceRating >= 4.5 ? '#10b981' :
                            employee.performanceRating >= 3.5 ? '#3b82f6' :
                            employee.performanceRating >= 2.5 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* Leave balance */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.leaveBalance', "Ta'til balansi")}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-border-default">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-text-secondary">{t('employees.detail.leave.annual', "Yillik ta'til")}</p>
                        <span className="text-xs text-text-tertiary">{employee.leaveBalance.used}/{employee.leaveBalance.annual} {t('employees.detail.leave.day', 'kun')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${leaveUsedPercent}%` }} />
                      </div>
                      <p className="text-xs text-text-tertiary mt-1.5">{t('employees.detail.leave.remaining', 'Qolgan:')} <span className="font-semibold text-blue-600">{employee.leaveBalance.annual - employee.leaveBalance.used} {t('employees.detail.leave.day', 'kun')}</span></p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border-default">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-text-secondary">{t('employees.detail.leave.sick', 'Kasallik')}</p>
                        <span className="text-xs text-text-tertiary">{employee.leaveBalance.usedSick}/{employee.leaveBalance.sick} {t('employees.detail.leave.day', 'kun')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${sickUsedPercent}%` }} />
                      </div>
                      <p className="text-xs text-text-tertiary mt-1.5">{t('employees.detail.leave.remaining', 'Qolgan:')} <span className="font-semibold text-amber-600">{employee.leaveBalance.sick - employee.leaveBalance.usedSick} {t('employees.detail.leave.day', 'kun')}</span></p>
                    </div>
                  </div>
                </section>

                {/* Emergency contact */}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.emergency', 'Favqulodda aloqa')}
                  </h4>
                  <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{employee.emergencyContact}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{t('employees.detail.emergencyHint', 'Favqulodda holat uchun aloqa shaxsi')}</p>
                      </div>
                      <a href={`tel:${employee.emergencyPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold hover:bg-red-500/15 transition-colors">
                        <Phone className="w-3 h-3" />
                        {employee.emergencyPhone}
                      </a>
                    </div>
                  </div>
                </section>

                {/* Notes */}
                {employee.notes && (
                  <section>
                    <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-tertiary" /> {t('employees.detail.sections.notes', 'Izohlar')}
                    </h4>
                    <p className="text-sm text-text-secondary bg-surface-secondary/50 px-3.5 py-2.5 rounded-xl border border-border-subtle italic">
                      {employee.notes}
                    </p>
                  </section>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 flex-shrink-0">
              <button
                onClick={() => onEdit?.(employee)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('employees.detail.actions.editProfile', 'Profilni tahrirlash')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
