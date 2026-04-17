import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, MapPin, Calendar, Heart, AlertTriangle,
  Users, CreditCard, TrendingUp, Clock, ExternalLink, Pill, Droplets, Shield,
} from 'lucide-react';
import type { Child } from '@/types';
import { useTranslation } from 'react-i18next';
import { formatDateDisplay } from '@/utils/date';

interface ChildDetailPanelProps {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (child: Child) => void;
}

export default function ChildDetailPanel({ child, isOpen, onClose, onEdit }: ChildDetailPanelProps) {
  const { t } = useTranslation();

  if (!child) return null;

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

  const relationLabels: Record<string, string> = {
    mother: t('children.relation.mother', 'Ona'),
    father: t('children.relation.father', 'Ota'),
    guardian: t('children.relation.guardian', 'Vasiy'),
  };

  const calculateAge = (dob: string): string => {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years < 1) return `${months + (years * 12)} ${t('common.months', 'oy')}`;
    if (months < 0) return `${years - 1} ${t('common.yearsShort', 'yosh')} ${12 + months} ${t('common.months', 'oy')}`;
    return `${years} ${t('common.yearsShort', 'yosh')} ${months} ${t('common.months', 'oy')}`;
  };

  const status = statusConfig[child.status];
  const age = calculateAge(child.dateOfBirth);
  const latestPayment = child.payments[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed right-0 top-0 h-screen w-full sm:w-[480px] lg:w-[520px] bg-surface-primary shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border-default flex-shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">{t('children.detail.profile', 'Bola profili')}</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all" aria-label={t('common.close', 'Yopish')}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 sm:px-6 py-5 bg-gradient-to-br from-surface-secondary to-surface-primary">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-text-primary">{child.firstName} {child.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}</span>
                      <span className="text-xs text-text-tertiary">{child.group}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {age}</span>
                      <span>{child.gender === 'male' ? t('children.addModal.male', 'O\'g\'il').replace('♂', '').trim() : t('children.addModal.female', 'Qiz').replace('♀', '').trim()}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{child.attendanceRate}%</p>
                    <p className="text-[10px] text-text-tertiary">{t('children.detail.attendance', 'Davomat')}</p>
                  </div>
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <CreditCard className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{latestPayment ? `${latestPayment.paidAmount.toLocaleString(t('common.locale', 'uz-UZ'))}` : '—'}</p>
                    <p className="text-[10px] text-text-tertiary">{t('children.detail.latestPayment', 'Oxirgi to\'lov')}</p>
                  </div>
                  <div className="bg-surface-primary rounded-xl p-3 border border-border-subtle text-center">
                    <Clock className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{formatDateDisplay(child.enrollmentDate, 'dd.MM.yyyy')}</p>
                    <p className="text-[10px] text-text-tertiary">{t('children.detail.enrolled', 'Ro\'yxatdan')}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 sm:px-6 py-5 space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-text-tertiary" /> {t('children.detail.parentsGuardians', 'Ota-onalar / Vasiylar')}</h4>
                  <div className="space-y-3">
                    {child.parents.map((parent) => (
                      <div key={parent.id} className="p-3.5 rounded-xl border border-border-default bg-surface-secondary/30 hover:bg-surface-secondary/60 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div><p className="text-sm font-medium text-text-primary">{parent.firstName} {parent.lastName}</p><p className="text-xs text-text-tertiary">{relationLabels[parent.relation]}{parent.occupation ? ` • ${parent.occupation}` : ''}</p></div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <a href={`tel:${parent.phone}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors group"><Phone className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-primary" />{parent.phone}<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                {child.address && (
                  <section>
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-text-tertiary" /> {t('children.addModal.address', 'Uy manzili')}</h4>
                    <p className="text-sm text-text-secondary bg-surface-secondary/50 px-3.5 py-2.5 rounded-xl border border-border-subtle">{child.address}</p>
                  </section>
                )}
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-text-tertiary" /> {t('children.detail.medicalInfo', 'Tibbiy ma\'lumot')}</h4>
                  <div className="p-3.5 rounded-xl border border-border-default space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div><p className="text-xs text-red-600 font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> {t('children.detail.emergencyContact', 'Favqulodda aloqa')}</p><p className="text-sm font-medium text-text-primary mt-0.5">{child.medical.emergencyContact}</p></div>
                      <a href={`tel:${child.medical.emergencyPhone}`} className="text-sm text-red-600 font-medium hover:underline">{child.medical.emergencyPhone}</a>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {child.medical.bloodType && <div className="flex items-center gap-2 text-sm"><Droplets className="w-4 h-4 text-red-400" /><span className="text-text-tertiary">{t('children.detail.bloodType', 'Qon:')}</span><span className="font-semibold text-text-primary">{child.medical.bloodType}</span></div>}
                      {child.medical.doctorName && <div className="flex items-center gap-2 text-sm"><Heart className="w-4 h-4 text-blue-400" /><span className="text-text-tertiary">{t('children.detail.doctor', 'Dr:')}</span><span className="font-medium text-text-primary truncate">{child.medical.doctorName}</span></div>}
                    </div>
                    {child.medical.allergies.length > 0 && (
                      <div><p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1.5"><AlertTriangle className="w-3 h-3" /> {t('children.detail.allergies', 'Allergiyalar')}</p><div className="flex flex-wrap gap-1.5">{child.medical.allergies.map((a) => <span key={a} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">{a}</span>)}</div></div>
                    )}
                    {child.medical.conditions.length > 0 && (
                      <div><p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1.5"><Heart className="w-3 h-3" /> {t('children.detail.conditions', 'Holatlar')}</p><div className="flex flex-wrap gap-1.5">{child.medical.conditions.map((c) => <span key={c} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{c}</span>)}</div></div>
                    )}
                    {child.medical.medications.length > 0 && (
                      <div><p className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1.5"><Pill className="w-3 h-3" /> {t('children.detail.medications', 'Dori-darmonlar')}</p><div className="flex flex-wrap gap-1.5">{child.medical.medications.map((m) => <span key={m} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">{m}</span>)}</div></div>
                    )}
                    {child.medical.allergies.length === 0 && child.medical.conditions.length === 0 && child.medical.medications.length === 0 && (
                      <p className="text-xs text-text-tertiary text-center py-2">{t('children.detail.noMedicalRecords', 'Allergiya, holat yoki dori-darmon ma\'lumotlari yo\'q.')}</p>
                    )}
                  </div>
                </section>
                <section>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-text-tertiary" /> {t('children.detail.paymentHistory', 'To\'lov tarixi')}</h4>
                  <div className="rounded-xl border border-border-default overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="border-b border-border-subtle bg-surface-secondary/30"><th className="text-left text-xs font-semibold text-text-tertiary px-3.5 py-2.5">{t('common.month', 'Oy')}</th><th className="text-left text-xs font-semibold text-text-tertiary px-3 py-2.5">{t('common.amount', 'Summa')}</th><th className="text-right text-xs font-semibold text-text-tertiary px-3.5 py-2.5">{t('common.status', 'Holat')}</th></tr></thead>
                      <tbody>
                        {child.payments.map((payment) => {
                          const ps = paymentStatusConfig[payment.status];
                          return (
                            <tr key={payment.id} className="border-b border-border-subtle last:border-0">
                              <td className="px-3.5 py-2.5 text-sm text-text-primary font-medium">{formatDateDisplay(payment.month + '-01', 'dd.MM.yyyy')}</td>
                              <td className="px-3 py-2.5 text-sm text-text-secondary">{payment.paidAmount.toLocaleString(t('common.locale', 'uz-UZ'))} / {payment.amount.toLocaleString(t('common.locale', 'uz-UZ'))}</td>
                              <td className="px-3.5 py-2.5 text-right"><span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${ps.bg} ${ps.text}`}>{ps.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
                {child.notes && (
                  <section><h4 className="text-sm font-semibold text-text-primary mb-2">{t('children.addModal.notes', 'Izohlar')}</h4><p className="text-sm text-text-secondary bg-surface-secondary/50 px-3.5 py-2.5 rounded-xl border border-border-subtle italic">{child.notes}</p></section>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 flex-shrink-0">
              <button
                onClick={() => onEdit(child)}
                className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
              >
                {t('children.detail.editProfile', 'Profilni tahrirlash')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
