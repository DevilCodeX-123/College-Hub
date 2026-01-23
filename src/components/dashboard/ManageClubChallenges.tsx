import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Trophy,
    Users,
    Clock,
    Plus,
    Loader2,
    Trash2,
    Edit,
    AlertCircle,
    Zap,
    X,
    CheckCircle2,
    ThumbsUp,
    ThumbsDown,
    Lightbulb
} from 'lucide-react';
import { Challenge } from '@/types';

interface ManageClubChallengesProps {
    clubId: string;
    clubName?: string;
}

export function ManageClubChallenges({ clubId, clubName }: ManageClubChallengesProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isGradingOpen, setIsGradingOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

    // Form States
    const [newChallenge, setNewChallenge] = useState({
        _id: '', // For edit mode
        title: '',
        description: '',
        points: 50,
        difficulty: 'medium',
        category: 'Hackathon',
        deadline: '',
        entryFee: 0,
        isTeamChallenge: false,
        minTeamSize: 2,
        maxTeamSize: 4,
        prizes: '', // For prize details
        phases: [] as { name: string; deadline: string }[]
    });

    const [usePhases, setUsePhases] = useState(false);
    const [activeTab, setActiveTab] = useState('active');

    const [gradingData, setGradingData] = useState({
        marks: 0,
        feedback: '',
        awardBadge: { name: '', description: '' },
        awardSkill: ''
    });

    // Fetch Challenges
    const { data: challenges = [], isLoading } = useQuery({
        queryKey: ['club-challenges', clubId],
        queryFn: () => api.getChallenges(undefined, clubId)
    });

    // Fetch Club for suggestions
    const { data: club } = useQuery({
        queryKey: ['club', clubId],
        queryFn: () => api.getClub(clubId),
        enabled: !!clubId
    });

    const suggestions = club?.challengeSuggestions || [];

    // Reset Form Helper
    const resetForm = () => {
        setNewChallenge({
            _id: '',
            title: '',
            description: '',
            points: 50,
            difficulty: 'medium',
            category: 'Hackathon',
            deadline: '',
            entryFee: 0,
            isTeamChallenge: false,
            minTeamSize: 2,
            maxTeamSize: 4,
            prizes: '',
            phases: []
        });
        setUsePhases(false);
        setIsEditMode(false);
    };

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => {
            const payload = { ...data, clubId, clubName };
            if (!payload.deadline) delete payload.deadline;
            if (!payload._id) delete payload._id;
            // Clean phases
            if (payload.phases && payload.phases.length > 0) {
                payload.phases = payload.phases.map((p: any) => {
                    const clean = { ...p };
                    if (!clean.deadline) delete clean.deadline;
                    return clean;
                });
            }
            return api.createChallenge(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Challenge Created", description: "New challenge is now active." });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast({ title: "Creation Failed", description: err.response?.data?.message || "Failed to create challenge", variant: "destructive" });
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            const payload = { ...data };
            if (!payload.deadline) delete payload.deadline;
            // Clean phases
            if (payload.phases && payload.phases.length > 0) {
                payload.phases = payload.phases.map((p: any) => {
                    const clean = { ...p };
                    if (!clean.deadline) delete clean.deadline;
                    return clean;
                });
            }
            return api.updateChallenge(data._id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Challenge Updated" });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast({ title: "Update Failed", description: err.response?.data?.message || "Failed to update challenge", variant: "destructive" });
        }
    });

    // Close/Finish Challenge Mutation
    const closeChallengeMutation = useMutation({
        mutationFn: (id: string) => api.updateChallenge(id, { status: 'completed' } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Challenge Closed", description: "This challenge is now marked as completed." });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteChallenge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Challenge Deleted" });
        }
    });

    // Grading Mutation
    const gradeMutation = useMutation({
        mutationFn: (variables: { challengeId: string, submissionId: string }) => {
            return api.gradeChallengeSubmission(variables.challengeId, variables.submissionId, {
                userId: variables.submissionId,
                marks: gradingData.marks, // 0-100
                feedback: gradingData.feedback,
                reviewerId: user?.id || "unknown",
                awardBadge: gradingData.awardBadge.name ? gradingData.awardBadge : null,
                awardSkill: gradingData.awardSkill || null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Submission Graded", description: "Marks and awards have been processed." });
            setIsGradingOpen(false);
            setGradingData({ marks: 0, feedback: '', awardBadge: { name: '', description: '' }, awardSkill: '' });
        }
    });

    // Suggestion Actions
    const approveSuggestionMutation = useMutation({
        mutationFn: (suggestionId: string) => api.approveChallengeSuggestion(clubId, suggestionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club', clubId] });
            queryClient.invalidateQueries({ queryKey: ['club-challenges', clubId] });
            toast({ title: "Challenge Approved", description: "Suggestion has been converted to an active challenge." });
        },
        onError: (err: any) => {
            toast({ title: "Approval Failed", description: err.response?.data?.message || "Failed to approve suggestion", variant: "destructive" });
        }
    });

    const rejectSuggestionMutation = useMutation({
        mutationFn: (suggestionId: string) => api.rejectChallengeSuggestion(clubId, suggestionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club', clubId] });
            toast({ title: "Suggestion Rejected" });
        },
        onError: (err: any) => {
            toast({ title: "Rejection Failed", description: err.response?.data?.message || "Failed to reject suggestion", variant: "destructive" });
        }
    });

    // Helper to get submissions from selected challenge
    const submissions = selectedChallenge?.submissions || [];

    // Phase Handlers
    const handleAddPhase = () => {
        setNewChallenge(prev => ({
            ...prev,
            phases: [...(prev.phases || []), { name: `Phase ${(prev.phases?.length || 0) + 1}`, deadline: '' }]
        }));
    };

    const handleRemovePhase = (index: number) => {
        setNewChallenge(prev => ({
            ...prev,
            phases: prev.phases.filter((_, i) => i !== index)
        }));
    };

    const handlePhaseChange = (index: number, field: string, value: string) => {
        setNewChallenge(prev => ({
            ...prev,
            phases: prev.phases.map((p, i) => i === index ? { ...p, [field]: value } : p)
        }));
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const myChallenges = challenges.filter((c: any) => c.clubId === clubId);

    const formatDateForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleEdit = (challenge: any) => {
        setNewChallenge({
            _id: challenge._id || challenge.id,
            title: challenge.title,
            description: challenge.description,
            points: challenge.points,
            difficulty: challenge.difficulty,
            category: challenge.category,
            deadline: formatDateForInput(challenge.deadline),
            entryFee: challenge.entryFee || 0,
            isTeamChallenge: challenge.isTeamChallenge || false,
            minTeamSize: challenge.minTeamSize || 2,
            maxTeamSize: challenge.maxTeamSize || 4,
            prizes: challenge.prizes || '',
            phases: (challenge.phases || []).map((p: any) => ({
                ...p,
                deadline: formatDateForInput(p.deadline)
            }))
        });
        setUsePhases(challenge.phases && challenge.phases.length > 0);
        setIsEditMode(true);
        setIsCreateOpen(true);
    };

    const activeChallenges = myChallenges.filter((c: any) => c.status !== 'completed'); // Simplify: active if not strictly completed
    const pastChallenges = myChallenges.filter((c: any) => c.status === 'completed');

    const renderChallengeList = (list: any[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((challenge: any) => (
                <Card key={challenge._id || challenge.id} className="relative overflow-hidden group">
                    {challenge.status === 'completed' && <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center pointer-events-none"><Badge variant="secondary">Completed</Badge></div>}
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <Badge variant={challenge.difficulty === 'hard' ? 'destructive' : 'secondary'}>
                                {challenge.difficulty ? (challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)) : 'Medium'}
                            </Badge>
                            <Badge variant="outline">{challenge.category}</Badge>
                        </div>
                        <CardTitle className="mt-2 line-clamp-1">{challenge.title}</CardTitle>
                        <CardDescription className="line-clamp-2 h-10">
                            {challenge.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {challenge.phases && challenge.phases.length > 0
                                    ? `${challenge.phases.length} Phases`
                                    : (challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : 'No Deadline')}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-primary">
                                <Zap className="h-4 w-4" /> {challenge.points} XP
                            </span>
                        </div>

                        {(challenge.prizes) && (
                            <div className="text-xs bg-yellow-500/10 text-yellow-600 p-2 rounded border border-yellow-500/20">
                                <strong>Prizes:</strong> {challenge.prizes}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                                {challenge.participants || 0} participants
                                <br />
                                {challenge.submissions?.length || 0} submissions
                            </div>
                            <div className="flex gap-2 relative z-20">
                                <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedChallenge(challenge);
                                    setIsGradingOpen(true);
                                }}>
                                    Grade
                                </Button>
                                {challenge.status !== 'completed' && (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(challenge)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-blue-500 hover:text-blue-700" title="Close Challenge" onClick={() => {
                                            if (confirm("Mark this challenge as Completed?")) closeChallengeMutation.mutate(challenge._id || challenge.id);
                                        }}>
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => {
                                    if (confirm("Delete this challenge?")) deleteMutation.mutate(challenge._id || challenge.id);
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        Club Challenges
                    </h3>
                    <p className="text-muted-foreground">Manage ongoing complications and grade submissions.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Create Challenge
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="active">Active Challenges ({activeChallenges.length})</TabsTrigger>
                    <TabsTrigger value="past">Past Challenges ({pastChallenges.length})</TabsTrigger>
                    <TabsTrigger value="suggested">Suggested ({suggestions.filter((s: any) => s.status === 'pending').length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="pt-4">
                    {activeChallenges.length === 0 ? <p className="text-muted-foreground text-center py-8">No active challenges.</p> : renderChallengeList(activeChallenges)}
                </TabsContent>
                <TabsContent value="past" className="pt-4">
                    {pastChallenges.length === 0 ? <p className="text-muted-foreground text-center py-8">No past challenges.</p> : renderChallengeList(pastChallenges)}
                </TabsContent>
                <TabsContent value="suggested" className="pt-4">
                    {suggestions.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/10 rounded-xl border border-dashed">
                            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">No challenge suggestions yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suggestions.map((suggestion: any) => (
                                <Card key={suggestion._id || suggestion.id} className={cn(
                                    "relative border-l-4",
                                    suggestion.status === 'approved' ? "border-l-green-500 bg-green-50/5" :
                                        suggestion.status === 'rejected' ? "border-l-red-500 bg-red-50/5" :
                                            "border-l-blue-500"
                                )}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline">{suggestion.difficulty}</Badge>
                                            <Badge variant={
                                                suggestion.status === 'approved' ? 'success' :
                                                    suggestion.status === 'rejected' ? 'destructive' :
                                                        'secondary'
                                            }>
                                                {suggestion.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-2">{suggestion.title}</CardTitle>
                                        <CardDescription>{suggestion.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Points: <b>{suggestion.points} XP</b></span>
                                            <span className="text-muted-foreground">By: <b>{suggestion.suggestedBy?.userName || 'Member'}</b></span>
                                        </div>
                                        {suggestion.status === 'pending' && (
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                    onClick={() => approveSuggestionMutation.mutate(suggestion._id || suggestion.id)}
                                                    disabled={approveSuggestionMutation.isPending}
                                                >
                                                    <ThumbsUp className="h-4 w-4 mr-2" /> Approve
                                                </Button>
                                                <Button
                                                    className="flex-1"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => rejectSuggestionMutation.mutate(suggestion._id || suggestion.id)}
                                                    disabled={rejectSuggestionMutation.isPending}
                                                >
                                                    <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Challenge Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Challenge' : 'Create New Challenge'}</DialogTitle>
                        <DialogDescription>{isEditMode ? 'Modify challenge details.' : 'Set up a new challenge for your club members.'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={newChallenge.title} onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={newChallenge.category} onValueChange={v => setNewChallenge({ ...newChallenge, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Hackathon">Hackathon</SelectItem>
                                        <SelectItem value="Coding">Coding</SelectItem>
                                        <SelectItem value="Design">Design</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={newChallenge.description} onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Points (XP)</Label>
                                <Input type="number" value={newChallenge.points} onChange={e => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Entry Fee (XP)</Label>
                                <Input type="number" value={newChallenge.entryFee} onChange={e => setNewChallenge({ ...newChallenge, entryFee: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select value={newChallenge.difficulty} onValueChange={v => setNewChallenge({ ...newChallenge, difficulty: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {!usePhases && (
                                <div className="space-y-2">
                                    <Label>Deadline</Label>
                                    <Input type="date" value={newChallenge.deadline} onChange={e => setNewChallenge({ ...newChallenge, deadline: e.target.value })} />
                                </div>
                            )}
                        </div>

                        {/* Team & Prizes Config */}
                        <div className="flex items-center gap-2 border-t pt-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={newChallenge.isTeamChallenge}
                                onChange={e => setNewChallenge({ ...newChallenge, isTeamChallenge: e.target.checked })}
                            />
                            <Label>Team Challenge?</Label>
                        </div>

                        {newChallenge.isTeamChallenge && (
                            <div className="grid grid-cols-2 gap-4 bg-secondary/10 p-2 rounded">
                                <div className="space-y-2">
                                    <Label>Min Members</Label>
                                    <Input type="number" min={1} value={newChallenge.minTeamSize} onChange={e => setNewChallenge({ ...newChallenge, minTeamSize: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Members</Label>
                                    <Input type="number" min={1} value={newChallenge.maxTeamSize} onChange={e => setNewChallenge({ ...newChallenge, maxTeamSize: parseInt(e.target.value) })} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Prizes (Markdown/Text)</Label>
                            <Textarea
                                placeholder="1st Place: T-Shirt..."
                                value={newChallenge.prizes}
                                onChange={e => setNewChallenge({ ...newChallenge, prizes: e.target.value })}
                            />
                        </div>

                        {/* Phase Toggle */}
                        <div className="flex items-center gap-2 border-t pt-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={usePhases}
                                onChange={e => {
                                    setUsePhases(e.target.checked);
                                    if (e.target.checked && (!newChallenge.phases || newChallenge.phases.length === 0)) {
                                        setNewChallenge({ ...newChallenge, phases: [{ name: 'Phase 1', deadline: '' }] });
                                    }
                                }}
                            />
                            <Label>Enable Multi-Phase Submission?</Label>
                        </div>

                        {usePhases && (
                            <div className="space-y-3 bg-secondary/10 p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Phases</Label>
                                    <Button variant="ghost" size="sm" onClick={handleAddPhase}><Plus className="h-3 w-3 mr-1" /> Add Phase</Button>
                                </div>
                                {newChallenge.phases?.map((phase, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="Phase Name"
                                            value={phase?.name || ''}
                                            onChange={e => handlePhaseChange(idx, 'name', e.target.value)}
                                            className="h-8"
                                        />
                                        <Input
                                            type="date"
                                            value={phase?.deadline || ''}
                                            onChange={e => handlePhaseChange(idx, 'deadline', e.target.value)}
                                            className="h-8 w-32"
                                        />
                                        {idx > 0 && (
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleRemovePhase(idx)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => isEditMode ? updateMutation.mutate(newChallenge) : createMutation.mutate(newChallenge)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin mr-2" /> : null}
                            {isEditMode ? 'Update Challenge' : 'Create Challenge'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grading Dialog */}
            <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Grade Submissions: {selectedChallenge?.title}</DialogTitle>
                        <DialogDescription>Review work and award marks/badges.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {submissions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
                        ) : (
                            submissions.map((sub: any) => {
                                const phaseName = selectedChallenge?.phases?.find((p: any) => p._id === sub.phaseId || p.id === sub.phaseId)?.name;

                                return (
                                    <div key={sub._id || sub.submissionId} className="border rounded-lg p-4 space-y-4 bg-secondary/5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold">{sub.userName}</p>
                                                <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                {phaseName && <Badge variant="outline" className="mt-1">{phaseName}</Badge>}
                                            </div>
                                            <Badge variant={sub.status === 'approved' ? 'success' : sub.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {sub.status || 'Pending'}
                                            </Badge>
                                        </div>

                                        <div className="bg-background p-2 rounded border text-sm">
                                            <span className="font-semibold text-xs text-muted-foreground uppercase">Submission Link:</span>
                                            <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline truncate mt-1">
                                                {sub.submissionLink}
                                            </a>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                            <div className="space-y-2">
                                                <Label>Marks (0-100)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    max={100}
                                                    onChange={e => setGradingData({ ...gradingData, marks: parseInt(e.target.value) })}
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Award: {Math.round(((gradingData.marks || 0) / 100) * (selectedChallenge?.points || 0))} XP
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Feedback</Label>
                                                <Input
                                                    placeholder="Great work..."
                                                    onChange={e => setGradingData({ ...gradingData, feedback: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Award Badge (Optional)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Badge Name"
                                                    value={gradingData.awardBadge.name}
                                                    onChange={e => setGradingData({ ...gradingData, awardBadge: { ...gradingData.awardBadge, name: e.target.value } })}
                                                />
                                                <Input
                                                    placeholder="Description"
                                                    value={gradingData.awardBadge.description}
                                                    onChange={e => setGradingData({ ...gradingData, awardBadge: { ...gradingData.awardBadge, description: e.target.value } })}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <Button size="sm" onClick={() => gradeMutation.mutate({
                                                challengeId: selectedChallenge._id || selectedChallenge.id,
                                                submissionId: sub._id || sub.submissionId
                                            })}>
                                                {gradeMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                Submit Grade
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
