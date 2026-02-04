import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Label } from '@/components/ui/label';
import {
    Shield,
    Calendar,
    Building2,
    CheckCircle2,
    Loader2,
    Activity,
    Users,
    Target,
    FolderKanban,
    Bell,
    Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UserDetailsDialogProps {
    user: any;
    open: boolean;
    onClose: () => void;
}

const ROLE_HIERARCHY: Record<string, number> = {
    'owner': 100,
    'admin': 10,
    'co_admin': 9,
    'club_coordinator': 8,
    'club_co_coordinator': 7,
    'club_head': 6,
    'core_member': 4,
    'student': 1
};

export function UserDetailsDialog({ user, open, onClose }: UserDetailsDialogProps) {
    const { user: currentUser, refreshUser } = useAuth();
    const [notification, setNotification] = useState('');
    const [selectedRole, setSelectedRole] = useState(user?.role || 'student');
    const [selectedClub, setSelectedClub] = useState('');
    const [activeView, setActiveView] = useState<'info' | 'points'>('info');

    // Sync state with user prop when it changes or dialog opens
    useEffect(() => {
        if (user && open) {
            setSelectedRole(user.role || 'student');
            setSelectedClub(''); // Reset club selection when switching users
        }
    }, [user, open]);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch full user profile for detailed info (clubs, activity etc)
    const { data: fullUser, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['user-profile', user?.id || user?._id],
        queryFn: () => api.getProfile(user?.id || user?._id, currentUser?.id || currentUser?._id),
        enabled: open && !!user
    });

    const displayUser = fullUser || user;

    // Fetch user's actual projects (more reliable than activity log)
    const { data: userProjects = [], isLoading: isLoadingProjects } = useQuery({
        queryKey: ['user-projects', displayUser?.id || displayUser?._id],
        queryFn: () => api.getProjects(undefined, undefined, displayUser?.id || displayUser?._id, currentUser?.id || currentUser?._id),
        enabled: !!displayUser
    });

    // Fetch clubs for context selection
    const { data: clubsList } = useQuery({
        queryKey: ['all-clubs', currentUser?.college],
        queryFn: () => api.getClubs(currentUser?.college, currentUser?.id),
        enabled: !!currentUser?.college
    });

    const blockMutation = useMutation({
        mutationFn: (blocked: boolean) => api.updateUserStatus(user?._id || user?.id, { website: blocked }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['college-students', user?.college] });
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
            toast({
                title: variables ? 'User Blocked' : 'User Unblocked',
                description: `${user?.name} has been ${variables ? 'blocked from' : 'unblocked on'} the platform`
            });
        }
    });

    const notificationMutation = useMutation({
        mutationFn: (content: string) => api.sendNotification({
            userId: user?._id || user?.id,
            content,
            type: 'admin_alert',
            title: 'Admin Notification'
        }),
        onSuccess: () => {
            setNotification('');
            toast({ title: 'Success', description: 'Notification sent to ' + user?.name });
        }
    });

    const roleMutation = useMutation({
        mutationFn: (data: { role: string, clubId?: string }) => api.updateUserRole(user?._id || user?.id, {
            ...data,
            requestingUserId: currentUser?.id || currentUser?._id
        }),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['college-students', user?.college] });
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
            toast({ title: 'Role Updated' });

            // Sync current user session if they updated themselves
            if (user?._id === currentUser?._id || user?.id === currentUser?.id) {
                await refreshUser();
            }
        }
    });

    if (!displayUser) return null;

    const createdDate = displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Unknown';
    const challenges = displayUser.activity?.filter((a: any) => a.type === 'challenge') || [];
    // Projects from direct query preferenced over activity
    const projects = userProjects.length > 0 ? userProjects.map((p: any) => ({
        title: p.title,
        status: p.status,
        refId: p._id || p.id
    })) : displayUser.activity?.filter((a: any) => a.type === 'project') || [];

    // Use populated joinedClubs if available, otherwise fallback to activity or IDs
    const userClubs = displayUser.joinedClubs || [];

    const myPower = ROLE_HIERARCHY[currentUser?.role || ''] || 0;
    const theirPower = ROLE_HIERARCHY[displayUser.role] || 0;
    const canModifyRole = currentUser?.role === 'owner' || myPower > theirPower;

    const handleSendNotification = () => {
        if (!notification.trim()) {
            toast({ title: 'Error', description: 'Please enter a notification message', variant: 'destructive' });
            return;
        }
        notificationMutation.mutate(notification);
    };

    const handleBlockUser = () => {
        blockMutation.mutate(true);
    };

    const handleUnblockUser = () => {
        blockMutation.mutate(false);
    };



    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                            {displayUser.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xl font-bold">{displayUser.name}</p>
                            <p className="text-sm text-muted-foreground font-normal">{displayUser.email}</p>
                        </div>
                        {isLoadingProfile && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
                    </DialogTitle>
                    <div className="flex gap-2 mr-8">
                        <Button
                            variant={activeView === 'info' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveView('info')}
                            className="h-8 font-bold text-[10px] uppercase tracking-wider"
                        >
                            Profile
                        </Button>
                        <Button
                            variant={activeView === 'points' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveView('points')}
                            className="h-8 font-bold text-[10px] uppercase tracking-wider"
                        >
                            History
                        </Button>
                    </div>
                </DialogHeader>

                {activeView === 'info' ? (
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Created</p>
                                        <p className="font-semibold">{createdDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">College</p>
                                        <p className="font-semibold">{displayUser.college || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Role</p>
                                            <Select
                                                value={selectedRole}
                                                onValueChange={(val) => setSelectedRole(val)}
                                                disabled={!canModifyRole || roleMutation.isPending}
                                            >
                                                <SelectTrigger className="h-8 w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[
                                                        { value: 'student', label: 'Student', power: 1 },
                                                        { value: 'core_member', label: 'Core Team', power: 4 },
                                                        { value: 'club_head', label: 'Secretary', power: 6 },
                                                        { value: 'club_coordinator', label: 'Coordinator', power: 8 },
                                                        { value: 'admin', label: 'Admin', power: 10 }
                                                    ]
                                                        .filter(opt => currentUser?.role === 'owner' || opt.power < myPower)
                                                        .map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Context Selection (Club) */}
                                    {(selectedRole === 'club_coordinator' || selectedRole === 'club_co_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member') && (
                                        <div className="pl-6 space-y-2 border-l-2 border-primary/20 ml-2 animate-in slide-in-from-left-2 duration-200">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Assign to Club</Label>
                                            <Select value={selectedClub} onValueChange={setSelectedClub}>
                                                <SelectTrigger className="h-8 w-full bg-secondary/50">
                                                    <SelectValue placeholder="Select Club..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clubsList?.map((club: any) => (
                                                        <SelectItem key={club.id || club._id} value={club.id || club._id}>
                                                            {club.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {selectedRole === 'admin' && (
                                        <p className="pl-6 text-[10px] font-bold text-primary/60 uppercase tracking-tight">
                                            Will be Admin in {user.college}
                                        </p>
                                    )}

                                    {(selectedRole !== user.role || (selectedClub && (selectedRole === 'club_coordinator' || selectedRole === 'club_co_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member'))) && (
                                        <Button
                                            size="sm"
                                            className="h-8 mt-2"
                                            onClick={() => roleMutation.mutate({ role: selectedRole, clubId: selectedClub })}
                                            disabled={
                                                roleMutation.isPending ||
                                                ((selectedRole === 'club_coordinator' || selectedRole === 'club_co_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member') && !selectedClub)
                                            }
                                        >
                                            {roleMutation.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                            {selectedRole === user.role ? 'Update Context' : 'Update Role'}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">XP Points</p>
                                        <p className="font-semibold">{displayUser.points || 0} XP (Level {displayUser.level || 0})</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Clubs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Clubs ({userClubs.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingProfile ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                ) : userClubs.length > 0 ? (
                                    <div className="space-y-2">
                                        {userClubs.map((club: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    {club.logo ? (
                                                        <img src={club.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                            {club.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-sm">{club.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{club.college}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
                                                    {displayUser.role === 'club_coordinator' && club.coordinatorId === displayUser.id ? 'Coordinator' : 'Member'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No clubs joined yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Challenges */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Challenges ({challenges.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {challenges.length > 0 ? (
                                    <div className="space-y-2">
                                        {challenges.map((challenge: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                        <Target className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <span className="font-bold text-sm">{challenge.title}</span>
                                                </div>
                                                <Badge variant={challenge.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase tracking-widest">
                                                    {challenge.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No challenges participated yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Projects */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FolderKanban className="h-5 w-5" />
                                    Projects ({projects.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingProjects ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                ) : projects.length > 0 ? (
                                    <div className="space-y-2">
                                        {projects.map((project: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                                                        <FolderKanban className="h-4 w-4 text-cyan-600" />
                                                    </div>
                                                    <span className="font-bold text-sm">{project.title}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-cyan-200 text-cyan-700 bg-cyan-50">
                                                    {project.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No projects participated yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Send Notification */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Send Notification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Textarea
                                    placeholder="Type your notification message here..."
                                    value={notification}
                                    onChange={(e) => setNotification(e.target.value)}
                                    rows={3}
                                />
                                <Button onClick={handleSendNotification} className="w-full" disabled={notificationMutation.isPending}>
                                    {notificationMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                                    Send Notification
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">User Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-3">
                                {user.blocked?.website ? (
                                    <Button variant="outline" onClick={handleUnblockUser} className="flex-1" disabled={blockMutation.isPending}>
                                        {blockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Unblock User
                                    </Button>
                                ) : (
                                    <Button variant="destructive" onClick={handleBlockUser} className="flex-1" disabled={blockMutation.isPending}>
                                        {blockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                                        Block User
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* Points Management & History View */
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-primary/5 border-primary/10">
                                <CardContent className="pt-6">
                                    <p className="text-xs font-black uppercase tracking-widest text-primary/60">Total XP</p>
                                    <p className="text-4xl font-black text-primary mt-1">{displayUser.points || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-50/50 border-orange-100">
                                <CardContent className="pt-6">
                                    <p className="text-xs font-black uppercase tracking-widest text-orange-600/60">Level Progress</p>
                                    <p className="text-4xl font-black text-orange-600 mt-1">Lvl {displayUser.level || 1}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-none ring-1 ring-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Point Distribution</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {(!displayUser.pointsHistory || displayUser.pointsHistory.length === 0) ? (
                                        <div className="p-12 text-center text-slate-400 italic">
                                            No point history available yet.
                                        </div>
                                    ) : (
                                        [...displayUser.pointsHistory].reverse().map((item: any, idx) => (
                                            <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                        item.amount > 0 ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"
                                                    )}>
                                                        {item.amount > 0 ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{item.reason}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter">
                                                                {item.sourceType}
                                                            </Badge>
                                                            <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "text-sm font-black",
                                                    item.amount > 0 ? "text-green-600" : "text-rose-600"
                                                )}>
                                                    {item.amount > 0 ? '+' : ''}{item.amount} XP
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
