import { useState } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Shield,
    Users,
    Building2,
    Search,
    BarChart3,
    Settings,
    UserPlus,
    Target,
    FolderKanban,
    Trophy,
    FileText,
    Plus,
    BookOpen,
    ExternalLink,
    Trash2,
    MapPin,
    Navigation,
    Loader2,
    ClipboardList,
    Crown,
    Mail,
    Edit,
    Flag,
    UserCog,
    Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CreateClubDialog } from '@/components/owner/CreateClubDialog';
import { CreatePollDialog } from '@/components/owner/CreatePollDialog';
import { CreateBroadcastDialog } from '@/components/owner/CreateBroadcastDialog';
import { CreateChallengeDialog } from '@/components/owner/CreateChallengeDialog';
import { AssignHeadDialog } from '@/components/owner/AssignHeadDialog';
import { UserDetailsDialog } from '@/components/owner/UserDetailsDialog';
import { CreateNoteDialog } from '@/components/owner/CreateNoteDialog';
import { CreateLocationDialog } from '@/components/owner/CreateLocationDialog';
import { ExtendPollDialog } from '@/components/owner/ExtendPollDialog';
import { ComprehensiveClubSettingsDialog } from '@/components/owner/ComprehensiveClubSettingsDialog';
import { ManageClubTasks } from '@/components/dashboard/ManageClubTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CollegeAdminViewProps {
    collegeName: string;
}

export function CollegeAdminView({ collegeName }: CollegeAdminViewProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
    const [isCreateBroadcastOpen, setIsCreateBroadcastOpen] = useState(false);
    const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
    const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
    const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);
    const [pollFilter, setPollFilter] = useState('active');
    const [selectedClubForSettings, setSelectedClubForSettings] = useState<any>(null);
    const [isClubSettingsOpen, setIsClubSettingsOpen] = useState(false);
    const [isCollegeTasksOpen, setIsCollegeTasksOpen] = useState(false);

    // Fetch college-specific data
    const { data: stats } = useQuery({
        queryKey: ['admin-stats', collegeName],
        enabled: !!collegeName,
        queryFn: async () => {
            const myCollegeUsers = await api.getUsers(collegeName, user?.id || user?._id);
            const myCollegeClubs = await api.getClubs(collegeName, user?.id || user?._id);
            const myCollegeChallenges = await api.getChallenges(collegeName);
            const myCollegeProjects = await api.getProjects(collegeName);

            return {
                totalStudents: myCollegeUsers.length,
                totalCoAdmins: myCollegeUsers.filter((u: any) => u.role === 'co_admin').length,
                totalClubs: myCollegeClubs.length,
                totalChallenges: myCollegeChallenges.length,
                totalProjects: myCollegeProjects.length,
                blockedStudents: myCollegeUsers.filter((u: any) => u.blocked?.website).length
            };
        }
    });

    const { data: collegeStudents = [] } = useQuery({
        queryKey: ['college-students', collegeName],
        enabled: !!collegeName,
        queryFn: () => api.getUsers(collegeName, user?.id || user?._id)
    });

    const { data: collegeClubs = [] } = useQuery({
        queryKey: ['college-clubs', collegeName],
        enabled: !!collegeName,
        queryFn: () => api.getClubs(collegeName, user?.id || user?._id)
    });

    const filteredStudents = collegeStudents.filter((u: any) =>
        u.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
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
                                {user?.role === 'owner' ? 'Owner / Admin View' : 'College Coordinator Panel'}
                            </h1>
                            <div className="mt-2 flex items-center gap-3 text-blue-200/80">
                                <Building2 className="h-5 w-5" />
                                <span className="text-lg font-medium tracking-wide leading-none">{collegeName}</span>
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                                <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">Administrative Control</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30 px-4 py-1.5 text-sm font-bold tracking-wider transition-colors duration-200 uppercase">
                            {user?.role === 'owner' ? 'Supreme Authority' : (user?.role === 'admin' ? 'College Coordinator' : 'College Co-Coordinator')}
                        </Badge>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-secondary/20 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
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
                </TabsList>

                {/* Overview Tab */}
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
                                <CardTitle className="text-sm font-medium">Co-Coordinators</CardTitle>
                                <UserPlus className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats?.totalCoAdmins || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Assistant coordinators</p>
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
                                <Target className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats?.totalChallenges || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">College challenges</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-cyan-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                                <FolderKanban className="h-4 w-4 text-cyan-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Active projects</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Blocked Students</CardTitle>
                                <Users className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats?.blockedStudents || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Currently blocked</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <Button variant="outline" className="justify-start" onClick={() => setActiveTab('students')}>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Students
                            </Button>

                            <Button variant="outline" className="justify-start" onClick={() => setActiveTab('clubs')}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Manage Clubs
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Management</CardTitle>
                            <div className="flex gap-4 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {filteredStudents.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No students found</p>
                                ) : (
                                    filteredStudents.map((student: any) => (
                                        <div
                                            key={student.id || student._id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold shrink-0">
                                                    {student.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{student.name}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                                <div className="flex gap-2">
                                                    <Badge variant="secondary" className="text-[10px]">{student.role}</Badge>
                                                    <Badge variant="outline" className="text-[10px]">{student.points} XP</Badge>
                                                    {student.blocked?.website ? (
                                                        <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600 text-[10px]">Active</Badge>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setSelectedUser(student);
                                                    setIsUserDetailsOpen(true);
                                                }}>
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Clubs Tab */}
                <TabsContent value="clubs" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Club Management</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsCollegeTasksOpen(true)}>
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    College Tasks
                                </Button>
                                <Button onClick={() => setIsCreateClubOpen(true)}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Create Club
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {collegeClubs.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-muted-foreground">No clubs created yet for {collegeName}</p>
                                    <Button className="mt-4" onClick={() => setIsCreateClubOpen(true)}>Create Your First Club</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {collegeClubs.map((club: any) => (
                                        <Card key={club._id} className="border-2">
                                            <CardHeader>
                                                <CardTitle className="text-lg">{club.name}</CardTitle>
                                                <Badge variant="outline">{club.memberCount || 0} members</Badge>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground mb-3">{club.description}</p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => navigate(`/clubs/${club._id || club.id}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedClubForSettings(club);
                                                            setIsClubSettingsOpen(true);
                                                        }}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>College Leaderboard</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage college-wide rankings</p>
                            </div>
                            <Button onClick={() => setIsCreateChallengeOpen(true)}>
                                <Trophy className="h-4 w-4 mr-2" />
                                Create Leaderboard (via Challenge)
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground mb-2">Leaderboard feature is driven by Challenges.</p>
                                <Badge variant="outline">System Generated Rankings</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="polls" className="space-y-6">
                    <div className="grid md:grid-cols-1 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>College-wide Polls</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Feedback from all students in {collegeName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-secondary p-1 rounded-lg flex text-xs font-semibold">
                                        <button
                                            className={`px-3 py-1 rounded-md transition-all ${pollFilter === 'active' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            onClick={() => setPollFilter('active')}
                                        >
                                            Active
                                        </button>
                                        <button
                                            className={`px-3 py-1 rounded-md transition-all ${pollFilter === 'closed' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            onClick={() => setPollFilter('closed')}
                                        >
                                            History
                                        </button>
                                    </div>
                                    <Button onClick={() => setIsCreatePollOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> New Poll
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CollegePollsList college={collegeName} status={pollFilter} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Broadcast Notifications</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Send alerts and updates to all students</p>
                            </div>
                            <Button onClick={() => setIsCreateBroadcastOpen(true)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Send Broadcast
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-blue-700 dark:text-blue-400">Welcome to Campus Hub!</p>
                                            <p className="text-sm text-blue-600 dark:text-blue-500">Sent to all students • 2 days ago</p>
                                        </div>
                                        <Badge className="bg-blue-500 text-white">Sent</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Notes & Papers Management</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Share study materials and papers with students</p>
                            </div>
                            <Button onClick={() => setIsCreateNoteOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Note / Paper
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <NotesList collegeName={collegeName} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Smart Campus Tab */}
                <TabsContent value="locations" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Smart Campus Management</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage campus locations and navigation links</p>
                            </div>
                            <Button onClick={() => setIsCreateLocationOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Location
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <LocationsList collegeName={collegeName} />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* Dialogs */}
            <CreateClubDialog
                open={isCreateClubOpen}
                onClose={() => setIsCreateClubOpen(false)}
                collegeName={collegeName}
                collegeUsers={collegeStudents}
            />

            <CreatePollDialog
                open={isCreatePollOpen}
                onClose={() => setIsCreatePollOpen(false)}
                collegeName={collegeName}
            />

            <CreateBroadcastDialog
                open={isCreateBroadcastOpen}
                onClose={() => setIsCreateBroadcastOpen(false)}
                collegeName={collegeName}
            />

            <CreateChallengeDialog
                open={isCreateChallengeOpen}
                onClose={() => setIsCreateChallengeOpen(false)}
                collegeName={collegeName}
            />



            <UserDetailsDialog
                user={selectedUser}
                open={isUserDetailsOpen}
                onClose={() => setIsUserDetailsOpen(false)}
            />

            <CreateNoteDialog
                open={isCreateNoteOpen}
                onClose={() => setIsCreateNoteOpen(false)}
                collegeName={collegeName}
            />

            <CreateLocationDialog
                open={isCreateLocationOpen}
                onClose={() => setIsCreateLocationOpen(false)}
                collegeName={collegeName}
            />

            <ErrorBoundary name="Club Settings Dialog">
                <ComprehensiveClubSettingsDialog
                    open={isClubSettingsOpen}
                    onClose={() => setIsClubSettingsOpen(false)}
                    club={selectedClubForSettings}
                    collegeUsers={collegeStudents}
                />
            </ErrorBoundary>

            <Dialog open={isCollegeTasksOpen} onOpenChange={setIsCollegeTasksOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Global College Tasks
                        </DialogTitle>
                    </DialogHeader>
                    <ManageClubTasks readOnly={true} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LocationsList({ collegeName }: { collegeName: string }) {
    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['campus-locations', collegeName],
        queryFn: () => api.getLocations(collegeName)
    });

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campus-locations', collegeName] });
            toast({ title: 'Location deleted successfully' });
        }
    });

    if (isLoading) return <div className="text-center py-12">Loading locations...</div>;

    if (locations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No campus locations added yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {locations.map((loc: any) => (
                <div key={loc._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{loc.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{loc.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px]">{loc.category}</Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">Added: {new Date(loc.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <a href={loc.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                <Navigation className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => {
                            if (confirm('Are you sure you want to delete this location?')) {
                                deleteMutation.mutate(loc._id);
                            }
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function NotesList({ collegeName }: { collegeName: string }) {
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes', collegeName],
        queryFn: () => api.getNotes(collegeName)
    });

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteNote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes', collegeName] });
            toast({ title: 'Note deleted successfully' });
        }
    });

    if (isLoading) return <div className="text-center py-12">Loading notes...</div>;

    if (notes.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No notes or papers uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {notes.map((note: any) => (
                <div key={note._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{note.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-md">{note.description || 'No description'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {note.isPublic ? (
                                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">Public</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">Private</Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">Added on {new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <a href={note.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => {
                            if (confirm('Are you sure you want to delete this note?')) {
                                deleteMutation.mutate(note._id);
                            }
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CollegePollsList({ college, status }: { college: string, status: string }) {
    const { user } = useAuth();
    const { data: polls = [], isLoading } = useQuery<any[]>({
        queryKey: ["college-polls", college, status],
        queryFn: () => api.getPolls(user?.id, user?.role, user?.email, undefined, college, status)
    });

    const [extendPollId, setExtendPollId] = useState<string | null>(null);
    const [currentExpiry, setCurrentExpiry] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const closePollMutation = useMutation({
        mutationFn: (pollId: string) => api.updatePollStatus(pollId, 'closed'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["college-polls", college] });
            toast({ title: "Poll closed successfully" });
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const getTimeRemaining = (expiresAt: string) => {
        if (!expiresAt) return null;
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;

        if (diff <= 0) return "Expired";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m remaining`;
    };

    return (
        <div className="space-y-4">
            {polls.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <p>No {status === 'active' ? 'active' : 'past'} college polls.</p>
                </div>
            ) : (
                polls.map((p: any) => {
                    const resultsHidden = p.options[0]?.votes === undefined;
                    const totalVotes = resultsHidden ? 0 : p.options.reduce((acc: number, curr: any) => acc + curr.votes, 0);
                    const timeRemaining = p.expiresAt ? getTimeRemaining(p.expiresAt) : null;
                    const isCreator = user?.id === p.createdBy;

                    return (
                        <Card key={p._id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold">{p.question}</p>
                                    {p.expiresAt && (
                                        <p className={`text-xs mt-1 ${timeRemaining === 'Expired' ? 'text-destructive' : 'text-blue-500'}`}>
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {timeRemaining || 'Expired'}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                                    {p.status === 'active' && isCreator && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-xs px-2"
                                                onClick={() => {
                                                    setExtendPollId(p._id);
                                                    setCurrentExpiry(p.expiresAt);
                                                }}
                                            >
                                                Extend
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-destructive hover:text-destructive px-2"
                                                onClick={() => closePollMutation.mutate(p._id)}
                                            >
                                                Close
                                            </Button>
                                        </>
                                    )}
                                    {p.status === 'closed' && isCreator && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs px-2 border-primary text-primary hover:bg-primary/10"
                                            onClick={() => {
                                                setExtendPollId(p._id);
                                                setCurrentExpiry(p.expiresAt);
                                            }}
                                        >
                                            Restart
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {p.options.map((o: any, i: number) => {
                                    const percentage = resultsHidden || totalVotes === 0 ? 0 : Math.round((o.votes / totalVotes) * 100);
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{o.text}</span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {resultsHidden ? 'Hidden' : `${percentage}% (${o.votes})`}
                                                </span>
                                            </div>
                                            {!resultsHidden && (
                                                <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percentage}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })
            )}

            {extendPollId && (
                <ExtendPollDialog
                    open={!!extendPollId}
                    onClose={() => setExtendPollId(null)}
                    pollId={extendPollId}
                    currentExpiry={currentExpiry}
                />
            )}
        </div>
    );
}
