import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border-default">
      <p className="text-xs sm:text-sm text-text-tertiary order-2 sm:order-1">
        {t('common.paginationShowing', '{{start}}-{{end}} / {{total}} natija', {
          start: startItem,
          end: endItem,
          total: totalItems,
        })}
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label={t('common.previousPage', 'Oldingi sahifa')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getVisiblePages().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-text-tertiary text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          aria-label={t('common.nextPage', 'Keyingi sahifa')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
