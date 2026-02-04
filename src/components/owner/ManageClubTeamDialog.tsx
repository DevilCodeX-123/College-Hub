
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, UserPlus, Loader2, Edit, Trash2, Crown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ManageClubTeamDialogProps {
    open: boolean;
    onClose: () => void;
    club: any;
    collegeUsers: any[];
    defaultTab?: string;
    targetUserId?: string;
    isPromotionOnly?: boolean;
}

export function ManageClubTeamDialog({ open, onClose, club, collegeUsers, defaultTab = 'secretary', targetUserId, isPromotionOnly = false }: ManageClubTeamDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('core_member');
    const [customTitle, setCustomTitle] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab);

    const getRoleLabel = (r: string) => {
        const labels: Record<string, string> = {
            'club_coordinator': 'Coordinator',
            'club_co_coordinator': 'Joint Coordinator',
            'club_head': 'Secretary',
            'head': 'Secretary',
            'core_member': 'Core Team',
            'student': 'Student',
            'admin': 'Admin',
            'co_admin': 'Co-Admin',
            'owner': 'Owner'
        };
        return labels[r] || r.replace(/_/g, ' ').toUpperCase();
    };

    const clubId = club?._id || club?.id;

    // Filter to show all potentially eligible users (Members of the club)
    const candidates = collegeUsers.filter((u: any) => {
        // Exclude system roles
        if (u.role === 'admin' || u.role === 'owner') return false;

        // Must be in the club
        const isInClub = u.joinedClubs?.some((id: any) => id.toString() === clubId.toString());

        // Also include if they are already in the core team (edge case protection)
        const isInCoreTeam = club?.coreTeam?.some((m: any) => m.userId === (u._id || u.id));

        return isInClub || isInCoreTeam;
    });

    // Unified state reset and sync when dialog opens or target changes
    useEffect(() => {
        if (!open) return;

        // Force correct tab and role based on how the dialog was opened
        const initialTab = isPromotionOnly ? 'core' : defaultTab;
        setActiveTab(initialTab);

        if (initialTab === 'leadership') setSelectedRole('coordinator');
        else if (initialTab === 'secretary') setSelectedRole('head');
        else setSelectedRole('core_member');

        // Pre-select user if provided
        if (targetUserId) {
            setSelectedUser(targetUserId);
            // If they are already in core team, sync their info
            const existingMember = club?.coreTeam?.find((m: any) => m.userId === targetUserId);
            if (existingMember) {
                handleEdit(existingMember);
            } else {
                setCustomTitle('');
            }
        } else {
            setSelectedUser('');
            setCustomTitle('');
        }
    }, [open, defaultTab, targetUserId, club?.coreTeam]);

    const updateTeamMutation = useMutation({
        mutationFn: async ({ userId, role, customTitle }: { userId: string, role: string, customTitle: string }) => {
            let apiRole: string = 'student';
            if (role === 'coordinator') apiRole = 'club_coordinator';
            else if (role === 'faculty_coordinator') apiRole = 'club_coordinator'; // Backend role remains same
            else if (role === 'co_coordinator' || role === 'co-coordinator') apiRole = 'club_co_coordinator';
            else if (role === 'head' || role === 'secretary') apiRole = 'club_head';
            else if (role === 'core_member') apiRole = 'core_member';

            // Automatic Demotion Logic: If assigning a NEW regular coordinator, 
            // the OLD regular coordinator becomes a secretary automatically.
            if (role === 'coordinator') {
                const oldCoordinator = club?.coreTeam?.find((m: any) =>
                    m.role === 'club_coordinator' &&
                    m.customTitle !== 'Faculty Coordinator' && // Don't demote faculty
                    m.userId !== userId
                );

                if (oldCoordinator) {
                    await api.updateClubCoreTeam(clubId, {
                        userId: oldCoordinator.userId,
                        role: 'club_head',
                        customTitle: oldCoordinator.customTitle,
                        requestingUserId: user?.id || user?._id
                    });
                }
            }

            return api.updateClubCoreTeam(clubId, {
                userId,
                role: apiRole,
                customTitle: role === 'faculty_coordinator' ? 'Faculty Coordinator' : customTitle,
                requestingUserId: user?.id || user?._id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management', clubId] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            toast({ title: 'Team Member Updated' });
            resetForm();
        },
        onError: () => {
            toast({ title: 'Failed to update', variant: 'destructive' });
        }
    });

    const removeTeamMutation = useMutation({
        mutationFn: (userId: string) => api.removeCoreTeamMember(clubId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-management', clubId] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            toast({ title: 'Member Demoted' });
        }
    });

    const handleAssign = () => {
        if (!selectedUser || !clubId) return;

        // Prevent multiple regular coordinators (Allow 1 regular + 1 faculty)
        if (selectedRole === 'coordinator') {
            const currentCoordinator = club?.coreTeam?.find((m: any) =>
                m.role === 'club_coordinator' && m.customTitle !== 'Faculty Coordinator'
            );
            if (currentCoordinator && currentCoordinator.userId !== selectedUser) {
                if (!confirm(`This club already has a coordinator (${currentCoordinator.name}). Assigning a new one will automatically demote the current one to Secretary. Proceed?`)) {
                    return;
                }
            }
        }

        if (!confirm(`Are you sure you want to assign this role?`)) return;

        updateTeamMutation.mutate({ userId: selectedUser, role: selectedRole, customTitle });
    };

    const resetForm = () => {
        setSelectedUser('');
        setSelectedRole('core_member');
        setCustomTitle('');
    };

    const handleEdit = (member: any) => {
        setSelectedUser(member.userId);
        let role: any = 'core_member';
        if (member.role === 'club_head') role = 'head';
        if (member.role === 'club_co_coordinator') role = 'co_coordinator';
        if (member.role === 'club_coordinator') {
            role = member.customTitle === 'Faculty Coordinator' ? 'faculty_coordinator' : 'coordinator';
        }
        setSelectedRole(role);
        setCustomTitle(member.customTitle || '');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Manage Team: {club?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {!isPromotionOnly && (
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="leadership">
                                    <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                    Leadership
                                </TabsTrigger>
                                <TabsTrigger value="secretary">
                                    <Crown className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                    Secretary
                                </TabsTrigger>
                                <TabsTrigger value="core">
                                    <Shield className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                    Core Team
                                </TabsTrigger>
                            </TabsList>
                        )}

                        <div className="space-y-6">
                            {/* Form Section */}
                            <div className="bg-secondary/10 p-4 rounded-xl border-2 border-secondary/20 shadow-sm">
                                <h4 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-primary/70">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    {selectedUser ? 'Updating Member' : 'Add New Member'}
                                </h4>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">1. Select Candidate</Label>
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger className="h-10 bg-white">
                                                <SelectValue placeholder="Search student..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {candidates.map((u: any) => (
                                                    <SelectItem key={u._id || u.id} value={u._id || u.id}>
                                                        <span className="font-semibold">{u.name}</span>
                                                        <span className="ml-2 text-[10px] text-muted-foreground opacity-60">({u.email})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">2. Assign Role</Label>
                                            <Select
                                                value={selectedRole}
                                                onValueChange={(val: any) => setSelectedRole(val)}
                                                disabled={
                                                    (function () {
                                                        const ROLE_HIERARCHY: Record<string, number> = {
                                                            'owner': 100,
                                                            'admin': 5,
                                                            'club_coordinator': 4,
                                                            'club_head': 3,
                                                            'core_member': 2,
                                                            'student': 1
                                                        };
                                                        const myPower = ROLE_HIERARCHY[user?.role || ''] || 0;
                                                        return myPower <= 2; // Core members or below can't assign roles
                                                    })()
                                                }
                                            >
                                                <SelectTrigger className="h-10 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(function () {
                                                        const ROLE_HIERARCHY: Record<string, number> = {
                                                            'owner': 100,
                                                            'admin': 5,
                                                            'club_coordinator': 4,
                                                            'club_head': 3,
                                                            'core_member': 2,
                                                            'student': 1
                                                        };
                                                        const myPower = ROLE_HIERARCHY[user?.role || ''] || 0;

                                                        const currentCoordinator = club?.coreTeam?.find((m: any) => m.role === 'club_coordinator' && m.customTitle !== 'Faculty Coordinator');
                                                        const currentFaculty = club?.coreTeam?.find((m: any) => m.role === 'club_coordinator' && m.customTitle === 'Faculty Coordinator');

                                                        const isEditingThisCoordinator = currentCoordinator?.userId === selectedUser;
                                                        const isEditingThisFaculty = currentFaculty?.userId === selectedUser;

                                                        const options = isPromotionOnly
                                                            ? [{ value: 'core_member', label: 'Core Team', power: 2 }]
                                                            : [
                                                                { value: 'core_member', label: 'Core Team', power: 2 },
                                                                { value: 'head', label: 'Secretary', power: 3 },
                                                                { value: 'coordinator', label: 'Coordinator', power: 4 },
                                                                { value: 'faculty_coordinator', label: 'Faculty Coordinator', power: 4 }
                                                            ];

                                                        return options
                                                            .filter(opt => user?.role === 'owner' || opt.power < myPower)
                                                            .filter(opt => {
                                                                // Always show core and secretary
                                                                if (opt.power < 4) return true;

                                                                // For Coordinators:
                                                                if (opt.value === 'coordinator' && currentCoordinator && !isEditingThisCoordinator) {
                                                                    // Coordinator exists, but demotion is automatic so we can show it
                                                                    return true;
                                                                }

                                                                // For Faculty: Limit to 1
                                                                if (opt.value === 'faculty_coordinator' && currentFaculty && !isEditingThisFaculty) {
                                                                    return false;
                                                                }

                                                                return true;
                                                            })
                                                            .map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                            ));
                                                    })()}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">3. Custom Title</Label>
                                            <Input
                                                value={customTitle}
                                                onChange={(e) => setCustomTitle(e.target.value)}
                                                placeholder="e.g. Design Lead"
                                                className="h-10 bg-white"
                                                disabled={selectedRole === 'faculty_coordinator'}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-2 border-t border-secondary/20">
                                        {selectedUser && (
                                            <Button variant="ghost" size="sm" onClick={resetForm} className="text-[10px] font-bold uppercase tracking-widest">
                                                Cancel Edit
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={handleAssign}
                                            disabled={!selectedUser || updateTeamMutation.isPending}
                                            className="px-6 font-bold shadow-lg"
                                        >
                                            {updateTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {selectedUser ? 'SAVE' : 'CONFIRM ADD'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Current Lists */}
                            <div className="space-y-6">
                                <TabsContent value="leadership" className="m-0 space-y-3">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600/70 mb-2">Club Coordinators (Admin View)</h4>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                        {club?.coreTeam?.filter((m: any) => m.role === 'club_coordinator').map((m: any) => (
                                            <div key={m.userId} className="p-3 rounded-lg border-2 border-amber-100 bg-amber-50/20 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-amber-600 flex items-center justify-center shadow-lg">
                                                        <Crown className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-amber-900 text-sm uppercase tracking-tight">{m.name}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge className={`${m.customTitle === 'Faculty Coordinator' ? 'bg-indigo-600' : 'bg-amber-600'} text-[8px] h-4 py-0 font-bold tracking-tighter shrink-0 text-white`}>
                                                                {m.customTitle === 'Faculty Coordinator' ? 'FACULTY' : getRoleLabel(m.role).toUpperCase()}
                                                            </Badge>
                                                            {m.customTitle && m.customTitle !== 'Faculty Coordinator' && <span className="text-[10px] text-amber-600/60 font-medium italic truncate max-w-[100px]">"{m.customTitle}"</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(user?.role === 'admin' || user?.role === 'owner') && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(m)}>
                                                            <Edit className="h-3.5 w-3.5 text-amber-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => {
                                                            if (confirm(`Remove Coordinator Status for ${m.name}?`)) removeTeamMutation.mutate(m.userId);
                                                        }}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!club?.coreTeam?.some((m: any) => m.role === 'club_coordinator')) && (
                                            <div className="py-8 text-center border-2 border-dashed border-amber-100 rounded-lg text-xs text-amber-400 font-medium">No Coordinator assigned yet.</div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="secretary" className="m-0 space-y-3">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600/70 mb-2">Active Secretaries & Heads</h4>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                        {club?.coreTeam?.filter((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator').map((m: any) => (
                                            <div key={m.userId} className="p-3 rounded-lg border-2 border-blue-100 bg-blue-50/20 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                                                        <Crown className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-blue-900 text-sm uppercase tracking-tight">{m.name}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge className="bg-blue-600 text-[8px] h-4 py-0 font-bold tracking-tighter shrink-0 text-white">{getRoleLabel(m.role).toUpperCase()}</Badge>
                                                            {m.customTitle && <span className="text-[10px] text-blue-600/60 font-medium italic truncate max-w-[100px]">"{m.customTitle}"</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100/50" onClick={() => handleEdit(m)}>
                                                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => {
                                                        if (confirm(`Demote ${m.name}?`)) removeTeamMutation.mutate(m.userId);
                                                    }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!club?.coreTeam?.some((m: any) => m.role === 'club_head' || m.role === 'club_co_coordinator')) && (
                                            <div className="py-8 text-center border-2 border-dashed border-blue-100 rounded-lg text-xs text-blue-400 font-medium">No Secretary Assigned.</div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="core" className="m-0 space-y-3">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500/70 mb-2">Core Team Members</h4>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                        {club?.coreTeam?.filter((m: any) => m.role === 'core_member').map((m: any) => (
                                            <div key={m.userId} className="p-3 rounded-lg border border-slate-200 bg-slate-50/30 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <Shield className="h-4 w-4 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-black opacity-60 tracking-widest uppercase shrink-0">{getRoleLabel(m.role)}</Badge>
                                                            {m.customTitle && <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]">"{m.customTitle}"</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(m)}>
                                                        <Edit className="h-3.5 w-3.5 text-slate-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => {
                                                        if (confirm(`Remove ${m.name}?`)) removeTeamMutation.mutate(m.userId);
                                                    }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!club?.coreTeam?.some((m: any) => m.role === 'core_member')) && (
                                            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 italic">No core members found.</div>
                                        )}
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
