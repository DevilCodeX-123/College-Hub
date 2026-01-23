import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy, Clock, Zap } from 'lucide-react';
import { Challenge } from '@/types';
import { format } from 'date-fns';

interface ChallengeSummaryProps {
    challenges: Challenge[];
}

export function ChallengeSummary({ challenges }: ChallengeSummaryProps) {
    return (
        <Card variant="elevated">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Ongoing Challenges
                    </CardTitle>
                    <Link
                        to="/challenges"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        View all <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="group cursor-pointer">
                        <Link to="/challenges" className="block p-3 rounded-lg hover:bg-secondary/5 border border-transparent hover:border-border transition-all">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold group-hover:text-primary transition-colors truncate">{challenge.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {challenge.deadline ? format(new Date(challenge.deadline), 'MMM d') : 'No deadline'}
                                        </span>
                                        <span className="flex items-center gap-1 font-bold text-primary">
                                            <Zap className="h-3 w-3" /> {challenge.points} XP
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {challenge.difficulty}
                                </Badge>
                            </div>
                        </Link>
                    </div>
                ))}

                {challenges.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No active challenges. Level up by starting one!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
