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

    const [phases, setPhases] = useState([{ name: 'Initialization', description: '' }]);
    const baseXP = 100;
    const additionalPhaseXP = (phases.length > 1 ? (phases.length - 1) * 50 : 0);
    const calculatedXP = baseXP + additionalPhaseXP;

    const addPhase = () => {
        setPhases([...phases, { name: `Phase ${phases.length + 1}`, description: '' }]);
    };

    const removePhase = (index: number) => {
        if (phases.length > 1) {
            setPhases(phases.filter((_, i) => i !== index));
        }
    };

    const handleCreate = () => {
        if (!title || !description) {
            toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
            return;
        }

        createMutation.mutate({
            title,
            description,
            points: calculatedXP,
            phases: phases,
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

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Challenge Title" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the challenge..." />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Challenge Phases</Label>
                            <Button variant="outline" size="sm" onClick={addPhase} className="h-7 text-[10px]">
                                + Add Phase
                            </Button>
                        </div>
                        {phases.map((phase, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input
                                    className="h-8 text-xs"
                                    placeholder={`Phase ${index + 1} Name`}
                                    value={phase.name}
                                    onChange={(e) => {
                                        const newPhases = [...phases];
                                        newPhases[index].name = e.target.value;
                                        setPhases(newPhases);
                                    }}
                                />
                                {phases.length > 1 && (
                                    <Button variant="ghost" size="sm" onClick={() => removePhase(index)} className="h-8 w-8 p-0 text-destructive">
                                        ×
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='flex gap-4 pt-2'>
                        <div className="flex-1">
                            <Label className="flex justify-between">
                                XP Tokens
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">Auto-Calculated</span>
                            </Label>
                            <div className="relative group">
                                <Input
                                    className="bg-muted font-bold cursor-help"
                                    value={calculatedXP}
                                    readOnly
                                />
                                <div className="absolute left-0 -top-12 bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-xl z-50">
                                    {baseXP} (Base) + {additionalPhaseXP} ({phases.length - 1} Extra Phases)
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Label>Deadline (Optional)</Label>
                            <Input type="date" min={new Date().toISOString().split('T')[0]} value={deadlines} onChange={(e) => setDeadlines(e.target.value)} />
                        </div>
                    </div>
                    {phases.length > 0 && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">XP Progression Active</p>
                            <p className="text-xs text-muted-foreground">This challenge has {phases.length} phase(s). Reward set to <span className="font-bold text-foreground">{calculatedXP} XP</span>.</p>
                        </div>
                    )}
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
