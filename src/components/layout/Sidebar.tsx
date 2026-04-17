import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCheck,
  Wallet,
  Settings,
  ChevronLeft,
  Shield,
  LogOut,
  HelpCircle,
  CalendarCheck2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { groupsDetailData } from '@/data/groupsData';

const totalChildrenCount = groupsDetailData.reduce((sum, g) => sum + g.currentCount, 0);

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, path: '/' },
    { id: 'children', label: t('nav.children'), icon: <Users className="w-5 h-5" />, path: '/children', badge: totalChildrenCount },
    { id: 'groups', label: t('nav.groups'), icon: <FolderKanban className="w-5 h-5" />, path: '/groups' },
    { id: 'employees', label: t('nav.employees'), icon: <UserCheck className="w-5 h-5" />, path: '/employees' },
    { id: 'finances', label: t('nav.finances'), icon: <Wallet className="w-5 h-5" />, path: '/finances' },
    { id: 'attendance', label: t('nav.attendance', 'Davomat'), icon: <CalendarCheck2 className="w-5 h-5" />, path: '/attendance' },
  ];

  const bottomNavItems = [
    { id: 'settings', label: t('system.settings'), icon: <Settings className="w-5 h-5" />, path: '/settings' },
    { id: 'help', label: t('system.help'), icon: <HelpCircle className="w-5 h-5" />, path: '/help' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: any) => {
    const active = isActive(item.path);
    return (
      <li key={item.id}>
        <Link
          to={item.path}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${active
              ? 'text-text-primary bg-surface-secondary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/60'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-navy-900 dark:bg-emerald-400"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className={`flex-shrink-0 ${active ? 'text-text-primary' : ''}`}>{item.icon}</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {item.badge && !collapsed && (
            <span className="ml-auto text-xs font-semibold text-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded-md">
              {item.badge}
            </span>
          )}
          {collapsed && hoveredItem === item.id && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-medium whitespace-nowrap z-50 shadow-lg"
            >
              {item.label}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-navy-900 rotate-45" />
            </motion.div>
          )}
        </Link>
      </li>
    );
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Menejer',
    staff: 'Xodim',
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen bg-surface-primary border-r border-border-default flex flex-col w-[260px]"
    >
      <div className={`flex items-center h-14 sm:h-16 px-4 border-b border-border-default ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-text-primary tracking-tight whitespace-nowrap overflow-hidden"
              >
                KinderAdmin
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200" aria-label="Yig'ish">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggle} className="mx-auto mt-3 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200" aria-label="Yoyish">
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">{navItems.map(renderNavItem)}</ul>
      </nav>
      <div className="px-3 pb-3 sm:pb-4 space-y-1">
        <div className="border-t border-border-subtle mb-3" />
        <ul className="space-y-1">{bottomNavItems.map(renderNavItem)}</ul>
        <div className={`mt-3 p-2.5 sm:p-3 rounded-xl bg-surface-secondary ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-text-tertiary truncate capitalize">{roleLabels[user?.role || 'admin']}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all duration-200" aria-label="Chiqish">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
