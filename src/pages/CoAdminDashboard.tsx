import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    Shield,
    Building2,
    Target,
    Trophy,
    BookOpen,
    MapPin,
    Settings,
    ShieldAlert,
    UserPlus,
    FolderKanban,
    Plus,
    FileText,
    Activity,
    Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { RoleGate } from '@/components/common/RoleGate';
import { CollegeDetailView } from '@/components/common/CollegeDetailView';

export default function CoAdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats', user?.college],
        queryFn: () => api.getAdminStats(user?.college || ''),
        enabled: !!user?.college
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <RoleGate
            allowedRoles={['co_admin']}
            fallback={
                <Layout>
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Card className="max-w-md text-center p-8">
                            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-semibold">Access Restricted</h2>
                            <p className="text-muted-foreground mt-2">
                                You need Co-Admin privileges to access this page.
                            </p>
                        </Card>
                    </div>
                </Layout>
            }
        >
            <Layout>
                <div className="space-y-8 animate-fade-in pb-12">
                    {/* Header with High-end Gradient Styling */}
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/20 to-transparent" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/20 shadow-inner backdrop-blur-xl">
                                    <Shield className="h-10 w-10 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-blue-50">
                                        College Co-Admin Panel
                                    </h1>
                                    <div className="mt-2 flex items-center gap-3 text-blue-200/80">
                                        <Building2 className="h-5 w-5" />
                                        <span className="text-lg font-medium tracking-wide leading-none">{user?.college}</span>
                                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                                        <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">Co-Coordinator View</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30 px-4 py-1.5 text-sm font-bold tracking-wider transition-colors duration-200">
                                    SUPREME AUTHORITY
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 backdrop-blur-md rounded-xl border flex-wrap">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Activity className="h-4 w-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="students" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Users className="h-4 w-4 mr-2" />
                                Students
                            </TabsTrigger>
                            <TabsTrigger value="clubs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Building2 className="h-4 w-4 mr-2" />
                                Clubs
                            </TabsTrigger>
                            <TabsTrigger value="polls" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Target className="h-4 w-4 mr-2" />
                                Polls
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Trophy className="h-4 w-4 mr-2" />
                                Leaderboard
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Notes
                            </TabsTrigger>
                            <TabsTrigger value="locations" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <MapPin className="h-4 w-4 mr-2" />
                                Smart Campus
                            </TabsTrigger>
                            <TabsTrigger value="team" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Shield className="h-4 w-4 mr-2" />
                                College Team
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                        <Users className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{stats?.totalStudents || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">In your college</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-purple-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Assigned Clubs</CardTitle>
                                        <Building2 className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{stats?.totalClubs || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-green-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Challenges</CardTitle>
                                        <Target className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{stats?.totalChallenges || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Ongoing events</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-orange-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Projects</CardTitle>
                                        <FolderKanban className="h-4 w-4 text-orange-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Active collaborations</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-red-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                                        <FileText className="h-4 w-4 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">New</div>
                                        <p className="text-xs text-muted-foreground mt-1">Needs your review</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-teal-500">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Poll Participation</CardTitle>
                                        <Activity className="h-4 w-4 text-teal-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">High</div>
                                        <p className="text-xs text-muted-foreground mt-1">Engagement rate</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Management Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CollegeDetailView collegeName={user?.college || ''} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Sub-tabs delegation */}
                        <TabsContent value="students">
                            <Card><CardHeader><CardTitle>Students Management</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="clubs">
                            <Card><CardHeader><CardTitle>Clubs Management</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="polls">
                            <Card><CardHeader><CardTitle>College Polls</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 opacity-50 border-2 border-dashed rounded-lg">
                                        <Target className="h-12 w-12 mx-auto mb-4" />
                                        <p>College polls access is managed by the Head Coordinator.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications">
                            <Card><CardHeader><CardTitle>Broadcasts</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 opacity-50 border-2 border-dashed rounded-lg">
                                        <ShieldAlert className="h-12 w-12 mx-auto mb-4" />
                                        <p>Broadcast system access is managed by the Head Coordinator.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="leaderboard">
                            <Card><CardHeader><CardTitle>College Leaderboard</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notes">
                            <Card><CardHeader><CardTitle>Smart Library</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="locations">
                            <Card><CardHeader><CardTitle>Smart Campus Map</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="team">
                            <Card><CardHeader><CardTitle>College Team Management</CardTitle></CardHeader>
                                <CardContent><CollegeDetailView collegeName={user?.college || ''} /></CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </Layout>
        </RoleGate>
    );
}

