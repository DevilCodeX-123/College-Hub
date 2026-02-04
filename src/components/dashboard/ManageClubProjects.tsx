import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from '@tanstack/react-query';
import {
    FolderKanban,
    Users,
    Clock,
    CheckCircle2,
    Calendar,
    Target,
    ArrowRight,
    UserCircle,
    Bell,
    Send,
    Loader2,
    Check,
    Ban,
    FileText,
    Pause,
    Play,
    Trash2,
    Trophy
} from 'lucide-react';


interface ManageClubProjectsProps {
    clubId: string;
    allUsers: any[];
}

export function ManageClubProjects({ clubId, allUsers }: ManageClubProjectsProps) {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [notifyTitle, setNotifyTitle] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");

    // Awarding State
    const [isAwardOpen, setIsAwardOpen] = useState(false);
    const [selectedAwardProject, setSelectedAwardProject] = useState<any>(null);
    const [selectedMemberForAward] = useState("all");
    const [awardData, setAwardData] = useState({ badgeName: "", badgeDesc: "For outstanding contribution" });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['club-projects', clubId, currentUser?.id],
        queryFn: () => api.getProjects(undefined, clubId, undefined, currentUser?.id)
    });

    const approveMutation = useMutation({
        mutationFn: (projectId: string) => api.approveProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-projects', clubId] });
            toast({ title: "Project Approved", description: "The project has been approved and moved to running projects." });
        },
        onError: (err: any) => {
            toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (projectId: string) => api.rejectProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-projects', clubId] });
            toast({ title: "Project Rejected", description: "The proposal has been rejected." });
        },
        onError: (err: any) => {
            toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
        }
    });

    const notifyMutation = useMutation({
        mutationFn: (data: { projectId: string, title: string, message: string }) =>
            api.notifyProjectTeam(data.projectId, {
                title: data.title,
                message: data.message,
                senderId: currentUser?.id || '',
                type: 'info'
            }),
        onSuccess: () => {
            toast({
                title: "Notifications Sent",
                description: `Team members of "${selectedProject?.title}" have been notified.`,
                variant: "default"
            });
            setIsNotifyOpen(false);
            setNotifyTitle("");
            setNotifyMessage("");
            setSelectedProject(null);
        },
        onError: (err: any) => {
            toast({
                title: "Failed to send",
                description: err.message || "An error occurred while sending notifications.",
                variant: "destructive"
            });
        }
    });

    const onHoldMutation = useMutation({
        mutationFn: (projectId: string) => api.onHoldProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-projects', clubId] });
            toast({ title: "Project Paused", description: "The project has been put on hold." });
        },
        onError: (err: any) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: (projectId: string) => api.resumeProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-projects', clubId] });
            toast({ title: "Project Resumed", description: "The project is now active again." });
        },
        onError: (err: any) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (projectId: string) => api.deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-projects', clubId] });
            toast({ title: "Project Deleted", description: "The project has been permanently removed." });
        },
        onError: (err: any) => {
            toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
        }
    });

    const awardBadgeMutation = useMutation({
        mutationFn: async () => {
            const badge = {
                name: awardData.badgeName,
                description: awardData.badgeDesc,
                icon: 'award'
            };

            if (selectedMemberForAward === 'all') {
                const userIds = selectedAwardProject?.team?.map((m: any) =>
                    typeof m === 'string' ? m : (m.id || m._id)
                ) || [];
                return api.awardBadgeBatch(userIds, badge);
            } else {
                return api.awardUserBadge(selectedMemberForAward, badge);
            }
        },
        onSuccess: () => {
            toast({
                title: "Badge Awarded!",
                description: selectedMemberForAward === 'all'
                    ? "Team-wide honors dispersed."
                    : "User profile has been updated."
            });
            setAwardData({ ...awardData, badgeName: "" });
            setIsAwardOpen(false);
        },
        onError: (err: any) => {
            toast({ title: "Award Failed", description: err.message, variant: "destructive" });
        }
    });



    const getMemberDetails = (memberOrId: any) => {
        if (!memberOrId) return null;
        if (typeof memberOrId === 'object' && (memberOrId.name || memberOrId.avatar)) return memberOrId;
        const id = typeof memberOrId === 'object' ? (memberOrId.id || memberOrId._id) : memberOrId;
        return allUsers.find(u => u.id === id || u._id === id) || (typeof memberOrId === 'object' ? memberOrId : null);
    };

    const handleOpenNotify = (project: any) => {
        setSelectedProject(project);
        setNotifyTitle(`Update: ${project.title}`);
        setIsNotifyOpen(true);
    };

    const handleOpenDetails = (project: any) => {
        setSelectedProject(project);
        setIsDetailsOpen(true);
    };

    const handleSendNotify = () => {
        if (!notifyMessage.trim()) {
            toast({
                title: "Empty Message",
                description: "Please enter a message for the team.",
                variant: "destructive"
            });
            return;
        }
        notifyMutation.mutate({
            projectId: selectedProject?.id || selectedProject?._id,
            title: notifyTitle,
            message: notifyMessage
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            Loading projects...
        </div>;
    }

    const activeProjects = projects.filter((p: any) => ['approved', 'in_progress', 'completed', 'on_hold'].includes(p.status));
    const requestProjects = projects.filter((p: any) => ['pending', 'rejected'].includes(p.status));

    const ProjectCard = ({ project, isRequest = false }: { project: any, isRequest?: boolean }) => (
        <Card key={project.id || project._id} className={`overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 ${project.status === 'on_hold' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
            <CardHeader className="pb-3 bg-secondary/10">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={
                        project.status === 'completed' ? 'default' :
                            project.status === 'in_progress' ? 'secondary' :
                                project.status === 'on_hold' ? 'outline' :
                                    project.status === 'rejected' ? 'destructive' : 'outline'
                    } className={project.status === 'on_hold' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}>
                        {project.status === 'on_hold' ? 'Paused' : project.status?.replace('_', ' ') || 'unknown'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.type || 'General'}
                    </span>
                </div>
                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                    {project.description || project.problemStatement}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-4 space-y-4">
                {!['pending', 'rejected'].includes(project.status) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Leader</p>
                    <div className="flex items-center gap-2">
                        {(() => {
                            const leader = getMemberDetails(project.requestedBy);
                            return (
                                <>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={leader?.avatar} />
                                        <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium truncate max-w-[150px]">
                                        {leader?.name || 'Unknown User'}
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team ({project.team?.length || 0})</p>
                        <p className="text-[10px] text-muted-foreground">Max {project.memberLimit || 4}</p>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden py-1">
                        {project.team?.slice(0, 5).map((memberData: any) => {
                            const member = getMemberDetails(memberData);
                            const memberId = member?._id || member?.id || (typeof memberData === 'string' ? memberData : Math.random().toString());
                            return (
                                <Avatar key={memberId} className="h-7 w-7 border-2 border-background ring-0">
                                    <AvatarImage src={member?.avatar} title={member?.name} />
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                        {member?.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })}
                        {(project.team?.length || 0) > 5 && (
                            <div className="h-7 w-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                +{(project.team?.length || 0) - 5}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
                    {project.deadline && (
                        <div className="flex items-center gap-1 text-primary">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.deadline).toLocaleDateString()}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {project.idea ? 'Has Concept' : 'Proposal'}
                    </div>
                </div>
            </CardContent>

            <div className="p-3 bg-secondary/5 border-t mt-auto space-y-2">
                {isRequest && project.status === 'pending' ? (
                    <>
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                className="flex-1 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold"
                                size="sm"
                                onClick={() => approveMutation.mutate(project._id || project.id)}
                                disabled={approveMutation.isPending}
                            >
                                <Check className="h-3 w-3" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 h-8 text-xs gap-1.5 font-bold"
                                size="sm"
                                onClick={() => rejectMutation.mutate(project._id || project.id)}
                                disabled={rejectMutation.isPending}
                            >
                                <Ban className="h-3 w-3" />
                                Reject
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                            size="sm"
                            onClick={() => handleOpenDetails(project)}
                        >
                            <FileText className="h-3 w-3 mr-1.5" />
                            View Full Proposal Details
                        </Button>
                    </>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-8 text-[10px] gap-1 px-1"
                                size="sm"
                                onClick={() => handleOpenNotify(project)}
                                disabled={project.status === 'rejected'}
                            >
                                <Bell className="h-3 w-3" />
                                Notify
                            </Button>

                            {project.status === 'on_hold' ? (
                                <Button
                                    variant="outline"
                                    className="flex-1 h-8 text-[10px] gap-1 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200"
                                    size="sm"
                                    onClick={() => resumeMutation.mutate(project._id || project.id)}
                                    disabled={resumeMutation.isPending}
                                >
                                    <Play className="h-3 w-3" />
                                    Resume
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="flex-1 h-8 text-[10px] gap-1 px-1 bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200"
                                    size="sm"
                                    onClick={() => onHoldMutation.mutate(project._id || project.id)}
                                    disabled={onHoldMutation.isPending || project.status === 'completed'}
                                >
                                    <Pause className="h-3 w-3" />
                                    Pause
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                className="flex-1 h-8 text-[10px] gap-1 px-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                                size="sm"
                                onClick={() => {
                                    if (confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
                                        deleteMutation.mutate(project._id || project.id);
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-xs justify-between group px-2 font-bold"
                            size="sm"
                            onClick={() => handleOpenDetails(project)}
                        >
                            View Details
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <Tabs defaultValue="running" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl p-1 bg-slate-900/5 backdrop-blur-sm border shadow-sm h-12">
                    <TabsTrigger value="running" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300">
                        Approved & Running
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300">
                        Requests & Rejected
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="running" className="mt-6">
                    {activeProjects.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FolderKanban className="h-10 w-10 opacity-20 mb-3" />
                                <p>No active or completed projects currently.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map(p => <ProjectCard key={p._id || p.id} project={p} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    {requestProjects.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileText className="h-10 w-10 opacity-20 mb-3" />
                                <p>No pending project requests or rejections.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requestProjects.map(p => <ProjectCard key={p._id || p.id} project={p} isRequest={true} />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Notification Dialog */}
            <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Notify Project Team
                        </DialogTitle>
                        <DialogDescription>
                            Send a direct notification to everyone in <strong>{selectedProject?.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Notification Title</Label>
                            <Input
                                id="title"
                                placeholder="Meeting at 2 PM / Deadline Reminder"
                                value={notifyTitle}
                                onChange={(e) => setNotifyTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter your message here..."
                                className="min-h-[100px]"
                                value={notifyMessage}
                                onChange={(e) => setNotifyMessage(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNotifyOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSendNotify}
                            disabled={notifyMutation.isPending || !notifyMessage.trim()}
                            className="gap-2"
                        >
                            {notifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send Notification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline">{selectedProject?.type || 'General Project'}</Badge>
                            <Badge variant={selectedProject?.status === 'completed' ? 'default' : 'secondary'}>
                                {selectedProject?.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FolderKanban className="h-6 w-6 text-primary" />
                            {selectedProject?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Complete details and team collaboration info.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 p-3 rounded-lg bg-secondary/10 border">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</p>
                                <div className="flex items-center gap-2">
                                    <Progress value={selectedProject?.progress} className="h-2 flex-1" />
                                    <span className="text-sm font-bold">{selectedProject?.progress}%</span>
                                </div>
                            </div>
                            <div className="space-y-1 p-3 rounded-lg bg-secondary/10 border">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deadline</p>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {selectedProject?.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'No deadline'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-primary">
                                <Clock className="h-4 w-4" />
                                Project Description
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/5 p-3 rounded-lg border border-dashed text-justify">
                                {selectedProject?.description || selectedProject?.problemStatement || "No description provided."}
                            </p>
                        </div>

                        {selectedProject?.problemStatement && selectedProject?.description && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-destructive/80">
                                    <Target className="h-4 w-4" />
                                    Problem Statement
                                </h4>
                                <div className="text-sm text-muted-foreground bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                                    {selectedProject.problemStatement}
                                </div>
                            </div>
                        )}

                        {selectedProject?.idea && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Proposed Idea
                                </h4>
                                <div className="text-sm text-muted-foreground bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    {selectedProject.idea}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Team Members ({selectedProject?.team?.length || 0})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedProject?.team?.map((memberData: any) => {
                                    const member = getMemberDetails(memberData);
                                    const memberId = member?._id || member?.id;
                                    const isLeader = (selectedProject.requestedBy?._id || selectedProject.requestedBy) === memberId;
                                    return (
                                        <div key={memberId || Math.random().toString()} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/10 transition-colors border group">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                <AvatarImage src={member?.avatar} />
                                                <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                                    {member?.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className="text-sm font-bold truncate">
                                                        {member?.name || 'Unknown'}
                                                    </span>
                                                    {isLeader && <Badge variant="default" className="scale-[0.7] h-5 origin-left">Leader</Badge>}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground truncate uppercase font-medium">
                                                    {member?.role?.replace('_', ' ') || 'Member'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 sm:justify-between border-t pt-4">
                        <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>
                            Close
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {selectedProject?.status === 'pending' ? (
                                <>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 sm:flex-none"
                                        onClick={() => {
                                            rejectMutation.mutate(selectedProject._id || selectedProject.id);
                                            setIsDetailsOpen(false);
                                        }}
                                        disabled={rejectMutation.isPending}
                                    >
                                        <Ban className="h-4 w-4 mr-2" /> Reject
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 font-bold"
                                        onClick={() => {
                                            approveMutation.mutate(selectedProject._id || selectedProject.id);
                                            setIsDetailsOpen(false);
                                        }}
                                        disabled={approveMutation.isPending}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Approve Project
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-1.5 items-center">
                                        {selectedProject?.status === 'on_hold' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 h-8 text-xs px-2"
                                                onClick={() => {
                                                    resumeMutation.mutate(selectedProject._id || selectedProject.id);
                                                    setIsDetailsOpen(false);
                                                }}
                                                disabled={resumeMutation.isPending}
                                            >
                                                <Play className="h-3.5 w-3.5 mr-1" /> Resume
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200 h-8 text-xs px-2"
                                                onClick={() => {
                                                    onHoldMutation.mutate(selectedProject._id || selectedProject.id);
                                                    setIsDetailsOpen(false);
                                                }}
                                                disabled={onHoldMutation.isPending || selectedProject?.status === 'completed' || selectedProject?.status === 'rejected'}
                                            >
                                                <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                                            </Button>
                                        )}

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 text-xs px-2"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
                                                    deleteMutation.mutate(selectedProject._id || selectedProject.id);
                                                    setIsDetailsOpen(false);
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="gap-1 h-8 text-xs px-2"
                                            onClick={() => {
                                                setIsDetailsOpen(false);
                                                handleOpenNotify(selectedProject);
                                            }}
                                            disabled={selectedProject?.status === 'rejected'}
                                        >
                                            <Bell className="h-3.5 w-3.5" /> Notify Team
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 border h-8 text-xs px-2"
                                            onClick={() => {
                                                setIsDetailsOpen(false);
                                                setIsAwardOpen(true);
                                                setSelectedAwardProject(selectedProject);
                                            }}
                                            disabled={!['completed', 'approved', 'in_progress'].includes(selectedProject?.status)}
                                        >
                                            <Trophy className="h-3.5 w-3.5" /> Award Recognition
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Award Recognition Dialog */}
            <Dialog open={isAwardOpen} onOpenChange={setIsAwardOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-purple-600" />
                            Award Recognition
                        </DialogTitle>
                        <DialogDescription>
                            Award a badge to the **entire team** of <strong>{selectedAwardProject?.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>



                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Badge Name</Label>
                            <Input
                                placeholder="e.g. Top Performer, Bug Basher"
                                value={awardData.badgeName}
                                onChange={e => setAwardData({ ...awardData, badgeName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Reason for awarding..."
                                value={awardData.badgeDesc}
                                onChange={e => setAwardData({ ...awardData, badgeDesc: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={() => awardBadgeMutation.mutate()}
                            className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-bold uppercase tracking-widest mt-2"
                            disabled={!selectedMemberForAward || !awardData.badgeName || awardBadgeMutation.isPending}
                        >
                            {awardBadgeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                            {selectedMemberForAward === 'all' ? 'Award Entire Team' : 'Award Badge'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

