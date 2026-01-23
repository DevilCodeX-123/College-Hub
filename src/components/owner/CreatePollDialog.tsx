import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Vote, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePollDialogProps {
    open: boolean;
    onClose: () => void;
    collegeName: string;
}

export function CreatePollDialog({ open, onClose, collegeName }: CreatePollDialogProps) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState('24');
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const createPollMutation = useMutation({
        mutationFn: (data: any) => api.createPoll(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-polls'] });
            toast({
                title: 'Poll Created Successfully',
                description: `Poll for ${collegeName} has been created`
            });
            setQuestion('');
            setOptions(['', '']);
            setDuration('24');
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create poll',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreatePoll = () => {
        if (!question.trim()) {
            toast({ title: 'Error', description: 'Please enter a question', variant: 'destructive' });
            return;
        }

        const validOptions = options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
            toast({ title: 'Error', description: 'Please provide at least 2 options', variant: 'destructive' });
            return;
        }

        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
            return;
        }

        let expiresAt = null;
        if (duration !== '0') {
            expiresAt = new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000);
        }

        const payload = {
            question,
            options: validOptions,
            createdBy: user.id,
            targetRoles: ['student', 'club_coordinator', 'admin', 'co_admin'], // Comprehensive target for college polls
            college: user.college || collegeName, // Scope by the admin's college
            expiresAt
        };

        createPollMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Vote className="h-5 w-5" />
                        Create New Poll for {collegeName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Poll Question */}
                    <div>
                        <Label>Poll Question *</Label>
                        <Input
                            placeholder="What would you like to ask?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <Label>Duration</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Hour</SelectItem>
                                <SelectItem value="6">6 Hours</SelectItem>
                                <SelectItem value="12">12 Hours</SelectItem>
                                <SelectItem value="24">24 Hours</SelectItem>
                                <SelectItem value="48">48 Hours</SelectItem>
                                <SelectItem value="168">1 Week</SelectItem>
                                <SelectItem value="0">No Limit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Options */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Options *</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={addOption}
                                disabled={options.length >= 6}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Minimum 2 options, maximum 6 options
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreatePoll} disabled={createPollMutation.isPending}>
                        {createPollMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Vote className="h-4 w-4 mr-2" />
                        Create Poll
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
