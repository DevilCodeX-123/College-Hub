import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    MessageSquare,
    AlertTriangle,
    Lightbulb,
    Mail,
    Send,
    Loader2,
    HelpCircle,
    CheckCircle2,
    User as UserIcon,
    ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function HelpManagement() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeSubTab, setActiveSubTab] = useState('feedback');

    // FAQ State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', icon: 'HelpCircle' });
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ question: '', answer: '' });

    // Notification State
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Queries
    const { data: faqs = [], isLoading: isLoadingFAQs } = useQuery({
        queryKey: ['faqs'],
        queryFn: api.getFAQs
    });

    const { data: notifications = [], isLoading: isLoadingNotes } = useQuery({
        queryKey: ['owner-notifications'],
        queryFn: () => api.getNotifications(currentUser?.id || currentUser?._id, 'owner'),
        refetchInterval: 10000
    });

    const feedbackNotes = notifications.filter((n: any) => {
        const isFeedbackRecipient = n.recipient === 'owner' || n.recipient === 'admins';
        const isFeedbackCategory = n.category === 'feedback';
        const seemsLikeFeedback = n.title?.includes('Suggestion') || n.title?.includes('Complaint') || n.type === 'alert' || n.type === 'warning';

        return isFeedbackCategory || (isFeedbackRecipient && seemsLikeFeedback);
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Mutations
    const categoryMutation = useMutation({
        mutationFn: (data: any) => data.id ? api.updateFAQCategory(data.id, data) : api.createFAQCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            setIsAddingCategory(false);
            setEditingCategory(null);
            toast({ title: "Success", description: "Category saved successfully" });
        }
    });

    const itemMutation = useMutation({
        mutationFn: (data: any) => api.addFAQItem(data.categoryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            setAddingItemTo(null);
            setNewItem({ question: '', answer: '' });
            toast({ title: "Success", description: "FAQ Item added" });
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => api.deleteFAQCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast({ title: "Deleted", description: "Category removed" });
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: ({ catId, itemId }: any) => api.deleteFAQItem(catId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast({ title: "Deleted", description: "FAQ Item removed" });
        }
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => api.markNotificationRead(id, currentUser?.id || currentUser?._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-notifications'] });
        }
    });

    const handleSendDirectNotification = async () => {
        if (!selectedFeedback || !replyMessage.trim()) return;
        setIsSendingReply(true);
        try {
            await api.sendNotification({
                recipient: selectedFeedback.sender, // Assuming sender is stored as ID
                title: "Response to your feedback",
                message: replyMessage,
                senderId: currentUser?.id || currentUser?._id,
                type: 'info'
            });
            toast({ title: "Sent", description: "Notification sent to student" });
            setReplyMessage('');
            setSelectedFeedback(null);
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSendingReply(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                <TabsList className="grid grid-cols-2 bg-slate-100/50 p-1">
                    <TabsTrigger value="feedback" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Student Feedback & Complaints
                        {feedbackNotes.filter((n: any) => !n.readBy.includes(currentUser?.id || currentUser?._id)).length > 0 && (
                            <Badge variant="destructive" className="ml-1 px-1.5 h-5 min-w-5 flex items-center justify-center animate-pulse">
                                {feedbackNotes.filter((n: any) => !n.readBy.includes(currentUser?.id || currentUser?._id)).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="faqs" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Manage FAQs
                    </TabsTrigger>
                </TabsList>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-4 pt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* List of Feedback */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 max-h-[70vh] flex flex-col">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-lg">Recent Complaints & Suggestions</CardTitle>
                                <CardDescription>Sent to Owner and Admins</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto">
                                {isLoadingNotes ? (
                                    <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                                ) : feedbackNotes.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 font-medium">No feedback entries found.</div>
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
                                                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors relative ${selectedFeedback?._id === note._id ? 'bg-primary/5 ring-l-4 ring-primary' : ''}`}
                                            >
                                                {!note.readBy.includes(currentUser?.id || currentUser?._id) && (
                                                    <span className="absolute left-2 top-11 h-2 w-2 rounded-full bg-primary" />
                                                )}
                                                <div className="flex items-center gap-3 mb-1">
                                                    {note.type === 'alert' ? (
                                                        <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><AlertTriangle className="h-3.5 w-3.5" /></div>
                                                    ) : (
                                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Lightbulb className="h-3.5 w-3.5" /></div>
                                                    )}
                                                    <h4 className="font-bold text-sm truncate">{note.title}</h4>
                                                    <span className="text-[10px] text-slate-400 ml-auto">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 pl-9">{note.message}</p>
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
                                            <div className="flex gap-2">
                                                <Badge variant={selectedFeedback.type === 'alert' ? 'destructive' : 'secondary'}>
                                                    {selectedFeedback.type === 'alert' ? 'Complaint' : 'Suggestion'}
                                                </Badge>
                                                {selectedFeedback.recipient === 'owner' && <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Private (Owner Only)</Badge>}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(null)}><X className="h-4 w-4" /></Button>
                                        </div>
                                        <CardTitle className="mt-3 text-xl">{selectedFeedback.title}</CardTitle>
                                        <p className="text-xs text-slate-400">{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="p-4 bg-slate-50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                                            {selectedFeedback.message}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <Send className="h-3 w-3" />
                                                Direct Response to Student
                                            </Label>
                                            <Textarea
                                                placeholder="Type your message to resolve this or provide updates..."
                                                className="min-h-[120px] bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-primary"
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                            />
                                            <Button
                                                className="w-full h-11 font-bold shadow-lg shadow-primary/20"
                                                onClick={handleSendDirectNotification}
                                                disabled={isSendingReply || !replyMessage.trim()}
                                            >
                                                {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                                Send Personal Notification
                                            </Button>
                                        </div>
                                    </CardContent>
                                </>
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Select a feedback entry to view details and respond.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                {/* FAQ Tab */}
                <TabsContent value="faqs" className="space-y-4 pt-4">
                    <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 pb-4">
                            <div>
                                <CardTitle className="text-lg">Website FAQ Categories</CardTitle>
                                <CardDescription>Manage how help content is grouped and displayed.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setIsAddingCategory(true)} disabled={isAddingCategory}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Category
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {isAddingCategory && (
                                <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
                                    <CardContent className="p-4 grid md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <Label>Category Name</Label>
                                            <Input
                                                value={newCategory.name}
                                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                                placeholder="e.g. Technical Support"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Icon Name (Lucide)</Label>
                                            <Select value={newCategory.icon} onValueChange={v => setNewCategory({ ...newCategory, icon: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Zap">Zap</SelectItem>
                                                    <SelectItem value="Target">Target</SelectItem>
                                                    <SelectItem value="Calendar">Calendar</SelectItem>
                                                    <SelectItem value="FolderKanban">Folder</SelectItem>
                                                    <SelectItem value="Trophy">Trophy</SelectItem>
                                                    <SelectItem value="HelpCircle">Circle</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <Button className="flex-1" onClick={() => categoryMutation.mutate(newCategory)}>Save</Button>
                                            <Button variant="ghost" onClick={() => setIsAddingCategory(false)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Accordion type="single" collapsible className="space-y-3">
                                {faqs.map((cat: any) => (
                                    <AccordionItem key={cat._id} value={cat._id} className="border rounded-xl overflow-hidden px-4 hover:shadow-sm transition-all">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <HelpCircle className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold">{cat.name}</h4>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{cat.items.length} QUESTIONS</span>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Delete entire category?')) deleteCategoryMutation.mutate(cat._id);
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4 space-y-4 pt-2 border-t mt-2">
                                            <div className="grid gap-3">
                                                {cat.items.map((item: any) => (
                                                    <div key={item._id} className="p-3 bg-slate-50 rounded-lg group relative">
                                                        <h5 className="text-sm font-bold text-slate-700 pr-10">{item.question}</h5>
                                                        <p className="text-xs text-slate-500 mt-1">{item.answer}</p>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                                            onClick={() => deleteItemMutation.mutate({ catId: cat._id, itemId: item._id })}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            {addingItemTo === cat._id ? (
                                                <div className="space-y-3 p-4 bg-primary/5 rounded-xl border-2 border-primary/10 animate-in slide-in-from-top-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Question</Label>
                                                        <Input
                                                            value={newItem.question}
                                                            onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Answer</Label>
                                                        <Textarea
                                                            value={newItem.answer}
                                                            onChange={e => setNewItem({ ...newItem, answer: e.target.value })}
                                                            className="bg-white min-h-[80px]"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" className="flex-1" onClick={() => itemMutation.mutate({ categoryId: cat._id, ...newItem })}>
                                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                                            Add Question
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setAddingItemTo(null)}>Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAddingItemTo(cat._id)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add New Question
                                                </Button>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
