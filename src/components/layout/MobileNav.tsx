import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Trophy,
  FolderKanban,
  User as UserIcon,
  Map,
  Shield,
  Crown,
  Building2,
  Target,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/clubs', icon: Users, label: 'Clubs' },
  { path: '/challenges', icon: Target, label: 'Challenges' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: UserIcon, label: 'Profile' },
  { path: '/campus-map', icon: Map, label: 'Smart Campus' },
  { path: '/help', icon: HelpCircle, label: 'Help & More' },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { notifications } = useNotifications();

  const getNotificationDot = (itemPath: string) => {
    const normalizedItemPath = itemPath.toLowerCase().replace(/\/$/, '') || '/';
    // TRIPLE FAILSAFE: Check location directly here too
    const currentLoc = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (currentLoc === normalizedItemPath) return null;

    if (!notifications[normalizedItemPath]) return null;
    return (
      <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 top-16 bg-background opacity-100 z-50 animate-fade-in shadow-xl">
      <nav className="p-4 pb-24 space-y-2 h-[calc(100vh-4rem)] overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                isActive
                  ? 'bg-secondary text-primary shadow-sm border border-border/50'
                  : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50 opacity-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" />
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {!isActive && getNotificationDot(item.path)}
                </div>
              </>
            )}
          </NavLink>
        ))}

        {/* Management Section for Owner / Staff */}
        {(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'co_admin' || user?.role === 'club_coordinator' || user?.role === 'club_co_coordinator' || user?.role === 'club_head' || user?.role === 'core_member') && (
          <>
            <div className="my-4 border-t border-border/50" />
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</p>

            {user?.role === 'owner' && (
              <NavLink to="/owner" onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200', isActive ? 'bg-white text-amber-600 shadow-sm border border-amber-100' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Crown className="h-5 w-5" />
                <span>Owner Panel</span>
              </NavLink>
            )}

            {(user?.role === 'admin' || user?.role === 'co_admin') && (
              <NavLink to="/admin" onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Shield className="h-5 w-5" />
                <span>College Admin Panel</span>
              </NavLink>
            )}

            {(user?.role === 'club_coordinator' || user?.role === 'club_co_coordinator') && (
              <NavLink to="/club-coordinator" onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Shield className="h-5 w-5" />
                <span>Club Coordinator Panel</span>
              </NavLink>
            )}

            {user?.role === 'club_head' && (
              <NavLink to="/club-head" onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Target className="h-5 w-5" />
                <span>Club Secretary Panel</span>
              </NavLink>
            )}

            {user?.role === 'core_member' && (
              <NavLink to="/core-team" onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}>
                <Users className="h-5 w-5" />
                <span>Core Team Panel</span>
              </NavLink>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
