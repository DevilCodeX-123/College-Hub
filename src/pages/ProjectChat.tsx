import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProjectChat() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: project } = useQuery({
        queryKey: ['project', id],
        queryFn: () => api.getProject(id!),
        enabled: !!id,
    });

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['project-messages', id],
        queryFn: () => api.getProjectMessages(id!),
        refetchInterval: 3000, // Poll every 3 seconds
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => api.sendProjectMessage(id!, content, user?.id || ''),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['project-messages', id] });
        },
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

    const isMember = project?.team?.includes(user?.id) || user?.role === 'admin' || user?.id === project?.requestedBy;

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
                                {messages.map((msg: any) => (
                                    <div
                                        key={msg.id || msg._id}
                                        className={`flex items-start gap-3 ${msg.sender?._id === user?.id ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Avatar className="h-8 w-8 border">
                                            <AvatarFallback className="text-[10px] bg-secondary">
                                                {msg.sender?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col gap-1 max-w-[70%] ${msg.sender?._id === user?.id ? 'items-end' : ''}`}>
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-xs font-medium">{msg.sender?.name || 'User'}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div
                                                className={`px-4 py-2 rounded-2xl text-sm ${msg.sender?._id === user?.id
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-secondary text-secondary-foreground rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
