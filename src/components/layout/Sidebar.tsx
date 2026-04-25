
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
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useChildren } from '@/hooks/useChildren';
import { useGroups } from '@/hooks/useGroups';
import { useEmployees } from '@/hooks/useEmployees';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, userRole, logout, hasPermission } = useAuth();
  const { t } = useTranslation();
  
  const { data: childrenData } = useChildren();
  const { data: groupsData } = useGroups();
  const { data: employeesData } = useEmployees();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, path: '/' },
    { id: 'children', label: t('nav.children', 'Bolalar'), icon: <Users className="w-5 h-5" />, path: '/children', badge: childrenData?.length },
    { id: 'groups', label: t('nav.groups', 'Guruhlar'), icon: <FolderKanban className="w-5 h-5" />, path: '/groups', badge: groupsData?.length },
    { id: 'employees', label: t('nav.employees', 'Xodimlar'), icon: <UserCheck className="w-5 h-5" />, path: '/employees', badge: employeesData?.length, show: hasPermission('admin') },
    { id: 'parents', label: t('nav.parents', 'Ota-onalar'), icon: <UserRound className="w-5 h-5" />, path: '/parents' },
    { id: 'finances', label: t('nav.finances', 'Moliya'), icon: <Wallet className="w-5 h-5" />, path: '/finances', show: hasPermission('admin') || hasPermission('accountant') },
    { id: 'attendance', label: t('nav.attendance', 'Davomat'), icon: <CalendarCheck2 className="w-5 h-5" />, path: '/attendance', show: hasPermission('admin') || hasPermission('teacher') },
  ];

  const bottomNavItems = [
    { id: 'settings', label: t('system.settings', 'Sozlamalar'), icon: <Settings className="w-5 h-5" />, path: '/settings' },
    { id: 'help', label: t('system.help', 'Yordam'), icon: <HelpCircle className="w-5 h-5" />, path: '/help' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: any) => {
    if (item.show === false) return null;
    const active = isActive(item.path);
    
    const content = (
      <Link
        to={item.path}
        className={`
          relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${active
            ? 'text-primary bg-primary/10'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <span className={`flex-shrink-0 ${active ? 'text-primary' : ''}`}>{item.icon}</span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden flex-1"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {item.badge !== undefined && !collapsed && (
          <span className="text-xs font-semibold text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <li key={item.id}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>
      );
    }

    return <li key={item.id}>{content}</li>;
  };

  const roleLabels: Record<string, string> = {
    admin: t('roles.admin', 'Administrator'),
    teacher: t('roles.teacher', "O'qituvchi"),
    accountant: t('roles.accountant', 'Buxgalter'),
    secretary: t('roles.secretary', 'Kotib'),
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-full bg-surface-primary border-r border-border-default flex flex-col z-40 hidden lg:flex shadow-sm"
    >
      <div className={`flex items-center h-16 px-4 border-b border-border-default ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg text-text-primary tracking-tight whitespace-nowrap overflow-hidden"
              >
                KinderAdmin
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!collapsed && (
          <button onClick={onToggle} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggle} className="mx-auto mt-4 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-6 hidden-scrollbar">
        <ul className="space-y-1.5">{navItems.map(renderNavItem)}</ul>
      </nav>
      <div className="px-3 pb-4 space-y-1">
        <div className="border-t border-border-subtle mb-4" />
        <ul className="space-y-1">{bottomNavItems.map(renderNavItem)}</ul>
        <div className={`mt-4 p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              {user?.photoURL && <AvatarImage src={user.photoURL} alt={user?.displayName || 'User'} />}
              <AvatarFallback>{(user?.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-xs text-text-tertiary truncate capitalize">{roleLabels[userRole || 'admin']}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
