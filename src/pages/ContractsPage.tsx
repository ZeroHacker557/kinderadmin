import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Printer, Search, ChevronDown, User, Calendar, CheckCircle } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useKindergarten } from '@/hooks/useKindergarten';
import PageHeader from '@/components/layout/PageHeader';
import ContractTemplate from '@/components/contracts/ContractTemplate';
import { Spinner } from '@/components/ui/Spinner';
import type { Child } from '@/types';
import { formatDateDisplay } from '@/utils/date';

export default function ContractsPage() {
  const { t } = useTranslation();
  const { kindergarten } = useKindergarten();
  const { data: children, loading, error } = useChildren();
  const contractRef = useRef<HTMLDivElement>(null);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) || null,
    [children, selectedChildId]
  );

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return children;
    const q = searchQuery.toLowerCase();
    return children.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.parents?.some(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q)
        )
    );
  }, [children, searchQuery]);

  const handlePrint = () => {
    if (!selectedChild) return;
    window.print();
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChildId(child.id);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Spinner size="xl" className="text-navy-500 mx-auto" />
          <p className="text-text-secondary text-sm">{t('contracts.loading', "Ma'lumotlar yuklanmoqda...")}</p>
        </div>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-danger font-medium">{t('contracts.error', 'Xatolik yuz berdi')}</p>
          <p className="text-text-tertiary text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('contracts.title', 'Shartnomalar')}
        description={t('contracts.subtitle', "Bola tanlang va shartnomani avtomatik yarating")}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Bosh sahifa'), href: '/' },
          { label: t('contracts.title', 'Shartnomalar') },
        ]}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ===== Left Panel — Child Selector ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selector Card */}
          <div className="bg-surface-primary rounded-2xl border border-border-default shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-navy-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-navy-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('contracts.selectChild', 'Bolani tanlang')}
                </h2>
                <p className="text-sm text-text-tertiary">
                  {t('contracts.selectChildDesc', "Shartnoma yaratish uchun ro'yxatdan bolani tanlang")}
                </p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className="relative">
              <button
                id="child-selector-dropdown"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border-default bg-surface-secondary hover:bg-surface-tertiary transition-all text-left"
              >
                {selectedChild ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-navy-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {selectedChild.lastName} {selectedChild.firstName}
                      </p>
                      <p className="text-xs text-text-tertiary">{selectedChild.group}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-text-tertiary">
                    {t('contracts.selectPlaceholder', 'Bolani tanlang...')}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-surface-primary border border-border-default rounded-xl shadow-lg overflow-hidden"
                  >
                    {/* Search */}
                    <div className="p-3 border-b border-border-subtle">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('contracts.searchPlaceholder', 'Ism bo\'yicha qidiring...')}
                          className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-secondary border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-500/30 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredChildren.length === 0 ? (
                        <div className="p-4 text-center text-sm text-text-tertiary">
                          {t('contracts.noResults', 'Natija topilmadi')}
                        </div>
                      ) : (
                        filteredChildren.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleSelectChild(child)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors ${
                              selectedChildId === child.id ? 'bg-navy-500/5' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-navy-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {child.lastName} {child.firstName}
                              </p>
                              <p className="text-xs text-text-tertiary">{child.group}</p>
                            </div>
                            {selectedChildId === child.id && (
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Print Button */}
            <button
              id="generate-print-contract-btn"
              onClick={handlePrint}
              disabled={!selectedChild}
              className={`mt-5 w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                selectedChild
                  ? 'bg-navy-600 hover:bg-navy-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                  : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
              }`}
            >
              <Printer className="w-4.5 h-4.5" />
              {t('contracts.printBtn', 'Shartnoma yaratish va chop etish')}
            </button>
          </div>

          {/* Instructions Card */}
          <div className="bg-surface-primary rounded-2xl border border-border-default shadow-sm p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {t('contracts.howToTitle', "Qanday ishlaydi?")}
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: t('contracts.step1', "Yuqoridagi ro'yxatdan bolani tanlang") },
                { step: '2', text: t('contracts.step2', "\"Chop etish\" tugmasini bosing — shartnoma avtomatik to'ldiriladi") },
                { step: '3', text: t('contracts.step3', 'Chop etish oynasidan A4 formatda chop eting yoki PDF sifatida saqlang') },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-navy-600">{item.step}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Right Panel — Preview Card ===== */}
        <div className="lg:col-span-1">
          <div className="bg-surface-primary rounded-2xl border border-border-default shadow-sm p-6 sticky top-8">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-500" />
              {t('contracts.previewTitle', "Shartnoma ma'lumotlari")}
            </h3>

            {selectedChild ? (
              <div className="space-y-4">
                {/* Child Info */}
                <div className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1.5">{t('contracts.childInfo', 'Bola')}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedChild.lastName} {selectedChild.firstName} {selectedChild.middleName || ''}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{selectedChild.group}</p>
                </div>

                {/* Parent Info */}
                {selectedChild.parents?.[0] && (
                  <div className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle">
                    <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1.5">{t('contracts.parentInfo', 'Ota-ona')}</p>
                    <p className="text-sm font-medium text-text-primary">
                      {selectedChild.parents[0].lastName} {selectedChild.parents[0].firstName} {(selectedChild.parents[0] as any).middleName || ''}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{selectedChild.parents[0].phone}</p>
                    {(selectedChild.parents[0].passportId || selectedChild.parents[0].passportSeries) && (
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {t('contracts.passportLabel', 'Pasport:')} {selectedChild.parents[0].passportId || selectedChild.parents[0].passportSeries}
                      </p>
                    )}
                  </div>
                )}

                {/* Enrollment Date */}
                <div className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1.5">{t('contracts.enrollmentLabel', "Qabul sanasi")}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-sm text-text-primary">
                      {selectedChild.enrollmentDate
                        ? formatDateDisplay(selectedChild.enrollmentDate)
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    {t('contracts.previewHint', "Chop etish tugmasini bosganingizda shartnoma A4 formatda chop etish oynasida ko'rsatiladi.")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-surface-secondary flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="text-sm text-text-tertiary">
                  {t('contracts.noSelection', "Bolani tanlaganingizda shartnoma ma'lumotlari shu yerda ko'rsatiladi.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ===== Hidden Print Template ===== */}
      {selectedChild && (
        <ContractTemplate
          ref={contractRef}
          child={selectedChild}
          kindergarten={kindergarten}
        />
      )}
    </>
  );
}
