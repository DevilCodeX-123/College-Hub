import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Settings,
    UserCog,
    Trophy,
    History,
    Users,
    Plus,
    ClipboardList,
    Zap,
    Crown,
    Shield,
    Save,
    Trash2,
    Clock,
    UserCheck,
    UserX,
    CheckCircle2,
    XCircle,
    MapPin,
    Link as LinkIcon,
    Award,
    Check,
    ChevronsUpDown,
    X,
    AlertTriangle
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ManageClubTasks } from '../dashboard/ManageClubTasks';
import { ClubEventsManager } from '../club/ClubEventsManager';

interface ComprehensiveClubSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    club: any;
    collegeUsers: any[];
}

export function ComprehensiveClubSettingsDialog({
    open,
    onClose,
    club,
    collegeUsers
}: ComprehensiveClubSettingsDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('basic');
    const [isTasksTabActive, setIsTasksTabActive] = useState(false);
    const [isConfirmCoordinatorOpen, setIsConfirmCoordinatorOpen] = useState(false);

    // Basic Info State
    const [basicInfo, setBasicInfo] = useState({
        name: club?.name || '',
        description: club?.description || '',
        logo: club?.logo || '',
        category: club?.category || '',
        instagram: club?.socialLinks?.instagram || '',
        linkedin: club?.socialLinks?.linkedin || '',
        website: club?.socialLinks?.website || '',
        banner: club?.banner || ''
    });

    // Coordinator State
    const [selectedCoordinator, setSelectedCoordinator] = useState(club?.coordinatorId || '');

    const isCoordinatorChanged = selectedCoordinator !== (club?.coordinatorId || '');
    // Achievements State
    const [achievements, setAchievements] = useState(club?.achievements || []);
    const [newAchievement, setNewAchievement] = useState({ title: '', description: '', earnedAt: '' });

    // History State
    const [history, setHistory] = useState(club?.history || []);

    // Team Members State
    const [coreTeam, setCoreTeam] = useState(club?.coreTeam || []);

    // Pending Members State
    const [pendingMembers, setPendingMembers] = useState(club?.pendingMembers || []);

    // Sync state with props when club changes
    useEffect(() => {
        if (club) {
            setBasicInfo({
                name: club.name || '',
                description: club.description || '',
                logo: club.logo || '',
                category: club.category || '',
                instagram: club.socialLinks?.instagram || '',
                linkedin: club.socialLinks?.linkedin || '',
                website: club.socialLinks?.website || '',
                banner: club.banner || ''
            });
            setSelectedCoordinator(club.coordinatorId || '');
            setAchievements(club.achievements || []);
            setHistory(club.history || []);
            setCoreTeam(club.coreTeam || []);
            setPendingMembers(club.pendingMembers || []);
        }
    }, [club]);

    // Approve Member Mutation
    const approveMemberMutation = useMutation({
        mutationFn: (userId: string) => api.approveJoinRequest(club._id || club.id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Member approved successfully!' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to approve member',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    });

    // Reject Member Mutation
    const rejectMemberMutation = useMutation({
        mutationFn: (userId: string) => api.rejectJoinRequest(club._id || club.id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Member rejected' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to reject member',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    });

    // Update Club Mutation
    const updateClubMutation = useMutation({
        mutationFn: (data: any) => api.updateClub(club._id || club.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Club updated successfully!' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update club',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    });

    const handleSaveBasicInfo = () => {
        updateClubMutation.mutate({
            name: basicInfo.name,
            description: basicInfo.description,
            logo: basicInfo.logo,
            category: basicInfo.category,
            socialLinks: {
                instagram: basicInfo.instagram,
                linkedin: basicInfo.linkedin,
                website: basicInfo.website
            },
            banner: basicInfo.banner,
            coverImage: basicInfo.banner
        }, {
            onSuccess: () => onClose()
        });
    };

    const handleSaveCoordinator = () => {
        const coordinator = collegeUsers.find(u => u._id === selectedCoordinator || u.id === selectedCoordinator);
        if (!coordinator) {
            toast({ title: 'Please select a coordinator', variant: 'destructive' });
            return;
        }

        setIsConfirmCoordinatorOpen(true);
    };

    const confirmSaveCoordinator = () => {
        const coordinator = collegeUsers.find(u => u._id === selectedCoordinator || u.id === selectedCoordinator);
        if (!coordinator) return;

        updateClubMutation.mutate({
            coordinatorId: selectedCoordinator,
            coordinator: coordinator.name
        }, {
            onSuccess: () => {
                setIsConfirmCoordinatorOpen(false);
                onClose();
            }
        });
    };

    const handleAddAchievement = () => {
        if (!newAchievement.title) {
            toast({ title: 'Please enter achievement title', variant: 'destructive' });
            return;
        }

        const updatedAchievements = [...achievements, { ...newAchievement, _id: Date.now().toString() }];
        setAchievements(updatedAchievements);
        updateClubMutation.mutate({ achievements: updatedAchievements });
        setNewAchievement({ title: '', description: '', earnedAt: '' });
    };

    const handleDeleteAchievement = (id: string) => {
        const updatedAchievements = achievements.filter((a: any) => a._id !== id);
        setAchievements(updatedAchievements);
        updateClubMutation.mutate({ achievements: updatedAchievements });
    };

    const handleAddTeamMember = (userId: string) => {
        const user = collegeUsers.find(u => (u._id || u.id) === userId);
        if (!user) return;

        const updatedTeam = [
            ...coreTeam,
            {
                userId: user._id || user.id,
                name: user.name,
                role: 'core_member',
                customTitle: 'Team Member'
            }
        ];
        setCoreTeam(updatedTeam);
        updateClubMutation.mutate({ coreTeam: updatedTeam });
    };

    const handleRemoveTeamMember = (userId: string) => {
        const updatedTeam = coreTeam.filter((m: any) => m.userId !== userId);
        setCoreTeam(updatedTeam);
        updateClubMutation.mutate({ coreTeam: updatedTeam });
    };

    const handleUpdateTeamMemberRole = (userId: string, newRole: string, newTitle: string) => {
        const updatedTeam = coreTeam.map((m: any) =>
            m.userId === userId ? { ...m, role: newRole, customTitle: newTitle } : m
        );
        setCoreTeam(updatedTeam);
        updateClubMutation.mutate({ coreTeam: updatedTeam });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {!club ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Comprehensive Club Settings - {club.name}
                            </DialogTitle>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={(v) => {
                            setActiveTab(v);
                            setIsTasksTabActive(v === 'tasks');
                        }} className="w-full">
                            <TabsList className="grid w-full grid-cols-7">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="coordinator">Coordinator</TabsTrigger>
                                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                                <TabsTrigger value="history">Events</TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                                <TabsTrigger value="pending">
                                    Pending
                                    {pendingMembers.length > 0 && (
                                        <Badge variant="destructive" className="ml-2">{pendingMembers.length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4">
                                {/* Club Stats Snapshot */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="pt-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black text-primary uppercase tracking-widest">Club Points</p>
                                                <p className="text-2xl font-black">{club?.points || 0}</p>
                                            </div>
                                            <Trophy className="h-8 w-8 text-primary/40" />
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-emerald-50 border-emerald-200">
                                        <CardContent className="pt-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Club Coins</p>
                                                <p className="text-2xl font-black">{club?.coins || 0}</p>
                                            </div>
                                            <Zap className="h-8 w-8 text-emerald-400" />
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Club Name</Label>
                                            <Input
                                                value={basicInfo.name}
                                                onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Logo URL</Label>
                                            <Input
                                                value={basicInfo.logo}
                                                onChange={(e) => setBasicInfo({ ...basicInfo, logo: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={basicInfo.description}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select value={basicInfo.category} onValueChange={(v) => setBasicInfo({ ...basicInfo, category: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Technical">Technical</SelectItem>
                                                <SelectItem value="Cultural">Cultural</SelectItem>
                                                <SelectItem value="Sports">Sports</SelectItem>
                                                <SelectItem value="Social">Social</SelectItem>
                                                <SelectItem value="Academic">Academic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Instagram</Label>
                                            <Input
                                                value={basicInfo.instagram}
                                                onChange={(e) => setBasicInfo({ ...basicInfo, instagram: e.target.value })}
                                                placeholder="@username"
                                            />
                                        </div>
                                        <div>
                                            <Label>LinkedIn</Label>
                                            <Input
                                                value={basicInfo.linkedin}
                                                onChange={(e) => setBasicInfo({ ...basicInfo, linkedin: e.target.value })}
                                                placeholder="URL"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Website</Label>
                                        <Input
                                            value={basicInfo.website}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, website: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <Label>Club Background URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={basicInfo.banner}
                                                onChange={(e) => setBasicInfo({ ...basicInfo, banner: e.target.value })}
                                                placeholder="https://image-url.com/banner.jpg"
                                            />
                                            {basicInfo.banner && (
                                                <div className="h-10 w-10 rounded-lg overflow-hidden border shrink-0">
                                                    <img src={basicInfo.banner} className="h-full w-full object-cover" alt="Preview" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveBasicInfo} className="w-full">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Basic Info
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Coordinator Tab */}
                            <TabsContent value="coordinator" className="space-y-4">
                                <div className="space-y-3">
                                    <Label>Select New Coordinator</Label>
                                    <Select value={selectedCoordinator} onValueChange={setSelectedCoordinator}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a coordinator..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {collegeUsers.map((user: any) => (
                                                <SelectItem key={user._id || user.id} value={user._id || user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleSaveCoordinator}
                                        variant={isCoordinatorChanged ? "default" : "outline"}
                                        className={`w-full ${isCoordinatorChanged ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-white text-muted-foreground'}`}
                                    >
                                        <UserCog className="h-4 w-4 mr-2" />
                                        Update Coordinator
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Achievements Tab */}
                            <TabsContent value="achievements" className="space-y-4">
                                <Card>
                                    <CardContent className="pt-4 space-y-3">
                                        <Label>Add New Achievement</Label>
                                        <Input
                                            placeholder="Achievement Title"
                                            value={newAchievement.title}
                                            onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                                        />
                                        <Textarea
                                            placeholder="Description"
                                            value={newAchievement.description}
                                            onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                                        />
                                        <Input
                                            type="date"
                                            value={newAchievement.earnedAt}
                                            onChange={(e) => setNewAchievement({ ...newAchievement, earnedAt: e.target.value })}
                                        />
                                        <Button onClick={handleAddAchievement} className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Achievement
                                        </Button>
                                    </CardContent>
                                </Card>

                                <div className="space-y-2">
                                    <Label>Current Achievements</Label>
                                    {achievements.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No achievements yet</p>
                                    ) : (
                                        achievements.map((achievement: any) => (
                                            <Card key={achievement._id}>
                                                <CardContent className="p-3 flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{achievement.title}</p>
                                                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                                        {achievement.earnedAt && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(achievement.earnedAt).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteAchievement(achievement._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="space-y-6">
                                <ClubEventsManager club={club} />
                            </TabsContent>

                            {/* Team Tab */}
                            <TabsContent value="team" className="space-y-6">
                                <Card className="bg-secondary/5 border-dashed">
                                    <CardContent className="pt-4 space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Add New Team Member</Label>
                                        <Select onValueChange={handleAddTeamMember}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Search student to add..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {collegeUsers
                                                    .filter(u => !coreTeam.some((m: any) => m.userId === (u._id || u.id)))
                                                    .map((user: any) => (
                                                        <SelectItem key={user._id || user.id} value={user._id || user.id}>
                                                            <span className="font-semibold">{user.name}</span>
                                                            <span className="ml-2 text-[10px] text-muted-foreground">({user.email})</span>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>

                                <div className="space-y-6">
                                    {/* Secretary Panel Section */}
                                    <div className="space-y-3">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600/70 flex items-center gap-2 px-1">
                                            <Crown className="h-3 w-3" />
                                            Secretary & Head Panel
                                        </h4>
                                        <div className="space-y-2">
                                            {coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').length === 0 ? (
                                                <div className="py-8 text-center border-2 border-dashed border-blue-50 bg-blue-50/10 rounded-xl text-xs text-blue-400 italic">
                                                    No Secretary assigned yet.
                                                </div>
                                            ) : (
                                                coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').map((member: any) => (
                                                    <Card key={member.userId} className="border-l-4 border-l-blue-600 shadow-sm overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                                                                        <Crown className="h-5 w-5 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-blue-950 text-sm uppercase tracking-tight">{member.name}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <Badge className="bg-blue-600 h-4 py-0 text-[8px] font-bold uppercase shrink-0">{member.role}</Badge>
                                                                            <Input
                                                                                value={member.customTitle || ''}
                                                                                placeholder="Custom Title..."
                                                                                onChange={(e) => handleUpdateTeamMemberRole(member.userId, member.role, e.target.value)}
                                                                                className="h-6 text-[10px] w-32 bg-transparent border-blue-100 focus-visible:ring-blue-200"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveTeamMember(member.userId)}
                                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Club Core Team Section */}
                                    <div className="space-y-3">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500/70 flex items-center gap-2 px-1">
                                            <Shield className="h-3 w-3" />
                                            Club Core Team
                                        </h4>
                                        <div className="space-y-2">
                                            {coreTeam.filter((m: any) => m.role === 'core_member').length === 0 ? (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-100 bg-slate-50/10 rounded-xl text-xs text-slate-400 italic">
                                                    No core team members assigned yet.
                                                </div>
                                            ) : (
                                                coreTeam.filter((m: any) => m.role === 'core_member').map((member: any) => (
                                                    <Card key={member.userId} className="border-l-4 border-l-slate-400 hover:shadow-md transition-shadow overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                                        <Shield className="h-4 w-4 text-slate-500" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <Badge variant="outline" className="h-4 py-0 text-[8px] font-black uppercase opacity-60 shrink-0">{member.role}</Badge>
                                                                            <Input
                                                                                value={member.customTitle || ''}
                                                                                placeholder="Custom Title..."
                                                                                onChange={(e) => handleUpdateTeamMemberRole(member.userId, member.role, e.target.value)}
                                                                                className="h-6 text-[10px] w-32 bg-transparent border-slate-100 focus-visible:ring-slate-200"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveTeamMember(member.userId)}
                                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Pending Members Tab */}
                            <TabsContent value="pending" className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Pending Join Requests</Label>
                                        <Badge variant="secondary">{pendingMembers.length} pending</Badge>
                                    </div>
                                    {pendingMembers.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8 text-center">
                                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No pending join requests</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        pendingMembers.map((member: any) => (
                                            <Card key={member.userId}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{member.name}</p>
                                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Requested: {new Date(member.requestedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => approveMemberMutation.mutate(member.userId)}
                                                                disabled={approveMemberMutation.isPending}
                                                            >
                                                                <UserCheck className="h-4 w-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => rejectMemberMutation.mutate(member.userId)}
                                                                disabled={rejectMemberMutation.isPending}
                                                            >
                                                                <UserX className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="tasks" className="space-y-4">
                                <ErrorBoundary name="Manage Club Tasks">
                                    <ManageClubTasks clubId={club._id || club.id} clubName={club.name} readOnly={true} />
                                </ErrorBoundary>
                            </TabsContent>
                        </Tabs>
                        {/* Close fragment for club check */}
                    </>
                )}
            </DialogContent>

            <AlertDialog open={isConfirmCoordinatorOpen} onOpenChange={setIsConfirmCoordinatorOpen}>
                <AlertDialogContent className="max-w-[400px] border-2 border-primary/20 bg-white/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <AlertTriangle className="h-6 w-6 text-primary" />
                        </div>
                        <AlertDialogTitle className="text-xl font-black text-center text-slate-900">
                            Change Coordinator?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-slate-600 font-medium">
                            Are you sure you want to assign <span className="text-primary font-bold">
                                {collegeUsers.find(u => u._id === selectedCoordinator || u.id === selectedCoordinator)?.name}
                            </span> as the new coordinator for <span className="text-primary font-bold">{club?.name}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 my-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Note:
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                            This will grant them full administrative access to this club's settings and data.
                        </p>
                    </div>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto font-bold uppercase tracking-widest text-[10px] h-10">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmSaveCoordinator}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20"
                        >
                            Yes, Assign New Coordinator
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
