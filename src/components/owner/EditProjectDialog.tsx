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
import { Rocket, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface EditProjectDialogProps {
    open: boolean;
    onClose: () => void;
    project: any;
}

export function EditProjectDialog({ open, onClose, project }: EditProjectDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (project) {
            setTitle(project.title || '');
            setDescription(project.description || '');
            setTags(project.tags?.join(', ') || '');
        }
    }, [project]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateProject(project._id || project.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: 'Project Updated Successfully' });
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update project',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleUpdate = () => {
        if (!title || !description) {
            toast({ title: 'Error', description: 'Title and description are required', variant: 'destructive' });
            return;
        }

        updateMutation.mutate({
            title,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        Edit Project
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Title" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project..." />
                    </div>
                    <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. React, Node.js, MongoDB" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
