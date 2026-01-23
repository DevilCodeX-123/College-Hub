import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock, Trophy, Star, Zap, Target, Shield, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const allBadges = [
    { id: 'early_adopter', name: 'Early Adopter', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', description: 'Joined the platform during the beta phase.' },
    { id: 'first_challenge', name: 'First Challenge', icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', description: 'Successfully completed your first challenge.' },
    { id: 'team_player', name: 'Team Player', icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Joined 3 or more clubs.' },
    { id: 'code_master', name: 'Code Master', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Completed 10 coding challenges.' },
    { id: 'innovator', name: 'Innovator', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Proposed a project that was accepted.' },
    { id: 'college_hero', name: 'College Hero', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Reached Top 10 on the global leaderboard.' },
];

export default function Badges() {
    const { user } = useAuth();

    // Simulation: User has these badges locked/unlocked
    const earnedBadgeIds = ['early_adopter', 'first_challenge', 'team_player'];

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-12">
                {/* Header */}
                <section>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Award className="h-8 w-8 text-primary" />
                        Achievements Hub
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track your milestones and collect unique digital badges
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allBadges.filter(badge => earnedBadgeIds.includes(badge.id)).map((badge) => {
                        return (
                            <Card
                                key={badge.id}
                                className="relative overflow-hidden transition-all duration-300 border-primary/20 shadow-md translate-y-[-2px]"
                            >
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
                                        badge.bg
                                    )}>
                                        <badge.icon className={cn("h-6 w-6", badge.color)} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">{badge.name}</CardTitle>
                                        <Badge variant="success" className="text-[10px] h-4 mt-1">Earned</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {badge.description}
                                    </p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20" />
                            </Card>
                        );
                    })}
                </div>

                {/* Info Card */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Star className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold">How to earn more?</p>
                            <p className="text-sm text-muted-foreground">
                                Keep participating in challenges, events, and contributing to projects.
                                Some badges are secret until you unlock them!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
