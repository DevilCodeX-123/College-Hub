import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Trophy,
  FolderKanban,
  User,
  Map,
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
  Crown,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/clubs', icon: Users, label: 'Clubs' },
  { path: '/challenges', icon: Target, label: 'Challenges' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/campus-map', icon: Map, label: 'Smart Campus' },
  { path: '/help', icon: HelpCircle, label: 'Help & More' },
];



export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const getNotificationDot = (itemPath: string) => {
    const normalizedItemPath = itemPath.toLowerCase().replace(/\/$/, '') || '/';
    // TRIPLE FAILSAFE: Check location directly here too
    const currentLoc = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (currentLoc === normalizedItemPath) return null;

    if (!notifications[normalizedItemPath]) return null;

    return (
      <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-40 hidden lg:flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-secondary text-primary shadow-md shadow-primary/5 border border-primary/10'
                  : 'text-slate-500 hover:text-primary hover:bg-slate-50/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {!isActive && getNotificationDot(item.path)}
                  </div>
                )}
                {collapsed && !isActive && getNotificationDot(item.path)}
              </>
            )}
          </NavLink>
        ))}

        {/* Management Section for Owner / Staff */}
        {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'co_admin' || user?.role === 'club_coordinator' || user?.role === 'club_co_coordinator' || user?.role === 'club_head' || user?.role === 'core_member') && (
          <>
            <div className={cn('my-6 border-t border-border/50', collapsed && 'mx-2')} />
            {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Management</p>}

            {/* Owner Panel - Only for Owner */}
            {user?.role === 'owner' && (
              <NavLink to="/owner" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-secondary text-amber-600 shadow-sm border border-amber-100/20' : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50')}>
                <Crown className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Owner Panel</span>}
              </NavLink>
            )}

            {/* College Admin Panel - Strict Role */}
            {(user?.role === 'admin' || user?.role === 'co_admin') && (
              <NavLink to="/admin" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-secondary text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50')}>
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>College Admin Panel</span>}
              </NavLink>
            )}

            {/* Club Coordinator Panel - Strict Role */}
            {(user?.role === 'club_coordinator' || user?.role === 'club_co_coordinator') && (
              <NavLink to="/club-coordinator" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Club Coordinator Panel</span>}
              </NavLink>
            )}

            {/* Club Secretary Panel - Strict Role */}
            {user?.role === 'club_head' && (
              <NavLink to="/club-head" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Target className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Club Secretary Panel</span>}
              </NavLink>
            )}

            {/* Core Team Panel - Strict Role */}
            {user?.role === 'core_member' && (
              <NavLink to="/core-team" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-secondary text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50')}>
                <Users className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Core Team Panel</span>}
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
