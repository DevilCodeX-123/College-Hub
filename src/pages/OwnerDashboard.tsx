import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Crown,
    Users,
    Building2,
    Shield,
    Activity,
    Search,
    BarChart3,
    Settings,
    Ban,
    CheckCircle,
    FileText,
    ArrowLeft,
    HelpCircle,
    Trophy,
    FolderKanban,
    Megaphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Navigate } from 'react-router-dom';
import { CollegeManagementPanel } from '@/components/owner/CollegeManagementPanel';
import { UserDetailsDialog } from '@/components/owner/UserDetailsDialog';
import { PlatformSettingsDialog } from '@/components/owner/PlatformSettingsDialog';
import { HelpManagement } from '@/components/owner/HelpManagement';
import { ComprehensiveClubSettingsDialog } from '@/components/owner/ComprehensiveClubSettingsDialog';
import { AdManagement } from '@/components/owner/AdManagement';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewingCollege, setViewingCollege] = useState<string | null>(null);
    const [selectedClubForSettings, setSelectedClubForSettings] = useState<any>(null);
    const [isClubSettingsOpen, setIsClubSettingsOpen] = useState(false);
    const [overviewFilter, setOverviewFilter] = useState<'all' | 'admins' | 'blocked'>('all');

    const handleUserSettings = (user: any) => {
        setSelectedUser(user);
        setUserDetailsOpen(true);
    };

    // Redirect if not owner
    if (!user || user.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

    // Fetch platform statistics
    const { data: stats } = useQuery({
        queryKey: ['owner-stats'],
        queryFn: async () => {
            const users = await api.getUsers(undefined, user?.id || user?._id);
            const clubs = await api.getClubs(undefined, user?.id || user?._id);
            const challenges = await api.getChallenges(); // Challenges already logic? check later
            const projects = await api.getProjects();

            return {
                totalUsers: users.length,
                totalAdmins: users.filter((u: any) => u.role === 'admin' || u.role === 'club_coordinator').length,
                totalClubs: clubs.length,
                totalChallenges: challenges.length,
                totalProjects: projects.length,
                blockedUsers: users.filter((u: any) => u.blocked?.website).length
            };
        }
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => api.getUsers(undefined, user?.id || user?._id)
    });

    const { data: allClubs = [] } = useQuery({
        queryKey: ['all-clubs'],
        queryFn: () => api.getClubs()
    });

    const { data: allChallenges = [] } = useQuery({
        queryKey: ['all-challenges'],
        queryFn: () => api.getChallenges()
    });

    const { data: allProjects = [] } = useQuery({
        queryKey: ['all-projects'],
        queryFn: () => api.getProjects()
    });

    const filteredUsers = allUsers.filter((u: any) => {
        const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());

        // Privacy: Never show yourself in the management lists
        const isSelf = u.id === user?.id || u._id === user?.id || u.id === user?._id || u._id === user?._id;
        if (isSelf) return false;

        if (viewingCollege) {
            return matchesSearch && u.college === viewingCollege;
        }

        if (activeTab === 'users') {
            if (overviewFilter === 'admins') return matchesSearch && (u.role === 'admin' || u.role === 'club_coordinator');
            if (overviewFilter === 'blocked') return matchesSearch && u.blocked?.website;
            return matchesSearch; // 'all'
        }

        // Default view: Only Admins/Owners (excluding self)
        return matchesSearch && (u.role === 'admin' || u.role === 'owner');
    });

    return (
        <Layout>
            <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
                {/* Premium Hero Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 md:p-12 text-white shadow-2xl border border-white/5">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/20 via-orange-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse" />
                                <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/20 border border-white/20 transform hover:scale-110 transition-transform duration-500">
                                    <Crown className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                                    Owner Panel
                                </h1>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">Platform Administration & Control</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSettingsOpen(true)}
                                    className="bg-white/5 hover:bg-white/10 text-white border-white/20 rounded-full h-9 px-4 gap-2 backdrop-blur-md transition-all font-bold"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Settings</span>
                                </Button>
                                <Badge className="bg-white/10 hover:bg-white/20 text-amber-400 border-amber-500/30 px-6 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase backdrop-blur-md transition-all duration-300">
                                    <Shield className="h-3.5 w-3.5 mr-2" />
                                    Supreme Authority
                                </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mr-2">System Version 2.0.4-LTS</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="sticky top-4 z-50 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                        <TabsList className="flex h-14 w-full bg-slate-100/30 p-1 rounded-3xl border-none">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'users', label: 'Users', icon: Users },
                                { id: 'tasks', label: 'Engagement', icon: Activity },
                                { id: 'help', label: 'Support', icon: HelpCircle },
                                { id: 'colleges', label: 'Colleges', icon: Building2 },
                                { id: 'clubs', label: 'Clubs', icon: Trophy },
                                { id: 'ads', label: 'Ads', icon: Megaphone },
                                { id: 'logs', label: 'Audit', icon: FileText },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="flex-1 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-lg text-slate-500 font-bold transition-all duration-300 gap-2"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    <span className="hidden lg:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-blue-50/30"
                                onClick={() => { setActiveTab('users'); setOverviewFilter('all'); }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-600/60">Total Users</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Users className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.totalUsers || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        Platform-wide registry
                                    </p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>

                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-purple-50/30"
                                onClick={() => { setActiveTab('users'); setOverviewFilter('admins'); }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-purple-600/60">Total Admins</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.totalAdmins || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Coordinators & Admins</p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>

                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-green-50/30"
                                onClick={() => setActiveTab('clubs')}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600/60">Total Clubs</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                        <Trophy className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.totalClubs || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Active communities</p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>

                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-orange-50/30"
                                onClick={() => setActiveTab('tasks')}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600/60">Challenges</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.totalChallenges || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Platform-wide events</p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>

                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-cyan-50/30"
                                onClick={() => setActiveTab('tasks')}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600/60">Projects</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                                        <FolderKanban className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.totalProjects || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Open source & research</p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>

                            <Card
                                className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-none bg-gradient-to-br from-white to-rose-50/30"
                                onClick={() => { setActiveTab('users'); setOverviewFilter('blocked'); }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-600/60">Blocked Users</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                        <Ban className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black text-slate-900">{stats?.blockedUsers || 0}</div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Currently restricted</p>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('users')}>
                                    <Users className="h-4 w-4 mr-2" />
                                    View All Users
                                </Button>
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('colleges')}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Manage Colleges
                                </Button>
                                <Button variant="outline" className="justify-start" onClick={() => setSettingsOpen(true)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Platform Settings
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Users Tab (now Admins/Scoped Students) */}
                    <TabsContent value="users" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {viewingCollege && (
                                            <Button variant="ghost" size="sm" onClick={() => setViewingCollege(null)}>
                                                <ArrowLeft className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <CardTitle className="flex items-center gap-2">
                                            {viewingCollege ? (
                                                `Students of ${viewingCollege}`
                                            ) : overviewFilter === 'admins' ? (
                                                'Administrators'
                                            ) : overviewFilter === 'blocked' ? (
                                                'Blocked Users'
                                            ) : (
                                                'Platform Users'
                                            )}
                                        </CardTitle>
                                    </div>
                                    {viewingCollege && (
                                        <Badge variant="secondary">
                                            {filteredUsers.length} Students found
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={viewingCollege ? "Search students..." : "Search admins..."}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {filteredUsers.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            {viewingCollege ? "No students found in this college" : "No admins found"}
                                        </p>
                                    ) : (
                                        filteredUsers.map((userItem: any) => (
                                            <div
                                                key={userItem.id || userItem._id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold shrink-0">
                                                        {userItem.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold truncate">{userItem.name}</p>
                                                            {userItem.role === 'admin' && (
                                                                <Badge variant="outline" className="text-[10px] bg-blue-50/50">Admin</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground truncate">{userItem.email}</p>
                                                        {!viewingCollege && userItem.college && (
                                                            <p className="text-[10px] text-primary/60 font-medium uppercase tracking-wider">{userItem.college}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                                        {/* Primary Role */}
                                                        <Badge variant={userItem.role === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {userItem.role === 'admin' ? 'Admin' :
                                                                userItem.role === 'club_coordinator' ? 'Coordinator' :
                                                                    userItem.role === 'club_head' ? 'Secretary' :
                                                                        userItem.role === 'core_member' ? 'Core Member' :
                                                                            userItem.role === 'club_member' ? 'Club Member' :
                                                                                userItem.role === 'owner' ? 'Owner' :
                                                                                    userItem.role}
                                                        </Badge>

                                                        {/* Club-Specific Roles */}
                                                        {userItem.clubRoles && userItem.clubRoles.length > 0 && (
                                                            userItem.clubRoles.slice(0, 2).map((clubRole: any, idx: number) => {
                                                                const roleLabel =
                                                                    clubRole.role === 'club_coordinator' ? 'Coordinator' :
                                                                        clubRole.role === 'club_head' ? 'Secretary' :
                                                                            clubRole.role === 'club_co_coordinator' ? 'Co-Coordinator' :
                                                                                clubRole.role === 'core_member' ? 'Core' :
                                                                                    'Member';

                                                                return (
                                                                    <Badge key={idx} variant="outline" className="text-[10px] bg-purple-50/50">
                                                                        {clubRole.clubName} {roleLabel}
                                                                    </Badge>
                                                                );
                                                            })
                                                        )}
                                                        {userItem.clubRoles && userItem.clubRoles.length > 2 && (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                +{userItem.clubRoles.length - 2} more
                                                            </Badge>
                                                        )}

                                                        <Badge variant="outline" className="text-[10px]">{userItem.points} XP</Badge>
                                                        {userItem.blocked?.website ? (
                                                            <Badge variant="destructive" className="text-[10px]">
                                                                <Ban className="h-3 w-3 mr-1" />
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-600 text-[10px]">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        {viewingCollege && userItem.role === 'student' && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="h-8 gap-1.5 font-bold shadow-md bg-green-600 hover:bg-green-700 animate-in zoom-in-95 duration-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUserSettings(userItem);
                                                                }}
                                                            >
                                                                <Crown className="h-3.5 w-3.5" />
                                                                <span>Make Admin</span>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUserSettings(userItem);
                                                            }}
                                                            title="User Settings"
                                                        >
                                                            <Settings className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Help Management Tab */}
                    <TabsContent value="help" className="space-y-6">
                        <HelpManagement />
                    </TabsContent>

                    {/* Ad Management Tab */}
                    <TabsContent value="ads" className="space-y-6">
                        <AdManagement />
                    </TabsContent>

                    {/* Colleges Tab */}
                    <TabsContent value="colleges" className="space-y-6">
                        <CollegeManagementPanel />
                    </TabsContent>

                    {/* Tasks & Engagement Tab */}
                    <TabsContent value="tasks" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg">Platform Challenges</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
                                    <div className="divide-y">
                                        {allChallenges.map((c: any) => (
                                            <div key={c._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                <div>
                                                    <p className="font-bold text-sm">{c.title}</p>
                                                    <p className="text-xs text-muted-foreground">{c.college} • {c.points} XP</p>
                                                </div>
                                                <Badge variant={c.status === 'completed' ? 'default' : 'outline'}>
                                                    {c.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg">Project Proposals</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
                                    <div className="divide-y">
                                        {allProjects.map((p: any) => (
                                            <div key={p._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                <div>
                                                    <p className="font-bold text-sm">{p.title}</p>
                                                    <p className="text-xs text-muted-foreground">{p.college} • {p.team?.length} Members</p>
                                                </div>
                                                <Badge variant="outline" className="capitalize">
                                                    {p.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Clubs Tab */}
                    <TabsContent value="clubs" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Platform Clubs</CardTitle>
                                <div className="flex gap-4 mt-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search clubs by name or college..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {allClubs.filter((c: any) =>
                                        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        c.college?.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((club: any) => (
                                        <div key={club.id || club._id} className="p-4 border rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                                                    {club.logo ? (
                                                        <img src={club.logo} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        club.name?.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{club.name}</p>
                                                    <p className="text-xs text-muted-foreground">{club.college}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] h-4">{club.memberCount} Members</Badge>
                                                        <Badge variant="outline" className="text-[9px] h-4">{club.points} Points</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setSelectedClubForSettings(club);
                                                    setIsClubSettingsOpen(true);
                                                }}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Audit Logs Tab */}
                    <TabsContent value="logs" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Logs</CardTitle>
                                <p className="text-sm text-muted-foreground">Track all critical platform actions</p>
                            </CardHeader>
                            <CardContent className="p-12">
                                <div className="relative group max-w-sm mx-auto text-center">
                                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                                    <div className="relative">
                                        <div className="h-24 w-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-primary/20 transform group-hover:rotate-12 transition-transform duration-500">
                                            <FileText className="h-12 w-12 text-primary opacity-40" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Logs</h3>
                                        <p className="text-slate-400 font-medium mt-3 text-sm leading-relaxed px-4">
                                            Audit logging system will be implemented in Phase 1.
                                            All platform actions are currently being buffered.
                                        </p>
                                        <div className="mt-8 flex gap-3 justify-center">
                                            <div className="h-1 w-8 rounded-full bg-slate-200" />
                                            <div className="h-1 w-12 rounded-full bg-primary/30" />
                                            <div className="h-1 w-8 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* User Details Dialog */}
                <UserDetailsDialog
                    user={selectedUser}
                    open={userDetailsOpen}
                    onClose={() => setUserDetailsOpen(false)}
                />

                {/* Platform Settings Dialog */}
                <PlatformSettingsDialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                />

                <ErrorBoundary name="Club Settings Dialog">
                    <ComprehensiveClubSettingsDialog
                        open={isClubSettingsOpen}
                        onClose={() => setIsClubSettingsOpen(false)}
                        club={selectedClubForSettings}
                        collegeUsers={allUsers}
                    />
                </ErrorBoundary>
            </div>
        </Layout>
    );
}
