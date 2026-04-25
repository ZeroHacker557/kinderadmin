import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Heart, CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { GroupInfo } from '@/types';
import { useTranslation } from 'react-i18next';

const childSchema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 ta harfdan iborat bo\'lishi kerak'),
  dateOfBirth: z.string().min(1, 'Tug\'ilgan sana kiritilishi shart'),
  gender: z.enum(['male', 'female']),
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  status: z.enum(['active', 'trial', 'inactive']),
  address: z.string().optional(),
  notes: z.string().optional(),
  parents: z.array(z.object({
    firstName: z.string().min(2, 'Ism kiritilishi shart'),
    lastName: z.string().min(2, 'Familiya kiritilishi shart'),
    relation: z.enum(['mother', 'father', 'guardian']),
    phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
    occupation: z.string().optional()
  })).min(1),
  medical: z.object({
    bloodType: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
    conditions: z.string().optional(),
    emergencyContact: z.string().min(2, 'Favqulodda aloqa kiritilishi shart'),
    emergencyPhone: z.string().min(9, 'Favqulodda telefon kiritilishi shart'),
    doctorName: z.string().optional(),
    doctorPhone: z.string().optional(),
    notes: z.string().optional()
  })
});

export type AddChildFormData = z.infer<typeof childSchema>;

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddChildFormData) => Promise<void>;
  groups: GroupInfo[];
  mode?: 'add' | 'edit';
  initialData?: AddChildFormData | null;
}

export default function AddChildModal({ isOpen, onClose, onSubmit, groups, mode = 'add', initialData = null }: AddChildModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AddChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: initialData || {
      firstName: '', lastName: '', dateOfBirth: '', gender: 'male', groupId: '', status: 'active', address: '', notes: '',
      parents: [{ firstName: '', lastName: '', relation: 'mother', phone: '', occupation: '' }],
      medical: { bloodType: '', allergies: '', medications: '', conditions: '', emergencyContact: '', emergencyPhone: '', doctorName: '', doctorPhone: '', notes: '' },
    }
  });

  const { fields: parentFields, append, remove } = useFieldArray({
    control,
    name: 'parents'
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) reset(initialData);
      else reset({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'male', groupId: '', status: 'active', address: '', notes: '',
        parents: [{ firstName: '', lastName: '', relation: 'mother', phone: '', occupation: '' }],
        medical: { bloodType: '', allergies: '', medications: '', conditions: '', emergencyContact: '', emergencyPhone: '', doctorName: '', doctorPhone: '', notes: '' }
      });
      setCurrentStep(1);
      setSubmitError(null);
    }
  }, [isOpen, initialData, reset]);

  const steps = [
    { id: 1, label: t('children.addModal.stepPersonal', 'Shaxsiy ma\'lumot'), icon: <User className="w-4 h-4" />, fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'groupId', 'status', 'address', 'notes'] },
    { id: 2, label: t('children.addModal.stepParents', 'Ota-ona'), icon: <Users className="w-4 h-4" />, fields: ['parents'] },
    { id: 3, label: t('children.addModal.stepMedical', 'Tibbiy ma\'lumot'), icon: <Heart className="w-4 h-4" />, fields: ['medical.emergencyContact', 'medical.emergencyPhone'] },
    { id: 4, label: t('children.addModal.stepReview', 'Tekshirish'), icon: <CheckCircle2 className="w-4 h-4" />, fields: [] },
  ];

  const onNextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields as (keyof AddChildFormData)[];
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setCurrentStep(prev => prev + 1);
  };

  const submitForm = async (data: AddChildFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Saqlashda xatolik");
    }
  };

  const selectedGroupId = watch('groupId');
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const relationLabels: Record<string, string> = { mother: t('children.relation.mother', 'Ona'), father: t('children.relation.father', 'Ota'), guardian: t('children.relation.guardian', 'Vasiy') };

  const formValues = watch();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? t('children.addModal.editTitle', 'Bola profilini tahrirlash') : t('children.addModal.title', 'Yangi bola ro\'yxatga olish')}
      subtitle={mode === 'edit' ? t('children.addModal.editSubtitle', 'Bola ma\'lumotlarini yangilang') : t('children.addModal.subtitle', 'Ro\'yxatga olish uchun barcha bosqichlarni to\'ldiring')}
      size="xl"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button 
                type="button"
                onClick={async () => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                  else {
                    let valid = true;
                    for (let i = currentStep - 1; i < step.id - 1; i++) {
                      const stepValid = await trigger(steps[i].fields as any);
                      if (!stepValid) { valid = false; break; }
                    }
                    if (valid) setCurrentStep(step.id);
                  }
                }} 
                className={`flex items-center gap-2 transition-all duration-200 ${step.id === currentStep ? 'text-primary' : step.id < currentStep ? 'text-emerald-600 cursor-pointer' : 'text-text-tertiary'}`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step.id === currentStep ? 'bg-primary text-white' : step.id < currentStep ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-tertiary text-text-tertiary'}`}>
                  {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && <div className={`flex-1 h-px mx-2 sm:mx-3 transition-colors duration-300 ${step.id < currentStep ? 'bg-emerald-300' : 'bg-border-default'}`} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(submitForm)}>
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {currentStep === 1 && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Ism *" placeholder="Ismni kiriting" {...register('firstName')} error={errors.firstName?.message} />
                    <Input label="Familiya *" placeholder="Familiyani kiriting" {...register('lastName')} error={errors.lastName?.message} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Tug'ilgan sana *" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-primary">Jinsi</label>
                      <div className="flex gap-2">
                        {(['male', 'female'] as const).map((g) => (
                          <button key={g} type="button" onClick={() => setValue('gender', g)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${watch('gender') === g ? 'bg-primary text-white border-primary' : 'bg-surface-primary text-text-secondary border-border-default hover:border-primary/50'}`}>
                            {g === 'male' ? '♂ O\'g\'il' : '♀ Qiz'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-primary">Guruhga biriktirish *</label>
                      <Select value={watch('groupId')} onValueChange={(val) => setValue('groupId', val)}>
                        <SelectTrigger className={errors.groupId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Guruh tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name} ({g.currentCount}/{g.capacity}) — {g.ageRange} yosh</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.groupId && <p className="text-sm text-red-500">{errors.groupId.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-primary">Holati</label>
                      <Select value={watch('status')} onValueChange={(val: any) => setValue('status', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Faol</SelectItem>
                          <SelectItem value="trial">Sinov</SelectItem>
                          <SelectItem value="inactive">Faol emas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input label="Uy manzili" placeholder="To'liq uy manzili" {...register('address')} error={errors.address?.message} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary">Izohlar</label>
                    <textarea {...register('notes')} placeholder="Maxsus izohlar yoki talablar..." rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-5">
                  {parentFields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border border-border-default bg-surface-secondary/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-text-primary">{index === 0 ? 'Asosiy aloqa' : 'Qo\'shimcha aloqa'}</h4>
                        {parentFields.length > 1 && <button type="button" onClick={() => remove(index)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <Input label="Ism *" placeholder="Ism" {...register(`parents.${index}.firstName`)} error={errors.parents?.[index]?.firstName?.message} />
                        <Input label="Familiya *" placeholder="Familiya" {...register(`parents.${index}.lastName`)} error={errors.parents?.[index]?.lastName?.message} />
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-text-primary">Qarindoshlik</label>
                          <Select value={watch(`parents.${index}.relation`)} onValueChange={(val: any) => setValue(`parents.${index}.relation`, val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mother">Ona</SelectItem>
                              <SelectItem value="father">Ota</SelectItem>
                              <SelectItem value="guardian">Vasiy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <Input label="Telefon raqam *" type="tel" placeholder="+998 90 000-00-00" {...register(`parents.${index}.phone`)} error={errors.parents?.[index]?.phone?.message} />
                        <Input label="Kasbi" placeholder="Ish joyi yoki kasbi" {...register(`parents.${index}.occupation`)} />
                      </div>
                    </div>
                  ))}
                  {parentFields.length < 3 && (
                    <button type="button" onClick={() => append({ firstName: '', lastName: '', relation: 'father', phone: '', occupation: '' })} className="w-full py-3 rounded-xl border-2 border-dashed border-border-default text-sm font-medium text-text-tertiary hover:text-text-primary hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Boshqa ota-ona / vasiy qo'shish</button>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50"><p className="text-sm text-amber-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />Tibbiy ma'lumotlar qat'iy maxfiy saqlanadi va faqat vakolatli xodimlarga ko'rinadi.</p></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Favqulodda aloqa (Ism) *" placeholder="To'liq ism" {...register('medical.emergencyContact')} error={errors.medical?.emergencyContact?.message} />
                    <Input label="Favqulodda telefon *" type="tel" placeholder="+998 90 000-00-00" {...register('medical.emergencyPhone')} error={errors.medical?.emergencyPhone?.message} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-primary">Qon guruhi</label>
                      <Select value={watch('medical.bloodType')} onValueChange={(val) => setValue('medical.bloodType', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Noma'lum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Noma'lum</SelectItem>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input label="Shifokor ismi" placeholder="Pediatr ismi" {...register('medical.doctorName')} />
                  </div>
                  <Input label="Allergiyalar" placeholder="Vergul bilan ajratilgan" {...register('medical.allergies')} />
                  <Input label="Tibbiy holatlar" placeholder="Vergul bilan ajratilgan" {...register('medical.conditions')} />
                  <Input label="Dori-darmonlar" placeholder="Vergul bilan ajratilgan" {...register('medical.medications')} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary">Tibbiy izohlar</label>
                    <textarea {...register('medical.notes')} placeholder="Qo'shimcha tibbiy ma'lumotlar..." rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none" />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="max-w-2xl mx-auto space-y-5">
                  {submitError && (
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50"><p className="text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />Iltimos, yuborishdan oldin barcha ma'lumotlarni tekshirib chiqing.</p></div>
                  <div className="p-4 rounded-xl border border-border-default">
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Bola ma'lumotlari</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-text-tertiary">Ism:</span> <span className="font-medium text-text-primary">{formValues.firstName} {formValues.lastName}</span></div>
                      <div><span className="text-text-tertiary">Tug'ilgan sana:</span> <span className="font-medium text-text-primary">{formValues.dateOfBirth || '—'}</span></div>
                      <div><span className="text-text-tertiary">Jinsi:</span> <span className="font-medium text-text-primary">{formValues.gender === 'male' ? 'O\'g\'il' : 'Qiz'}</span></div>
                      <div><span className="text-text-tertiary">Guruh:</span> <span className="font-medium text-text-primary">{selectedGroup?.name || '—'}</span></div>
                      <div><span className="text-text-tertiary">Holat:</span> <span className="font-medium text-text-primary capitalize">{formValues.status === 'active' ? 'Faol' : formValues.status === 'trial' ? 'Sinov' : 'Faol emas'}</span></div>
                      {formValues.address && <div className="col-span-2"><span className="text-text-tertiary">Manzil:</span> <span className="font-medium text-text-primary">{formValues.address}</span></div>}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border-default">
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Ota-ona / Vasiy</h4>
                    {formValues.parents?.map((parent, i) => (
                      <div key={i} className={`grid grid-cols-2 gap-x-6 gap-y-2 text-sm ${i > 0 ? 'mt-3 pt-3 border-t border-border-subtle' : ''}`}>
                        <div><span className="text-text-tertiary">Ism:</span> <span className="font-medium text-text-primary">{parent.firstName} {parent.lastName}</span></div>
                        <div><span className="text-text-tertiary">Qarindoshlik:</span> <span className="font-medium text-text-primary">{relationLabels[parent.relation]}</span></div>
                        <div><span className="text-text-tertiary">Telefon:</span> <span className="font-medium text-text-primary">{parent.phone}</span></div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl border border-border-default">
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Tibbiy ma'lumot</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-text-tertiary">Favqulodda:</span> <span className="font-medium text-text-primary">{formValues.medical?.emergencyContact}</span></div>
                      <div><span className="text-text-tertiary">Telefon:</span> <span className="font-medium text-text-primary">{formValues.medical?.emergencyPhone}</span></div>
                      {formValues.medical?.bloodType && <div><span className="text-text-tertiary">Qon guruhi:</span> <span className="font-medium text-text-primary">{formValues.medical.bloodType}</span></div>}
                      {formValues.medical?.allergies && <div className="col-span-2"><span className="text-text-tertiary">Allergiyalar:</span> <span className="font-medium text-red-600">{formValues.medical.allergies}</span></div>}
                      {formValues.medical?.conditions && <div className="col-span-2"><span className="text-text-tertiary">Holatlar:</span> <span className="font-medium text-text-primary">{formValues.medical.conditions}</span></div>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={currentStep === 1 ? onClose : () => setCurrentStep(prev => prev - 1)}>
            {currentStep === 1 ? 'Bekor qilish' : 'Orqaga'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary hidden sm:inline">{currentStep}-bosqich / {steps.length}</span>
            {currentStep < 4 ? (
              <Button type="button" onClick={onNextStep}>Davom etish</Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting}>{mode === 'edit' ? 'Saqlash' : "Ro'yxatga olish"}</Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
