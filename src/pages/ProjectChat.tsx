import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Loader2, Users, Shield, Zap, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ProjectChat() {
    const { toast } = useToast();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: project } = useQuery({
        queryKey: ['project', id, user?.id],
        queryFn: () => api.getProject(id!, user?.id || (user as any)?._id),
        enabled: !!id && !!user,
    });

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['project-messages', id],
        queryFn: () => api.getProjectMessages(id!),
        refetchInterval: 3000, // Poll every 3 seconds
    });

    const uId = (user?.id || (user as any)?._id)?.toString();
    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => api.sendProjectMessage(id!, content, uId || ''),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['project-messages', id] });
        },
    });

    const resolveJoinMutation = useMutation({
        //@ts-ignore
        mutationFn: ({ requestId, status, rejectionReason, messageId }: { requestId: string, status: 'accepted' | 'rejected', rejectionReason?: string, messageId?: string }) =>
            api.resolveProjectJoinRequest(id!, requestId, { status, requestingUserId: uId || '', rejectionReason, messageId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['project-messages', id] });
            toast({ title: "Recruit Resolved", description: "Operation status updated." });
        },
        onError: (err: any) => {
            toast({
                title: "Action Failed",
                description: err.response?.data?.message || "Could not resolve request",
                variant: "destructive"
            });
        }
    });

    const resolvePostponeMutation = useMutation({
        mutationFn: ({ goalId, status, deadline, messageId }: { goalId: string, status: 'accepted' | 'rejected', deadline?: string, messageId?: string }) =>
            api.resolveMissionPostpone(id!, goalId, { status, requestingUserId: uId || '', deadline, messageId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['project-messages', id] });
            toast({ title: "Mission Updated", description: "Request status updated." });
        },
        onError: (err: any) => {
            toast({
                title: "Action Failed",
                description: err.response?.data?.message || "Could not resolve postponement",
                variant: "destructive"
            });
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(newMessage.trim());
    };

    const isMember = (() => {
        if (!project || !user) return false;
        const uId = (user?.id || (user as any)?._id)?.toString();
        if (!uId) return false;

        const isTeamMember = (project as any).team?.some((m: any) => {
            if (!m) return false;
            const mId = (typeof m === 'string' ? m : (m.id || m._id))?.toString();
            return mId === uId;
        });

        const leader = (project as any).requestedBy;
        const leaderId = (typeof leader === 'string' ? leader : (leader?.id || leader?._id))?.toString();

        return isTeamMember || user.role === 'admin' || leaderId === uId;
    })();

    const isLeader = (() => {
        if (!project || !user) return false;
        const leader = (project as any).requestedBy;
        const leaderId = (typeof leader === 'string' ? leader : (leader?.id || leader?._id))?.toString();
        // const isAdmin = user.role === 'admin' || user.role === 'owner';
        return leaderId === uId; // Strictly leader only
    })();

    if (!isMember && project) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <Users className="h-12 w-12 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground max-w-md">
                        You must be a member of this project to access the team chat.
                    </p>
                    <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] min-h-[500px] flex flex-col space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold truncate max-w-[300px] md:max-w-md">
                                {project?.title || 'Project Chat'}
                            </h1>
                            <p className="text-xs text-muted-foreground">Team Discussion • {project?.team?.length || 0} members</p>
                        </div>
                    </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm">
                    <ScrollArea className="flex-1 p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground italic">No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                                {messages.map((msg: any) => {
                                    const isSystem = msg.type === 'system';
                                    const isRecruitment = msg.type === 'recruitment' || msg.content?.includes('approve or reject this recruit directly') || msg.content?.includes('NEW RECRUIT ALERT');
                                    const isPostpone = msg.type === 'postpone' || msg.content?.includes('MISSION POSTPONE REQUEST');

                                    if (isRecruitment || isPostpone) {
                                        return (
                                            <div key={msg.id || msg._id} className="flex flex-col items-center justify-center py-4 px-4 w-full">
                                                <div className="bg-slate-950 text-white rounded-none p-6 max-w-2xl w-full shadow-2xl border-l-4 border-white">
                                                    <p className="text-[13px] font-bold leading-relaxed whitespace-pre-wrap mb-6">
                                                        {msg.content}
                                                    </p>

                                                    {msg.requestStatus && msg.requestStatus !== 'pending' ? (
                                                        <div className="flex justify-center mt-4">
                                                            <Badge className={`uppercase text-[10px] font-black px-4 py-2 rounded-full tracking-widest ${msg.requestStatus === 'accepted' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                                {msg.requestStatus === 'accepted' ? 'ACCEPTED' : 'REJECTED'}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        isLeader && (isPostpone ? msg.goalId : msg.joinRequestId) && (
                                                            <div className="flex gap-4 justify-center">
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1 bg-white text-black hover:bg-slate-200 font-black text-[11px] uppercase tracking-widest h-11 rounded-none"
                                                                    disabled={resolveJoinMutation.isPending || resolvePostponeMutation.isPending}
                                                                    onClick={() => {
                                                                        const msgId = msg.id || msg._id;
                                                                        if (isPostpone) {
                                                                            resolvePostponeMutation.mutate({ goalId: msg.goalId, status: 'accepted', deadline: msg.requestedDate, messageId: msgId });
                                                                        } else {
                                                                            resolveJoinMutation.mutate({ requestId: msg.joinRequestId, status: 'accepted', messageId: msgId });
                                                                        }
                                                                    }}
                                                                >
                                                                    Accept Request
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="flex-1 border-white text-white hover:bg-white hover:text-black font-black text-[11px] uppercase tracking-widest h-11 rounded-none bg-transparent"
                                                                    disabled={resolveJoinMutation.isPending || resolvePostponeMutation.isPending}
                                                                    onClick={() => {
                                                                        const msgId = msg.id || msg._id;
                                                                        if (isPostpone) {
                                                                            resolvePostponeMutation.mutate({ goalId: msg.goalId, status: 'rejected', messageId: msgId });
                                                                        } else {
                                                                            const reason = prompt("State reason for rejection (this will be sent to candidate):");
                                                                            if (reason !== null) {
                                                                                resolveJoinMutation.mutate({ requestId: msg.joinRequestId, status: 'rejected', rejectionReason: reason, messageId: msgId });
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    Reject Request
                                                                </Button>
                                                            </div>
                                                        )
                                                    )}
                                                    <div className="mt-6 pt-4 border-t border-white/10 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] flex justify-between items-center">
                                                        <span>{isPostpone ? 'Operation Timeline Change' : 'New Join Request'}</span>
                                                        <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (isSystem) {
                                        return (
                                            <div key={msg.id || msg._id} className="flex flex-col items-center justify-center py-2 px-4">
                                                <div className="bg-slate-900 border border-white/10 rounded-none p-5 max-w-md w-full shadow-sm">
                                                    <p className="text-[11px] font-bold text-white whitespace-pre-wrap leading-relaxed text-center">
                                                        {msg.content}
                                                    </p>
                                                    <div className="mt-2 text-[9px] text-slate-500 font-black text-center uppercase tracking-widest">
                                                        Operation Alert • {format(new Date(msg.createdAt), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={msg.id || msg._id}
                                            className={`flex items-start gap-4 ${(msg.sender?._id === uId || msg.sender?.id === uId) ? 'flex-row-reverse' : ''}`}
                                        >
                                            <Avatar className="h-10 w-10 border-2 border-white/10 shadow-lg">
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-black uppercase">
                                                    {(msg.sender?.name || "?").charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.sender?._id === uId || msg.sender?.id === uId ? 'items-end' : ''}`}>
                                                <div className="flex items-center gap-2 px-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                        {msg.sender?.name || 'User'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`px-5 py-3 rounded-[1.5rem] text-[13px] font-semibold leading-relaxed shadow-xl ${(msg.sender?._id === uId || msg.sender?.id === uId)
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-none'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t bg-background/50">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <Input
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sendMessageMutation.isPending}
                                className="bg-card"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                                {sendMessageMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
