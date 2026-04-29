import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/Dropdown';

export default function MobileNav() {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const mainItems = [
    { id: 'dashboard', label: 'Asosiy', icon: <LayoutDashboard className="w-5 h-5" />, path: '/' },
    { id: 'children', label: 'Bolalar', icon: <Users className="w-5 h-5" />, path: '/children' },
    { id: 'groups', label: 'Guruhlar', icon: <FolderKanban className="w-5 h-5" />, path: '/groups' },
  ];

  const moreItems = [
    { id: 'employees', label: 'Xodimlar', path: '/employees', show: hasPermission('admin') },
    { id: 'parents', label: 'Ota-onalar', path: '/parents' },
    { id: 'contracts', label: 'Shartnomalar', path: '/contracts', show: hasPermission('admin') },
    { id: 'finances', label: 'Moliya', path: '/finances', show: hasPermission('admin') || hasPermission('accountant') },
    { id: 'attendance', label: 'Davomat', path: '/attendance', show: hasPermission('admin') || hasPermission('teacher') },
    { id: 'settings', label: 'Sozlamalar', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-primary border-t border-border-default pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 z-40 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2">
        {mainItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center justify-center p-2 gap-1 rounded-lg ${
              isActive(item.path) ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center p-2 gap-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary outline-none">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Boshqa</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-48 mb-2">
            {moreItems.map(item => {
              if (item.show === false) return null;
              return (
                <DropdownMenuItem key={item.id} asChild>
                  <Link to={item.path} className="w-full cursor-pointer py-2">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
