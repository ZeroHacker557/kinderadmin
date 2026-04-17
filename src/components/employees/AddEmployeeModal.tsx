import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import type { Department } from '@/types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  mode?: 'add' | 'edit';
  initialData?: EmployeeFormData;
  departmentOptions?: Department[];
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  position: string;
  departmentId: string;
  phone: string;
  salary: string; // keep string for inputs
  hireDate: string;
  workSchedule: string;
  education: string;
  experience: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

const emptyForm: EmployeeFormData = {
  firstName: '',
  lastName: '',
  position: '',
  departmentId: '',
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
};

export default function AddEmployeeModal({ isOpen, onClose, onSubmit, mode = 'add', initialData, departmentOptions = [] }: AddEmployeeModalProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<EmployeeFormData>(initialData ?? emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(0);
    setForm(initialData ?? emptyForm);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen, initialData, mode]);

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

  const steps = [
    { id: 0, title: t('employees.addModal.steps.personal', "Shaxsiy ma'lumotlar"), icon: '👤' },
    { id: 1, title: t('employees.addModal.steps.work', "Ish ma'lumotlari"), icon: '💼' },
    { id: 2, title: t('employees.addModal.steps.extra', "Qo'shimcha"), icon: '📋' },
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setActiveStep(0);
      setForm(emptyForm);
      setSubmitError(null);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Saqlashda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setActiveStep(0);
        setForm(initialData ?? emptyForm);
        onClose();
      }}
      title={mode === 'edit' ? t('employees.editModal.title', 'Profilni tahrirlash') : t('employees.addModal.title')}
      subtitle={mode === 'edit' ? t('employees.editModal.subtitle', "Xodim ma'lumotlarini tahrirlang") : t('employees.addModal.subtitle', "Xodim ma'lumotlarini to'ldiring")}
      size="lg"
    >
      {/* Step indicator */}
      <div className="px-4 sm:px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                activeStep === step.id
                  ? 'bg-navy-900 text-white shadow-sm'
                  : activeStep > step.id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-surface-primary border border-border-default text-text-secondary'
              }`}
            >
              <span className="text-base">{activeStep > step.id ? '✓' : step.icon}</span>
              <div className="min-w-0 hidden sm:block">
                <p className="text-[10px] font-medium opacity-70">{t('common.step', 'Qadam')} {index + 1}</p>
                <p className="text-xs font-semibold truncate">{step.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="px-4 sm:px-6 py-5 space-y-4 min-h-[320px]">
        {submitError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {submitError}
          </div>
        )}
        {activeStep === 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('employees.addModal.firstName', 'Ism')} *</label>
                <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder={t('employees.addModal.firstNamePlaceholder', 'Masalan: Maria')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('employees.addModal.lastName', 'Familiya')} *</label>
                <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder={t('employees.addModal.lastNamePlaceholder', 'Masalan: Rodriguez')} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('employees.addModal.phone', 'Telefon')} *</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+998 90 123-45-67" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('employees.addModal.address', 'Manzil')}</label>
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder={t('employees.addModal.addressPlaceholder', 'Toshkent sh., ...')} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('employees.addModal.emergencyContact', 'Favqulodda aloqa')}</label>
                <input type="text" value={form.emergencyContact} onChange={e => update('emergencyContact', e.target.value)} placeholder={t('employees.addModal.fullName', "To'liq ism")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('employees.addModal.emergencyPhone', 'Favqulodda telefon')}</label>
                <input type="tel" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} placeholder="+998 90 ..." className={inputClass} />
              </div>
            </div>
          </>
        )}

        {activeStep === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('employees.addModal.position', 'Lavozim')} *</label>
                <input type="text" value={form.position} onChange={e => update('position', e.target.value)} placeholder={t('employees.addModal.positionPlaceholder', 'Masalan: Tarbiyachi')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('employees.addModal.department', "Bo'lim")} *</label>
                <select value={form.departmentId} onChange={e => update('departmentId', e.target.value)} className={inputClass}>
                  <option value="">{t('employees.addModal.departmentSelect', "Bo'limni tanlang")}</option>
                  {departmentOptions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('employees.addModal.salaryLabel', "Ish haqi (so'm)")} *</label>
                <input type="number" value={form.salary} onChange={e => update('salary', e.target.value)} placeholder="5000000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('employees.addModal.hireDate', 'Ishga kirgan sana')} *</label>
                <input type="date" value={form.hireDate} onChange={e => update('hireDate', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('employees.addModal.workSchedule', 'Ish grafigi')}</label>
              <input type="text" value={form.workSchedule} onChange={e => update('workSchedule', e.target.value)} placeholder="Du-Ju 08:00-17:00, Sha 08:00-13:00" className={inputClass} />
            </div>
          </>
        )}

        {activeStep === 2 && (
          <>
            <div>
              <label className={labelClass}>{t('employees.addModal.education', "Ma'lumoti")}</label>
              <input type="text" value={form.education} onChange={e => update('education', e.target.value)} placeholder="Oliy — Pedagogika universiteti" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('employees.addModal.experience', 'Tajriba')}</label>
              <input type="text" value={form.experience} onChange={e => update('experience', e.target.value)} placeholder="5 yil" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('employees.addModal.notes', 'Izohlar')}</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={t('employees.addModal.notesPlaceholder', "Qo'shimcha ma'lumotlar...")} rows={4} className={`${inputClass} resize-none`} />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30">
        <button
          onClick={() => {
            if (activeStep > 0) return setActiveStep(activeStep - 1);
            setActiveStep(0);
            setForm(initialData ?? emptyForm);
            onClose();
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary border border-border-default transition-colors"
        >
          {activeStep === 0 ? t('common.cancel', 'Bekor qilish') : t('common.back', 'Orqaga')}
        </button>
        <div className="flex items-center gap-1.5">
          {steps.map(s => (
            <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-200 ${activeStep === s.id ? 'bg-navy-900 w-5' : activeStep > s.id ? 'bg-emerald-500' : 'bg-border-default'}`} />
          ))}
        </div>
        {activeStep < steps.length - 1 ? (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
          >
            {t('common.next', 'Keyingi')}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
          >
            {mode === 'edit' ? t('common.save', 'Saqlash') : t('employees.addEmployee', "Xodim qo'shish")}
          </button>
        )}
      </div>
    </Modal>
  );
}
