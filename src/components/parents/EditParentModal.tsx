import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { Parent } from '@/types';

const parentSchema = z.object({
  firstName: z.string().min(2, 'Ism kiritilishi shart'),
  lastName: z.string().min(2, 'Familiya kiritilishi shart'),
  middleName: z.string().optional(),
  relation: z.enum(['mother', 'father', 'guardian']),
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  email: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  passportId: z.string().optional()
});

export type EditParentFormData = z.infer<typeof parentSchema>;

interface EditParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditParentFormData) => Promise<void>;
  initialData: Parent | null;
}

export default function EditParentModal({ isOpen, onClose, onSubmit, initialData }: EditParentModalProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EditParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      firstName: '', lastName: '', middleName: '', relation: 'mother', phone: '', email: '', occupation: '', address: '', passportId: ''
    }
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        middleName: (initialData as any).middleName || '',
        relation: initialData.relation || 'mother',
        phone: initialData.phone || '',
        email: initialData.email || '',
        occupation: initialData.occupation || '',
        address: initialData.address || '',
        passportId: initialData.passportId || (initialData as any).passportSeries || ''
      });
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ota-ona ma'lumotlarini tahrirlash"
      subtitle="Barcha kiritilgan o'zgarishlar ushbu ota-onaga biriktirilgan barcha bolalar uchun ham yangilanadi."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-5 sm:px-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Ism *" placeholder="Ism" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Familiya *" placeholder="Familiya" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Otchestvo (Otasining ismi)" placeholder="Masalan: Sardor o'g'li" {...register('middleName')} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Qarindoshlik</label>
              <Select value={watch('relation')} onValueChange={(val: any) => setValue('relation', val)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Telefon raqam *" type="tel" placeholder="+998 90 000-00-00" {...register('phone')} error={errors.phone?.message} />
            <Input label="Email" type="email" placeholder="email@example.com" {...register('email')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Pasport ID" placeholder="AA 1234567" {...register('passportId')} />
            <Input label="Kasbi / Ish joyi" placeholder="Kasbi" {...register('occupation')} />
          </div>
          <Input label="Yashash manzili" placeholder="To'liq manzil" {...register('address')} />
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-4 sm:px-6 border-t border-border-default bg-surface-secondary/30 rounded-b-2xl">
          <Button type="button" variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button type="submit" isLoading={isSubmitting}>Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}
