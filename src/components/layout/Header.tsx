import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const breadcrumbMap: Record<string, string> = {
    '/': 'nav.dashboard',
    '/children': 'nav.children',
    '/groups': 'nav.groups',
    '/employees': 'nav.employees',
    '/finances': 'nav.finances',
    '/settings': 'system.settings',
    '/help': 'system.help',
  };
  const currentPageKey = breadcrumbMap[location.pathname];
  const currentPage = currentPageKey ? t(currentPageKey) : t('common.page', 'Sahifa');

  useEffect(() => {
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 bg-surface-elevated backdrop-blur-xl border-b border-border-default">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={onMobileMenuToggle} className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200 flex-shrink-0" aria-label="Menyu">
            <Menu className="w-5 h-5" />
          </button>
          <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
            <span className="text-text-tertiary font-medium flex-shrink-0">KinderAdmin</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <span className="text-text-primary font-semibold truncate">{currentPage}</span>
          </nav>
          <h1 className="sm:hidden text-base font-semibold text-text-primary truncate">{currentPage}</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input type="text" placeholder={t('common.search')} className="w-44 lg:w-52 xl:w-64 focus:w-64 lg:focus:w-72 pl-9 pr-4 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/20 transition-all duration-300" />
          </div>
          <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200" aria-label={t('common.search', 'Qidirish...')}>
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMobileSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-border-subtle">
            <div className="px-3 py-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input type="text" placeholder={t('header.searchMobilePlaceholder', "Bolalar, xodimlar, yozuvlarni qidiring...")} autoFocus className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/20 transition-all duration-200" />
              </div>
              <button onClick={() => setShowMobileSearch(false)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
