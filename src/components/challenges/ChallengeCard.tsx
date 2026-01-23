import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Zap, ChevronRight, Check, Loader2, Info, Gift } from 'lucide-react';
import { Challenge } from '@/types';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTask, setShowTask] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamJoinCode, setTeamJoinCode] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const daysLeft = differenceInDays(challenge.deadline, new Date());
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;

  // Check if user has already joined
  const challengeId = challenge.id || challenge._id;
  const activity = user?.activity?.find((a: any) =>
    a.type === 'challenge' &&
    (a.refId === challengeId || a.refId === challenge.id || a.refId === challenge._id)
  );
  const hasJoined = !!activity;
  const isCompleted = activity?.status === 'completed';

  // Fetch team info if it's a team challenge and user joined
  const { data: myTeam } = useQuery({
    queryKey: ['challenge-team', challengeId, user?.id],
    queryFn: () => api.getMyChallengeTeam(challengeId, user?.id || ''),
    enabled: hasJoined && challenge.isTeamChallenge
  });

  const joinMutation = useMutation({
    mutationFn: () => api.joinChallenge(challengeId, user?.id || ''),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      if (data.user) updateUser(data.user);
      toast({
        title: 'Challenge Joined!',
        description: `You've started "${challenge.title}". Task details are now available. XP will be awarded after verification.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Join Failed',
        description: err.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => api.createChallengeTeam(challengeId, user?.id || '', name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-team', challenge.id, user?.id] });
      // Backend returns team, but we might need to refresh user too if activity was added
      // The backend route for create-team updates user activity!
      api.getProfile(user?.id || '').then(u => updateUser(u));
      toast({ title: 'Team Created!', description: 'Invite your friends using the team code.' });
    },
    onError: (err: any) => {
      toast({ title: 'Creation Failed', description: err.response?.data?.message || 'Something went wrong', variant: 'destructive' });
    }
  });

  const joinTeamMutation = useMutation({
    mutationFn: (code: string) => api.joinChallengeTeam(user?.id || '', code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-team', challenge.id, user?.id] });
      api.getProfile(user?.id || '').then(u => updateUser(u));
      toast({ title: 'Team Joined!', description: 'You are now part of the team.' });
    },
    onError: (err: any) => {
      toast({ title: 'Join Failed', description: err.response?.data?.message || 'Invalid team code', variant: 'destructive' });
    }
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string, memberId: string }) =>
      api.removeTeamMember(teamId, memberId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-team', challengeId, user?.id] });
      toast({ title: 'Member Removed', description: 'Team member has been removed successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Remove Failed', description: err.response?.data?.message || 'Failed to remove member', variant: 'destructive' });
    }
  });

  const [selectedPhase, setSelectedPhase] = useState<string>('');

  const submitMutation = useMutation({
    mutationFn: (variables: { link: string, phaseId?: string }) => api.submitChallenge(challengeId, user?.id || '', variables.link, variables.phaseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      // Update local user activity if needed or just show success
      toast({
        title: 'Submission Received!',
        description: 'Your work has been submitted for review.',
      });
      setSubmissionLink('');
      setSelectedPhase('');
    },
    onError: (err: any) => {
      toast({
        title: 'Submission Failed',
        description: err.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  // Check if user has enough points
  const canAfford = !user || user.points >= (challenge.entryFee || 0);

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return toast({ title: 'Please login to join challenges', variant: 'destructive' });
    if (!canAfford) return toast({
      title: 'Insufficient Points',
      description: `You need ${challenge.entryFee} XP to join this challenge.`,
      variant: 'destructive'
    });
    if (hasJoined) return;
    joinMutation.mutate();
  };

  const handleCreateTeam = () => {
    if (!teamName) return toast({ title: 'Please enter a team name', variant: 'destructive' });
    createTeamMutation.mutate(teamName);
  };

  const handleJoinTeam = () => {
    if (!teamJoinCode) return toast({ title: 'Please enter a team code', variant: 'destructive' });
    joinTeamMutation.mutate(teamJoinCode);
  };

  // Fetch challenge-specific leaderboard
  const { data: challengeLeaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['challenge-leaderboard', challengeId],
    queryFn: () => api.getChallengeLeaderboard(challengeId),
    enabled: showTask
  });

  return (
    <>
      <Card variant="interactive" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={challenge.difficulty}>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {challenge.category}
                </Badge>
                {challenge.isTeamChallenge && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    Team ({challenge.minTeamSize || 2}-{challenge.maxTeamSize || 4})
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base leading-tight">
                {challenge.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1 text-xp">
                <Zap className="h-4 w-4" />
                <span className="font-bold">+{challenge.points}</span>
              </div>
              {challenge.entryFee > 0 && (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0 h-4">
                  -{challenge.entryFee} XP
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {challenge.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <Link
              to={`/clubs/${challenge.clubId}`}
              className="text-primary hover:underline"
            >
              {challenge.clubName}
            </Link>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{challenge.participants} joined</span>
              </div>
              {challenge.joinCode && !hasJoined && (
                <Badge variant="secondary" className="font-mono text-[10px] tracking-wider px-2 py-0">
                  Key: {challenge.joinCode}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm',
                isUrgent ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {daysLeft < 0
                  ? 'Ended'
                  : daysLeft === 0
                    ? 'Ends today'
                    : `${daysLeft} days left`}
              </span>
            </div>
            <div className="flex gap-2">
              {hasJoined ? (
                <Button
                  size="sm"
                  variant={isCompleted ? "success" : "secondary"}
                  onClick={() => setShowTask(true)}
                  className="h-8"
                >
                  {isCompleted ? (
                    <><Check className="h-3.5 w-3.5 mr-1" /> Completed</>
                  ) : (
                    <><Info className="h-3.5 w-3.5 mr-1" /> View Updates</>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTask(true)}
                  className="h-8"
                >
                  View Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTask} onOpenChange={setShowTask}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {challenge.title}
              {challenge.isTeamChallenge && <Badge variant="secondary">Team Challenge</Badge>}
            </DialogTitle>
            <DialogDescription>
              {hasJoined
                ? `Complete this task and wait for coordinator verification to earn ${challenge.points} XP.`
                : `Join this challenge to earn ${challenge.points} XP upon completion.`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div className="rounded-lg bg-secondary/20 p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Task Instructions
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {challenge.description}
                </p>
              </div>

              <p className="text-sm whitespace-pre-wrap">{challenge.prizes}</p>

              {hasJoined && challenge.isTeamChallenge && myTeam && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">Your Team: {myTeam.name}</h4>
                    <Badge variant="secondary" className="font-mono tracking-widest">
                      {myTeam.joinCode}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Team Members:</p>
                    <div className="space-y-2">
                      {myTeam.members?.map((member: any) => {
                        const isLeader = member._id === myTeam.leaderId || member._id === (myTeam.leaderId as any)?._id;
                        const isCurrentUser = member._id === user?.id;
                        const canRemove = user?.id === myTeam.leaderId && !isCurrentUser;

                        return (
                          <div key={member._id} className="flex items-center justify-between p-2 rounded-md bg-secondary/20">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">{member.name}</span>
                              {isLeader && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Leader</Badge>}
                            </div>
                            {canRemove && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeTeamMemberMutation.mutate({
                                  teamId: myTeam._id || myTeam.id,
                                  memberId: member._id
                                })}
                                disabled={removeTeamMemberMutation.isPending}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!hasJoined && challenge.isTeamChallenge && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Team Name</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Alpha"
                          className="h-8 text-xs"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                        <Button size="sm" className="h-8 text-[10px]" onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                          {createTeamMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Have a code?</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="A1B2C3"
                          className="h-8 text-xs font-mono uppercase"
                          value={teamJoinCode}
                          onChange={(e) => setTeamJoinCode(e.target.value)}
                        />
                        <Button size="sm" variant="secondary" className="h-8 text-[10px]" onClick={handleJoinTeam} disabled={joinTeamMutation.isPending}>
                          {joinTeamMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Join"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasJoined && !isCompleted && (() => {
                // Check if user already has a pending or approved submission
                const userSubmissions = (challenge.submissions || []).filter((s: any) => s.userId === user?.id);
                const hasPendingSubmission = userSubmissions.some((s: any) => s.status === 'pending' || s.status === 'approved');

                // For non-phased challenges, if there's already a submission, don't show the form
                if (!challenge.phases || challenge.phases.length === 0) {
                  if (hasPendingSubmission) {
                    return (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                        <Info className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-bold text-blue-600">Submission Under Review</h4>
                        <p className="text-sm text-blue-600/80">Your submission is being reviewed by the coordinator.</p>
                      </div>
                    );
                  }
                }

                return (
                  <div className="space-y-4 p-4 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="submission-link" className="text-sm font-semibold">Submit Your Work</Label>
                      {(challenge.phases && challenge.phases.length > 0) && (
                        <Badge variant="outline" className="text-xs">
                          Multi-Phase Challenge
                        </Badge>
                      )}
                    </div>

                    {/* Phase Selector if phases exist */}
                    {(challenge.phases && challenge.phases.length > 0) && (
                      <div className="space-y-4">
                        {(() => {
                          // Logic to determine active phase
                          const userSubmissions = (challenge.submissions || []).filter((s: any) => s.userId === user?.id);
                          const nextPhaseIndex = challenge.phases.findIndex((phase: any) =>
                            !userSubmissions.some((s: any) =>
                              (s.phaseId === phase._id || s.phaseId === phase.id) && s.status !== 'rejected' // Re-submission allowed if rejected? Usually yes.
                            )
                          );

                          // If nextPhaseIndex is -1, it means all phases are submitted (or no phases exist, handled by outer check)
                          const allPhasesSubmitted = nextPhaseIndex === -1;
                          const currentActivePhaseId = allPhasesSubmitted ? null : (challenge.phases[nextPhaseIndex]._id || challenge.phases[nextPhaseIndex].id);

                          // Auto-select active phase if none selected
                          if (currentActivePhaseId && selectedPhase !== currentActivePhaseId) {
                            // We can't set state directly in render. 
                            // Instead, we use the active phase to control the UI state or button disabled state.
                            // OR, simpler: just render the active phase as read-only or pre-selected safely.
                            // Better UX: Just show the user which phase they are submitting for.
                          }

                          if (allPhasesSubmitted) {
                            return (
                              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <h4 className="font-bold text-green-600">All Phases Completed!</h4>
                                <p className="text-sm text-green-600/80">You have submitted all required phases for this challenge.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Select Phase</Label>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  value={selectedPhase || currentActivePhaseId || ""}
                                  onChange={(e) => setSelectedPhase(e.target.value)}
                                >
                                  <option value="" disabled>Select a phase...</option>
                                  {challenge.phases.map((phase: any, index: number) => {
                                    const isSubmitted = userSubmissions.some((s: any) => (s.phaseId === phase._id || s.phaseId === phase.id) && s.status !== 'rejected');
                                    const isLocked = index > nextPhaseIndex;
                                    const isTarget = index === nextPhaseIndex;

                                    return (
                                      <option
                                        key={phase._id || phase.id}
                                        value={phase._id || phase.id}
                                        disabled={isSubmitted || isLocked}
                                      >
                                        {phase.name}
                                        {isSubmitted ? " (Submitted)" : isLocked ? " (Locked)" : " (Open)"}
                                        - Due: {new Date(phase.deadline).toLocaleDateString()}
                                      </option>
                                    );
                                  })}
                                </select>
                                <p className="text-[10px] text-muted-foreground">
                                  * Phases must be completed in order. Phase {nextPhaseIndex + 1} is currently open.
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  id="submission-link"
                                  placeholder="Paste your GitHub/Drive link here..."
                                  value={submissionLink}
                                  onChange={(e) => setSubmissionLink(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() => submitMutation.mutate({ link: submissionLink, phaseId: selectedPhase || currentActivePhaseId })}
                                  disabled={!submissionLink || submitMutation.isPending}
                                  size="sm"
                                >
                                  {submitMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Submit'
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Standard Single Submission */}
                    {(!challenge.phases || challenge.phases.length === 0) && (
                      <div className="flex gap-2">
                        <Input
                          id="submission-link"
                          placeholder="Paste your GitHub/Drive link here..."
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => submitMutation.mutate({ link: submissionLink })}
                          disabled={!submissionLink || submitMutation.isPending}
                          size="sm"
                        >
                          {submitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Submit'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={isCompleted ? "success" : hasJoined ? "warning" : "outline"}>
                  {isCompleted ? "Verified & Completed" : hasJoined ? "In Progress" : "Not Joined"}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4 py-4">
              {isLoadingLeaderboard ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : challengeLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-lg">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No verified submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {challengeLeaderboard.map((entry: any) => (
                    <div
                      key={entry.userId}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        entry.rank === 1 && "bg-gold/5 border-gold/20",
                        entry.userId === user?.id && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                          entry.rank === 1 ? "bg-gold text-white" : "bg-secondary text-muted-foreground"
                        )}>
                          {entry.rank}
                        </div>
                        <span className="font-medium text-sm">
                          {entry.name}
                          {entry.userId === user?.id && <span className="ml-2 text-[10px] text-primary">(You)</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">{entry.marks}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">marks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="ghost" onClick={() => setShowTask(false)}>
              {hasJoined ? "Close" : "Maybe Later"}
            </Button>
            {!hasJoined && !challenge.isTeamChallenge && (
              <Button
                onClick={handleJoin}
                disabled={joinMutation.isPending || (!canAfford && !!user)}
              >
                {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                {!canAfford && !!user ? "Insufficient XP" : "Join Challenge"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
