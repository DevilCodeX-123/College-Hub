import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PollWidget() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [dismissedPolls, setDismissedPolls] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('dismissed_polls');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const { data: polls = [], isLoading } = useQuery({
        queryKey: ['polls', user?.id],
        queryFn: () => api.getPolls(user?.id, user?.role, user?.email),
        enabled: !!user,
        refetchInterval: 30000,
    });

    const voteMutation = useMutation({
        mutationFn: ({ pollId, optionIndex }: { pollId: string, optionIndex: number }) =>
            api.votePoll(pollId, { userId: user!.id, optionIndex }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            setSelectedOption(null);
            setTimeLeft(null);
            // After voting, we might want to keep it to show results, 
            // but the user asked to "limit" it. We'll let them see results 
            // and then they can dismiss, OR we can auto-dismiss if they prefer.
            // For now, let's keep it visible until they dismiss, but persist the dismiss.
        }
    });

    // Find the latest active poll (voted or not)
    const activePoll = (Array.isArray(polls) ? polls : []).find((p: any) =>
        p && p.status === 'active' && !dismissedPolls.includes(p._id)
    );

    const hasVoted = !!activePoll?.votedBy?.includes(user?.id);

    // Timer Logic for auto-submit
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedOption !== null && timeLeft !== null && timeLeft > 0 && !hasVoted) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newValue = (prev ?? 0) - 1;
                    if (newValue <= 0) {
                        if (user && activePoll && !voteMutation.isPending) {
                            voteMutation.mutate({ pollId: activePoll._id, optionIndex: selectedOption });
                        }
                        return 0;
                    }
                    return newValue;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timeLeft, selectedOption, activePoll, user, voteMutation, hasVoted]);

    const handleOptionSelect = (val: string) => {
        const index = parseInt(val);
        setSelectedOption(index);
        setTimeLeft(15);
    };

    const handleVote = () => {
        if (selectedOption !== null && user && activePoll) {
            voteMutation.mutate({ pollId: activePoll._id, optionIndex: selectedOption });
        }
    };

    const handleDismiss = () => {
        if (activePoll) {
            const newList = [...dismissedPolls, activePoll._id];
            setDismissedPolls(newList);
            localStorage.setItem('dismissed_polls', JSON.stringify(newList));
        }
    };

    if (isLoading || !activePoll) return null;

    // Calculate total votes for percentage
    const totalVotes = activePoll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);

    return (
        <div className="fixed bottom-20 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-5">
            <Card className="shadow-2xl border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-primary" />
                        {hasVoted ? 'Poll Results' : 'Live Poll'}
                        {timeLeft !== null && !hasVoted && (
                            <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto animate-pulse">
                                Auto-submitting in {timeLeft}s
                            </span>
                        )}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleDismiss}>
                        <span className="text-xs">×</span>
                    </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-3">
                    <h4 className="font-bold text-sm mb-4 leading-tight">{activePoll.question}</h4>

                    {!hasVoted ? (
                        <div className="space-y-4">
                            <RadioGroup onValueChange={handleOptionSelect} value={selectedOption?.toString()}>
                                {activePoll.options.map((option: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer",
                                            selectedOption === idx ? "bg-primary/5 border border-primary/10" : "hover:bg-accent/50"
                                        )}
                                        onClick={() => handleOptionSelect(idx.toString())}
                                    >
                                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                        <Label htmlFor={`option-${idx}`} className="text-sm font-medium cursor-pointer w-full">
                                            {option.text}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>

                            <div className="space-y-3 pt-2">
                                {timeLeft !== null && (
                                    <Progress value={((15 - timeLeft) / 15) * 100} className="h-1 bg-primary/10" />
                                )}
                                <Button
                                    onClick={handleVote}
                                    disabled={selectedOption === null || voteMutation.isPending}
                                    className="w-full shadow-lg shadow-primary/20"
                                    size="sm"
                                >
                                    {voteMutation.isPending ? (
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    ) : (
                                        'Submit Vote'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activePoll.options.map((option: any, idx: number) => {
                                const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>{option.text}</span>
                                            <span className="text-primary">{percentage}%</span>
                                        </div>
                                        <div className="relative h-2 w-full bg-primary/5 rounded-full overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-right">{option.votes || 0} votes</p>
                                    </div>
                                );
                            })}
                            <div className="pt-2 border-t border-primary/10">
                                <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                                    Thanks for contributing to the campus discussion!
                                </p>
                                <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-[11px] font-bold" onClick={handleDismiss}>
                                    Dismiss Results
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
