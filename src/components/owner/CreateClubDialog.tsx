import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CreateClubDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
    collegeUsers: any[];
}

export function CreateClubDialog({ open, onClose, collegeName, collegeUsers }: CreateClubDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [coordinator, setCoordinator] = useState('');

    // Filter potential coordinators (students/members/coordinators not already assigned??)
    // For now, allow any non-admin to be a coordinator.
    const eligibleCoordinators = collegeUsers.filter((u: any) => u.role !== 'admin' && u.role !== 'owner');

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createClubMutation = useMutation({
        mutationFn: (data: any) => api.createClub(data),
        onSuccess: async () => {
            console.log("Club created successfully, invalidating queries for college:", collegeName);
            // Invalidate all related queries using broad keys to ensure catch-all
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['clubs'] }),
                queryClient.invalidateQueries({ queryKey: ['college-clubs'] }),
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
                // Force refetch to ensure UI updates immediately
                queryClient.refetchQueries({ queryKey: ['clubs'] }),
                queryClient.refetchQueries({ queryKey: ['college-clubs'] })
            ]);

            // Also need to update the user's role to coordinator if they aren't already
            if (coordinator) {
                try {
                    console.log("Updating user role for coordinator:", coordinator);
                    await api.updateUserRole(coordinator, {
                        role: 'club_coordinator',
                        requestingUserId: user?.id || user?._id
                    });
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ['all-users'] }),
                        queryClient.invalidateQueries({ queryKey: ['college-students'] })
                    ]);
                } catch (err) {
                    console.error("Failed to update user role:", err);
                }
            }

            toast({ title: 'Club Created Successfully' });
            setName('');
            setDescription('');
            setCategory('');
            setCoordinator('');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create club',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const { user } = useAuth(); // Access user directly for failsafe

    const handleCreate = () => {
        const finalCollegeName = collegeName || user?.college;

        if (!name || !description || !category || !coordinator) {
            toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
            return;
        }

        if (!finalCollegeName) {
            toast({ title: 'Error', description: 'College information is missing. Please refresh.', variant: 'destructive' });
            return;
        }

        console.log(`Creating club: ${name}, College: ${finalCollegeName}`);

        const coordinatorUser = collegeUsers.find(u => u._id === coordinator);

        createClubMutation.mutate({
            name,
            description,
            category,
            coordinatorId: coordinator,
            coordinator: coordinatorUser?.name || 'Unknown',
            college: finalCollegeName,
            socialLinks: { instagram: '', linkedin: '', website: '' }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        Create New Club
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Club Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coding Club" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
                    </div>
                    <div>
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Creative">Creative</SelectItem>
                                <SelectItem value="Cultural">Cultural</SelectItem>
                                <SelectItem value="Literary">Literary</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Social">Social</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Assign Club Head</Label>
                        <Select value={coordinator} onValueChange={setCoordinator}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a coordinator..." />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleCoordinators.map((user: any) => (
                                    <SelectItem key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createClubMutation.isPending}>
                        {createClubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Club
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
