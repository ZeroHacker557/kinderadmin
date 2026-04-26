import { Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/Dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

export default function Header({ isMobile }: HeaderProps) {
  const { user, logout, kindergarten } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-surface-primary border-b border-border-default z-30 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && <h1 className="font-bold text-xl text-primary">KinderAdmin</h1>}
        {kindergarten && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary/60 border border-border-subtle">
            <span className="text-base">🏫</span>
            <span className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{kindergarten.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-surface-secondary transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              {user?.photoURL && <AvatarImage src={user.photoURL} alt={user?.displayName || 'User'} />}
              <AvatarFallback>{(user?.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <div className="px-3 py-2 border-b border-border-subtle">
              <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <User className="w-4 h-4 mr-2" />
                <span>Profil sozlamalari</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2 text-red-500" />
                <span className="text-red-500">Chiqish</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
