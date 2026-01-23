import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AssignCoreTeamDialogProps {
    open: boolean;
    onClose: () => void;
    collegeUsers: any[];
    collegeName: string;
}

export function AssignCoreTeamDialog({ open, onClose, collegeUsers, collegeName }: AssignCoreTeamDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Filter eligible users: Not admin, NOT owner, NOT co_admin
    const eligibleUsers = collegeUsers.filter((u: any) =>
        u.role !== 'admin' && u.role !== 'owner' && u.role !== 'co_admin'
    );

    const assignMutation = useMutation({
        mutationFn: (data: { userId: string, title: string }) =>
            api.updateUser(data.userId, { role: 'core_member', customTitle: data.title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            toast({
                title: 'Core Team Member Assigned',
                description: `User added to College Core Team successfully.`
            });
            onClose();
            setSelectedUserId('');
            setCustomTitle('');
        },
        onError: (error: any) => {
            console.error('Assign Core Team Error:', error);
            toast({
                title: 'Failed to assign Core Team member',
                description: error.response?.data?.message || error.message || 'Unknown error',
                variant: 'destructive'
            });
        }
    });

    const handleAssign = () => {
        if (!selectedUserId) return;
        assignMutation.mutate({ userId: selectedUserId, title: customTitle });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Assign Core Team Member for {collegeName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleUsers.length > 0 ? (
                                    eligibleUsers.map((user: any) => (
                                        <SelectItem key={user._id} value={user._id}>
                                            <div className="flex items-center gap-2">
                                                <span>{user.name}</span>
                                                <Badge variant="outline" className="text-xs">{user.role}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No eligible users found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="core-title">Role Title (optional)</Label>
                        <Input
                            id="core-title"
                            placeholder="e.g. Lead Developer, Event Lead"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedUserId || assignMutation.isPending}>
                        {assignMutation.isPending ? 'Assigning...' : 'Assign to Core Team'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
