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
import { Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ExtendPollDialogProps {
    open: boolean;
    onClose: () => void;
    pollId: string;
    currentExpiry: string | null;
    college?: string;
}

export function ExtendPollDialog({ open, onClose, pollId, currentExpiry, college }: ExtendPollDialogProps) {
    const [hours, setHours] = useState('24');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const extendMutation = useMutation({
        mutationFn: () => api.extendPoll(pollId, parseInt(hours)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["college-polls", college] });
            toast({ title: 'Poll Extended', description: `Added ${hours} hours to the poll.` });
            onClose();
        },
        onError: (err: any) => {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to extend poll',
                variant: 'destructive'
            });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Extend Poll Duration
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-sm text-muted-foreground">
                        Current Expiry: {currentExpiry ? new Date(currentExpiry).toLocaleString() : 'No Limit'}
                    </div>

                    <div className="space-y-2">
                        <Label>Add Hours</Label>
                        <Input
                            type="number"
                            min="1"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the number of hours to extend the poll by.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => extendMutation.mutate()} disabled={extendMutation.isPending}>
                        {extendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Extend
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
