import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    Users,
    Settings,
    BarChart2,
    Calendar,
    Loader2,
    Shield,
    Save,
    Plus,
    Trash2,
    Check,
    Megaphone,
    UserPlus,
    Building2,
    Crown,
    Trophy,
    History,
    Vote,
    UserCog,
    ClipboardList,
    Swords,
    Zap,
    FolderKanban,
    X,
    Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ManageClubTeamDialog } from '@/components/owner/ManageClubTeamDialog';
import { ManageClubProjects } from '@/components/dashboard/ManageClubProjects';
import { ManageClubTasks } from '@/components/dashboard/ManageClubTasks';
import { ManageClubChallenges } from '@/components/dashboard/ManageClubChallenges';
import { ClubEventsManager } from '@/components/club/ClubEventsManager';
import { AssignWorkDialog } from '@/components/club/AssignWorkDialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

interface ClubCoordinatorViewProps {
    clubId: string;
    collegeName: string;
    isImpersonating?: boolean;
}

export function ClubCoordinatorView({ clubId, collegeName, isImpersonating = false }: ClubCoordinatorViewProps) {
    const { user } = useAuth();
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
    const [isPromotionOnly, setIsPromotionOnly] = useState(false);
    const [isAssignWorkOpen, setIsAssignWorkOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [dialogTab, setDialogTab] = useState('secretary');
    const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);

    // Fetch Club details
    const { data: club, isLoading } = useQuery({
        queryKey: ['club-management', clubId],
        queryFn: () => api.getClub(clubId, user?.id),
        enabled: !!clubId
    });

    // Fetch data for members/team management
    const { data: allUsers = [] } = useQuery<any[]>({
        queryKey: ['users'],
        queryFn: () => api.getUsers(),
    });

    const clubMembers = allUsers.filter((u: any) => u.joinedClubs?.includes(clubId));

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Club Not Found</h2>
                <p className="text-muted-foreground">The requested club could not be loaded.</p>
            </div>
        );
    }

    const isFullCoordinator = isImpersonating || ['owner', 'admin', 'co_admin', 'club_coordinator', 'club_co_coordinator'].includes(user?.role || '');
    const isSecretary = user?.role === 'club_head';
    const getDisplayTitle = () => {
        if (!club) return 'Club Management';
        if (isImpersonating) return `Managing: ${club.name}`;
        if (user?.role === 'club_head') return 'Club Secretary Panel';
        return 'Club Coordinator Panel';
    };


    if (isLoading || !club) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl min-h-[160px] flex items-center">
                {club.banner && (
                    <div className="absolute inset-0 z-0">
                        <img src={club.banner} className="w-full h-full object-cover opacity-40" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
                    </div>
                )}
                {!club.banner && (
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/20 to-transparent z-0" />
                )}

                <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                    <div className="flex items-center gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-xl border border-white/20 overflow-hidden">
                            {club.logo ? (
                                <img src={club.logo} className="h-full w-full object-cover" alt={club.name} />
                            ) : (
                                <Building2 className="h-10 w-10 text-primary" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white leading-tight">
                                {getDisplayTitle()}
                            </h1>
                            <div className="mt-2 flex items-center gap-3 text-slate-300">
                                <Users className="h-5 w-5 text-primary" />
                                <span className="text-lg font-medium tracking-wide leading-none">{club.name}</span>
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/50" />
                                <span className="text-sm font-semibold uppercase tracking-widest text-primary leading-none">
                                    {isImpersonating ? (user?.role === 'owner' ? 'OWNER VIEW' : 'ADMIN VIEW') : `${user?.role?.replace('_', ' ').toUpperCase()} VIEW`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-secondary/20 p-1 rounded-xl">
                    <TabsTrigger value="overview"><BarChart2 className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
                    <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" /> Members</TabsTrigger>
                    <TabsTrigger value="core-team"><Shield className="h-4 w-4 mr-2" /> Core Team</TabsTrigger>
                    <TabsTrigger value="polls"><Vote className="h-4 w-4 mr-2" /> Polls</TabsTrigger>
                    <TabsTrigger value="notifications"><Megaphone className="h-4 w-4 mr-2" /> Notifications</TabsTrigger>
                    <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-2" /> Leaderboard</TabsTrigger>
                    <TabsTrigger value="projects"><FolderKanban className="h-4 w-4 mr-2" /> Projects</TabsTrigger>
                    {(isFullCoordinator || isSecretary) && (
                        <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" /> Events</TabsTrigger>
                    )}
                    <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4 mr-2" /> Task Hub</TabsTrigger>
                    <TabsTrigger value="challenges"><Swords className="h-4 w-4 mr-2" /> Challenges</TabsTrigger>
                    {isFullCoordinator && (
                        <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Settings (Admin)</TabsTrigger>
                    )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatsCard title="Total Members" value={clubMembers.length} icon={Users} color="blue" />
                        <StatsCard title="Core Team" value={club.coreTeam?.length || 0} icon={Shield} color="green" />
                        <StatsCard title="Pending Requests" value={club.pendingMembers?.length || 0} icon={UserPlus} color="red" />
                    </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary/5 p-6 rounded-3xl border-2 border-primary/20">
                        <div>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" /> Operational Work
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium italic">Assign specific club roles and operational tasks to members.</p>
                        </div>
                        <Button
                            onClick={() => setIsAssignWorkOpen(true)}
                            className="w-full sm:w-auto h-12 px-8 rounded-2xl gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all font-black uppercase tracking-widest text-xs"
                        >
                            <Zap className="h-4 w-4" /> Assign Work (25 XP)
                        </Button>
                    </div>

                    <ManageClubMembers
                        clubId={clubId}
                        pendingMembers={club.pendingMembers}
                        canManage={true}
                        users={allUsers}
                        onPromote={(userId) => {
                            setTargetUserId(userId);
                            setDialogTab('core');
                            setIsPromotionOnly(true);
                            setIsManageTeamOpen(true);
                        }}
                    />

                    {isFullCoordinator && (
                        <div className="mt-8 space-y-6">
                            <ManageClubTasks
                                clubId={clubId}
                                clubName={club.name}
                                readOnly={false}
                                categoryFilter="operational"
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="core-team">
                    <ManageCoreTeam
                        club={club}
                        canManage={isFullCoordinator || isSecretary}
                        isImpersonating={isImpersonating}
                        onManage={(tab) => {
                            setDialogTab(tab || 'secretary');
                            setIsManageTeamOpen(true);
                        }}
                        onAssignWork={() => setIsAssignWorkOpen(true)}
                    />
                </TabsContent>

                <TabsContent value="polls">
                    {(isFullCoordinator || isSecretary) && <ClubPollCreator clubId={clubId} />}
                    <div className="space-y-6">
                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="w-full bg-secondary/30 p-1 rounded-xl">
                                <TabsTrigger value="active" className="flex-1 rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Active Polls</TabsTrigger>
                                <TabsTrigger value="past" className="flex-1 rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="active">
                                <ClubPollsList clubId={clubId} status="active" />
                            </TabsContent>
                            <TabsContent value="past">
                                <ClubPollsList clubId={clubId} status="closed" />
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <ClubBroadcasts clubId={clubId} clubName={club.name} />
                </TabsContent>

                <TabsContent value="leaderboard">
                    <ClubLeaderboard clubId={clubId} />
                </TabsContent>

                <TabsContent value="projects">
                    <ManageClubProjects clubId={clubId} allUsers={allUsers} />
                </TabsContent>

                <TabsContent value="events">
                    <ClubEventsManager club={club} />
                </TabsContent>

                <TabsContent value="tasks">
                    <ManageClubTasks clubId={clubId} clubName={club.name} categoryFilter="global" />
                </TabsContent>

                <TabsContent value="challenges">
                    <ManageClubChallenges clubId={clubId} />
                </TabsContent>


                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Club Profile</CardTitle>
                                    <CardDescription>Update description and social links</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ClubProfileEditor club={club} />
                                </CardContent>
                            </Card>

                            {isFullCoordinator && (
                                <Card className="border-l-4 border-l-primary">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex justify-between items-center">
                                            Team Administration
                                            <Badge variant="secondary">Coordinator Access</Badge>
                                        </CardTitle>
                                        <CardDescription>Manage roles, appoint Secretary, and core team.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="bg-secondary/20 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Club Secretary</p>
                                                <p className="text-lg font-bold">
                                                    {club.coreTeam?.find((m: any) => m.role === 'club_head')?.name || "Not Assigned"}
                                                </p>
                                            </div>
                                            <Crown className="text-yellow-500 h-6 w-6" />
                                        </div>

                                        <Button className="w-full" onClick={() => {
                                            setDialogTab('leadership');
                                            setIsManageTeamOpen(true);
                                        }}>
                                            <Shield className="mr-2 h-4 w-4" /> Manage Coordinator Roles
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full border-primary/20 hover:bg-primary/5 text-primary font-bold"
                                            onClick={() => setIsAssignWorkOpen(true)}
                                        >
                                            <Zap className="mr-2 h-4 w-4" /> Assign Operational Work
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-8">
                            <ClubAchievementsManager clubId={clubId} achievements={club.achievements} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <ManageClubTeamDialog
                open={isManageTeamOpen}
                onClose={() => {
                    setIsManageTeamOpen(false);
                    setTargetUserId(undefined);
                    setIsPromotionOnly(false);
                }}
                club={club}
                collegeUsers={allUsers.filter((u: any) => u.college === collegeName)}
                defaultTab={dialogTab}
                targetUserId={targetUserId}
                isPromotionOnly={isPromotionOnly}
            />

            <AssignWorkDialog
                open={isAssignWorkOpen}
                onClose={() => setIsAssignWorkOpen(false)}
                club={club}
                members={allUsers.filter((u: any) => u.joinedClubs?.includes(clubId))}
            />
        </div>
    );
}

// ---------------- Helper Components ----------------

function StatsCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className={`border-l-4 border-l-${color}-500 shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function ClubProfileEditor({ club }: { club: any }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        description: club.description || '',
        instagram: club.socialLinks?.instagram || '',
        linkedin: club.socialLinks?.linkedin || '',
        website: club.socialLinks?.website || '',
        logo: club.logo || '',
        banner: club.banner || ''
    });

    useEffect(() => {
        if (!isEditing) {
            setForm({
                description: club.description || '',
                instagram: club.socialLinks?.instagram || '',
                linkedin: club.socialLinks?.linkedin || '',
                website: club.socialLinks?.website || '',
                logo: club.logo || '',
                banner: club.banner || ''
            });
        }
    }, [club, isEditing]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateClub(club.id || (club as any)._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Profile Updated' });
            setIsEditing(false);
        }
    });

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-xl border-2 border-primary/20">
                        <AvatarImage src={club.logo} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{club.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{club.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{club.description || "No description."}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {club.socialLinks?.instagram && <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Instagram</Badge>}
                    {club.socialLinks?.linkedin && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">LinkedIn</Badge>}
                    {club.socialLinks?.website && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Website</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile & Branding</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Club Avatar URL</Label>
                    <div className="flex gap-2">
                        <Input
                            value={form.logo}
                            onChange={e => setForm({ ...form, logo: e.target.value })}
                            placeholder="https://image-url.com/logo.png"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Club Background URL</Label>
                    <div className="flex gap-2">
                        <Input
                            value={form.banner}
                            onChange={e => setForm({ ...form, banner: e.target.value })}
                            placeholder="https://image-url.com/banner.jpg"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Club Description</Label>
                <textarea
                    className="w-full min-h-[100px] p-3 border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instagram</Label>
                    <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LinkedIn</Label>
                    <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button
                    onClick={() => updateMutation.mutate({
                        description: form.description,
                        logo: form.logo,
                        banner: form.banner,
                        socialLinks: {
                            instagram: form.instagram,
                            linkedin: form.linkedin,
                            website: form.website
                        }
                    })}
                >
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
        </div>
    );
}

function ClubAchievementsManager({ clubId, achievements = [] }: { clubId: string; achievements: any[] }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', description: '', earnedAt: '' });

    const addMutation = useMutation({
        mutationFn: (data: any) => api.addClubAchievement(clubId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            toast({ title: 'Achievement Added' });
            setIsOpen(false);
            setNewItem({ title: '', description: '', earnedAt: '' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (itemId: string) => api.deleteClubAchievement(clubId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            toast({ title: 'Removed' });
        }
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>Awards and recognition</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Achievement</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                            <div>
                                <Label>Title</Label>
                                <Input value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                            </div>
                            <div>
                                <Label>Date Earned</Label>
                                <Input type="date" value={newItem.earnedAt} onChange={e => setNewItem({ ...newItem, earnedAt: e.target.value })} />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea className="w-full border rounded p-2" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                            </div>
                            <Button className="w-full" onClick={() => addMutation.mutate(newItem)}>Save Achievement</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {achievements.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No achievements recorded.</p> :
                        achievements.map((item: any) => (
                            <div key={item._id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Trophy className="h-4 w-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteMutation.mutate(item._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ManageClubMembers({ clubId, pendingMembers, canManage, onPromote, users = [] }: { clubId: string; pendingMembers?: any[]; canManage?: boolean; onPromote?: (userId: string) => void; users?: any[] }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const clubMembers = users.filter((u: any) => u.joinedClubs?.includes(clubId));

    const removeMutation = useMutation({
        mutationFn: (userId: string) => api.removeMemberFromClub(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            toast({ title: 'Member removed successfully' });
        }
    });

    const approveMutation = useMutation({
        mutationFn: (userId: string) => api.approveJoinRequest(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Member Approved' });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (userId: string) => api.rejectJoinRequest(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management'] });
            toast({ title: 'Request Rejected' });
        }
    });

    return (
        <div className="space-y-6">
            {canManage && pendingMembers && pendingMembers.length > 0 && (
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {pendingMembers.map((r: any) => (
                                <div key={r.userId} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{r.name}</p>
                                        <p className="text-xs text-muted-foreground">{r.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => approveMutation.mutate(r.userId)} disabled={approveMutation.isPending}>
                                            <Check className="h-4 w-4 mr-2" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(r.userId)} disabled={rejectMutation.isPending}>
                                            <X className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <CardTitle>Current Members</CardTitle>
                    <Badge variant="outline">{clubMembers.length} Members</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {clubMembers.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No members found</div>
                        ) : clubMembers.map((member: any, index: number) => (
                            <div key={member.id || member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="shrink-0">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground min-w-[20px]">{index + 1}.</span>
                                        <div>
                                            <p className="font-bold truncate">{member.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{member.role} • {member.points} XP</p>
                                        </div>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex gap-2 self-end sm:self-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-primary/20 hover:bg-primary/5 text-primary"
                                            onClick={() => onPromote?.(member.id || member._id)}
                                        >
                                            <Shield className="h-3.5 w-3.5 mr-2" /> Promote
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-3"
                                            onClick={() => {
                                                if (confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY remove ${member.name} from the club?`)) {
                                                    removeMutation.mutate(member.id || member._id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ManageCoreTeam({ club, canManage, isImpersonating, onManage, onAssignWork }: { club: any; canManage?: boolean; isImpersonating?: boolean; onManage?: (tab?: string) => void; onAssignWork?: () => void }) {
    const coreTeam = club.coreTeam || [];
    const coordinators = coreTeam.filter((m: any) => m.role === 'club_coordinator');
    const secretaries = coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator');
    const regularCore = coreTeam.filter((m: any) => m.role !== 'club_head' && m.role !== 'club_co_coordinator' && m.role !== 'club_coordinator');

    return (
        <div className="space-y-6">
            {/* Club Coordinator Section - ONLY changeable by Admin/Owner */}
            <Card className="border-l-4 border-l-amber-500 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-amber-50/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-amber-900">Leadership & Faculty</CardTitle>
                        </div>
                        <p className="text-sm text-amber-600/80 font-medium">Club Coordinators and Faculty Oversight</p>
                    </div>
                    {isImpersonating && (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onAssignWork?.()}
                                variant="outline"
                                size="sm"
                                className="border-primary/20 hover:bg-primary/5 text-primary font-bold"
                            >
                                <Zap className="h-4 w-4 mr-2" /> Assign Work
                            </Button>
                            <Button
                                onClick={() => onManage?.('leadership')}
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 shadow-lg font-bold"
                            >
                                <UserCog className="h-4 w-4 mr-2" /> Manage Coordinator
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-amber-100">
                        {coordinators.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground italic">
                                No Coordinator assigned yet.
                            </div>
                        ) : (
                            coordinators.map((member: any, index: number) => (
                                <div key={member.userId} className="flex items-center justify-between p-4 bg-white hover:bg-amber-50/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-inner">
                                            <Crown className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-amber-900/30 font-mono">#{index + 1}</span>
                                            <div>
                                                <p className="font-black text-amber-950 text-lg uppercase tracking-tight">{member.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge className={`${member.customTitle === 'Faculty Coordinator' ? 'bg-indigo-600 hover:bg-indigo-600' : 'bg-amber-600 hover:bg-amber-600'} font-bold uppercase text-[9px] tracking-widest text-white`}>
                                                        {member.customTitle || 'Club Coordinator'}
                                                    </Badge>
                                                    {member.customTitle && member.customTitle !== 'Faculty Coordinator' && <Badge variant="secondary" className="text-[10px] font-bold border-amber-200 text-amber-800">{member.customTitle}</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isImpersonating && (
                                        <Button variant="ghost" size="sm" onClick={() => onManage?.('leadership')} className="text-amber-600 hover:bg-amber-100/50">
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {!isImpersonating && (
                        <div className="p-3 bg-amber-50/50 border-t">
                            <p className="text-[10px] text-amber-700/70 font-bold uppercase tracking-wider flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Coordinator roles can only be modified by College Admins or Platform Owners
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-600 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-blue-900">Secretary & Head Panel</CardTitle>
                        </div>
                        <p className="text-sm text-blue-600/80 font-medium">Primary leadership for the Secretary Panel</p>
                    </div>
                    {canManage && (
                        <Button onClick={() => onManage?.('secretary')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <UserCog className="h-4 w-4 mr-2" /> Assign Secretary
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-blue-100">
                        {secretaries.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground italic">
                                No Secretary assigned yet.
                            </div>
                        ) : (
                            secretaries.map((member: any, index: number) => (
                                <div key={member.userId} className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shadow-inner">
                                            <Crown className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-blue-900/30 font-mono">#{index + 1}</span>
                                            <div>
                                                <p className="font-black text-blue-950 text-lg uppercase tracking-tight">{member.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge className="bg-blue-600 hover:bg-blue-600 font-bold uppercase text-[9px] tracking-widest">{member.role}</Badge>
                                                    {member.customTitle && <Badge variant="secondary" className="text-[10px] font-bold border-blue-200 text-blue-800">{member.customTitle}</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <Button variant="ghost" size="sm" onClick={() => onManage?.('secretary')} className="text-blue-600 hover:bg-blue-100/50">
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-slate-400">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-slate-500" />
                            <CardTitle>Club Core Team</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Members supporting club operations</p>
                    </div>
                    {canManage && (
                        <Button onClick={() => onManage?.('core')} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" /> Add Member
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {regularCore.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground italic">
                                <p>No core team members assigned yet.</p>
                            </div>
                        ) : (
                            regularCore.map((member: any) => (
                                <div key={member.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border shrink-0">
                                            <Shield className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">{member.role}</Badge>
                                                {member.customTitle && <Badge variant="secondary" className="text-[9px] font-medium truncate max-w-[100px]">{member.customTitle}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <Button variant="ghost" size="sm" onClick={() => onManage?.('core')} className="self-end sm:self-auto h-8 w-8 p-0">
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ClubPollCreator({ clubId }: { clubId: string }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const createPollMutation = useMutation({
        mutationFn: (data: any) => api.createPoll(data),
        onSuccess: () => {
            toast({ title: 'Poll Created' });
            setQuestion(''); setOptions(['', '']);
            queryClient.invalidateQueries({ queryKey: ['club-polls', clubId] });
        }
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        createPollMutation.mutate({ question, options: options.filter(o => o), clubId, createdBy: user?.id });
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-base">Create Poll</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" required />
                    {options.map((opt, i) => (
                        <Input key={i} value={opt} onChange={e => {
                            const n = [...options]; n[i] = e.target.value; setOptions(n);
                        }} placeholder={`Option ${i + 1}`} required />
                    ))}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>
                            <Plus className="h-4 w-4 mr-2" /> Add Option
                        </Button>
                    </div>
                    <Button type="submit" className="w-full">Create Poll</Button>
                </form>
            </CardContent>
        </Card>
    );
}

function PollCountdown({ expiresAt }: { expiresAt: string }) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${h}h ${m}m remaining`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft || timeLeft === 'Expired') return null;

    return (
        <p className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft}
        </p>
    );
}

function ClubPollsList({ clubId, status }: { clubId: string, status?: string }) {
    const { user } = useAuth();
    const { data: polls = [], isLoading } = useQuery({
        queryKey: ['club-polls', clubId, status],
        queryFn: () => api.getPolls(user?.id, user?.role, user?.email, clubId, undefined, status)
    });

    if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Poll Status & Results
            </h3>
            {polls.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
                    <Vote className="h-10 w-10 mb-2 opacity-20" />
                    <p>No polls created yet in this club.</p>
                </Card>
            ) : (
                polls.map((p: any) => {
                    const totalVotes = p.options.reduce((acc: number, curr: any) => acc + (curr.votes || 0), 0);

                    return (
                        <Card key={p._id} className="overflow-hidden border-l-4 border-l-primary">
                            <CardHeader className="pb-3 border-b bg-secondary/5">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5 font-bold">
                                                {(p.expiresAt && new Date() >= new Date(p.expiresAt)) ? 'EXPIRED' : (p.status?.toUpperCase() || 'ACTIVE')}
                                            </Badge>
                                            {p.expiresAt && p.status === 'active' && <PollCountdown expiresAt={p.expiresAt} />}
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {totalVotes} Total Votes
                                            </span>
                                        </div>
                                        <p className="font-bold text-base leading-tight mt-1">{p.question}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-3">
                                    {p.options.map((o: any, i: number) => {
                                        const percentage = totalVotes === 0 ? 0 : Math.round((o.votes / totalVotes) * 100);
                                        return (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="flex items-center gap-1.5">{o.text}</span>
                                                    <span className="text-muted-foreground">{o.votes} votes ({percentage}%)</span>
                                                </div>
                                                <Progress value={percentage} className="h-1.5" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}

function ClubBroadcasts({ clubId, clubName }: { clubId: string; clubName: string }) {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const sendMutation = useMutation({
        mutationFn: (data: any) => api.sendNotification(data),
        onSuccess: () => {
            toast({ title: 'Broadcast Sent' });
            setTitle('');
            setMessage('');
        }
    });

    const handleSend = (e: any) => {
        e.preventDefault();
        sendMutation.mutate({
            recipient: clubId,
            type: 'club_broadcast',
            sender: 'Club Coordinator',
            title: `[${clubName}] ${title}`,
            message: message,
            relatedId: clubId
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Club Broadcast</CardTitle>
                <p className="text-sm text-muted-foreground">Notify all members of updates</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSend} className="space-y-4">
                    <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Message..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={sendMutation.isPending}>
                        <Megaphone className="h-4 w-4 mr-2" /> Send Broadcast
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function ClubLeaderboard({ clubId }: { clubId: string }) {
    const { data: users = [], isLoading } = useQuery<any[]>({
        queryKey: ['club-members', clubId],
        queryFn: () => api.getUsers()
    });

    const calculateClubWeeklyXP = (user: any) => {
        if (!user.pointsHistory) return 0;

        // Find last Monday (Week Start)
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        return user.pointsHistory
            .filter((p: any) =>
                p.clubId?.toString() === clubId.toString() &&
                new Date(p.timestamp) >= weekStart
            )
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    };

    // Filter to get only members of this club and calculate their CLUB-SPECIFIC weekly XP
    const clubMembers = (users as any[])
        .filter((u: any) => u.joinedClubs?.includes(clubId))
        .map(u => ({
            ...u,
            clubWeeklyXP: calculateClubWeeklyXP(u)
        }))
        .sort((a: any, b: any) => (b.clubWeeklyXP || 0) - (a.clubWeeklyXP || 0));

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Club Rankings</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (clubMembers.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Club Rankings</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No members in this club yet.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Medal colors for top 3
    const getMedalColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-500';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-amber-600';
        return 'text-muted-foreground';
    };

    const getRankBadgeStyle = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md';
        if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-md';
        return 'bg-muted text-muted-foreground';
    };

    // Count weekly badges for a member for this specific club
    const getWeeklyBadgeCount = (member: any, rank: number) => {
        if (!member.clubWeeklyBadges) return 0;
        return member.clubWeeklyBadges.filter((b: any) =>
            b.clubId?.toString() === clubId.toString() && b.rank === rank
        ).length;
    };

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Weekly Club Rankings
                        </CardTitle>
                        <CardDescription>
                            Performance for current week • Resets every Monday
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-bold">
                        {clubMembers.length} Member{clubMembers.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {clubMembers.map((member: any, index: number) => {
                        const rank = index + 1;
                        const isTopThree = rank <= 3;
                        const goldCount = getWeeklyBadgeCount(member, 1);
                        const silverCount = getWeeklyBadgeCount(member, 2);
                        const bronzeCount = getWeeklyBadgeCount(member, 3);
                        const hasBadges = goldCount > 0 || silverCount > 0 || bronzeCount > 0;

                        return (
                            <div
                                key={member.id || member._id}
                                className={cn(
                                    "flex items-center gap-4 p-4 transition-colors",
                                    isTopThree ? "bg-gradient-to-r from-secondary/20 to-transparent" : "hover:bg-muted/30"
                                )}
                            >
                                {/* Rank Badge */}
                                <div className={cn(
                                    "shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-black text-lg",
                                    getRankBadgeStyle(rank)
                                )}>
                                    {rank <= 3 ? (
                                        <Trophy className={cn("h-5 w-5", getMedalColor(rank))} />
                                    ) : (
                                        <span className="text-sm">{rank}</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <Avatar className={cn(
                                    "h-12 w-12",
                                    isTopThree && "ring-2 ring-yellow-400 shadow-lg"
                                )}>
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {member.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Member Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={cn(
                                            "font-bold truncate",
                                            isTopThree && "text-lg"
                                        )}>
                                            {member.name}
                                        </p>
                                        {rank === 1 && (
                                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[8px] px-1.5 py-0">
                                                🏆 CHAMPION
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <Badge variant="outline" className="text-[9px] font-medium uppercase">
                                            {member.role?.replace(/_/g, ' ')}
                                        </Badge>
                                        {member.level && (
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                Level {member.level}
                                            </span>
                                        )}
                                    </div>
                                    {/* Weekly Badge History */}
                                    {hasBadges && (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            {goldCount > 0 && (
                                                <div className="flex items-center gap-0.5 bg-yellow-100 border border-yellow-300 rounded-full px-1.5 py-0.5">
                                                    <span className="text-[10px] font-bold text-yellow-700">🥇</span>
                                                    <span className="text-[9px] font-black text-yellow-800">×{goldCount}</span>
                                                </div>
                                            )}
                                            {silverCount > 0 && (
                                                <div className="flex items-center gap-0.5 bg-gray-100 border border-gray-300 rounded-full px-1.5 py-0.5">
                                                    <span className="text-[10px] font-bold text-gray-600">🥈</span>
                                                    <span className="text-[9px] font-black text-gray-700">×{silverCount}</span>
                                                </div>
                                            )}
                                            {bronzeCount > 0 && (
                                                <div className="flex items-center gap-0.5 bg-amber-100 border border-amber-300 rounded-full px-1.5 py-0.5">
                                                    <span className="text-[10px] font-bold text-amber-700">🥉</span>
                                                    <span className="text-[9px] font-black text-amber-800">×{bronzeCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Points */}
                                <div className="text-right shrink-0">
                                    <p className={cn(
                                        "font-black text-2xl tracking-tighter",
                                        isTopThree ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {member.clubWeeklyXP || 0}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                        CLUB XP
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
