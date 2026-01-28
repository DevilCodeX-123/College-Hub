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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CreateBroadcastDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreateBroadcastDialog({ open, onClose, collegeName }: CreateBroadcastDialogProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [recipient, setRecipient] = useState('all');
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const sendNotificationMutation = useMutation({
        mutationFn: (data: any) => api.sendNotification(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast({
                title: 'Broadcast Sent Successfully',
                description: `Notification has been sent to ${recipient === 'all' ? 'all students' : recipient}`
            });
            setTitle('');
            setMessage('');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to send broadcast',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const handleSend = () => {
        if (!title.trim() || !message.trim()) {
            toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }

        if (!user) return;

        const payload = {
            recipient,
            title,
            message,
            senderId: user.id || (user as any)._id,
            type,
            isManualBroadcast: true
        };

        console.log('Sending Broadcast Payload:', payload);
        sendNotificationMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        Send College Broadcast
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Broadcast Title *</Label>
                        <Input
                            placeholder="e.g. End Semester Results Out"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label>Message Content *</Label>
                        <Textarea
                            placeholder="Type your announcement here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-2 min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Category</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="alert">Alert/Urgent</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Target Audience</Label>
                            <Select value={recipient} onValueChange={setRecipient}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Everywhere</SelectItem>
                                    <SelectItem value="students">Students Only</SelectItem>
                                    <SelectItem value="coordinators">Coordinators Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sendNotificationMutation.isPending}>
                        {sendNotificationMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Broadcast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
