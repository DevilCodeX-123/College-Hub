import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Loader2,
    CheckCircle,
    XCircle,
    Users,
    Globe,
    Mail,
    Trash2,
    Zap,
    ExternalLink,
    Calendar,
    Trophy,
    Eye,
    Shield,
    Clock,
    Lock,
    ChevronRight,
    Search,
    Filter,
    AlertCircle,
    Check
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ManageClubTasks({ clubId, clubName, readOnly = false }: { clubId?: string, clubName?: string, readOnly?: boolean }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        pointsReward: 50,
        targetType: 'club',
        targetEmails: '',
        category: 'daily'
    });

    // Fetch Active Tasks
    const { data: activeTasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['club-tasks', clubId || 'global', 'active'],
        queryFn: () => api.getTasks(clubId ? { joinedClubs: clubId, status: 'active' } : { status: 'active' })
    });

    // Fetch History Tasks
    const { data: historyTasks = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['club-tasks', clubId || 'global', 'history'],
        queryFn: () => api.getTasks(clubId ? { joinedClubs: clubId, status: 'inactive' } : { status: 'inactive' })
    });

    // Fetch Submissions
    const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
        queryKey: ['club-task-submissions', clubId || 'global'],
        queryFn: () => api.getTaskSubmissions(clubId ? { clubId } : {})
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createTask({
            ...data,
            clubId,
            clubName: clubName || (user as any)?.joinedClubsNames?.[0] || 'Club',
            createdBy: user?.id,
            targetEmails: data.targetEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: "Task Created!", description: "Club received +20 points for adding a task." });
            setIsCreateOpen(false);
            setNewTask({ title: '', description: '', pointsReward: 50, targetType: 'club', targetEmails: '', category: 'daily' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-tasks'] });
            toast({ title: "Task Closed", description: "Task moved to repository." });
        }
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, reviewData }: { id: string, reviewData: any }) => api.reviewTaskSubmission(id, reviewData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['club-task-submissions', clubId] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            if (data.status === 'approved') {
                toast({ title: "Approved!", description: "Member got XP and Club received +5 points." });
            } else {
                toast({ title: "Submission Rejected" });
            }
        }
    });

    if (isLoadingTasks || isLoadingSubmissions || isLoadingHistory) {
        return <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Synchronizing task data...</p>
        </div>;
    }

    // Process all tasks into a single list
    const safeActiveTasks = Array.isArray(activeTasks) ? activeTasks : [];
    const safeHistoryTasks = Array.isArray(historyTasks) ? historyTasks : [];

    const allTasks = [...safeActiveTasks, ...safeHistoryTasks]
        .sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        })
        .filter((t: any) =>
            (t.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (t.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-500 ${readOnly ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${readOnly ? 'bg-slate-200' : 'bg-primary/20'}`}>
                                {readOnly ? <Shield className="h-6 w-6 text-slate-600" /> : <Zap className="h-6 w-6 text-primary fill-primary/20" />}
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Task Hub</h3>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {readOnly
                                ? "Complete audit trail of all club activities and submissions."
                                : `Activity dashboard for ${clubName || 'your club'}. Manage lifecycle and verify integrity.`}
                        </p>
                    </div>

                    {!readOnly && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-12 px-6 rounded-2xl gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                                    <Plus className="h-5 w-5" /> Launch Activity
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px] rounded-[2rem] border-2 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent italic">PUBLISH TASK</DialogTitle>
                                    <DialogDescription className="font-medium text-muted-foreground/80">Create engaging tasks to activate your community and grow club presence.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold ml-1">Title of Activity</Label>
                                        <Input
                                            placeholder="e.g., Tech Workshop Promotion"
                                            value={newTask.title}
                                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                            className="h-12 rounded-xl border-2 focus:ring-0 focus:border-primary transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold ml-1">Instructions / Goal</Label>
                                        <Textarea
                                            placeholder="What exactly do members need to do?"
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                            className="min-h-[120px] rounded-xl border-2 focus:ring-0 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold ml-1">Student Reward (XP)</Label>
                                            <div className="relative">
                                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
                                                <Input
                                                    type="number"
                                                    value={newTask.pointsReward}
                                                    onChange={e => setNewTask({ ...newTask, pointsReward: parseInt(e.target.value) })}
                                                    className="pl-11 h-12 rounded-xl border-2"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold ml-1">Scope</Label>
                                            <Select
                                                value={newTask.targetType}
                                                onValueChange={v => setNewTask({ ...newTask, targetType: v })}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl border-2 font-semibold"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl border-2">
                                                    <SelectItem value="club">Club Members</SelectItem>
                                                    <SelectItem value="all">Entire College</SelectItem>
                                                    <SelectItem value="specific">Invitational</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {newTask.targetType === 'specific' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <Label className="text-sm font-bold ml-1">Target Emails (comma separated)</Label>
                                            <Input
                                                placeholder="user1@email.com, user2@email.com"
                                                value={newTask.targetEmails}
                                                onChange={e => setNewTask({ ...newTask, targetEmails: e.target.value })}
                                                className="h-12 rounded-xl border-2"
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 rounded-b-[2rem]">
                                    <div className="flex w-full items-center justify-between">
                                        <Badge variant="outline" className="h-8 px-4 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase tracking-wider text-[10px]">
                                            Earns +20 Club Pts
                                        </Badge>
                                        <Button
                                            onClick={() => createMutation.mutate(newTask)}
                                            disabled={!newTask.title || createMutation.isPending}
                                            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Task"}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="mt-8 relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks by title or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 pl-12 rounded-2xl bg-background border-2 border-primary/10 focus:border-primary transition-all font-medium"
                    />
                </div>
            </div>

            {/* Tasks List */}
            <div className="grid gap-4">
                {allTasks.length === 0 ? (
                    <div className="py-24 text-center space-y-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">No tasks matching filters</h4>
                            <p className="text-muted-foreground font-medium">Broaden your search or launch a new activity.</p>
                        </div>
                    </div>
                ) : allTasks.map((t: any) => {
                    const taskSubmissions = submissions.filter((s: any) => s.taskId === (t._id || t.id));
                    const pendingCount = taskSubmissions.filter((s: any) => s.status === 'pending').length;
                    const approvedCount = taskSubmissions.filter((s: any) => s.status === 'approved').length;
                    const rejectedCount = taskSubmissions.filter((s: any) => s.status === 'rejected').length;
                    const isLive = t.status === 'active';

                    return (
                        <Dialog key={t._id} onOpenChange={(open) => { if (open) setSelectedTaskDetails(t); }}>
                            <DialogTrigger asChild>
                                <Card className="group cursor-pointer rounded-[1.75rem] border-2 hover:border-primary transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            {/* Left Info */}
                                            <div className="p-6 flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={isLive ? "default" : "secondary"} className={`h-6 px-3 rounded-full font-black text-[9px] uppercase tracking-widest ${isLive ? 'bg-primary' : 'bg-slate-200 text-slate-600'}`}>
                                                        {isLive ? <Zap className="h-3 w-3 mr-1 animate-pulse" /> : <Lock className="h-3 w-3 mr-1" />}
                                                        {isLive ? "Live Now" : "Task Closed"}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" /> {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-black group-hover:text-primary transition-colors">{t.title}</h4>
                                                    <p className="text-sm text-muted-foreground font-medium line-clamp-1">{t.description}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <div className="h-8 px-4 rounded-xl bg-muted/60 flex items-center gap-2 text-[11px] font-bold">
                                                        <Trophy className="h-3.5 w-3.5 text-yellow-500" /> {t.pointsReward} XP for Students
                                                    </div>
                                                    <div className="h-8 px-4 rounded-xl bg-muted/60 flex items-center gap-2 text-[11px] font-bold">
                                                        {t.targetType === 'all' ? <Globe className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                                                        {t.targetType} Scope
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Metrics */}
                                            <div className="md:w-[320px] bg-muted/30 md:border-l flex p-6 items-center gap-4">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <div className="bg-background rounded-2xl p-3 border flex flex-col items-center justify-center space-y-0.5">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Submits</span>
                                                        <span className="text-lg font-black">{taskSubmissions.length}</span>
                                                    </div>
                                                    <div className="bg-background rounded-2xl p-3 border flex flex-col items-center justify-center space-y-0.5">
                                                        <span className="text-[10px] font-black uppercase text-emerald-600">Accepted</span>
                                                        <span className="text-lg font-black text-emerald-700">{approvedCount}</span>
                                                    </div>
                                                </div>
                                                {pendingCount > 0 && !readOnly ? (
                                                    <div className="h-14 w-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-pulse relative">
                                                        <AlertCircle className="h-7 w-7" />
                                                        <span className="absolute -top-1 -right-1 h-6 min-w-[24px] px-1.5 rounded-full bg-white text-orange-600 border-2 border-orange-500 flex items-center justify-center text-[10px] font-black">
                                                            {pendingCount}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                        <ChevronRight className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>

                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-2 shadow-2xl p-0 overflow-hidden">
                                <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-8 flex items-end justify-between border-b">
                                    <div className="space-y-1">
                                        <Badge className="bg-white text-primary border-primary/20 mb-2 font-bold">{t.category}</Badge>
                                        <h2 className="text-3xl font-black tracking-tight">{t.title}</h2>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-primary">+{20 + (approvedCount * 5)}</div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Points Earned by Club</p>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="grid md:grid-cols-3 gap-8">
                                        {/* Main Content */}
                                        <div className="md:col-span-2 space-y-8">
                                            <div className="space-y-4">
                                                <h5 className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-muted-foreground">
                                                    <Eye className="h-4 w-4" /> Activity Description
                                                </h5>
                                                <p className="text-lg font-medium leading-relaxed bg-muted/30 p-6 rounded-3xl border-2 border-dashed">
                                                    {t.description || "No specific instructions provided."}
                                                </p>
                                            </div>

                                            {/* Pending Reviews Section */}
                                            {isLive && !readOnly && (
                                                <div className="space-y-4">
                                                    <h5 className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-orange-600">
                                                        <Clock className="h-4 w-4" /> Pending Approval ({pendingCount})
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {pendingCount === 0 ? (
                                                            <div className="p-8 text-center bg-emerald-50 rounded-3xl border-2 border-emerald-100/50">
                                                                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                                                                <p className="font-bold text-emerald-800">All caught up!</p>
                                                            </div>
                                                        ) : taskSubmissions.filter((s: any) => s.status === 'pending').map((s: any) => (
                                                            <div key={s._id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-orange-50 border-2 border-orange-100 rounded-2xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-xl bg-orange-200 flex items-center justify-center font-black text-orange-700">
                                                                        {s.userName?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold">{s.userName}</p>
                                                                        <a href={s.submissionLink} target="_blank" rel="noreferrer" className="text-primary text-[11px] font-black flex items-center gap-1 hover:underline">
                                                                            View Proof <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 w-full md:w-auto">
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 md:flex-none h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                                                                        onClick={() => reviewMutation.mutate({
                                                                            id: s._id,
                                                                            reviewData: { status: 'approved', pointsAwarded: t.pointsReward, reviewedBy: user?.name }
                                                                        })}
                                                                        disabled={reviewMutation.isPending}
                                                                    >
                                                                        <Check className="h-4 w-4 mr-2" /> Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="flex-1 md:flex-none h-10 px-6 rounded-xl border-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold"
                                                                        onClick={() => reviewMutation.mutate({
                                                                            id: s._id,
                                                                            reviewData: { status: 'rejected', reviewedBy: user?.name }
                                                                        })}
                                                                        disabled={reviewMutation.isPending}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" /> Reject
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Completed Log */}
                                            <div className="space-y-4">
                                                <h5 className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-emerald-600">
                                                    <CheckCircle className="h-4 w-4" /> Activity Log ({approvedCount + rejectedCount})
                                                </h5>
                                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {taskSubmissions.filter((s: any) => s.status !== 'pending').length === 0 ? (
                                                        <p className="text-center py-12 text-muted-foreground font-medium italic">No participation history recorded yet.</p>
                                                    ) : taskSubmissions.filter((s: any) => s.status !== 'pending').map((s: any) => (
                                                        <div key={s._id} className="flex items-center justify-between p-4 px-6 bg-background rounded-2xl border-2 hover:border-primary/20 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black ${s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {s.userName?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold leading-none">{s.userName}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">{new Date(s.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="text-right">
                                                                    <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 ${s.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                                        {s.status}
                                                                    </Badge>
                                                                    {s.reviewedBy && (
                                                                        <div className="text-[9px] font-black text-muted-foreground/60 mt-0.5">By {s.reviewedBy}</div>
                                                                    )}
                                                                </div>
                                                                <a href={s.submissionLink} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sidebar */}
                                        <div className="space-y-8">
                                            <div className="bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/20 space-y-6">
                                                <h6 className="font-black text-xs uppercase tracking-widest text-primary">Task Snapshot</h6>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground font-bold italic">Integrity Index</span>
                                                        <span className="font-black text-primary">{taskSubmissions.length > 0 ? Math.round((approvedCount / taskSubmissions.length) * 100) : 0}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden border">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000"
                                                            style={{ width: `${taskSubmissions.length > 0 ? (approvedCount / taskSubmissions.length) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground">Student Earns</span>
                                                        <span className="text-lg font-black">{t.pointsReward} XP</span>
                                                    </div>
                                                    <div className="flex flex-col border-l pl-4">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground">Participation</span>
                                                        <span className="text-lg font-black">{taskSubmissions.length} Users</span>
                                                    </div>
                                                </div>

                                                {!readOnly && isLive && (
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full h-12 rounded-2xl gap-2 font-black uppercase tracking-widest shadow-xl shadow-rose-200"
                                                        onClick={() => {
                                                            if (confirm('Permanently close this task? Submissions will still be archived.')) {
                                                                deleteMutation.mutate(t._id);
                                                            }
                                                        }}
                                                    >
                                                        <Lock className="h-4 w-4" /> End Activity
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-4 px-2">
                                                <h6 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Task Metadata</h6>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Calendar className="h-4 w-4" /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Deployed</p>
                                                            <p className="font-bold">{new Date(t.createdAt).toDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Shield className="h-4 w-4" /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Security Level</p>
                                                            <p className="font-bold">Verified Audit Log</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })}
            </div>
        </div>
    );
}
