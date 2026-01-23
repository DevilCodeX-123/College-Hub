import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { ChevronRight, Crown, Medal } from 'lucide-react';
import { LeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  title?: string;
  currentUserId?: string;
}

const rankColors = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
};

const rankBg = {
  1: 'bg-gold/10 border-gold/30',
  2: 'bg-silver/10 border-silver/30',
  3: 'bg-bronze/10 border-bronze/30',
};

export function LeaderboardPreview({ entries, title = 'Leaderboard', currentUserId }: LeaderboardPreviewProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            Weekly {title}
          </CardTitle>
          <Link
            to="/leaderboard"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(Array.isArray(entries) ? entries : []).filter(Boolean).slice(0, 5).map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
              entry.rank <= 3
                ? rankBg[entry.rank as 1 | 2 | 3]
                : 'bg-card border-border',
              entry.userId === currentUserId && 'ring-2 ring-primary'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                entry.rank <= 3
                  ? rankColors[entry.rank as 1 | 2 | 3]
                  : 'text-muted-foreground'
              )}
            >
              {entry.rank <= 3 ? (
                <Medal className="h-5 w-5" />
              ) : (
                entry.rank
              )}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatar} />
              <AvatarFallback className="text-xs bg-secondary">
                {entry.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.name || 'Unknown'}</p>
              {entry.college && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.college}
                </p>
              )}
            </div>
            <span className="text-sm font-semibold text-primary">
              {(entry.points || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
