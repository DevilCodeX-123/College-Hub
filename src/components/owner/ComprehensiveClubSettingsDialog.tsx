import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    AlertTriangle,
    UserPlus
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
    const [selectedUserForTeam, setSelectedUserForTeam] = useState<string | null>(null);
    const [memberRole, setMemberRole] = useState('core_member');
    const [memberCustomTitle, setMemberCustomTitle] = useState('');

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
        onSuccess: (data) => {
            if (data.club) {
                setPendingMembers(data.club.pendingMembers || []);
                // If the club object in the dialog has a memberCount, we might want to update it too if we used it, 
                // but currently we mostly use pendingMembers and coreTeam arrays.
            }
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
        onSuccess: (data) => {
            if (data.club) {
                setPendingMembers(data.club.pendingMembers || []);
            }
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
        onSuccess: (data) => {
            if (data) {
                // Update local states based on updated club data
                setAchievements(data.achievements || []);
                setHistory(data.history || []);
                setCoreTeam(data.coreTeam || []);
                setPendingMembers(data.pendingMembers || []);
                setBasicInfo({
                    name: data.name || '',
                    description: data.description || '',
                    logo: data.logo || '',
                    category: data.category || '',
                    instagram: data.socialLinks?.instagram || '',
                    linkedin: data.socialLinks?.linkedin || '',
                    website: data.socialLinks?.website || '',
                    banner: data.banner || ''
                });
            }
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['club', club._id || club.id] });
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

    const handleAddTeamMember = () => {
        if (!selectedUserForTeam) return;
        const user = collegeUsers.find(u => (u._id || u.id) === selectedUserForTeam);
        if (!user) return;

        const updatedTeam = [
            ...coreTeam,
            {
                userId: user._id || user.id,
                name: user.name,
                role: memberRole,
                customTitle: memberCustomTitle || (memberRole === 'core_member' ? 'Team Member' : 'Secretary')
            }
        ];
        setCoreTeam(updatedTeam);
        updateClubMutation.mutate({ coreTeam: updatedTeam });

        // Reset local state
        setSelectedUserForTeam(null);
        setMemberRole('core_member');
        setMemberCustomTitle('');
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
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 w-[95vw] sm:w-full rounded-2xl sm:rounded-3xl">
                    {!club ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            <DialogHeader className="pr-10">
                                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg leading-tight">
                                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                    <span className="break-words">Club Settings - {club.name}</span>
                                </DialogTitle>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={(v) => {
                                setActiveTab(v);
                                setIsTasksTabActive(v === 'tasks');
                            }} className="w-full">
                                <TabsList className="flex flex-wrap h-auto gap-0.5 bg-secondary/30 p-1 mb-4 lg:grid lg:grid-cols-6 lg:gap-0 lg:h-10">
                                    <TabsTrigger value="basic" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">Basic Info</TabsTrigger>
                                    <TabsTrigger value="achievements" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">Achievements</TabsTrigger>
                                    <TabsTrigger value="history" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">Events</TabsTrigger>
                                    <TabsTrigger value="team" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9 font-bold text-primary">Team</TabsTrigger>
                                    <TabsTrigger value="pending" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">
                                        Pending
                                        {pendingMembers.length > 0 && (
                                            <Badge variant="destructive" className="ml-1 h-3.5 w-3.5 p-0 flex items-center justify-center text-[8px]">{pendingMembers.length}</Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">Tasks</TabsTrigger>
                                    <TabsTrigger value="points" className="flex-1 min-w-[70px] sm:min-w-[100px] text-[9px] sm:text-xs h-8 sm:h-9">Points History</TabsTrigger>
                                </TabsList>

                                {/* Basic Info Tab */}
                                <TabsContent value="basic" className="space-y-4">
                                    {/* Club Stats Snapshot */}
                                    <div className="grid grid-cols-1 gap-4 mb-4">
                                        <Card className="bg-primary/5 border-primary/20">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Club Points</p>
                                                    <p className="text-xl font-black">{club?.points || 0}</p>
                                                </div>
                                                <Trophy className="h-6 w-6 text-primary/40" />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs">Club Name</Label>
                                                <Input
                                                    value={basicInfo.name}
                                                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Logo URL</Label>
                                                <Input
                                                    value={basicInfo.logo}
                                                    onChange={(e) => setBasicInfo({ ...basicInfo, logo: e.target.value })}
                                                    placeholder="https://..."
                                                    className="h-9 text-sm"
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
                                                    <SelectItem value="Technology">Technology</SelectItem>
                                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                                    <SelectItem value="Sports">Sports</SelectItem>
                                                    <SelectItem value="Social">Social</SelectItem>
                                                    <SelectItem value="Academic">Academic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs">Instagram</Label>
                                                <Input
                                                    value={basicInfo.instagram}
                                                    onChange={(e) => setBasicInfo({ ...basicInfo, instagram: e.target.value })}
                                                    placeholder="@username"
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">LinkedIn</Label>
                                                <Input
                                                    value={basicInfo.linkedin}
                                                    onChange={(e) => setBasicInfo({ ...basicInfo, linkedin: e.target.value })}
                                                    placeholder="URL"
                                                    className="h-9 text-sm"
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



                                {/* Achievements Tab */}
                                <TabsContent value="achievements" className="space-y-4">
                                    <Card className="border-2 shadow-sm">
                                        <CardContent className="p-4 sm:p-6 space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Add New Achievement</Label>
                                                <Input
                                                    placeholder="Achievement Title (e.g. Hackathon Winner)"
                                                    value={newAchievement.title}
                                                    onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                                                    className="h-11 sm:h-12 rounded-xl text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold opacity-70">Description</Label>
                                                <Textarea
                                                    placeholder="Briefly describe the achievement..."
                                                    value={newAchievement.description}
                                                    onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                                                    className="rounded-xl min-h-[80px]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold opacity-70">Earned Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newAchievement.earnedAt}
                                                    onChange={(e) => setNewAchievement({ ...newAchievement, earnedAt: e.target.value })}
                                                    className="h-11 rounded-xl"
                                                />
                                            </div>
                                            <Button onClick={handleAddAchievement} className="w-full h-11 sm:h-12 rounded-xl font-bold uppercase tracking-wider text-[11px] sm:text-xs">
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

                                {/* Events Tab */}
                                <TabsContent value="history" className="space-y-6">
                                    <ClubEventsManager club={club} />
                                </TabsContent>

                                {/* Tasks Tab */}
                                <TabsContent value="tasks" className="space-y-4">
                                    <ManageClubTasks readOnly={false} clubId={club._id || club.id} />
                                </TabsContent>

                                {/* Points History Tab */}
                                <TabsContent value="points" className="space-y-4 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="bg-primary/5 border-primary/10">
                                            <CardContent className="pt-6">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Points</p>
                                                <p className="text-3xl font-black text-primary mt-1">{club.points || 0}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-green-50/50 border-green-100">
                                            <CardContent className="pt-6">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60">Monthly Points</p>
                                                <p className="text-3xl font-black text-green-600 mt-1">{club.monthlyPoints || 0}</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="border-none shadow-none ring-1 ring-slate-100">
                                        <CardHeader className="flex flex-row items-center justify-between py-4">
                                            <CardTitle className="text-base font-bold">Transaction History</CardTitle>
                                            <History className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-slate-100 border-t">
                                                {(!club.pointsHistory || club.pointsHistory.length === 0) ? (
                                                    <div className="p-12 text-center text-slate-400 italic text-sm">
                                                        No point transactions recorded yet.
                                                    </div>
                                                ) : (
                                                    [...club.pointsHistory].reverse().map((item: any, idx) => (
                                                        <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                                                            <div className="flex gap-3">
                                                                <div className={cn(
                                                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                                    item.amount > 0 ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"
                                                                )}>
                                                                    {item.amount > 0 ? <Plus className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-700">{item.reason}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-black uppercase tracking-tighter">
                                                                            {item.sourceType}
                                                                        </Badge>
                                                                        <span className="text-[9px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={cn(
                                                                "text-xs font-black",
                                                                item.amount > 0 ? "text-green-600" : "text-rose-600"
                                                            )}>
                                                                {item.amount > 0 ? '+' : ''}{item.amount} PTS
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Coordinator & Team Tab */}
                                <TabsContent value="team" className="p-1 space-y-8 pb-10">
                                    {/* Section 1: Faculty Coordinator */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <UserCog className="h-3 w-3 sm:h-4 sm:w-4" />
                                                1. Faculty Coordinator
                                            </h4>
                                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">LIMIT: 1 PERSON</Badge>
                                        </div>
                                        <Card className="border-2 border-primary/10 shadow-sm rounded-2xl overflow-hidden bg-white">
                                            <CardContent className="p-4 sm:p-6 space-y-4">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Select Faculty Coordinator</Label>
                                                        <Select value={selectedCoordinator} onValueChange={setSelectedCoordinator}>
                                                            <SelectTrigger className="h-11 sm:h-12 rounded-xl border-2 bg-slate-50/50 hover:bg-white transition-colors">
                                                                <SelectValue placeholder="Search faculty member..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px] rounded-xl border-2">
                                                                {collegeUsers
                                                                    .filter(u => u.joinedClubs?.includes(club?._id || club?.id))
                                                                    .map((user: any) => (
                                                                        <SelectItem key={user._id || user.id} value={user._id || user.id} className="rounded-lg my-1">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-sm">{user.name}</span>
                                                                                <span className="text-[10px] opacity-60 italic">{user.email}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={handleSaveCoordinator}
                                                        disabled={!isCoordinatorChanged}
                                                        className={`sm:mt-[22px] h-11 sm:h-12 rounded-xl font-black uppercase tracking-widest text-[10px] px-6 transition-all ${isCoordinatorChanged ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}
                                                    >
                                                        <Save className="h-4 w-4 mr-2" />
                                                        {club?.coordinatorId ? 'Update' : 'Set'}
                                                    </Button>
                                                </div>
                                                {club?.coordinator && (
                                                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                            <UserCog className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-primary uppercase leading-none">Current Coordinator</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-0.5">{club.coordinator}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Sections 2 & 3: Student Team Add Form */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                                                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                                2. Add Student Team Member
                                            </h4>
                                        </div>
                                        <Card className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
                                            <CardContent className="p-4 sm:p-6 space-y-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-70 ml-1">Search Student</Label>
                                                    <Select value={selectedUserForTeam || ''} onValueChange={setSelectedUserForTeam}>
                                                        <SelectTrigger className="h-11 sm:h-12 rounded-xl bg-white border-2">
                                                            <SelectValue placeholder="Search student by name..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[300px] rounded-xl border-2">
                                                            {collegeUsers
                                                                .filter(u =>
                                                                    u.joinedClubs?.includes(club?._id || club?.id) &&
                                                                    !coreTeam.some((m: any) => m.userId === (u._id || u.id)) &&
                                                                    u._id !== club?.coordinatorId
                                                                )
                                                                .map((user: any) => (
                                                                    <SelectItem key={user._id || user.id} value={user._id || user.id} className="rounded-lg my-1">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-sm">{user.name}</span>
                                                                            <span className="text-[10px] opacity-60 italic">{user.email}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {selectedUserForTeam && (
                                                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Panel Assignment</Label>
                                                                <Select value={memberRole} onValueChange={setMemberRole}>
                                                                    <SelectTrigger className="h-11 rounded-xl bg-white border-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-xl border-2">
                                                                        <SelectItem value="club_head" className="rounded-lg text-blue-600 font-bold">Secretary & Head Panel</SelectItem>
                                                                        <SelectItem value="club_co_coordinator" className="rounded-lg text-blue-600 font-bold">Co-Coordinator</SelectItem>
                                                                        <SelectItem value="core_member" className="rounded-lg">Club Core Team</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Custom Role Title</Label>
                                                                <Input
                                                                    placeholder={memberRole === 'core_member' ? "e.g. Graphic Designer" : "e.g. Tech Secretary"}
                                                                    value={memberCustomTitle}
                                                                    onChange={(e) => setMemberCustomTitle(e.target.value)}
                                                                    className="h-11 rounded-xl bg-white border-2"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={handleAddTeamMember}
                                                            className="w-full h-11 sm:h-12 rounded-xl font-black uppercase tracking-widest text-[11px] sm:text-xs shadow-lg"
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-2" />
                                                            Add to {memberRole === 'core_member' ? 'Core Team' : 'Head Panel'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Secretary Panel Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                                    <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    Secretary & Head Panel
                                                </h4>
                                                <Badge variant="outline" className="text-[9px] font-bold text-blue-600 border-blue-200">
                                                    {coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').length} Active
                                                </Badge>
                                            </div>
                                            <div className="grid gap-3">
                                                {coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').length === 0 ? (
                                                    <div className="py-10 text-center border-2 border-dashed border-blue-100 bg-blue-50/50 rounded-2xl text-[11px] text-blue-400 font-medium italic">
                                                        No Secretary or Head assigned to this club yet.
                                                    </div>
                                                ) : (
                                                    coreTeam.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').map((member: any) => (
                                                        <Card key={member.userId} className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all overflow-hidden rounded-xl">
                                                            <CardContent className="p-4 sm:p-5">
                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-inner">
                                                                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-black text-blue-950 text-sm sm:text-base uppercase tracking-tight truncate">{member.name}</p>
                                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                                <Badge className="bg-blue-600 h-5 px-2 py-0 text-[8px] font-black uppercase shrink-0">
                                                                                    {member.role?.replace('_', ' ')}
                                                                                </Badge>
                                                                                <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 min-w-0">
                                                                                    <span className="text-[9px] font-bold text-blue-400 uppercase">Title:</span>
                                                                                    <input
                                                                                        value={member.customTitle || ''}
                                                                                        placeholder="Set Title..."
                                                                                        onChange={(e) => handleUpdateTeamMemberRole(member.userId, member.role, e.target.value)}
                                                                                        className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-blue-700 w-full placeholder:text-blue-200"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveTeamMember(member.userId)}
                                                                        className="self-end sm:self-auto text-destructive hover:bg-destructive/10 h-9 w-9 p-0 rounded-full"
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
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    Club Core Team
                                                </h4>
                                                <Badge variant="outline" className="text-[9px] font-bold text-slate-500 border-slate-200">
                                                    {coreTeam.filter((m: any) => m.role === 'core_member').length} Members
                                                </Badge>
                                            </div>
                                            <div className="grid gap-3">
                                                {coreTeam.filter((m: any) => m.role === 'core_member').length === 0 ? (
                                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 bg-slate-50/10 rounded-2xl text-[11px] text-slate-400 font-medium italic">
                                                        No core team members assigned yet.
                                                    </div>
                                                ) : (
                                                    coreTeam.filter((m: any) => m.role === 'core_member').map((member: any) => (
                                                        <Card key={member.userId} className="border-l-4 border-l-slate-400 hover:shadow-md transition-all overflow-hidden rounded-xl">
                                                            <CardContent className="p-4 sm:p-5">
                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{member.name}</p>
                                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                                <Badge variant="outline" className="h-5 px-2 py-0 text-[8px] font-black uppercase opacity-60 shrink-0">
                                                                                    Member
                                                                                </Badge>
                                                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 min-w-0">
                                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Role:</span>
                                                                                    <input
                                                                                        value={member.customTitle || ''}
                                                                                        placeholder="Enter Role..."
                                                                                        onChange={(e) => handleUpdateTeamMemberRole(member.userId, member.role, e.target.value)}
                                                                                        className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-slate-700 w-full placeholder:text-slate-300"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveTeamMember(member.userId)}
                                                                        className="self-end sm:self-auto text-destructive hover:bg-destructive/10 h-9 w-9 p-0 rounded-full"
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
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-sm sm:text-base truncate">{member.name}</p>
                                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</p>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                                                    Requested: {new Date(member.requestedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => approveMemberMutation.mutate(member.userId)}
                                                                    disabled={approveMemberMutation.isPending}
                                                                    className="flex-1 sm:flex-none h-9 text-xs"
                                                                >
                                                                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => rejectMemberMutation.mutate(member.userId)}
                                                                    disabled={rejectMemberMutation.isPending}
                                                                    className="flex-1 sm:flex-none h-9 text-xs"
                                                                >
                                                                    <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
        </>
    );
}
