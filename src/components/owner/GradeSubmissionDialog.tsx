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
import { Award, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface GradeSubmissionDialogProps {
    open: boolean;
    onClose: () => void;
    submission: any;
}

export function GradeSubmissionDialog({ open, onClose, submission }: GradeSubmissionDialogProps) {
    const [marks, setMarks] = useState('');
    const [feedback, setFeedback] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const gradeMutation = useMutation({
        mutationFn: (data: any) => api.gradeSubmission(
            submission?.challengeId,
            submission?.userId,
            data.marks,
            data.feedback,
            user?.id || ''
        ),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            toast({
                title: 'Submission Graded!',
                description: data.message || 'Student has been notified.',
            });
            setMarks('');
            setFeedback('');
            onClose();
        },
        onError: (err: any) => {
            toast({
                title: 'Grading Failed',
                description: err.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        }
    });

    const handleGrade = () => {
        const marksNum = parseInt(marks);
        if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
            toast({ title: 'Error', description: 'Please enter valid marks (0-100)', variant: 'destructive' });
            return;
        }

        gradeMutation.mutate({ marks: marksNum, feedback });
    };

    if (!submission) return null;

    const estimatedXP = Math.round((parseInt(marks) || 0) / 100 * (submission.challengePoints || 100));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Grade Submission
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">{submission.userName}</p>
                        <a
                            href={submission.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                        >
                            View Submission →
                        </a>
                    </div>

                    <div>
                        <Label htmlFor="marks">Marks (out of 100)</Label>
                        <Input
                            id="marks"
                            type="number"
                            min="0"
                            max="100"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            placeholder="Enter marks (0-100)"
                        />
                        {marks && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Estimated XP: {estimatedXP} ({marks >= '40' ? 'Pass' : 'Fail'})
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="feedback">Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide feedback to the student..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleGrade} disabled={gradeMutation.isPending || !marks}>
                        {gradeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Grade
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
