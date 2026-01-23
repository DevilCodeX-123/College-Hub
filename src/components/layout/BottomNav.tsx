import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, FolderKanban, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/clubs', icon: Users, label: 'Clubs' },
  { path: '/challenges', icon: Trophy, label: 'Challenges' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { notifications } = useNotifications();
  const location = useLocation();

  const getNotificationDot = (itemPath: string) => {
    const normalizedItemPath = itemPath.toLowerCase().replace(/\/$/, '') || '/';
    // TRIPLE FAILSAFE: Check location directly here too
    const currentLoc = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (currentLoc === normalizedItemPath) return null;

    if (!notifications[normalizedItemPath]) return null;

    return (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'p-1.5 rounded-lg transition-colors relative',
                    isActive && 'bg-white shadow-sm border border-border'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!isActive && getNotificationDot(item.path)}
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
