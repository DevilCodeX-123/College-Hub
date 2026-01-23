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
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CreateChallengeDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreateChallengeDialog({ open, onClose, collegeName }: CreateChallengeDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('100');
    const [deadlines, setDeadlines] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createChallenge(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            toast({ title: 'Challenge Created Successfully' });
            setTitle('');
            setDescription('');
            setPoints('100');
            setDeadlines('');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create challenge',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleCreate = () => {
        if (!title || !description || !points) {
            toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
            return;
        }

        createMutation.mutate({
            title,
            description,
            points: parseInt(points),
            deadline: deadlines ? new Date(deadlines) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            clubId: 'college-general-' + (user?.college || collegeName).toLowerCase().replace(/\s+/g, '-'),
            clubName: (user?.college || collegeName) + " General",
            difficulty: 'medium',
            status: 'active',
            participants: 0,
            category: 'general'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Create New Challenge
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
                            <Label>Deadline (Optional)</Label>
                            <Input type="date" value={deadlines} onChange={(e) => setDeadlines(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Challenge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
