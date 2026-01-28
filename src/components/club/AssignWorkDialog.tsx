
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Users,
    Zap,
    Calendar,
    Swords,
    Megaphone,
    Vote,
    Loader2,
    Search,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AssignWorkDialogProps {
    open: boolean;
    onClose: () => void;
    club: any;
    members: any[];
}

const WORK_CATEGORIES = [
    {
        id: 'event',
        label: 'Event Support',
        icon: Calendar,
        xp: 25,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Assigned for organizing, managing, or supporting club events.'
    },
    {
        id: 'challenge',
        label: 'Challenge Creator',
        icon: Swords,
        xp: 25,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Assigned for designing or moderating club challenges.'
    },
    {
        id: 'broadcast',
        label: 'Broadcast Expert',
        icon: Megaphone,
        xp: 5,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Assigned for handling communications and notifications.'
    },
    {
        id: 'poll',
        label: 'Poll Master',
        icon: Vote,
        xp: 5,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        description: 'Assigned for creating community engagement polls.'
    },
    {
        id: 'custom',
        label: 'Other Specialized Work',
        icon: Zap,
        xp: 25,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        description: 'General operational tasks for the club.'
    }
];

export function AssignWorkDialog({ open, onClose, club, members }: AssignWorkDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState(WORK_CATEGORIES[0]);
    const [customDetails, setCustomDetails] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isMandatory, setIsMandatory] = useState(true);

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const assignMutation = useMutation({
        mutationFn: async (data: any) => {
            const targetEmails = members
                .filter(m => selectedUserIds.includes(m.id || m._id))
                .map(m => m.email);

            return api.createTask({
                title: `${selectedCategory.label}: ${club.name}`,
                description: customDetails || selectedCategory.description,
                pointsReward: selectedCategory.xp,
                targetType: 'specific',
                targetEmails: targetEmails,
                category: 'operational',
                clubId: club?._id || club?.id,
                clubName: club.name,
                createdBy: user?.id,
                deadline: deadline || undefined,
                isMandatory: isMandatory
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['club-tasks'] });
            toast({
                title: "Work Assigned Successfully",
                description: `Assigned task to ${selectedUserIds.length} members.`
            });
            handleClose();
        },
        onError: () => {
            toast({ title: "Assignment Failed", variant: "destructive" });
        }
    });

    const handleClose = () => {
        setSelectedUserIds([]);
        setSearchTerm('');
        setCustomDetails('');
        setDeadline('');
        setIsMandatory(true);
        onClose();
    };

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === filteredMembers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredMembers.map(m => m.id || m._id));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[2rem] border-2 shadow-2xl">
                <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-primary/5 via-background to-transparent border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-primary/20 shadow-inner">
                            <Zap className="h-6 w-6 text-primary fill-primary/20" />
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Active Missions</DialogTitle>
                    </div>
                    <DialogDescription className="text-base font-medium">
                        Assign operational missions to specific members. Completion will grant them XP and synchronize with their Daily Tasks.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 space-y-8">
                    {/* Step 1: Category Selection */}
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">1. Select Work Type</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {WORK_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = selectedCategory.id === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isSelected ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-secondary/20 hover:border-primary/40 bg-white'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl mb-3 w-fit ${cat.bgColor} ${cat.color} group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="font-black text-sm uppercase tracking-tight leading-tight">{cat.label}</div>
                                        <div className="mt-1 text-[10px] font-bold text-muted-foreground">{cat.xp} XP REWARD</div>
                                        {isSelected && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Member Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">2. Select Assignees</Label>
                            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-6 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                                {selectedUserIds.length === filteredMembers.length ? 'Deselect All' : 'Select All Members'}
                            </Button>
                        </div>

                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-xl border-2 focus-visible:ring-primary shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-2 pr-4 custom-scrollbar bg-slate-50/50 rounded-2xl border-2 border-dashed">
                            {filteredMembers.length === 0 ? (
                                <div className="col-span-2 py-8 text-center text-muted-foreground font-medium italic">No matching members found.</div>
                            ) : (
                                filteredMembers.map((m) => (
                                    <div
                                        key={m.id || m._id}
                                        onClick={() => toggleUser(m.id || m._id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedUserIds.includes(m.id || m._id)
                                            ? 'bg-white border-primary shadow-md translate-x-1'
                                            : 'bg-white/50 border-secondary/20 hover:bg-white hover:border-primary/20'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedUserIds.includes(m.id || m._id)}
                                            onCheckedChange={() => toggleUser(m.id || m._id)}
                                            className="rounded-md border-2"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate uppercase tracking-tight">{m.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium truncate">{m.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Step 3: Deployment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">3. Mission Deadline</Label>
                            <Input
                                type="date"
                                value={deadline}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setDeadline(e.target.value)}
                                className="h-11 rounded-xl border-2 focus-visible:ring-primary font-bold"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">4. Work Priority</Label>
                            <div
                                onClick={() => setIsMandatory(!isMandatory)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer h-11 ${isMandatory ? 'border-primary bg-primary/5' : 'border-secondary/20 bg-white'
                                    }`}
                            >
                                <Checkbox
                                    checked={isMandatory}
                                    onCheckedChange={() => setIsMandatory(!isMandatory)}
                                    className="rounded-md border-2"
                                />
                                <span className="font-bold text-sm uppercase tracking-tight">Mandatory Assignment</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Instructions */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">5. Mission Instructions (Required to Deploy)</Label>
                        <Textarea
                            placeholder={`Provide clear mission details for this ${selectedCategory.label}... (You must provide mission instructions to deploy work)`}
                            value={customDetails}
                            onChange={e => setCustomDetails(e.target.value)}
                            className="min-h-[100px] rounded-[1.5rem] border-2 focus-visible:ring-primary font-medium"
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Total Assignees</span>
                        <span className="text-2xl font-black text-primary leading-none">{selectedUserIds.length}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={handleClose} className="rounded-xl font-bold uppercase tracking-widest h-12 px-6">Cancel</Button>
                        <Button
                            onClick={() => assignMutation.mutate({})}
                            disabled={selectedUserIds.length === 0 || !customDetails.trim() || assignMutation.isPending}
                            className="rounded-2xl font-black uppercase tracking-widest px-10 h-12 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                        >
                            {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Deploy Mission
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
