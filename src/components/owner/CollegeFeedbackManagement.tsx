import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    AlertTriangle,
    Lightbulb,
    Mail,
    Send,
    Loader2,
    X,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CollegeFeedbackManagementProps {
    collegeName: string;
}

export function CollegeFeedbackManagement({ collegeName }: CollegeFeedbackManagementProps) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Queries
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['college-notifications', collegeName],
        queryFn: () => api.getNotifications(currentUser?.id || currentUser?._id, currentUser?.role || 'admin'),
        refetchInterval: 10000
    });

    // Filter feedback notifications for this college
    // Since we don't have college stored in notification directly, we rely on the fact that
    // notifications are broadcast to all admins. We filter for 'feedback' category.
    // If the sender is available, we could check their college, but for now we show all 'feedback' 
    // notifications that the admin receives.
    const feedbackNotes = notifications.filter((n: any) => {
        const isFeedbackRecipient = n.recipient === 'owner' || n.recipient === 'admins';
        const isFeedbackCategory = n.category === 'feedback';
        const seemsLikeFeedback = n.title?.includes('Suggestion') || n.title?.includes('Complaint') || n.type === 'alert' || n.type === 'warning';

        return isFeedbackCategory || (isFeedbackRecipient && seemsLikeFeedback);
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: (id: string) => api.markNotificationRead(id, currentUser?.id || currentUser?._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['college-notifications', collegeName] });
        }
    });

    const handleSendDirectReply = async () => {
        if (!selectedFeedback || !replyMessage.trim()) return;
        setIsSendingReply(true);
        try {
            await api.sendNotification({
                recipient: selectedFeedback.sender, // The student who sent the feedback
                title: "Response to your feedback",
                message: replyMessage,
                senderId: currentUser?.id || currentUser?._id,
                type: 'info'
            });
            toast({ title: "Sent", description: "Your response has been sent to the student." });
            setReplyMessage('');
            setSelectedFeedback(null);
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSendingReply(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* List of Feedback */}
            <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 max-h-[70vh] flex flex-col">
                <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Student Feedbacks</CardTitle>
                            <CardDescription>Complaints & suggestions from your campus</CardDescription>
                        </div>
                        {feedbackNotes.filter((n: any) => !n.readBy.includes(currentUser?.id || currentUser?._id)).length > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                                {feedbackNotes.filter((n: any) => !n.readBy.includes(currentUser?.id || currentUser?._id)).length} NEW
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                    ) : feedbackNotes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium italic">
                            No student feedback or complaints yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {feedbackNotes.map((note: any) => (
                                <div
                                    key={note._id}
                                    onClick={() => {
                                        setSelectedFeedback(note);
                                        if (!note.readBy.includes(currentUser?.id || currentUser?._id)) {
                                            markReadMutation.mutate(note._id);
                                        }
                                    }}
                                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors relative ${selectedFeedback?._id === note._id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                                >
                                    {!note.readBy.includes(currentUser?.id || currentUser?._id) && (
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                    <div className="flex items-center gap-3 mb-1 min-w-0">
                                        <div className={cn(
                                            "p-1.5 rounded-lg shrink-0",
                                            note.type === 'alert' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {note.type === 'alert' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
                                        </div>
                                        <h4 className="font-bold text-sm truncate flex-1">{note.title}</h4>
                                        <span className="text-[10px] text-slate-400 shrink-0">{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1 pl-9">{note.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detailed View & Reply */}
            <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 h-fit sticky top-0">
                {selectedFeedback ? (
                    <>
                        <CardHeader className="border-b bg-slate-50/50 pb-4">
                            <div className="flex items-center justify-between">
                                <Badge variant={selectedFeedback.type === 'alert' ? 'destructive' : 'secondary'}>
                                    {selectedFeedback.type === 'alert' ? 'Complaint' : 'Suggestion'}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(null)} className="h-8 w-8 p-0 rounded-full">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardTitle className="mt-3 text-xl">{selectedFeedback.title}</CardTitle>
                            <p className="text-xs text-slate-400 italic">Received on {new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-5 bg-slate-50 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-slate-700 ring-1 ring-slate-100 shadow-inner">
                                {selectedFeedback.message}
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <Send className="h-3 w-3" />
                                    Send Reply To Student
                                </Label>
                                <Textarea
                                    placeholder="Type your official response here..."
                                    className="min-h-[150px] bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-primary rounded-xl"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <Button
                                    className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                                    onClick={handleSendDirectReply}
                                    disabled={isSendingReply || !replyMessage.trim()}
                                >
                                    {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    Dispatch Notification
                                </Button>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="p-16 text-center text-slate-400">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="h-8 w-8 opacity-20" />
                        </div>
                        <h3 className="font-bold text-slate-500">Inbox Empty</h3>
                        <p className="text-sm mt-1">Select a message from the list to read and respond.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
