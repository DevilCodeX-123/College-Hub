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
import { Shield, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AssignHeadDialogProps {
    open: boolean;
    onClose: () => void;
    collegeUsers: any[];
    collegeName: string;
}

export function AssignHeadDialog({ open, onClose, collegeUsers, collegeName }: AssignHeadDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Check if a co-coordinator (co_admin) already exists
    const existingCoCoordinator = collegeUsers.find((u: any) => u.role === 'co_admin');

    // Filter eligible users: Not admin, NOT owner, and NOT already co_admin
    const eligibleUsers = collegeUsers.filter((u: any) =>
        u.role !== 'admin' && u.role !== 'owner' && u.role !== 'co_admin'
    );

    const assignMutation = useMutation({
        mutationFn: (data: { userId: string, title: string }) =>
            api.updateUser(data.userId, { role: 'co_admin', customTitle: data.title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            toast({
                title: 'Co-Coordinator Assigned',
                description: `User promoted to College Co-Coordinator successfully.`
            });
            onClose();
            setSelectedUserId('');
            setCustomTitle('');
        },
        onError: (error: any) => {
            console.error('Assign Co-Coordinator Error:', error);
            toast({
                title: 'Failed to assign Co-Coordinator',
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
                        <Shield className="h-5 w-5 text-primary" />
                        Assign College Co-Coordinator for {collegeName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {existingCoCoordinator ? (
                        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg text-amber-800 text-sm">
                            <p className="font-semibold flex items-center gap-2 mb-1">
                                <Shield className="h-4 w-4" />
                                Co-Coordinator already assigned
                            </p>
                            <p>
                                {existingCoCoordinator.name} ({existingCoCoordinator.email}) is already assigned as the Co-Coordinator.
                                Please demote the existing user first to assign a new one.
                            </p>
                        </div>
                    ) : (
                        <>
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
                                <Label htmlFor="head-title">Custom Title (e.g. Dean, Principal, Director)</Label>
                                <Input
                                    id="head-title"
                                    placeholder="e.g. Dean of Engineering"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!existingCoCoordinator && (
                        <Button onClick={handleAssign} disabled={!selectedUserId || assignMutation.isPending}>
                            {assignMutation.isPending ? 'Assigning...' : 'Assign Co-Coordinator'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
