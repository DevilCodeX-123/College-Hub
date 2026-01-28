import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SystemBadge } from '@/components/common/SystemBadge';
import { RoleGate } from '@/components/common/RoleGate';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Medal, Plus, Trophy, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const rankColors = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
  4: 'text-muted-foreground', // Default fallback
} as const;

const rankBg = {
  1: 'bg-gold/10 border-gold/30',
  2: 'bg-silver/10 border-silver/30',
  3: 'bg-bronze/10 border-bronze/30',
  4: 'bg-card border-border', // Default fallback
} as const;


export default function Leaderboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('college');

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', 'college', user?.college],
    queryFn: () => api.getLeaderboard(user?.college),
    enabled: !!user?.college,
  });

  const { data: clubLeaderboard = [], isLoading: isLoadingClubs } = useQuery({
    queryKey: ['leaderboard', 'clubs', user?.college],
    queryFn: () => api.getClubLeaderboard(user?.college),
    enabled: !!user?.college,
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-gold" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'college' ? (
                <>See how you rank against other students (Weekly Reset: Monday 12 AM)</>
              ) : (
                <>See how clubs rank in your college (Monthly Reset: 1st of every Month)</>
              )}
            </p>
          </div>
          <RoleGate allowedRoles={['club_coordinator', 'admin']}>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Leaderboard
            </Button>
          </RoleGate>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="college" onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="college" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              College
            </TabsTrigger>
            <TabsTrigger value="clubs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Club Rankings
            </TabsTrigger>
          </TabsList>

          {/* College Leaderboard */}
          <TabsContent value="college" className="space-y-4">
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && leaderboard.length > 0 && (
              <>
                {/* Top 3 Podium (Only show if we have enough data) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leaderboard.slice(0, 3).map((entry: any, index: number) => {
                    // On mobile, show in rank order (1, 2, 3) 
                    // On sm+, show in podium order (2, 1, 3)
                    const order = index === 0 ? 'sm:order-2 order-1' : index === 1 ? 'sm:order-1 order-2' : 'order-3';
                    const height = index === 0 ? 'pt-0' : 'sm:pt-8 pt-0';

                    return (
                      <div key={entry.userId} className={cn('text-center', order, height)}>
                        <Card
                          variant="gradient"
                          className={cn(
                            'p-4 h-full flex flex-col items-center justify-center',
                            entry.rank === 1 && 'border-2 border-gold/50 shadow-lg'
                          )}
                        >
                          <div className="relative inline-block">
                            <Avatar className="h-16 w-16 mx-auto border-4 border-card shadow-md">
                              <AvatarImage src={entry.avatar} />
                              <AvatarFallback className="text-xl font-bold">
                                {entry.name ? entry.name.charAt(0) : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                'absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full flex items-center justify-center',
                                entry.rank === 1 && 'gradient-gold',
                                entry.rank === 2 && 'bg-silver',
                                entry.rank === 3 && 'bg-bronze'
                              )}
                            >
                              {entry.rank === 1 ? (
                                <Crown className="h-4 w-4 text-foreground" />
                              ) : (
                                <Medal className="h-4 w-4 text-foreground" />
                              )}
                            </div>
                          </div>
                          <h3 className="font-semibold mt-4">{entry.name}</h3>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {entry.points?.toLocaleString() || 0}
                          </p>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Weekly XP</p>

                          <div className="mt-4 pt-4 border-t border-muted w-full space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500">
                              {entry.branch || 'Academic Hub'} • {entry.year || 'N/A'} Year
                            </p>
                            {entry.skills?.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1">
                                {entry.skills.slice(0, 2).map((skill: string) => (
                                  <Badge key={skill} variant="outline" className="text-[8px] font-bold px-1.5 py-0 h-4 bg-white/50">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>

                {/* Full Leaderboard */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Weekly Rankings</CardTitle>
                    <SystemBadge type="system_generated" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.map((entry: any) => (
                      <div
                        key={entry.userId}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          entry.rank <= 3
                            ? rankBg[entry.rank as 1 | 2 | 3]
                            : 'bg-card border-border',
                          entry.userId === user?.id && 'ring-2 ring-primary'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                            entry.rank <= 3
                              ? rankColors[entry.rank as 1 | 2 | 3]
                              : 'text-muted-foreground bg-secondary'
                          )}
                        >
                          {entry.rank <= 3 ? (
                            <Medal className="h-5 w-5" />
                          ) : (
                            entry.rank
                          )}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback className="bg-secondary">
                            {entry.name ? entry.name.charAt(0) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium truncate flex items-center gap-1">
                            <span className="truncate">{entry.name}</span>
                            {entry.userId === user?.id && (
                              <Badge variant="secondary" className="shrink-0 scale-75 origin-left">You</Badge>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
                            {entry.branch || 'Branch'} • {entry.year || 'N/A'} Year
                          </p>
                          {entry.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {entry.skills.slice(0, 3).map((skill: string) => (
                                <span key={skill} className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-primary/5 text-primary border border-primary/10">
                                  {skill}
                                </span>
                              ))}
                              {entry.skills.length > 3 && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                                  +{entry.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {entry.points?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {!isLoading && leaderboard.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found for leaderboard.
              </div>
            )}
          </TabsContent>

          {/* Club Rankings */}
          <TabsContent value="clubs" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Club Rankings</CardTitle>
                <SystemBadge type="system_generated" />
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingClubs ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : clubLeaderboard.map((club: any) => (
                  <div
                    key={club.clubId}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      club.rank <= 3
                        ? rankBg[club.rank as 1 | 2 | 3]
                        : 'bg-card border-border'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        club.rank <= 3
                          ? rankColors[club.rank as 1 | 2 | 3]
                          : 'text-muted-foreground bg-secondary'
                      )}
                    >
                      {club.rank <= 3 ? <Medal className="h-5 w-5" /> : club.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={club.logo} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {club.name ? club.name.substring(0, 2).toUpperCase() : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {club.memberCount} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {club.points?.toLocaleString() || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Points</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              Club rankings are based on task approvals, project completions, and events.
              Top 3 clubs receive achievements every Month (Reset: 1st of every Month).
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout >
  );
}
