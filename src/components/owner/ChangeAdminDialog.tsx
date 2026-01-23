import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChangeAdminDialogProps {
    open: boolean;
    onClose: () => void;
    currentAdmin: any;
    collegeUsers: any[];
    collegeName: string;
}

export function ChangeAdminDialog({ open, onClose, currentAdmin, collegeUsers, collegeName }: ChangeAdminDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const { toast } = useToast();

    // Filter out current admin and only show eligible users (excluding students with no admin potential)
    const eligibleUsers = collegeUsers.filter((u: any) =>
        u._id !== currentAdmin?._id &&
        (u.role === 'club_coordinator' || u.role === 'admin' || u.role === 'core_member')
    );

    const handleChangeAdmin = () => {
        if (!selectedUserId) {
            toast({ title: 'Error', description: 'Please select a new admin', variant: 'destructive' });
            return;
        }

        const newAdmin = collegeUsers.find((u: any) => u._id === selectedUserId);

        // TODO: Implement backend API call to change admin
        toast({
            title: 'Admin Changed Successfully',
            description: `${newAdmin.name} is now the admin of ${collegeName}`
        });

        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Change College Coordinator
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Admin */}
                    <div>
                        <Label className="text-sm text-muted-foreground">Current Coordinator</Label>
                        <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                                    {currentAdmin?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold">{currentAdmin?.name}</p>
                                    <p className="text-xs text-muted-foreground">{currentAdmin?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Select New Admin */}
                    <div>
                        <Label>Select New College Coordinator</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleUsers.length > 0 ? (
                                    eligibleUsers.map((user: any) => (
                                        <SelectItem key={user._id} value={user._id}>
                                            <div className="flex items-center gap-2">
                                                <span>{user.name}</span>
                                                <Badge variant="outline" className="text-xs">{user.role}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No eligible users found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                            Only club heads, core members, and existing coordinators are eligible
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleChangeAdmin} disabled={!selectedUserId}>
                        Change Coordinator
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
