import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  Heart,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Gender, ChildStatus, BloodType, GroupInfo } from '@/types';
import { useTranslation } from 'react-i18next';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddChildFormData) => Promise<void>;
  groups: GroupInfo[];
  mode?: 'add' | 'edit';
  initialData?: AddChildFormData | null;
}

interface ParentForm {
  firstName: string;
  lastName: string;
  relation: 'mother' | 'father' | 'guardian';
  phone: string;
  occupation: string;
}

export interface AddChildFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  groupId: string;
  status: ChildStatus;
  address: string;
  notes: string;
  parents: ParentForm[];
  medical: {
    bloodType: BloodType | '';
    allergies: string;
    medications: string;
    conditions: string;
    emergencyContact: string;
    emergencyPhone: string;
    doctorName: string;
    doctorPhone: string;
    notes: string;
  };
}



const emptyParent: ParentForm = { firstName: '', lastName: '', relation: 'mother', phone: '', occupation: '' };
const initialForm: AddChildFormData = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'male', groupId: '', status: 'active', address: '', notes: '',
  parents: [{ ...emptyParent }],
  medical: { bloodType: '', allergies: '', medications: '', conditions: '', emergencyContact: '', emergencyPhone: '', doctorName: '', doctorPhone: '', notes: '' },
};

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200';
const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';
const selectClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200 appearance-none';

export default function AddChildModal({ isOpen, onClose, onSubmit, groups, mode = 'add', initialData = null }: AddChildModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<AddChildFormData>(initialData ?? { ...initialForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialData ?? { ...initialForm });
    setCurrentStep(1);
    setErrors({});
  }, [isOpen, initialData]);

  const steps = [
    { id: 1, label: t('children.addModal.stepPersonal', 'Shaxsiy ma\'lumot'), icon: <User className="w-4 h-4" /> },
    { id: 2, label: t('children.addModal.stepParents', 'Ota-ona'), icon: <Users className="w-4 h-4" /> },
    { id: 3, label: t('children.addModal.stepMedical', 'Tibbiy ma\'lumot'), icon: <Heart className="w-4 h-4" /> },
    { id: 4, label: t('children.addModal.stepReview', 'Tekshirish'), icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const updateField = <K extends keyof AddChildFormData>(key: K, value: AddChildFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };
  const updateMedical = (key: string, value: string) => setForm(prev => ({ ...prev, medical: { ...prev.medical, [key]: value } }));
  const updateParent = (index: number, key: keyof ParentForm, value: string) => {
    setForm(prev => { const parents = [...prev.parents]; parents[index] = { ...parents[index], [key]: value }; return { ...prev, parents }; });
  };
  const addParent = () => { if (form.parents.length < 3) setForm(prev => ({ ...prev, parents: [...prev.parents, { ...emptyParent, relation: 'father' }] })); };
  const removeParent = (index: number) => { if (form.parents.length > 1) setForm(prev => ({ ...prev, parents: prev.parents.filter((_, i) => i !== index) })); };

  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.firstName.trim()) e.firstName = t('children.addModal.errors.firstName', 'Ism kiritilishi shart');
      if (!form.lastName.trim()) e.lastName = t('children.addModal.errors.lastName', 'Familiya kiritilishi shart');
      if (!form.dateOfBirth) e.dateOfBirth = t('children.addModal.errors.dob', 'Tug\'ilgan sana kiritilishi shart');
      if (!form.groupId) e.groupId = t('children.addModal.errors.group', 'Guruh tanlanishi shart');
    }
    if (step === 2) {
      form.parents.forEach((p, i) => {
        if (!p.firstName.trim()) e[`parent_${i}_firstName`] = t('children.addModal.errors.required', 'Shart');
        if (!p.lastName.trim()) e[`parent_${i}_lastName`] = t('children.addModal.errors.required', 'Shart');
        if (!p.phone.trim()) e[`parent_${i}_phone`] = t('children.addModal.errors.required', 'Shart');
      });
    }
    if (step === 3) {
      if (!form.medical.emergencyContact.trim()) e.emergencyContact = t('children.addModal.errors.emergencyContact', 'Favqulodda aloqa kiritilishi shart');
      if (!form.medical.emergencyPhone.trim()) e.emergencyPhone = t('children.addModal.errors.emergencyPhone', 'Favqulodda telefon kiritilishi shart');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 4)); };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleSubmit = async () => {
    try {
      await onSubmit(form);
      setForm({ ...initialForm });
      setCurrentStep(1);
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Saqlashda xatolik",
      }));
    }
  };
  const handleClose = () => { setForm(initialData ?? { ...initialForm }); setCurrentStep(1); setErrors({}); onClose(); };

  const selectedGroup = groups.find(g => g.id === form.groupId);
  const relationLabels: Record<string, string> = { mother: t('children.relation.mother', 'Ona'), father: t('children.relation.father', 'Ota'), guardian: t('children.relation.guardian', 'Vasiy') };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'edit' ? t('children.addModal.editTitle', 'Bola profilini tahrirlash') : t('children.addModal.title', 'Yangi bola ro\'yxatga olish')}
      subtitle={mode === 'edit' ? t('children.addModal.editSubtitle', 'Bola ma\'lumotlarini yangilang') : t('children.addModal.subtitle', 'Ro\'yxatga olish uchun barcha bosqichlarni to\'ldiring')}
      size="xl"
    >
      {/* Step Indicator */}
      <div className="px-4 sm:px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button onClick={() => { if (step.id < currentStep) setCurrentStep(step.id); }} className={`flex items-center gap-2 transition-all duration-200 ${step.id === currentStep ? 'text-text-primary' : step.id < currentStep ? 'text-emerald-600 cursor-pointer' : 'text-text-tertiary'}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step.id === currentStep ? 'bg-navy-900 text-white' : step.id < currentStep ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-tertiary text-text-tertiary'}`}>
                  {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && <div className={`w-8 sm:w-16 lg:w-24 h-px mx-2 sm:mx-3 transition-colors duration-300 ${step.id < currentStep ? 'bg-emerald-300' : 'bg-border-default'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {currentStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t('children.addModal.firstName', 'Ism *')}</label>
                    <input type="text" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder={t('children.addModal.firstNamePlaceholder', 'Ismni kiriting')} className={`${inputClass} ${errors.firstName ? 'border-red-300 focus:ring-red-100' : ''}`} />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{t('children.addModal.lastName', 'Familiya *')}</label>
                    <input type="text" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder={t('children.addModal.lastNamePlaceholder', 'Familiyani kiriting')} className={`${inputClass} ${errors.lastName ? 'border-red-300 focus:ring-red-100' : ''}`} />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t('children.addModal.dob', 'Tug\'ilgan sana *')}</label>
                    <input type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className={`${inputClass} ${errors.dateOfBirth ? 'border-red-300 focus:ring-red-100' : ''}`} />
                    {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{t('children.addModal.gender', 'Jinsi')}</label>
                    <div className="flex gap-2">
                      {(['male', 'female'] as const).map((g) => (
                        <button key={g} type="button" onClick={() => updateField('gender', g)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${form.gender === g ? 'bg-navy-900 text-white border-navy-900' : 'bg-surface-primary text-text-secondary border-border-default hover:border-navy-200'}`}>
                          {g === 'male' ? t('children.addModal.male', '♂ O\'g\'il') : t('children.addModal.female', '♀ Qiz')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t('children.addModal.group', 'Guruhga biriktirish *')}</label>
                    <select value={form.groupId} onChange={(e) => updateField('groupId', e.target.value)} className={`${selectClass} ${errors.groupId ? 'border-red-300 focus:ring-red-100' : ''}`}>
                      <option value="">{t('children.addModal.groupSelect', 'Guruh tanlang')}</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.currentCount}/{g.capacity}) — {g.ageRange} {t('common.yearsShort', 'yosh')}</option>)}
                    </select>
                    {errors.groupId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.groupId}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{t('children.addModal.status', 'Holati')}</label>
                    <select value={form.status} onChange={(e) => updateField('status', e.target.value as ChildStatus)} className={selectClass}>
                      <option value="active">{t('children.status.active', 'Faol')}</option>
                      <option value="trial">{t('children.status.trial', 'Sinov')}</option>
                      <option value="inactive">{t('children.status.inactive', 'Faol emas')}</option>
                    </select>
                  </div>
                </div>
                <div><label className={labelClass}>{t('children.addModal.address', 'Uy manzili')}</label><input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder={t('children.addModal.addressPlaceholder', 'To\'liq uy manzili')} className={inputClass} /></div>
                <div><label className={labelClass}>{t('children.addModal.notes', 'Izohlar')}</label><textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder={t('children.addModal.notesPlaceholder', 'Maxsus izohlar yoki talablar...')} rows={3} className={`${inputClass} resize-none`} /></div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto space-y-5">
                {form.parents.map((parent, index) => (
                  <div key={index} className="p-4 rounded-xl border border-border-default bg-surface-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-text-primary">{index === 0 ? t('children.relation.main', 'Asosiy aloqa') : t('children.relation.secondary', 'Qo\'shimcha aloqa')}</h4>
                      {form.parents.length > 1 && <button type="button" onClick={() => removeParent(index)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div><label className={labelClass}>{t('children.addModal.firstName', 'Ism *').replace('*','')}</label><input type="text" value={parent.firstName} onChange={(e) => updateParent(index, 'firstName', e.target.value)} placeholder={t('children.addModal.firstName', 'Ism *').replace('*','')} className={`${inputClass} ${errors[`parent_${index}_firstName`] ? 'border-red-300' : ''}`} /></div>
                      <div><label className={labelClass}>{t('children.addModal.lastName', 'Familiya *').replace('*','')}</label><input type="text" value={parent.lastName} onChange={(e) => updateParent(index, 'lastName', e.target.value)} placeholder={t('children.addModal.lastName', 'Familiya *').replace('*','')} className={`${inputClass} ${errors[`parent_${index}_lastName`] ? 'border-red-300' : ''}`} /></div>
                      <div><label className={labelClass}>{t('children.addModal.parentRelation', 'Qarindoshlik')}</label><select value={parent.relation} onChange={(e) => updateParent(index, 'relation', e.target.value)} className={selectClass}><option value="mother">{t('children.relation.mother', 'Ona')}</option><option value="father">{t('children.relation.father', 'Ota')}</option><option value="guardian">{t('children.relation.guardian', 'Vasiy')}</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div><label className={labelClass}>{t('children.addModal.parentPhone', 'Telefon raqam *')}</label><input type="tel" value={parent.phone} onChange={(e) => updateParent(index, 'phone', e.target.value)} placeholder={t('children.addModal.parentPhonePlaceholder', '+998 90 000-00-00')} className={`${inputClass} ${errors[`parent_${index}_phone`] ? 'border-red-300' : ''}`} /></div>
                    </div>
                    <div><label className={labelClass}>{t('children.addModal.parentOccupation', 'Kasbi')}</label><input type="text" value={parent.occupation} onChange={(e) => updateParent(index, 'occupation', e.target.value)} placeholder={t('children.addModal.parentOccupationPlaceholder', 'Ish joyi yoki kasbi')} className={inputClass} /></div>
                  </div>
                ))}
                {form.parents.length < 3 && (
                  <button type="button" onClick={addParent} className="w-full py-3 rounded-xl border-2 border-dashed border-border-default text-sm font-medium text-text-tertiary hover:text-text-primary hover:border-navy-200 transition-all duration-200 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />{t('children.addModal.addParent', 'Boshqa ota-ona / vasiy qo\'shish')}</button>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50"><p className="text-sm text-amber-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />Tibbiy ma'lumotlar qat'iy maxfiy saqlanadi va faqat vakolatli xodimlarga ko'rinadi.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Favqulodda aloqa *</label><input type="text" value={form.medical.emergencyContact} onChange={(e) => updateMedical('emergencyContact', e.target.value)} placeholder="To'liq ism" className={`${inputClass} ${errors.emergencyContact ? 'border-red-300' : ''}`} />{errors.emergencyContact && <p className="text-xs text-red-500 mt-1">{errors.emergencyContact}</p>}</div>
                  <div><label className={labelClass}>Favqulodda telefon *</label><input type="tel" value={form.medical.emergencyPhone} onChange={(e) => updateMedical('emergencyPhone', e.target.value)} placeholder="+998 90 000-00-00" className={`${inputClass} ${errors.emergencyPhone ? 'border-red-300' : ''}`} />{errors.emergencyPhone && <p className="text-xs text-red-500 mt-1">{errors.emergencyPhone}</p>}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Qon guruhi</label><select value={form.medical.bloodType} onChange={(e) => updateMedical('bloodType', e.target.value)} className={selectClass}><option value="">Noma'lum</option>{(['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const).map(bt => <option key={bt} value={bt}>{bt}</option>)}</select></div>
                  <div><label className={labelClass}>Shifokor ismi</label><input type="text" value={form.medical.doctorName} onChange={(e) => updateMedical('doctorName', e.target.value)} placeholder="Pediatr ismi" className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Allergiyalar</label><input type="text" value={form.medical.allergies} onChange={(e) => updateMedical('allergies', e.target.value)} placeholder="Vergul bilan ajratilgan: Yeryong'oq, Sut, va h.k." className={inputClass} /></div>
                <div><label className={labelClass}>Tibbiy holatlar</label><input type="text" value={form.medical.conditions} onChange={(e) => updateMedical('conditions', e.target.value)} placeholder="Vergul bilan ajratilgan: Astma, Ekzema, va h.k." className={inputClass} /></div>
                <div><label className={labelClass}>Dori-darmonlar</label><input type="text" value={form.medical.medications} onChange={(e) => updateMedical('medications', e.target.value)} placeholder="Vergul bilan ajratilgan dori nomlari" className={inputClass} /></div>
                <div><label className={labelClass}>Tibbiy izohlar</label><textarea value={form.medical.notes} onChange={(e) => updateMedical('notes', e.target.value)} placeholder="Qo'shimcha tibbiy ma'lumotlar..." rows={3} className={`${inputClass} resize-none`} /></div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="max-w-2xl mx-auto space-y-5">
                {errors.submit && (
                  <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50"><p className="text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />Iltimos, yuborishdan oldin barcha ma'lumotlarni tekshirib chiqing.</p></div>
                <div className="p-4 rounded-xl border border-border-default">
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><User className="w-4 h-4 text-navy-400" /> Bola ma'lumotlari</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-text-tertiary">Ism:</span> <span className="font-medium text-text-primary">{form.firstName} {form.lastName}</span></div>
                    <div><span className="text-text-tertiary">Tug'ilgan sana:</span> <span className="font-medium text-text-primary">{form.dateOfBirth || '—'}</span></div>
                    <div><span className="text-text-tertiary">Jinsi:</span> <span className="font-medium text-text-primary">{form.gender === 'male' ? 'O\'g\'il' : 'Qiz'}</span></div>
                    <div><span className="text-text-tertiary">Guruh:</span> <span className="font-medium text-text-primary">{selectedGroup?.name || '—'}</span></div>
                    <div><span className="text-text-tertiary">Holat:</span> <span className="font-medium text-text-primary capitalize">{form.status === 'active' ? 'Faol' : form.status === 'trial' ? 'Sinov' : 'Faol emas'}</span></div>
                    {form.address && <div className="col-span-2"><span className="text-text-tertiary">Manzil:</span> <span className="font-medium text-text-primary">{form.address}</span></div>}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-border-default">
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-navy-400" /> Ota-ona / Vasiy</h4>
                  {form.parents.map((parent, i) => (
                    <div key={i} className={`grid grid-cols-2 gap-x-6 gap-y-2 text-sm ${i > 0 ? 'mt-3 pt-3 border-t border-border-subtle' : ''}`}>
                      <div><span className="text-text-tertiary">Ism:</span> <span className="font-medium text-text-primary">{parent.firstName} {parent.lastName}</span></div>
                      <div><span className="text-text-tertiary">Qarindoshlik:</span> <span className="font-medium text-text-primary">{relationLabels[parent.relation]}</span></div>
                      <div><span className="text-text-tertiary">Telefon:</span> <span className="font-medium text-text-primary">{parent.phone}</span></div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl border border-border-default">
                  <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-navy-400" /> Tibbiy ma'lumot</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-text-tertiary">Favqulodda:</span> <span className="font-medium text-text-primary">{form.medical.emergencyContact}</span></div>
                    <div><span className="text-text-tertiary">Telefon:</span> <span className="font-medium text-text-primary">{form.medical.emergencyPhone}</span></div>
                    {form.medical.bloodType && <div><span className="text-text-tertiary">Qon guruhi:</span> <span className="font-medium text-text-primary">{form.medical.bloodType}</span></div>}
                    {form.medical.allergies && <div className="col-span-2"><span className="text-text-tertiary">Allergiyalar:</span> <span className="font-medium text-red-600">{form.medical.allergies}</span></div>}
                    {form.medical.conditions && <div className="col-span-2"><span className="text-text-tertiary">Holatlar:</span> <span className="font-medium text-text-primary">{form.medical.conditions}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30 flex-shrink-0">
        <button type="button" onClick={currentStep === 1 ? handleClose : handleBack} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-border-default transition-all duration-200">
          <ChevronLeft className="w-4 h-4" />{currentStep === 1 ? 'Bekor qilish' : 'Orqaga'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary hidden sm:inline">{currentStep}-bosqich / {steps.length}</span>
          {currentStep < 4 ? (
            <button type="button" onClick={handleNext} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-all duration-200 shadow-sm">Davom etish<ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-sm"><CheckCircle2 className="w-4 h-4" />{mode === 'edit' ? t('common.save', 'Saqlash') : t('children.addModal.submit', "Ro'yxatga olish")}</button>
          )}
        </div>
      </div>
    </Modal>
  );
}
