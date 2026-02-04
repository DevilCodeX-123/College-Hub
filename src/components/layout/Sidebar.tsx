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
  Calendar,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { api } from '@/lib/api';

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
  const [managedClubs, setManagedClubs] = useState<any[]>([]);

  // Fetch managed clubs for personalized labels
  useEffect(() => {
    const fetchClubs = async () => {
      if (user?.id && ['club_coordinator', 'club_co_coordinator', 'club_head', 'core_member'].includes(user.role)) {
        try {
          const clubs = await api.getManagedClubs(user.id);
          setManagedClubs(clubs || []);
        } catch (err) {
          console.error("Failed to fetch managed clubs for sidebar:", err);
        }
      }
    };
    fetchClubs();
  }, [user?.id, user?.role]);

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

        {/* Management Section - Ensuring only ONE panel is shown per user */}
        {(() => {
          const role = user?.role;
          if (!role) return null;

          const managementLinks = [];

          if (role === 'owner') {
            managementLinks.push(
              <NavLink key="owner" to="/owner" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-secondary text-amber-600 shadow-sm border border-amber-100/20' : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50')}>
                <Crown className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Owner Panel</span>}
              </NavLink>
            );
          } else if (role === 'admin') {
            managementLinks.push(
              <NavLink key="admin" to="/admin" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-secondary text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50/50')}>
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>College Admin Panel</span>}
              </NavLink>
            );
          } else if (managedClubs.length > 0) {
            managedClubs.forEach((club) => {
              const clubId = club.id || club._id;

              // Determine role in this specific club
              const memberInfo = club.coreTeam?.find((m: any) => m.userId === user?.id);
              const clubRole = memberInfo?.role || role;

              let path = "/club-coordinator";
              let Icon = Shield;
              let labelSuffix = "Coordinator";

              if (clubRole === 'club_head') {
                path = "/club-head";
                Icon = Target;
                labelSuffix = "Secretary";
              } else if (clubRole === 'core_member') {
                path = "/core-team";
                Icon = Users;
                labelSuffix = "Core Team";
              }

              managementLinks.push(
                <NavLink
                  key={clubId}
                  to={`${path}/${clubId}`}
                  className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-white text-primary shadow-sm border border-border/50' : 'text-slate-600 hover:text-foreground hover:bg-slate-50')}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{club.name} {labelSuffix}</span>}
                </NavLink>
              );
            });
          }

          // Add Ad Request link for all management roles EXCEPT owner (owner has Ad Management already)
          if (['admin', 'club_coordinator', 'club_co_coordinator', 'club_head', 'core_member'].includes(role)) {
            managementLinks.push(
              <NavLink
                key="ad-request"
                to="/request-ad"
                className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mt-2 bg-primary/5', isActive ? 'bg-primary text-white shadow-md' : 'text-primary hover:bg-primary/10')}
              >
                <Megaphone className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Request Ad</span>}
              </NavLink>
            );
          }

          if (managementLinks.length === 0) return null;

          return (
            <>
              <div className={cn('my-6 border-t border-border/50', collapsed && 'mx-2')} />
              {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Management</p>}
              <div className="space-y-1">
                {managementLinks}
              </div>
            </>
          );
        })()}
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
