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
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Navigate } from 'react-router-dom';
import { CollegeManagementPanel } from '@/components/owner/CollegeManagementPanel';
import { UserDetailsDialog } from '@/components/owner/UserDetailsDialog';
import { PlatformSettingsDialog } from '@/components/owner/PlatformSettingsDialog';

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewingCollege, setViewingCollege] = useState<string | null>(null);

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

    const filteredUsers = allUsers.filter((u: any) => {
        const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());

        // Privacy: Never show yourself in the management lists
        const isSelf = u.id === user?.id || u._id === user?.id || u.id === user?._id || u._id === user?._id;
        if (isSelf) return false;

        if (viewingCollege) {
            return matchesSearch && u.college === viewingCollege;
        }

        // Default view: Only Admins/Owners (excluding self)
        return matchesSearch && (u.role === 'admin' || u.role === 'owner' || u.role === 'co_admin');
    });

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Crown className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Owner Panel</h1>
                            <p className="text-muted-foreground">Platform Administration & Control</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 text-sm font-semibold">
                        <Shield className="h-4 w-4 mr-2" />
                        Supreme Authority
                    </Badge>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="users">
                            <Shield className="h-4 w-4 mr-2" />
                            Admins
                        </TabsTrigger>
                        <TabsTrigger value="colleges">
                            <Building2 className="h-4 w-4 mr-2" />
                            Colleges
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <FileText className="h-4 w-4 mr-2" />
                            Audit Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Registered on platform</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                                    <Shield className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.totalAdmins || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Coordinators & Admins</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                                    <Building2 className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.totalClubs || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Active clubs</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-orange-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Challenges</CardTitle>
                                    <Activity className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.totalChallenges || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Platform-wide challenges</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-cyan-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Projects</CardTitle>
                                    <FileText className="h-4 w-4 text-cyan-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Active projects</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-red-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
                                    <Ban className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats?.blockedUsers || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Currently blocked</p>
                                </CardContent>
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
                                        <CardTitle>
                                            {viewingCollege ? `Students of ${viewingCollege}` : 'Admin Management'}
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
                                                        <Badge variant={userItem.role === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {userItem.role}
                                                        </Badge>
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
                                                    <div className="flex gap-1">
                                                        {!viewingCollege && userItem.role === 'admin' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1.5 font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                                                                onClick={() => {
                                                                    setViewingCollege(userItem.college);
                                                                    setSearchQuery('');
                                                                }}
                                                            >
                                                                <Users className="h-3.5 w-3.5" />
                                                                <span>Change Admin</span>
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleUserSettings(userItem)}>
                                                            <Settings className="h-4 w-4" />
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

                    {/* Colleges Tab */}
                    <TabsContent value="colleges" className="space-y-6">
                        <CollegeManagementPanel />
                    </TabsContent>

                    {/* Audit Logs Tab */}
                    <TabsContent value="logs" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Logs</CardTitle>
                                <p className="text-sm text-muted-foreground">Track all critical platform actions</p>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>Audit logging system will be implemented in Phase 1</p>
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
            </div>
        </Layout>
    );
}
