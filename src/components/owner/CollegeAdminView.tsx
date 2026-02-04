import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { cn } from "@/lib/utils";

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
    FileText,
    Plus,
    BookOpen,
    ExternalLink,
    Trash2,
    MapPin,
    Navigation,
    Loader2,
    ClipboardList,
    Clock,
    Megaphone,
    Square
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateClubDialog } from '@/components/owner/CreateClubDialog';
import { CreatePollDialog } from '@/components/owner/CreatePollDialog';
import { CreateBroadcastDialog } from '@/components/owner/CreateBroadcastDialog';
import { CreateChallengeDialog } from '@/components/owner/CreateChallengeDialog';
import { UserDetailsDialog } from '@/components/owner/UserDetailsDialog';
import { CreateNoteDialog } from '@/components/owner/CreateNoteDialog';
import { CreateLocationDialog } from '@/components/owner/CreateLocationDialog';
import { ExtendPollDialog } from '@/components/owner/ExtendPollDialog';
import { ComprehensiveClubSettingsDialog } from '@/components/owner/ComprehensiveClubSettingsDialog';
import { ManageClubTasks } from '@/components/dashboard/ManageClubTasks';
import { ClubCoordinatorView } from '@/components/club/ClubCoordinatorView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CollegeFeedbackManagement } from '@/components/owner/CollegeFeedbackManagement';
import { MessageCircle } from 'lucide-react';
import { AdRequestForm } from '@/components/common/AdRequestForm';
import { MyAdRequests } from '@/components/common/MyAdRequests';

interface CollegeAdminViewProps {
    collegeName: string;
}

export function CollegeAdminView({ collegeName }: CollegeAdminViewProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

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
    const [selectedClubIdForManagement, setSelectedClubIdForManagement] = useState<string>('');

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
                totalStudents: (myCollegeUsers || []).length,
                totalCoAdmins: (myCollegeUsers || []).filter((u: any) => u?.role === 'co_admin').length,
                totalClubs: (myCollegeClubs || []).length,
                totalChallenges: (myCollegeChallenges || []).length,
                totalProjects: (myCollegeProjects || []).length,
                blockedStudents: (myCollegeUsers || []).filter((u: any) => u?.blocked?.website).length
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

    const filteredStudents = (collegeStudents || []).filter((u: any) =>
        u?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        u?.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
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

                    <TabsTrigger value="polls" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Target className="h-4 w-4 mr-2" />
                        Polls
                    </TabsTrigger>
                    <TabsTrigger value="club-management" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        Clubs
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="data-[state=active]:bg-background">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Feedback
                    </TabsTrigger>
                    <TabsTrigger value="ads" className="data-[state=active]:bg-background">
                        <Megaphone className="h-4 w-4 mr-2" />
                        Ads
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

                            <Button variant="outline" className="justify-start" onClick={() => setActiveTab('club-management')}>
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

                {/* Clubs Tab (Combined Management) */}
                <TabsContent value="club-management" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Club Management</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Select a club to access its coordinator panel directly</p>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Button variant="outline" onClick={() => setIsCollegeTasksOpen(true)} className="flex-1 sm:flex-none h-9 text-xs">
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    College Tasks
                                </Button>
                                <Button onClick={() => setIsCreateClubOpen(true)} className="flex-1 sm:flex-none h-9 text-xs">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Create Club
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="max-w-md space-y-2">
                                    <Label>Select Club to Manage</Label>
                                    <Select value={selectedClubIdForManagement} onValueChange={setSelectedClubIdForManagement}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a club..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {collegeClubs.map((club: any) => (
                                                <SelectItem key={club._id || club.id} value={club._id || club.id}>
                                                    {club.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedClubIdForManagement ? (
                                    <div className="border-t pt-6 mt-6">
                                        <div className="flex justify-end mb-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const club = collegeClubs.find((c: any) => (c._id || c.id) === selectedClubIdForManagement);
                                                    setSelectedClubForSettings(club);
                                                    setIsClubSettingsOpen(true);
                                                }}
                                            >
                                                <Settings className="h-4 w-4 mr-2" /> Club Settings
                                            </Button>
                                        </div>
                                        <ClubCoordinatorView
                                            clubId={selectedClubIdForManagement}
                                            collegeName={collegeName}
                                            isImpersonating={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed rounded-xl">
                                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-muted-foreground">Select a club from the list above or create a new one to begin management.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-6">
                    <CollegeFeedbackManagement collegeName={collegeName} />
                </TabsContent>

                <TabsContent value="ads" className="space-y-6">
                    <Card className="border-border/50 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-primary" />
                                Request Advertisement
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Submit a campaign for platform-wide or targeted display. All requests require Owner approval.</p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AdRequestForm />
                        </CardContent>
                    </Card>

                    <MyAdRequests />
                </TabsContent>

                <TabsContent value="polls" className="space-y-6">
                    <div className="grid md:grid-cols-1 gap-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>College-wide Polls</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Feedback from all students in {collegeName}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                    <div className="bg-secondary p-1 rounded-lg flex text-xs font-semibold w-full sm:w-auto">
                                        <button
                                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${pollFilter === 'active' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            onClick={() => setPollFilter('active')}
                                        >
                                            Active
                                        </button>
                                        <button
                                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${pollFilter === 'closed' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            onClick={() => setPollFilter('closed')}
                                        >
                                            History
                                        </button>
                                    </div>
                                    <Button onClick={() => setIsCreatePollOpen(true)} className="h-10 sm:h-9 text-xs sm:text-sm">
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
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Broadcast Notifications</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Send alerts and updates to all students</p>
                            </div>
                            <Button onClick={() => setIsCreateBroadcastOpen(true)} className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Send Broadcast
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <NotificationsHistory collegeName={collegeName} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Notes & Papers Management</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Share study materials and papers with students</p>
                            </div>
                            <Button onClick={() => setIsCreateNoteOpen(true)} className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm">
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
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Smart Campus Management</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage campus locations and navigation links</p>
                            </div>
                            <Button onClick={() => setIsCreateLocationOpen(true)} className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm">
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
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s remaining`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft) return null;

    return (
        <p className={`text-xs mt-1 font-mono ${timeLeft === 'Expired' ? 'text-destructive' : 'text-blue-500 animate-pulse'}`}>
            <Clock className="inline h-3 w-3 mr-1" />
            {timeLeft}
        </p>
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
                    const canManagePoll = user?.id === p.createdBy || user?.role === 'owner' || user?.role === 'co_admin' || user?.role === 'club_coordinator';

                    return (
                        <Card key={p._id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold">{p.question}</p>
                                    {p.expiresAt && p.status === 'active' ? (
                                        <PollCountdown expiresAt={p.expiresAt} />
                                    ) : (
                                        p.status === 'active' && <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> No Timer Set</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={(p.status === 'active') ? 'default' : 'secondary'} className="font-bold">
                                        {(p.expiresAt && new Date() >= new Date(p.expiresAt)) ? 'EXPIRED' : p.status.toUpperCase()}
                                    </Badge>
                                    {canManagePoll && p.status === 'active' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs px-2 gap-1 border-primary text-primary hover:bg-primary/5"
                                                onClick={() => {
                                                    setExtendPollId(p._id);
                                                    setCurrentExpiry(p.expiresAt);
                                                }}
                                            >
                                                <Clock className="h-3 w-3" /> {p.expiresAt ? 'Extend' : 'Set Timer'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-destructive hover:bg-destructive/5 px-2 gap-1"
                                                onClick={() => { if (confirm("Close this poll?")) closePollMutation.mutate(p._id); }}
                                            >
                                                <Square className="h-3 w-3 fill-current" /> Close
                                            </Button>
                                        </>
                                    )}
                                    {canManagePoll && p.status === 'closed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs px-2 gap-1 border-primary text-primary hover:bg-primary/5 font-bold"
                                            onClick={() => {
                                                setExtendPollId(p._id);
                                                setCurrentExpiry(p.expiresAt);
                                            }}
                                        >
                                            <Plus className="h-3 w-3" /> Restart
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
                    college={college}
                />
            )}
        </div>
    );
}

function NotificationsHistory({ collegeName }: { collegeName: string }) {
    const { user } = useAuth();
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['broadcast-notifications', user?.id, collegeName],
        queryFn: async () => {
            // explicitly request manual broadcasts only
            return await api.getNotifications(user?.id || '', user?.role || 'student', undefined, true);
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    if (notifications.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No manual broadcast history yet.</p>
                <p className="text-xs mt-2 italic px-8">Broadcasts sent to students or groups will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
            {notifications.map((notif: any) => (
                <Card key={notif._id || notif.id} className={cn(
                    "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 shadow-sm",
                    notif.type === 'alert' ? "border-l-red-500 bg-red-50/10" :
                        notif.type === 'success' ? "border-l-green-500 bg-green-50/10" :
                            notif.type === 'warning' ? "border-l-amber-500 bg-amber-50/10" :
                                "border-l-primary bg-primary/5"
                )}>
                    <CardHeader className="pb-3 border-b border-border/10">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest inline-block mb-1",
                                    notif.type === 'alert' ? "bg-red-100 text-red-700" :
                                        notif.type === 'success' ? "bg-green-100 text-green-700" :
                                            notif.type === 'warning' ? "bg-amber-100 text-amber-700" :
                                                "bg-primary/20 text-primary"
                                )}>
                                    {notif.type || 'INFO'} BROADCAST
                                </span>
                                <h4 className="font-extrabold text-xl leading-tight text-foreground/90">{notif.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0.5 border shadow-sm bg-white dark:bg-black">
                                        SENT TO: {notif.recipient.toUpperCase()}
                                    </Badge>
                                    <span className="opacity-30 text-[10px]">|</span>
                                    <span className="flex items-center gap-1 uppercase tracking-tight text-[10px] font-bold text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {new Date(notif.createdAt).toLocaleDateString()} AT {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <Badge variant={notif.type === 'alert' || notif.type === 'warning' ? 'destructive' : (notif.type === 'success' ? 'default' : 'secondary')} className="font-black uppercase text-[10px] h-5 shadow-sm">
                                {notif.type}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-4">
                        <div className="bg-background/90 p-5 rounded-2xl border border-border shadow-inner group-hover:bg-background transition-all">
                            <ExpandableText text={notif.message} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ExpandableText({ text }: { text: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const limit = 200;

    if (!text || text.length <= limit) {
        return <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground font-medium">{text}</p>;
    }

    return (
        <div>
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground font-medium">
                {isExpanded ? text : `${text.substring(0, limit)}...`}
            </p>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-primary mt-2 hover:underline focus:outline-none"
            >
                {isExpanded ? 'READ LESS' : 'READ MORE'}
            </button>
        </div>
    );
}
