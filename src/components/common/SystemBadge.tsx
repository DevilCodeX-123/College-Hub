import { Lock, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SystemBadgeProps {
  type: 'system_generated' | 'club_assigned' | 'read_only';
  className?: string;
}

const badgeConfig = {
  system_generated: {
    label: 'System Generated – Non Editable',
    icon: Lock,
    color: 'bg-muted text-muted-foreground',
  },
  club_assigned: {
    label: 'Marks Assigned by Club',
    icon: Info,
    color: 'bg-info/10 text-info',
  },
  read_only: {
    label: 'Read Only',
    icon: Lock,
    color: 'bg-secondary text-secondary-foreground',
  },
};

export function SystemBadge({ type, className }: SystemBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            config.color,
            className
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
