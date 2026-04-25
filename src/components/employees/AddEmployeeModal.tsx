import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import type { Department } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

// Validation schema
const employeeSchema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 ta harfdan iborat bo\'lishi kerak'),
  position: z.string().min(2, 'Lavozim kiritilishi shart'),
  departmentId: z.string().min(1, 'Bo\'lim tanlanishi shart'),
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  salary: z.string().min(1, 'Ish haqi kiritilishi shart'),
  hireDate: z.string().min(1, 'Sana kiritilishi shart'),
  workSchedule: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  mode?: 'add' | 'edit';
  initialData?: EmployeeFormData;
  departmentOptions?: Department[];
}

export default function AddEmployeeModal({ isOpen, onClose, onSubmit, mode = 'add', initialData, departmentOptions = [] }: AddEmployeeModalProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData || {
      firstName: '', lastName: '', position: '', departmentId: '', phone: '',
      salary: '', hireDate: '', workSchedule: '', education: '', experience: '',
      address: '', emergencyContact: '', emergencyPhone: '', notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) reset(initialData);
      else reset({
        firstName: '', lastName: '', position: '', departmentId: '', phone: '',
        salary: '', hireDate: '', workSchedule: '', education: '', experience: '',
        address: '', emergencyContact: '', emergencyPhone: '', notes: ''
      });
      setActiveStep(0);
      setSubmitError(null);
    }
  }, [isOpen, initialData, reset]);

  const steps = [
    { id: 0, title: t('employees.addModal.steps.personal', "Shaxsiy ma'lumotlar"), icon: '👤', fields: ['firstName', 'lastName', 'phone', 'address', 'emergencyContact', 'emergencyPhone'] },
    { id: 1, title: t('employees.addModal.steps.work', "Ish ma'lumotlari"), icon: '💼', fields: ['position', 'departmentId', 'salary', 'hireDate', 'workSchedule'] },
    { id: 2, title: t('employees.addModal.steps.extra', "Qo'shimcha"), icon: '📋', fields: ['education', 'experience', 'notes'] },
  ];

  const onNextStep = async () => {
    const fieldsToValidate = steps[activeStep].fields as (keyof EmployeeFormData)[];
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setActiveStep(prev => prev + 1);
  };

  const submitForm = async (data: EmployeeFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Saqlashda xatolik");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? t('employees.editModal.title', 'Profilni tahrirlash') : t('employees.addModal.title', 'Xodim qo\'shish')}
      subtitle={mode === 'edit' ? t('employees.editModal.subtitle', "Xodim ma'lumotlarini tahrirlang") : t('employees.addModal.subtitle', "Xodim ma'lumotlarini to'ldiring")}
      size="lg"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={async () => {
                if (step.id < activeStep) setActiveStep(step.id);
                else {
                  let valid = true;
                  for (let i = activeStep; i < step.id; i++) {
                    const stepValid = await trigger(steps[i].fields as any);
                    if (!stepValid) { valid = false; break; }
                  }
                  if (valid) setActiveStep(step.id);
                }
              }}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                activeStep === step.id
                  ? 'bg-primary text-white shadow-sm'
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

      <form onSubmit={handleSubmit(submitForm)}>
        <div className="px-4 sm:px-6 py-5 space-y-4 min-h-[320px]">
          {submitError && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              {submitError}
            </div>
          )}
          {activeStep === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('employees.addModal.firstName', 'Ism') + ' *'} placeholder={t('employees.addModal.firstNamePlaceholder', 'Masalan: Maria')} {...register('firstName')} error={errors.firstName?.message} />
                <Input label={t('employees.addModal.lastName', 'Familiya') + ' *'} placeholder={t('employees.addModal.lastNamePlaceholder', 'Masalan: Rodriguez')} {...register('lastName')} error={errors.lastName?.message} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('employees.addModal.phone', 'Telefon') + ' *'} type="tel" placeholder="+998 90 123-45-67" {...register('phone')} error={errors.phone?.message} />
              </div>
              <Input label={t('employees.addModal.address', 'Manzil')} placeholder={t('employees.addModal.addressPlaceholder', 'Toshkent sh., ...')} {...register('address')} error={errors.address?.message} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('employees.addModal.emergencyContact', 'Favqulodda aloqa')} placeholder={t('employees.addModal.fullName', "To'liq ism")} {...register('emergencyContact')} error={errors.emergencyContact?.message} />
                <Input label={t('employees.addModal.emergencyPhone', 'Favqulodda telefon')} type="tel" placeholder="+998 90 ..." {...register('emergencyPhone')} error={errors.emergencyPhone?.message} />
              </div>
            </>
          )}

          {activeStep === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('employees.addModal.position', 'Lavozim') + ' *'} placeholder={t('employees.addModal.positionPlaceholder', 'Masalan: Tarbiyachi')} {...register('position')} error={errors.position?.message} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">{t('employees.addModal.department', "Bo'lim")} *</label>
                  <Select value={watch('departmentId')} onValueChange={(val) => setValue('departmentId', val)}>
                    <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                      <SelectValue placeholder={t('employees.addModal.departmentSelect', "Bo'limni tanlang")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('employees.addModal.salaryLabel', "Ish haqi (so'm)") + ' *'} type="number" placeholder="5000000" {...register('salary')} error={errors.salary?.message} />
                <Input label={t('employees.addModal.hireDate', 'Ishga kirgan sana') + ' *'} type="date" {...register('hireDate')} error={errors.hireDate?.message} />
              </div>
              <Input label={t('employees.addModal.workSchedule', 'Ish grafigi')} placeholder="Du-Ju 08:00-17:00, Sha 08:00-13:00" {...register('workSchedule')} error={errors.workSchedule?.message} />
            </>
          )}

          {activeStep === 2 && (
            <>
              <Input label={t('employees.addModal.education', "Ma'lumoti")} placeholder="Oliy — Pedagogika universiteti" {...register('education')} error={errors.education?.message} />
              <Input label={t('employees.addModal.experience', 'Tajriba')} placeholder="5 yil" {...register('experience')} error={errors.experience?.message} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">{t('employees.addModal.notes', 'Izohlar')}</label>
                <textarea 
                  {...register('notes')} 
                  placeholder={t('employees.addModal.notesPlaceholder', "Qo'shimcha ma'lumotlar...")} 
                  rows={4} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (activeStep > 0) return setActiveStep(activeStep - 1);
              onClose();
            }}
          >
            {activeStep === 0 ? t('common.cancel', 'Bekor qilish') : t('common.back', 'Orqaga')}
          </Button>
          
          <div className="flex items-center gap-1.5">
            {steps.map(s => (
              <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-200 ${activeStep === s.id ? 'bg-primary w-5' : activeStep > s.id ? 'bg-emerald-500' : 'bg-border-default'}`} />
            ))}
          </div>
          
          {activeStep < steps.length - 1 ? (
            <Button type="button" onClick={onNextStep}>
              {t('common.next', 'Keyingi')}
            </Button>
          ) : (
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'edit' ? t('common.save', 'Saqlash') : t('employees.addEmployee', "Xodim qo'shish")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
