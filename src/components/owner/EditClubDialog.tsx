import { useState, useEffect } from 'react';
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
import { Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface EditClubDialogProps {
    open: boolean;
    onClose: () => void;
    club: any;
    collegeUsers: any[];
}

export function EditClubDialog({ open, onClose, club, collegeUsers }: EditClubDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [coordinator, setCoordinator] = useState('');

    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (club) {
            setName(club.name || '');
            setDescription(club.description || '');
            setCategory(club.category || '');
            setCoordinator(club.coordinatorId || '');
        }
    }, [club, open]);

    const eligibleCoordinators = collegeUsers.filter((u: any) => u.role !== 'admin' && u.role !== 'owner');

    const updateClubMutation = useMutation({
        mutationFn: (data: any) => api.updateClub(club._id || club.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });

            // If coordinator changed, update the user's role
            if (coordinator && coordinator !== club.coordinatorId) {
                api.updateUserRole(coordinator, 'club_coordinator');
                queryClient.invalidateQueries({ queryKey: ['all-users'] });
            }

            toast({ title: 'Club Updated Successfully' });
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update club',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleUpdate = () => {
        if (!name || !description || !category || !coordinator) {
            toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
            return;
        }

        const coordinatorUser = collegeUsers.find(u => u._id === coordinator);

        updateClubMutation.mutate({
            name,
            description,
            category,
            coordinatorId: coordinator,
            coordinator: coordinatorUser?.name || 'Unknown'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Club: {club?.name}
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
                                <SelectItem value="Cultural">Cultural</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Literary">Literary</SelectItem>
                                <SelectItem value="Social">Social</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Club Head</Label>
                        <Select value={coordinator} onValueChange={setCoordinator}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a club head..." />
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
                    <Button onClick={handleUpdate} disabled={updateClubMutation.isPending}>
                        {updateClubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
