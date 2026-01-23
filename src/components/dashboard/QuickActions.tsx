import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Trophy, Users, FolderKanban, Calendar, Sparkles, Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  {
    label: 'Join Challenge',
    icon: Trophy,
    href: '/challenges',
    color: 'from-primary/20 to-info/20',
    iconColor: 'text-primary',
  },
  {
    label: 'Explore Clubs',
    icon: Users,
    href: '/clubs',
    color: 'from-accent/20 to-success/20',
    iconColor: 'text-accent',
  },
  {
    label: 'My Projects',
    icon: FolderKanban,
    href: '/projects',
    color: 'from-warning/20 to-gold/20',
    iconColor: 'text-warning',
  },
  {
    label: 'Events',
    icon: Calendar,
    href: '/events',
    color: 'from-xp/20 to-primary/20',
    iconColor: 'text-xp',
  },
  {
    label: 'Set Goals',
    icon: Target,
    href: '/profile',
    color: 'from-destructive/20 to-warning/20',
    iconColor: 'text-destructive',
  },
  {
    label: 'Notes and Papers',
    icon: BookOpen,
    href: '/notes',
    color: 'from-info/20 to-accent/20',
    iconColor: 'text-info',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link key={action.label} to={action.href}>
          <Card
            variant="interactive"
            className={cn(
              'p-4 text-center bg-gradient-to-br border-0',
              action.color
            )}
          >
            <action.icon className={cn('h-6 w-6 mx-auto mb-2', action.iconColor)} />
            <span className="text-sm font-medium">{action.label}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
