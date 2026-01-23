import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateNoteDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreateNoteDialog({ open, onClose, collegeName }: CreateNoteDialogProps) {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const createMutation = useMutation({
        mutationFn: (data: any) => api.createNote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes', collegeName] });
            toast({ title: 'Note created successfully' });
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: 'Error creating note',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const resetForm = () => {
        setTitle('');
        setLink('');
        setDescription('');
        setIsPublic(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !link) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }

        createMutation.mutate({
            title,
            link,
            description,
            isPublic,
            college: collegeName,
            userId: user?.id,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-width-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Note / Paper</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Mathematics II - End Term 2023"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link">Drive / Document Link *</Label>
                        <Input
                            id="link"
                            placeholder="https://drive.google.com/..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief details about the document..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="public">Public Availability</Label>
                            <p className="text-xs text-muted-foreground">
                                If enabled, this will be visible to all students on the Notes panel.
                            </p>
                        </div>
                        <Switch
                            id="public"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create Note'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
