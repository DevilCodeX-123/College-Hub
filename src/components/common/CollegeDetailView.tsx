import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Building2,
    Key,
    Shield,
    Users,
    Target,
    FolderKanban,
    Vote,
    ChevronDown,
    ChevronUp,
    Calendar,
    Mail,
    Settings,
    Plus,
    UserCheck,
    Loader2,
    Flag,
    UserCog,
    Rocket,
    Star,
    Edit,
    Trash2,
    BookOpen,
    ExternalLink,
    MapPin,
    Navigation,
    Crown,
    UserPlus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ChangeAdminDialog } from '@/components/owner/ChangeAdminDialog';
import { UserDetailsDialog } from '@/components/owner/UserDetailsDialog';
import { AssignHeadDialog } from '@/components/owner/AssignHeadDialog';
import { AssignCoreTeamDialog } from '@/components/owner/AssignCoreTeamDialog';
import { CreateClubDialog } from '@/components/owner/CreateClubDialog';
import { CreateChallengeDialog } from '@/components/owner/CreateChallengeDialog';
import { EditChallengeDialog } from '@/components/owner/EditChallengeDialog';
import { CreateProjectDialog } from '@/components/owner/CreateProjectDialog';
import { EditProjectDialog } from '@/components/owner/EditProjectDialog';
import { ManageClubTeamDialog } from '@/components/owner/ManageClubTeamDialog';
import { GradeSubmissionDialog } from '@/components/owner/GradeSubmissionDialog';
import { EditClubDialog } from '@/components/owner/EditClubDialog';
import { CreateNoteDialog } from '@/components/owner/CreateNoteDialog';
import { CreateLocationDialog } from '@/components/owner/CreateLocationDialog';

interface CollegeDetailViewProps {
    collegeName: string;
}

export function CollegeDetailView({ collegeName }: CollegeDetailViewProps) {
    const [studentsOpen, setStudentsOpen] = useState(false);
    const [clubsOpen, setClubsOpen] = useState(false);
    const [challengesOpen, setChallengesOpen] = useState(false);
    const [challengeHistoryOpen, setChallengeHistoryOpen] = useState(false);
    const [projectsOpen, setProjectsOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [locationsOpen, setLocationsOpen] = useState(false);
    const [teamOpen, setTeamOpen] = useState(false);
    const { toast } = useToast();

    // Dialog states
    const [changeAdminOpen, setChangeAdminOpen] = useState(false);
    const [assignHeadOpen, setAssignHeadOpen] = useState(false);
    const [assignCoreTeamOpen, setAssignCoreTeamOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);

    // New Management Dialog States
    const [createClubOpen, setCreateClubOpen] = useState(false);
    const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
    const [editChallengeOpen, setEditChallengeOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [manageTeamOpen, setManageTeamOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState<any>(null);
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [editClubOpen, setEditClubOpen] = useState(false);
    const [createNoteOpen, setCreateNoteOpen] = useState(false);
    const [createLocationOpen, setCreateLocationOpen] = useState(false);

    const handleManageTeam = (club: any) => {
        setSelectedClub(club);
        setManageTeamOpen(true);
    };

    const handleStudentSettings = (student: any) => {
        setSelectedStudent(student);
        setStudentDetailsOpen(true);
    };

    const handleEditChallenge = (challenge: any) => {
        setSelectedChallenge(challenge);
        setEditChallengeOpen(true);
    };

    const handleEditClub = (club: any) => {
        setSelectedClub(club);
        setEditClubOpen(true);
    };

    const navigate = useNavigate();

    const handleViewClubDetails = (club: any) => {
        navigate(`/clubs/${club._id || club.id}`);
    };

    const queryClient = useQueryClient();

    const deleteClubMutation = useMutation({
        mutationFn: (id: string) => api.deleteClub(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            toast({ title: 'Club deleted successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to delete club',
                description: error.response?.data?.message || 'Error deleting club',
                variant: 'destructive'
            });
        }
    });

    const handleDeleteClub = (club: any) => {
        if (confirm(`Are you sure you want to delete "${club.name}"? This action cannot be undone.`)) {
            deleteClubMutation.mutate(club._id || club.id);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteChallenge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
        }
    });

    const handleDeleteChallenge = (challenge: any) => {
        if (confirm(`Are you sure you want to delete "${challenge.title}"?`)) {
            deleteMutation.mutate(challenge._id || challenge.id);
        }
    };

    const handleEditProject = (project: any) => {
        setSelectedProject(project);
        setEditProjectOpen(true);
    };

    const deleteProjectMutation = useMutation({
        mutationFn: (id: string) => api.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });

    const handleDeleteProject = (project: any) => {
        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            deleteProjectMutation.mutate(project._id || project.id);
        }
    };

    // Fetch all data
    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => api.getUsers()
    });

    const { data: clubs = [], isLoading: clubsLoading } = useQuery({
        queryKey: ['clubs'],
        queryFn: () => api.getClubs()
    });

    const { data: challenges = [], isLoading: challengesLoading } = useQuery({
        queryKey: ['challenges'],
        queryFn: () => api.getChallenges()
    });

    const { data: projects = [], isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.getProjects()
    });

    if (usersLoading || clubsLoading || challengesLoading || projectsLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!collegeName) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">Select a college to view its admin panel data</p>
                </CardContent>
            </Card>
        );
    }

    // Filter data for this college
    const collegeUsers = users.filter((u: any) => u.college === collegeName);
    const collegeAdmin = collegeUsers.find((u: any) => u.role === 'admin' || (u.role === 'club_coordinator' && !collegeUsers.some((a: any) => a.role === 'admin')));

    const isAdminLimitReached = collegeUsers.some((u: any) => u.role === 'admin');

    const actualHeads = collegeUsers.filter((u: any) => u.role === 'co_admin');
    const actualCoreTeam = collegeUsers.filter((u: any) => u.role === 'core_member');

    const collegeChallenges = challenges.filter((c: any) => c.clubName?.includes(collegeName));
    const now = new Date();
    const activeChallenges = collegeChallenges.filter((c: any) => !c.deadline || new Date(c.deadline) >= now);
    const challengeHistory = collegeChallenges.filter((c: any) => c.deadline && new Date(c.deadline) < now);

    const collegeProjects = projects.filter((p: any) => p.college === collegeName);

    const collegeClubs = clubs.filter((club: any) =>
        club.coordinatorId && collegeUsers.some((u: any) => u.id === club.coordinatorId)
    );

    const getChallengeParticipants = (challenge: any) => {
        return collegeUsers.filter((user: any) =>
            user.activity?.some((act: any) =>
                act.type === 'challenge' && act.challengeId === challenge._id
            )
        );
    };

    const getProjectMembers = (project: any) => {
        return collegeUsers.filter((user: any) =>
            user.activity?.some((act: any) =>
                act.type === 'project' && act.projectId === project._id
            )
        );
    };

    return (
        <div className="space-y-6">
            {/* College Overview - Clickable Cards */}
            {/* College Overview - Clickable Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setStudentsOpen(!studentsOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span>Students</span>
                            {studentsOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{collegeUsers.length}</div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setClubsOpen(!clubsOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span>Clubs</span>
                            {clubsOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{collegeClubs.length}</div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setChallengesOpen(!challengesOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span>Tasks</span>
                            {challengesOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{collegeChallenges.length}</div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setProjectsOpen(!projectsOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span>Projects</span>
                            {projectsOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{collegeProjects.length}</div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setNotesOpen(!notesOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span>Notes</span>
                            {notesOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-sm font-bold opacity-60">Manage</div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer border-l-4 border-l-blue-500 hover:shadow-lg transition-all" onClick={() => setTeamOpen(!teamOpen)}>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                            <span className="text-blue-700">Team</span>
                            {teamOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-lg sm:text-xl font-bold text-blue-800">{actualHeads.length + (collegeAdmin ? 1 : 0)} Adm</div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Areas */}
            <Collapsible open={studentsOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Students List ({collegeUsers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {collegeUsers.map((student: any) => (
                                    <div key={student._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold shrink-0">
                                                {student.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{student.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{student.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="text-[10px]">{student.role}</Badge>
                                                <Badge variant="outline" className="text-[10px]">{student.points} XP</Badge>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleStudentSettings(student)}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={clubsOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Flag className="h-5 w-5" />
                                Clubs ({collegeClubs.length})
                            </CardTitle>
                            <Button size="sm" onClick={() => setCreateClubOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Club
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {collegeClubs.map((club: any) => (
                                    <div key={club._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                                                {club.logo ? (
                                                    <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Flag className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold truncate">{club.name}</h4>
                                                <Badge variant="outline" className="text-[10px]">{club.category}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                                            <Button variant="outline" size="sm" onClick={() => handleViewClubDetails(club)} className="h-8 text-[10px] sm:text-xs">
                                                View
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClub(club)} className="h-8 w-8 p-0">
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleManageTeam(club)} className="h-8 w-8 p-0">
                                                <UserCog className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClub(club)} className="h-8 w-8 p-0">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={challengesOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Active Challenges ({activeChallenges.length})
                            </CardTitle>
                            <Button size="sm" onClick={() => setCreateChallengeOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Challenge
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activeChallenges.map((challenge: any) => (
                                    <div key={challenge._id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-lg">{challenge.title}</h4>
                                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <Badge variant="outline">{challenge.points} XP</Badge>
                                                    <span className="text-xs text-muted-foreground">Deadline: {new Date(challenge.deadline).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditChallenge(challenge)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteChallenge(challenge)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={projectsOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="h-5 w-5" />
                                Projects ({collegeProjects.length})
                            </CardTitle>
                            <Button size="sm" onClick={() => setCreateProjectOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Project
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {collegeProjects.map((project: any) => (
                                    <div key={project._id} className="border rounded-lg p-4 text-center items-center justify-between flex">
                                        <div className="text-left">
                                            <h4 className="font-semibold">{project.title}</h4>
                                            <p className="text-sm text-muted-foreground">{project.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={notesOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Notes & Papers Management
                            </CardTitle>
                            <Button size="sm" onClick={() => setCreateNoteOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Note
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <NotesList collegeName={collegeName} />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={locationsOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Smart Campus Management
                            </CardTitle>
                            <Button size="sm" onClick={() => setCreateLocationOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Location
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <LocationsList collegeName={collegeName} />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={teamOpen}>
                <CollapsibleContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Executive Section */}
                        <Card className="border-l-4 border-l-blue-600">
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-blue-900">Executive Panel</CardTitle>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Prime leadership for {collegeName}</p>
                                </div>
                                <Button size="sm" onClick={() => setAssignHeadOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-8">
                                    <UserPlus className="h-3.5 w-3.5 mr-2" /> Assign Co-Admin
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-blue-50">
                                    {/* Main Admin */}
                                    {collegeAdmin && (
                                        <div className="flex items-center justify-between p-4 bg-blue-50/20">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-200">
                                                    <Crown className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-blue-950 text-sm uppercase tracking-tight">{collegeAdmin.name}</p>
                                                    <Badge className="bg-blue-600 text-[8px] h-4 py-0 font-black uppercase tracking-widest leading-none">Chief Admin</Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleStudentSettings(collegeAdmin)}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {/* Co Admins */}
                                    {actualHeads.map((head: any) => (
                                        <div key={head._id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Shield className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-blue-900 text-sm">{head.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 uppercase">Co-Admin</Badge>
                                                        {head.customTitle && <span className="text-[10px] text-muted-foreground italic">({head.customTitle})</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleStudentSettings(head)}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {actualHeads.length === 0 && !collegeAdmin && (
                                        <p className="p-8 text-center text-sm text-muted-foreground italic">No executive team assigned.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Core Operations Section */}
                        <Card className="border-l-4 border-l-slate-400">
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-slate-500" />
                                        <CardTitle>Operations Team</CardTitle>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Core members supporting operations</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setAssignCoreTeamOpen(true)} className="h-8">
                                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Member
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {actualCoreTeam.map((member: any) => (
                                        <div key={member._id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border font-bold text-slate-500">
                                                    {member.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 uppercase">Core Ops</Badge>
                                                        {member.customTitle && <span className="text-[10px] text-muted-foreground italic">({member.customTitle})</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleStudentSettings(member)}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {actualCoreTeam.length === 0 && (
                                        <p className="p-8 text-center text-sm text-muted-foreground italic">No operations team assigned.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Dialogs */}
            <ChangeAdminDialog
                open={changeAdminOpen}
                onClose={() => setChangeAdminOpen(false)}
                currentAdmin={collegeAdmin}
                collegeUsers={collegeUsers}
                collegeName={collegeName}
            />

            <UserDetailsDialog
                user={selectedStudent}
                open={studentDetailsOpen}
                onClose={() => setStudentDetailsOpen(false)}
            />

            <AssignHeadDialog
                open={assignHeadOpen}
                onClose={() => setAssignHeadOpen(false)}
                collegeUsers={collegeUsers}
                collegeName={collegeName}
            />

            <AssignCoreTeamDialog
                open={assignCoreTeamOpen}
                onClose={() => setAssignCoreTeamOpen(false)}
                collegeUsers={collegeUsers}
                collegeName={collegeName}
            />

            <CreateClubDialog
                open={createClubOpen}
                onClose={() => setCreateClubOpen(false)}
                collegeName={collegeName}
                collegeUsers={collegeUsers}
            />

            <CreateChallengeDialog
                open={createChallengeOpen}
                onClose={() => setCreateChallengeOpen(false)}
                collegeName={collegeName}
            />

            <EditChallengeDialog
                open={editChallengeOpen}
                onClose={() => setEditChallengeOpen(false)}
                challenge={selectedChallenge}
            />

            <CreateProjectDialog
                open={createProjectOpen}
                onClose={() => setCreateProjectOpen(false)}
                collegeName={collegeName}
            />

            <EditProjectDialog
                open={editProjectOpen}
                onClose={() => setEditProjectOpen(false)}
                project={selectedProject}
            />

            <ManageClubTeamDialog
                open={manageTeamOpen}
                onClose={() => setManageTeamOpen(false)}
                club={selectedClub}
                collegeUsers={collegeUsers}
            />

            <GradeSubmissionDialog
                open={gradeDialogOpen}
                onClose={() => setGradeDialogOpen(false)}
                submission={selectedSubmission}
            />

            <EditClubDialog
                open={editClubOpen}
                onClose={() => setEditClubOpen(false)}
                club={selectedClub}
                collegeUsers={collegeUsers}
            />

            <CreateNoteDialog
                open={createNoteOpen}
                onClose={() => setCreateNoteOpen(false)}
                collegeName={collegeName}
            />

            <CreateLocationDialog
                open={createLocationOpen}
                onClose={() => setCreateLocationOpen(false)}
                collegeName={collegeName}
            />
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
