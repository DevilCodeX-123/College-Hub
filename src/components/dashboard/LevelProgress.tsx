import { Progress } from '@/components/ui/progress';
import { Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelProgressProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  className?: string;
}

export function LevelProgress({ level, currentXP, requiredXP, className }: LevelProgressProps) {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <div className={cn('p-4 rounded-xl gradient-hero border border-border', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Star className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dynamic Level</p>
            <p className="text-2xl font-bold">Level {level}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xp">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">{currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP</span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Next level requires 150% more effort!
          </p>
        </div>
      </div>
      <Progress value={progress} variant="xp" size="lg" className="bg-xp/20" />
    </div>
  );
}
