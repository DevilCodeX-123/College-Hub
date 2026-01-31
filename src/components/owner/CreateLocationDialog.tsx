import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateLocationDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreateLocationDialog({ open, onClose, collegeName }: CreateLocationDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [googleMapsLink, setGoogleMapsLink] = useState('');
    const [category, setCategory] = useState('General');
    const [description, setDescription] = useState('');

    const mutation = useMutation({
        mutationFn: (locationData: any) => api.createLocation(locationData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campus-locations', collegeName] });
            toast({
                title: 'Success',
                description: 'Campus location added successfully'
            });
            setName('');
            setGoogleMapsLink('');
            setCategory('General');
            setDescription('');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to add campus location',
                variant: 'destructive'
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !googleMapsLink) {
            toast({
                title: 'Missing information',
                description: 'Please provide both name and Google Maps link',
                variant: 'destructive'
            });
            return;
        }

        mutation.mutate({
            name,
            googleMapsLink,
            college: collegeName,
            category,
            description,
            userId: user?.id
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Campus Location</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Location Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Central Library, Block A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="Administrative">Administrative</SelectItem>
                                <SelectItem value="Hostel">Hostel</SelectItem>
                                <SelectItem value="Canteen">Canteen</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Library">Library</SelectItem>
                                <SelectItem value="Laboratories">Laboratories</SelectItem>
                                <SelectItem value="Auditorium">Auditorium</SelectItem>
                                <SelectItem value="Transport">Transport</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Briefly describe the location"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link">Google Maps Link</Label>
                        <Input
                            id="link"
                            placeholder="Paste Google Maps URL here"
                            value={googleMapsLink}
                            onChange={(e) => setGoogleMapsLink(e.target.value)}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Adding...' : 'Add Location'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
