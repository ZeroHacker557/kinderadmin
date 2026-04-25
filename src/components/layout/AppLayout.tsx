import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-surface-secondary flex font-sans text-text-primary">
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header sidebarCollapsed={sidebarCollapsed} isMobile={isMobile} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto min-h-full pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && <MobileNav />}
    </div>
  );
}
