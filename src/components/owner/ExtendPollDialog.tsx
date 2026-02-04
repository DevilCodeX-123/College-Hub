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
    clubId?: string;
}

export function ExtendPollDialog({ open, onClose, pollId, currentExpiry, college, clubId }: ExtendPollDialogProps) {
    const [hours, setHours] = useState('24');
    const [action, setAction] = useState<'add' | 'reduce'>('add');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const extendMutation = useMutation({
        mutationFn: () => {
            const h = parseInt(hours);
            const value = action === 'add' ? h : -h;
            return api.extendPoll(pollId, value);
        },
        onSuccess: () => {
            if (college) {
                queryClient.invalidateQueries({ queryKey: ["college-polls", college] });
            }
            if (clubId) {
                queryClient.invalidateQueries({ queryKey: ["club-polls", clubId] });
            }
            toast({
                title: action === 'add' ? 'Poll Extended' : 'Poll Duration Reduced',
                description: `${action === 'add' ? 'Added' : 'Removed'} ${hours} hours.`
            });
            onClose();
        },
        onError: (err: any) => {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to update poll',
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
                        Modify Poll Duration
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md text-center">
                        Current Expiry: <span className="font-bold text-foreground">{currentExpiry ? new Date(currentExpiry).toLocaleString() : 'No Limit'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setAction('add')}
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${action === 'add' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Add Time
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction('reduce')}
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${action === 'reduce' ? 'bg-background shadow-sm text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Reduce Time
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>{action === 'add' ? 'Add Hours' : 'Remove Hours'}</Label>
                        <Input
                            type="number"
                            min="1"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the number of hours to {action === 'add' ? 'extend' : 'reduce'} the poll by.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => extendMutation.mutate()}
                        disabled={extendMutation.isPending}
                        variant={action === 'reduce' ? 'destructive' : 'default'}
                    >
                        {extendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {action === 'add' ? 'Extend Duration' : 'Reduce Duration'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
