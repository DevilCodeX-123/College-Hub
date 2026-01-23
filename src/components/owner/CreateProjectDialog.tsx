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
import { Rocket, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateProjectDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreateProjectDialog({ open, onClose, collegeName }: CreateProjectDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: 'Project Created Successfully' });
            setTitle('');
            setDescription('');
            setTags('');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create project',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleCreate = () => {
        if (!title || !description) {
            toast({ title: 'Error', description: 'Title and description are required', variant: 'destructive' });
            return;
        }

        createMutation.mutate({
            title,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            college: collegeName,
            status: 'Proposed', // Default status
            members: [],
            likes: 0
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        Create New Project
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Project Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project..." />
                    </div>
                    <div>
                        <Label>Tags (comma separated)</Label>
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, Node.js, AI..." />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
