import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    Settings,
    BarChart2,
    Calendar,
    Loader2,
    Shield,
    Edit,
    Save,
    CheckCircle,
    Plus,
    Trash2,
    Check,
    Zap,
    Target,
    UserCog,
    ExternalLink,
    FileText,
    FolderKanban,
    Trophy,
    X,
    Activity,
    Vote,
    ShieldAlert,
    Building2,
    Megaphone,
    UserPlus,
    Crown,
    Link as LinkIcon,
    History,
    ClipboardList,
    Swords
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
import { RoleGate } from '@/components/common/RoleGate';
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

export default function CoordinatorDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { pathname } = useLocation();
    const queryClient = useQueryClient();
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch all users to filter college users
    const { data: allUsers = [] } = useQuery<any[]>({
        queryKey: ['users', user?.college],
        queryFn: () => api.getUsers(user?.college || '', user?.id || user?._id)
    });

    // Fetch Club by Coordinator ID
    const { data: club, isLoading } = useQuery({
        queryKey: ['my-club', user?.id],
        queryFn: () => user ? api.getClubByCoordinator(user.id, user.id) : null,
        enabled: !!user,
        retry: false
    });

    const isFullCoordinator = ['owner', 'admin', 'co_admin', 'club_coordinator', 'club_co_coordinator'].includes(user?.role || '');
    const isSecretary = user?.role === 'club_head';
    const isCorePanel = pathname.includes('/core-team');

    // Determine title based on path OR role
    const getDisplayTitle = () => {
        if (pathname.includes('/club-coordinator')) return 'Club Coordinator Panel';
        if (pathname.includes('/club-co-coordinator')) return 'Club Co-Coordinator Panel';
        if (pathname.includes('/club-head')) return 'Club Secretary Panel';
        if (pathname.includes('/core-team')) return 'Core Team Panel';

        // Fallback to role-based title
        if (user?.role === 'club_coordinator') return 'Club Coordinator Panel';
        if (user?.role === 'club_head') return 'Club Secretary Panel';
        return 'Club Administration Panel';
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    const clubId = club?.id || (club as any)?._id;

    return (
        <RoleGate allowedRoles={['club_coordinator', 'club_co_coordinator', 'club_head', 'core_member']}>
            {(!club) ? (
                <Layout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Club Assigned</h2>
                        <p className="text-muted-foreground max-w-md">
                            You are listed as a Coordinator, but no club is officially linked to your account yet.
                            Please contact the System Admin to link your account to a club.
                        </p>
                    </div>
                </Layout>
            ) : (
                <Layout>
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
                                                {user?.role === 'owner' ? 'OWNER VIEW' : `${user?.role.replace('_', ' ').toUpperCase()} VIEW`}
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
                                <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4 mr-2" /> Tasks</TabsTrigger>
                                <TabsTrigger value="challenges"><Swords className="h-4 w-4 mr-2" /> Challenges</TabsTrigger>
                                {isFullCoordinator && !isCorePanel && (
                                    <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Settings (Admin)</TabsTrigger>
                                )}
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatsCard title="Total Members" value={club.memberCount || 0} icon={Users} color="blue" />
                                    <StatsCard title="Core Team" value={club.coreTeam?.length || 0} icon={Shield} color="green" />
                                    <StatsCard title="Pending Requests" value={club.pendingMembers?.length || 0} icon={UserPlus} color="red" />
                                </div>
                            </TabsContent>

                            <TabsContent value="members">
                                <ManageClubMembers clubId={clubId} pendingMembers={club.pendingMembers} canManage={true} />
                            </TabsContent>

                            <TabsContent value="core-team">
                                <ManageCoreTeam club={club} canManage={(isFullCoordinator || isSecretary) && !isCorePanel} onManage={() => setIsManageTeamOpen(true)} />
                            </TabsContent>

                            <TabsContent value="polls">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {(isFullCoordinator || isSecretary || isCorePanel) && <ClubPollCreator clubId={clubId} />}
                                    <ClubPollsList clubId={clubId} />
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
                                <ManageClubTasks clubId={clubId} clubName={club.name} />
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

                                        {/* Team Administration - Restricted to Coordinators */}
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

                                                    <Button className="w-full" onClick={() => setIsManageTeamOpen(true)}>
                                                        <UserCog className="mr-2 h-4 w-4" /> Manage Team Roles & Secretary
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        Use this to promote members to Core Team or Secretary.
                                                    </p>
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

                        {/* Manage Team Dialog - Always render if open, rely on button for visibility */}
                        <ManageClubTeamDialog
                            open={isManageTeamOpen}
                            onClose={() => setIsManageTeamOpen(false)}
                            club={club}
                            collegeUsers={allUsers.filter((u: any) => u.college === user?.college)}
                        />
                    </div>
                </Layout>
            )
            }
        </RoleGate >
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

    // Sync form with club data when club updates, BUT ONLY if we are not actively editing
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
                    {club.banner && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Custom Banner</Badge>}
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
                        {form.logo && (
                            <div className="h-10 w-10 rounded-lg overflow-hidden border shrink-0">
                                <img src={form.logo} className="h-full w-full object-cover" alt="Preview" />
                            </div>
                        )}
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
                        {form.banner && (
                            <div className="h-10 w-10 rounded-lg overflow-hidden border shrink-0">
                                <img src={form.banner} className="h-full w-full object-cover" alt="Preview" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Club Description</Label>
                <textarea
                    className="w-full min-h-[100px] p-3 border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell everyone what your club is about..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instagram</Label>
                    <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="username or URL" />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LinkedIn</Label>
                    <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="URL" />
                </div>
                <div className="col-span-full space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Website</Label>
                    <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button
                    className="px-8 bg-primary hover:bg-primary/90"
                    onClick={() => updateMutation.mutate({
                        description: form.description,
                        logo: form.logo,
                        banner: form.banner,
                        coverImage: form.banner, // Also save to coverImage for compatibility
                        socialLinks: {
                            instagram: form.instagram,
                            linkedin: form.linkedin,
                            website: form.website
                        }
                    })}
                >
                    <Save className="mr-2 h-4 w-4" /> Save Branding & Profile
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
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Achievement Added' });
            setIsOpen(false);
            setNewItem({ title: '', description: '', earnedAt: '' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (itemId: string) => api.deleteClubAchievement(clubId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
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

function ManageClubMembers({ clubId, pendingMembers, canManage }: { clubId: string; pendingMembers?: any[]; canManage?: boolean }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: users = [], isLoading } = useQuery<any[]>({
        queryKey: ['users'],
        queryFn: () => api.getUsers()
    });

    const clubMembers = (users as any[]).filter((u: any) => u.joinedClubs?.includes(clubId));

    const removeMutation = useMutation({
        mutationFn: (userId: string) => api.removeMemberFromClub(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Member removed successfully' });
        }
    });

    const approveMutation = useMutation({
        mutationFn: (userId: string) => api.approveJoinRequest(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Member Approved' });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (userId: string) => api.rejectJoinRequest(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Request Rejected' });
        }
    });

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

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
                        ) : clubMembers.map((member: any) => (
                            <div key={member.id || member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="shrink-0">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{member.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{member.role} • {member.points} XP</p>
                                    </div>
                                </div>
                                {canManage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 self-end sm:self-auto h-8 px-3"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to remove this member?')) {
                                                removeMutation.mutate(member.id || member._id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ManageCoreTeam({ club, canManage, onManage }: { club: any; canManage?: boolean; onManage?: () => void }) {
    const coreTeam = club.coreTeam || [];
    const secretaries = coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator');
    const regularCore = coreTeam.filter((m: any) => m.role !== 'club_head' && m.role !== 'club_co_coordinator');

    return (
        <div className="space-y-6">
            {/* Secretary Panel Section */}
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
                        <Button onClick={onManage} size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                            secretaries.map((member: any) => (
                                <div key={member.userId} className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shadow-inner">
                                            <Crown className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-blue-950 text-lg uppercase tracking-tight">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge className="bg-blue-600 hover:bg-blue-600 font-bold uppercase text-[9px] tracking-widest">{member.role}</Badge>
                                                {member.customTitle && <Badge variant="secondary" className="text-[10px] font-bold border-blue-200 text-blue-800">{member.customTitle}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <Button variant="ghost" size="sm" onClick={onManage} className="text-blue-600 hover:bg-blue-100/50">
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* General Core Team Section */}
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
                        <Button onClick={onManage} variant="outline" size="sm">
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
                                        <Button variant="ghost" size="sm" onClick={onManage} className="self-end sm:self-auto h-8 w-8 p-0">
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

function ClubPollsList({ clubId }: { clubId: string }) {
    const { user } = useAuth();
    const { data: polls = [], isLoading } = useQuery({
        queryKey: ['club-polls', clubId],
        queryFn: () => api.getPolls(user?.id, user?.role, user?.email, clubId)
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
                                            <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                {p.status?.toUpperCase() || 'ACTIVE'}
                                            </Badge>
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
                                                    <span className="flex items-center gap-1.5">
                                                        {o.text}
                                                        {percentage === Math.max(...p.options.map((opt: any) => Math.round((opt.votes / totalVotes) * 100))) && totalVotes > 0 && (
                                                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                        )}
                                                    </span>
                                                    <span className="text-muted-foreground">{o.votes} votes ({percentage}%)</span>
                                                </div>
                                                <div className="relative group">
                                                    <Progress value={percentage} className="h-1.5" />
                                                </div>
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
    const queryClient = useQueryClient();
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
    return (
        <Card>
            <CardHeader><CardTitle>Club Rankings</CardTitle></CardHeader>
            <CardContent>
                <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground mb-4">Rankings coming soon.</p>
                </div>
            </CardContent>
        </Card>
    );
}
