import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { categoryConfig } from '@/data/financesData';
import type { Child, Employee, TransactionType } from '@/types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  children: Child[];
  employees: Employee[];
}

export interface TransactionFormData {
  type: TransactionType;
  category: string;
  description: string;
  amount: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'auto';
  childId: string;
  childName: string;
  employeeId: string;
  employeeName: string;
  receiptNumber: string;
  notes: string;
}

const incomeCategories = ['tuition', 'registration', 'extra_classes', 'events', 'other_income'];
const expenseCategories = ['salary', 'rent', 'utilities', 'food', 'supplies', 'maintenance', 'marketing', 'taxes', 'insurance', 'other_expense'];
const childLinkedIncomeCategories = new Set(['tuition', 'registration']);

export default function AddTransactionModal({ isOpen, onClose, onSubmit, children, employees }: AddTransactionModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TransactionFormData>({
    type: 'income' as TransactionType,
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    childId: '',
    childName: '',
    employeeId: '',
    employeeName: '',
    receiptNumber: '',
    notes: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const categories = form.type === 'income' ? incomeCategories : expenseCategories;
  const shouldShowChildFields = form.type === 'income' && childLinkedIncomeCategories.has(form.category);

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setSubmitError(null);
      setForm({
        type: 'income', category: '', description: '', amount: '',
        date: new Date().toISOString().split('T')[0], paymentMethod: 'cash',
        childId: '',
        childName: '', employeeId: '', employeeName: '', receiptNumber: '', notes: '',
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Saqlashda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yangi tranzaksiya" subtitle="Daromad yoki xarajatni kiritish" size="lg">
      <div className="px-4 sm:px-6 py-5 space-y-4">
        {submitError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {submitError}
          </div>
        )}
        {/* Type selector */}
        <div>
          <label className={labelClass}>Turi *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { update('type', 'income'); update('category', ''); }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                form.type === 'income'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-border-default text-text-secondary hover:border-emerald-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Daromad
            </button>
            <button
              onClick={() => { update('type', 'expense'); update('category', ''); }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                form.type === 'expense'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-border-default text-text-secondary hover:border-red-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Xarajat
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Kategoriya *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const config = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => {
                    const nextState: Partial<TransactionFormData> = { category: cat };
                    if (!childLinkedIncomeCategories.has(cat)) {
                      nextState.childId = '';
                      nextState.childName = '';
                    }
                    setForm((prev) => ({ ...prev, ...nextState }));
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                    form.category === cat
                      ? 'border-navy-900 bg-navy-900 text-white shadow-sm'
                      : 'border-border-default bg-surface-primary text-text-secondary hover:border-navy-200'
                  }`}
                >
                  <span>{config?.icon}</span>
                  {config?.label || cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Summa (so'm) *</label>
            <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="2,500,000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sana *</label>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tavsif *</label>
          <input type="text" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tranzaksiya haqida qisqacha..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>To'lov usuli</label>
            <select value={form.paymentMethod} onChange={e => update('paymentMethod', e.target.value)} className={inputClass}>
              <option value="cash">💵 Naqd</option>
              <option value="card">💳 Karta</option>
              <option value="transfer">🏦 O'tkazma</option>
              <option value="auto">⚡ Avtomatik</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Kvitansiya raqami</label>
            <input type="text" value={form.receiptNumber} onChange={e => update('receiptNumber', e.target.value)} placeholder="RCP-XXXX-XXX" className={inputClass} />
          </div>
        </div>

        {shouldShowChildFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bola tanlash</label>
              <select
                value={form.childId}
                onChange={(e) => {
                  const childId = e.target.value;
                  const selectedChild = children.find((child) => child.id === childId);
                  setForm((prev) => ({
                    ...prev,
                    childId,
                    childName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : '',
                  }));
                }}
                className={inputClass}
              >
                <option value="">Tanlanmagan</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} ({child.group})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Bola ismi (ixtiyoriy)</label>
              <input
                type="text"
                value={form.childName}
                onChange={e => update('childName', e.target.value)}
                placeholder="Masalan: Alisher Karimov"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {form.type === 'expense' && form.category === 'salary' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Xodim tanlash</label>
              <select
                value={form.employeeId}
                onChange={(e) => {
                  const employeeId = e.target.value;
                  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
                  setForm((prev) => ({
                    ...prev,
                    employeeId,
                    employeeName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '',
                  }));
                }}
                className={inputClass}
              >
                <option value="">Tanlanmagan</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.position})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Xodim ismi (ixtiyoriy)</label>
              <input
                type="text"
                value={form.employeeName}
                onChange={e => update('employeeName', e.target.value)}
                placeholder="Masalan: Maria Rodriguez"
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Izoh (ixtiyoriy)</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Qo'shimcha ma'lumot..." rows={2} className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-4 border-t border-border-default bg-surface-secondary/30">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary border border-border-default transition-colors">
          Bekor qilish
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm text-white ${
            form.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {form.type === 'income' ? '💰 Daromad qo\'shish' : '💸 Xarajat qo\'shish'}
        </button>
      </div>
    </Modal>
  );
}
