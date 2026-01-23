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
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface EditChallengeDialogProps {
    open: boolean;
    onClose: () => void;
    challenge: any;
}

export function EditChallengeDialog({ open, onClose, challenge }: EditChallengeDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('100');
    const [deadline, setDeadline] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Populate form when challenge changes
    useEffect(() => {
        if (challenge) {
            setTitle(challenge.title || '');
            setDescription(challenge.description || '');
            setPoints(challenge.points?.toString() || '100');
            // Format date for input[type="date"]
            if (challenge.deadline) {
                const date = new Date(challenge.deadline);
                setDeadline(date.toISOString().split('T')[0]);
            }
        }
    }, [challenge]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateChallenge(challenge._id || challenge.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            toast({ title: 'Challenge Updated Successfully' });
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update challenge',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleUpdate = () => {
        if (!title || !description || !points) {
            toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
            return;
        }

        updateMutation.mutate({
            title,
            description,
            points: parseInt(points),
            deadline: deadline ? new Date(deadline) : challenge.deadline,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Edit Challenge
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Challenge Title" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the challenge..." />
                    </div>
                    <div className='flex gap-4'>
                        <div className="flex-1">
                            <Label>XP Points</Label>
                            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>Deadline</Label>
                            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Challenge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
