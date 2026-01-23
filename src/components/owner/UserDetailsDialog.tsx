import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Label } from '@/components/ui/label';
import {
    User,
    Mail,
    Calendar,
    Building2,
    Users,
    Target,
    FolderKanban,
    Shield,
    Bell,
    Ban,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserDetailsDialogProps {
    user: any;
    open: boolean;
    onClose: () => void;
}

const ROLE_HIERARCHY: Record<string, number> = {
    'owner': 100,
    'admin': 5,
    'club_coordinator': 4,
    'club_head': 3,
    'core_member': 2,
    'student': 1
};

export function UserDetailsDialog({ user, open, onClose }: UserDetailsDialogProps) {
    const { user: currentUser, refreshUser } = useAuth();
    const [notification, setNotification] = useState('');
    const [selectedRole, setSelectedRole] = useState(user?.role || 'student');
    const [selectedClub, setSelectedClub] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch clubs for context selection
    const { data: clubsList } = useQuery({
        queryKey: ['all-clubs', currentUser?.college],
        queryFn: () => api.getClubs(currentUser?.college, currentUser?.id),
        enabled: !!currentUser?.college
    });

    const blockMutation = useMutation({
        mutationFn: (blocked: boolean) => api.updateUserStatus(user?._id || user?.id, { website: blocked }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['college-students', user?.college] });
            toast({
                title: variables ? 'User Blocked' : 'User Unblocked',
                description: `${user?.name} has been ${variables ? 'blocked from' : 'unblocked on'} the platform`
            });
        }
    });

    const notificationMutation = useMutation({
        mutationFn: (content: string) => api.sendNotification({
            userId: user?._id || user?.id,
            content,
            type: 'admin_alert',
            title: 'Admin Notification'
        }),
        onSuccess: () => {
            setNotification('');
            toast({ title: 'Success', description: 'Notification sent to ' + user?.name });
        }
    });

    const roleMutation = useMutation({
        mutationFn: (data: { role: string, clubId?: string }) => api.updateUserRole(user?._id || user?.id, {
            ...data,
            requestingUserId: currentUser?.id || currentUser?._id
        }),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['college-students', user?.college] });
            toast({ title: 'Role Updated' });

            // Sync current user session if they updated themselves
            if (user?._id === currentUser?._id || user?.id === currentUser?.id) {
                await refreshUser();
            }
        }
    });

    if (!user) return null;

    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
    const challenges = user.activity?.filter((a: any) => a.type === 'challenge') || [];
    const projects = user.activity?.filter((a: any) => a.type === 'project') || [];
    const clubs = user.activity?.filter((a: any) => a.type === 'club') || [];

    const myPower = ROLE_HIERARCHY[currentUser?.role || ''] || 0;
    const theirPower = ROLE_HIERARCHY[user.role] || 0;
    const canModifyRole = currentUser?.role === 'owner' || myPower > theirPower;

    const handleSendNotification = () => {
        if (!notification.trim()) {
            toast({ title: 'Error', description: 'Please enter a notification message', variant: 'destructive' });
            return;
        }
        notificationMutation.mutate(notification);
    };

    const handleBlockUser = () => {
        blockMutation.mutate(true);
    };

    const handleUnblockUser = () => {
        blockMutation.mutate(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xl font-bold">{user.name}</p>
                            <p className="text-sm text-muted-foreground font-normal">{user.email}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Created</p>
                                    <p className="font-semibold">{createdDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">College</p>
                                    <p className="font-semibold">{user.college || 'Not set'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Role</p>
                                        <Select
                                            value={selectedRole}
                                            onValueChange={(val) => setSelectedRole(val)}
                                            disabled={!canModifyRole || roleMutation.isPending}
                                        >
                                            <SelectTrigger className="h-8 w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    { value: 'student', label: 'Student', power: 1 },
                                                    { value: 'core_member', label: 'Core Team', power: 2 },
                                                    { value: 'club_head', label: 'Secretary', power: 3 },
                                                    { value: 'club_coordinator', label: 'Coordinator', power: 4 },
                                                    { value: 'admin', label: 'Admin', power: 5 }
                                                ]
                                                    .filter(opt => currentUser?.role === 'owner' || opt.power < myPower)
                                                    .map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Context Selection (Club) */}
                                {(selectedRole === 'club_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member') && (
                                    <div className="pl-6 space-y-2 border-l-2 border-primary/20 ml-2 animate-in slide-in-from-left-2 duration-200">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Assign to Club</Label>
                                        <Select value={selectedClub} onValueChange={setSelectedClub}>
                                            <SelectTrigger className="h-8 w-full bg-secondary/50">
                                                <SelectValue placeholder="Select Club..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clubsList?.map((club: any) => (
                                                    <SelectItem key={club.id || club._id} value={club.id || club._id}>
                                                        {club.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedRole === 'admin' && (
                                    <p className="pl-6 text-[10px] font-bold text-primary/60 uppercase tracking-tight">
                                        Will be Admin in {user.college}
                                    </p>
                                )}

                                {(selectedRole !== user.role || (selectedClub && (selectedRole === 'club_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member'))) && (
                                    <Button
                                        size="sm"
                                        className="h-8 mt-2"
                                        onClick={() => roleMutation.mutate({ role: selectedRole, clubId: selectedClub })}
                                        disabled={
                                            roleMutation.isPending ||
                                            ((selectedRole === 'club_coordinator' || selectedRole === 'club_head' || selectedRole === 'core_member') && !selectedClub)
                                        }
                                    >
                                        {roleMutation.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                        {selectedRole === user.role ? 'Update Context' : 'Update Role'}
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">XP Points</p>
                                    <p className="font-semibold">{user.points || 0} XP (Level {user.level || 0})</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clubs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Clubs ({clubs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clubs.length > 0 ? (
                                <div className="space-y-2">
                                    {clubs.map((club: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                            <span className="font-medium">{club.title}</span>
                                            <Badge variant="outline">{club.status || 'member'}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No clubs joined</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Challenges */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Challenges ({challenges.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {challenges.length > 0 ? (
                                <div className="space-y-2">
                                    {challenges.map((challenge: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                            <span className="font-medium">{challenge.title}</span>
                                            <Badge variant={challenge.status === 'completed' ? 'default' : 'secondary'}>
                                                {challenge.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No challenges participated</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Projects */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FolderKanban className="h-5 w-5" />
                                Projects ({projects.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {projects.length > 0 ? (
                                <div className="space-y-2">
                                    {projects.map((project: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                            <span className="font-medium">{project.title}</span>
                                            <Badge variant="outline">{project.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No projects participated</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Send Notification */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Send Notification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                placeholder="Type your notification message here..."
                                value={notification}
                                onChange={(e) => setNotification(e.target.value)}
                                rows={3}
                            />
                            <Button onClick={handleSendNotification} className="w-full" disabled={notificationMutation.isPending}>
                                {notificationMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                                Send Notification
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">User Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-3">
                            {user.blocked?.website ? (
                                <Button variant="outline" onClick={handleUnblockUser} className="flex-1" disabled={blockMutation.isPending}>
                                    {blockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Unblock User
                                </Button>
                            ) : (
                                <Button variant="destructive" onClick={handleBlockUser} className="flex-1" disabled={blockMutation.isPending}>
                                    {blockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                                    Block User
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
