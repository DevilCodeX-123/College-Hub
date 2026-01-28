import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { RoleGate } from '@/components/common/RoleGate';
import { SystemBadge } from '@/components/common/SystemBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Challenge, User } from '@/types';
import {
  Trophy,
  Info,
  MessageSquare,
  History,
  Award,
  Users,
  Instagram,
  Linkedin,
  Globe,
  Settings,
  UserPlus,
  ChevronLeft,
  Send,
  Loader2,
  BarChart2,
  Trash2,
  Plus,
  Shield,
  ShieldCheck,
  Zap,
  X,
  ArrowRight,
  Calendar,
  MapPin
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { PastEventDetailsDialog } from '@/components/events/PastEventDetailsDialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Guard for date formatting
const safeFormat = (date: any, formatStr: string) => {
  try {
    if (!date) return 'TBA';
    const d = new Date(date);
    if (!isValid(d)) return 'TBA';
    return format(d, formatStr);
  } catch (e) {
    return 'TBA';
  }
};

// Local Error Boundary for debugging
class ClubDetailErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    console.error('[ClubDetail Error]', error);
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong!</h2>
            <div className="bg-red-50 p-4 rounded text-left font-mono text-xs overflow-auto max-w-2xl mx-auto border border-red-200 text-red-800">
              {this.state.error?.toString()}
              <br />
              {this.state.error?.stack}
            </div>
          </div>
        </Layout>
      );
    }
    return this.props.children;
  }
}

function ClubDetailContent() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('challenges');
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    refreshUser();
  }, [id]);

  const [lastViewedChat, setLastViewedChat] = useState<number>(() => {
    const stored = localStorage.getItem(`lastViewedChat_${id}`);
    return stored ? parseInt(stored) : Date.now();
  });
  const [reportItem, setReportItem] = useState<any>(null);

  // Fetch Club Data (Using API)
  const { data: club, isLoading: isLoadingClub } = useQuery({
    queryKey: ['club', id],
    queryFn: () => (id ? api.getClub(id, user?.id || user?._id) : null),
    enabled: !!id,
  });

  // Fetch Club Challenges (Using API - filtering by clubId)
  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ['challenges', id],
    queryFn: () => api.getChallenges(undefined, id, user?.id || user?._id),
    enabled: !!id,
  });

  // Fetch Chat Messages
  const { data: messages = [], isLoading: isLoadingChat } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => (id ? api.getMessages(id) : []),
    enabled: !!id, // Enable always to catch background messages
    refetchInterval: 3000,
  });

  // Fetch Club Events (Official Records)
  const { data: clubEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['club-events', id],
    queryFn: () => api.getEvents(undefined, id),
    enabled: !!id,
  });

  // Fetch all users to compute actual member count
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['users', club?.college],
    queryFn: () => api.getUsers(club?.college),
    enabled: !!club?.college,
  });

  // Compute actual member count from users who have this club in joinedClubs
  const actualMemberCount = Array.isArray(allUsers) ? allUsers.filter((u: any) => {
    if (!u || !u.joinedClubs) return false;
    return (u.joinedClubs || []).some((cid: any) => {
      if (!cid) return false;
      const cidStr = (cid.id || cid._id || cid).toString();
      return cidStr === id;
    });
  }).length : (club?.memberCount || 0);

  const clubChallenges = Array.isArray(challenges) ? challenges.filter(c => c && c.status !== 'completed' && (!c.deadline || new Date(c.deadline) >= new Date())) : [];
  const completedEvents = Array.isArray(clubEvents) ? clubEvents.filter((e: any) => e && e.isCompleted) : [];

  const hasUnreadMessages = Array.isArray(messages) && messages.some((m: any) =>
    new Date(m.createdAt).getTime() > lastViewedChat && m.sender?._id !== user?.id
  );

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === 'chat') {
      const now = Date.now();
      setLastViewedChat(now);
      localStorage.setItem(`lastViewedChat_${id}`, now.toString());
    }
  };

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => api.sendMessage(id!, content, user?.id!),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat', id] });
    },
  });

  // Request Join Club Mutation
  const requestJoinClubMutation = useMutation({
    mutationFn: () => api.requestJoinClub(id!, user?.id!, user?.name!, user?.email!),
    onSuccess: (data) => {
      queryClient.setQueryData(['club', id], data.club);
      toast({ title: 'Join request sent! Waiting for approval.' });
      queryClient.invalidateQueries({ queryKey: ['club', id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send request',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });

  const isMember = (user?.joinedClubs || []).some((cid: any) => {
    if (!cid) return false;
    const cidStr = (cid.id || cid._id || cid).toString();
    return cidStr === id;
  });
  const isPending = club?.pendingMembers?.some((m: any) => m && (m.userId === user?.id || m.userId === (user as any)?._id));

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user) return;
    sendMessageMutation.mutate(newMessage);
  };

  if (isLoadingClub) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Club not found.</p>
          <Link to="/clubs" className="text-primary hover:underline mt-2 inline-block">
            Back to Clubs
          </Link>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'about', label: 'About', icon: Info },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'events', label: 'Events', icon: History },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Link */}
        <Link
          to="/clubs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Clubs
        </Link>

        {/* Club Header */}
        <div className="relative">
          <div className="h-32 sm:h-48 rounded-xl gradient-primary overflow-hidden relative">
            {(club.banner || club.coverImage) && (
              <img src={club.banner || club.coverImage} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 sm:-mt-12 px-4 sm:px-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-card shadow-lg">
              <AvatarImage src={club?.logo} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {club?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold">{club?.name || 'Club'}</h1>
                <Badge variant="secondary">{club?.category || 'General'}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {actualMemberCount} {actualMemberCount === 1 ? 'member' : 'members'}
                </span>
                <span>Coordinator: {club?.coordinator || 'Not Assigned'}</span>
              </div>
            </div>

            <div className="flex gap-2 pb-4">
              <Button
                variant={isMember ? "secondary" : isPending ? "outline" : "gradient"}
                disabled={!!isMember || !!isPending || !user || requestJoinClubMutation.isPending || !!(club.joiningDeadline && new Date(club.joiningDeadline) < new Date())}
                onClick={() => requestJoinClubMutation.mutate()}
              >
                {requestJoinClubMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : !isMember && !isPending && (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {club.joiningDeadline && !isMember && !isPending && (function () {
                  try { return new Date(club.joiningDeadline) < new Date(); } catch { return false; }
                })()
                  ? 'Joining Closed'
                  : isMember
                    ? 'Member'
                    : isPending
                      ? 'Request Pending'
                      : 'Join Club'}
              </Button>

            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 relative"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === 'chat' && hasUnreadMessages && activeTab !== 'chat' && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-background shadow-sm animate-pulse" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Challenges</h2>
              <RoleGate allowedRoles={['club_coordinator', 'core_member', 'admin']}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Suggest Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Suggest New Challenge</DialogTitle>
                    </DialogHeader>
                    <ChallengeCreator clubId={id!} clubName={club.name} isSuggestion />
                  </DialogContent>
                </Dialog>
              </RoleGate>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Array.isArray(clubChallenges) && clubChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
            {clubChallenges.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No active challenges at the moment.
              </p>
            )}

            {/* Past Challenges Section */}
            {Array.isArray(club.history) && club.history.some((i: any) => i && i.type === 'challenge') && (
              <div className="pt-8 border-t space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Past Challenges</h2>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.isArray(club.history) && club.history
                    .filter((item: any) => item && item.type === 'challenge')
                    .map((item: any, idx: number) => {
                      if (!item) return null;
                      const challenge: Challenge = {
                        id: item._id || item.id || `history-${idx}`,
                        _id: item._id || item.id,
                        title: item.title || 'Untitled',
                        description: item.description || '',
                        clubId: id!,
                        clubName: club.name || 'Club',
                        points: item.points || 0,
                        entryFee: 0,
                        difficulty: (item.difficulty as any) || 'medium',
                        deadline: item.date ? new Date(item.date) : new Date(),
                        participants: item.participantCount || (Array.isArray(item.leaderboard) ? item.leaderboard.length : 0),
                        status: 'completed',
                        category: item.category || 'Challenge',
                        isTeamChallenge: false,
                        prizes: Array.isArray(item.winners) ? item.winners.map((w: any) => w ? `${w.position || 'Winner'}: ${w.prize || 'Certificate'}` : '').filter(Boolean).join('\n') : ''
                      };
                      return (
                        <ChallengeCard
                          key={`past-${idx}`}
                          challenge={challenge}
                          onViewReport={() => setReportItem(item)}
                          initialLeaderboard={Array.isArray(item.leaderboard) ? item.leaderboard : []}
                        />
                      );
                    })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MembersList clubId={id!} />
          </TabsContent>


          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>About {club.name}</CardTitle>

              </CardHeader>
              <CardContent className="space-y-6">
                <p className="whitespace-pre-wrap text-muted-foreground">{club.description || 'No description provided.'}</p>

                {/* Social Links */}
                {(club.socialLinks?.instagram || club.socialLinks?.linkedin || club.socialLinks?.website) && (
                  <div className="flex gap-3">
                    {club.socialLinks.instagram && (
                      <a href={club.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon">
                          <Instagram className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {club.socialLinks.linkedin && (
                      <a href={club.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {club.socialLinks.website && (
                      <a href={club.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="min-h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Club Chat
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4">
                {!(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'co_admin' || user?.role === 'club_coordinator' || user?.role === 'club_co_coordinator' || user?.role === 'club_head' || user?.role === 'core_member') ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Restricted Access</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Club chat is exclusive to the Core Team and management. Students can participate in club challenges and attend events.
                    </p>
                  </div>
                ) : !isMember ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Members Only Chat</h3>
                    <p className="text-muted-foreground max-w-sm">
                      You need to be a member of this club to participate in the conversation.
                    </p>
                    {club.joiningDeadline && !isMember && !isPending && new Date(club.joiningDeadline) < new Date() ? (
                      <p className="mt-4 text-xs font-semibold text-destructive uppercase tracking-wider">Joining is currently closed</p>
                    ) : (
                      <Button
                        onClick={() => requestJoinClubMutation.mutate()}
                        className="mt-6"
                        variant="outline"
                        disabled={isPending || requestJoinClubMutation.isPending}
                      >
                        {isPending ? 'Approval Pending' : 'Request to Join Club to Access Chat'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
                      {isLoadingChat ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : Array.isArray(messages) && messages.length > 0 ? (
                        messages.map((msg: any) => (
                          <div
                            key={msg.id || msg._id}
                            className={cn(
                              "flex gap-3 max-w-[80%]",
                              msg.sender?._id === user?.id ? "ml-auto flex-row-reverse" : ""
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar} />
                              <AvatarFallback>{msg.sender?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className={cn(
                                "p-3 rounded-lg text-sm",
                                msg.sender?._id === user?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-foreground"
                              )}>
                                {msg.content}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 px-1">
                                {msg.sender?.name} - {(function () {
                                  try {
                                    const d = new Date(msg.createdAt);
                                    return isValid(d) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently';
                                  } catch (e) {
                                    return 'recently';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-10">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto pt-2 border-t">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Post-Event Reports</h2>
                <p className="text-sm text-muted-foreground">Detailed records of past competitions and internal club sessions.</p>
              </div>
              <Badge variant="outline" className="w-fit bg-primary/5 text-primary border-primary/20 py-1 px-3">
                {completedEvents.length} Verified Records
              </Badge>
            </div>

            {isLoadingEvents ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : completedEvents.length > 0 ? (
              <div className="grid gap-6">
                {completedEvents.map((event: any) => (
                  <Card key={event._id || event.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white ring-1 ring-slate-200">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Compact Poster Reveal */}
                        <div className="w-full md:w-56 h-40 relative overflow-hidden bg-slate-100">
                          <img
                            src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-white/90 text-primary hover:bg-white border-none shadow-sm text-[9px] font-black uppercase">
                              {event.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Calendar className="h-3 w-3" />
                              {safeFormat(event.date, 'MMMM dd, yyyy')}
                              <span className="opacity-30">•</span>
                              <MapPin className="h-3 w-3" />
                              {event.location || 'College Campus'}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {event.description || 'Verified record of achievement and participation.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">


                            <PastEventDetailsDialog event={event}>
                              <Button variant="ghost" size="sm" className="text-xs font-black text-primary hover:bg-primary/5 gap-1 group/btn">
                                VIEW OFFICIAL REPORT <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </PastEventDetailsDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="py-20 text-center space-y-4">
                  <div className="h-20 w-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <History className="h-10 w-10 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">No Verified Records</p>
                    <p className="text-sm text-slate-400 max-w-[280px] mx-auto">This club hasn't finalized any official event reports in the college hub registry yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Club Achievements</h2>
              <SystemBadge type="read_only" />
            </div>
            {Array.isArray(club.achievements) && club.achievements.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {club.achievements.map((achievement: any, idx: number) => (
                  <Card key={idx} className="group hover:border-primary/30 transition-all">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold leading-tight">{achievement.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {achievement.earnedAt ? new Date(achievement.earnedAt).getFullYear() : 'Recent'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{achievement.description}</p>
                        <EventDetailsDialog item={achievement} title="Achievement" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">
                    Achievements coming soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Dialog for History Items */}
      {reportItem && (
        <EventDetailsDialog
          item={reportItem}
          title="Challenge Report"
          open={!!reportItem}
          onOpenChange={(open) => !open && setReportItem(null)}
        />
      )}
    </Layout>
  );
}


function ChallengeCreator({ clubId, clubName, isSuggestion }: { clubId: string, clubName: string, isSuggestion?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 100,
    entryFee: 0,
    difficulty: 'medium' as const,
    category: 'General',
    deadline: '',
    isTeamChallenge: false
  });

  const actionMutation = useMutation({
    mutationFn: (data: any) => isSuggestion ? api.suggestChallenge(clubId, data) : api.createChallenge(data),
    onSuccess: () => {
      toast({ title: isSuggestion ? 'Challenge suggestion sent to core team!' : 'Challenge created successfully!' });
      queryClient.invalidateQueries({ queryKey: [isSuggestion ? 'club' : 'challenges'] });
      if (isSuggestion) {
        queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      }
    },
    onError: () => {
      toast({ title: isSuggestion ? 'Failed to send suggestion' : 'Failed to create challenge', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = isSuggestion ? {
      ...formData,
      suggestedBy: {
        userId: user?.id,
        userName: user?.name
      },
      status: 'pending'
    } : {
      ...formData,
      clubId,
      clubName,
      participants: 0,
      status: 'active'
    };
    actionMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Points</Label>
          <Input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(val: any) => setFormData({ ...formData, difficulty: val })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Entry Fee (XP)</Label>
          <Input
            type="number"
            min="0"
            value={formData.entryFee}
            onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2 flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isTeamChallenge}
              onChange={(e) => setFormData({ ...formData, isTeamChallenge: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Team Challenge</span>
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deadline</Label>
        <Input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={actionMutation.isPending}>
        {actionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSuggestion ? 'Submit Suggestion' : 'Create Challenge'}
      </Button>
    </form>
  );
}

function MembersList({ clubId }: { clubId: string }) {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers()
  });

  const clubMembers = Array.isArray(users) ? users.filter((u: any) =>
    (u.joinedClubs || []).some((cid: any) => {
      if (!cid) return false;
      return (cid.id || cid._id || cid).toString() === clubId;
    })
  ) : [];

  // Sort logic
  const getRolePriority = (role: string) => {
    switch (role) {
      case 'faculty_coordinator': return 1;
      case 'club_coordinator': return 2;
      case 'club_head': return 3;
      case 'core_member': return 4;
      case 'secretary': return 5;
      default: return 6; // members, admins, owners, students
    }
  };

  if (Array.isArray(clubMembers)) {
    clubMembers.sort((a: any, b: any) => getRolePriority(a?.role || '') - getRolePriority(b?.role || ''));
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading members...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubMembers.length === 0 ? (
        <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No members have joined this club yet.</p>
        </div>
      ) : (
        Array.isArray(clubMembers) && clubMembers.map((member: any) => {
          if (!member) return null;
          const formatRole = (role: string) => {
            switch (role) {
              case 'club_coordinator': return 'Coordinator';
              case 'club_head': return 'Club Head';
              case 'core_member': return 'Core Team';
              case 'secretary': return 'Secretary';
              case 'admin':
              case 'owner':
              case 'student':
              default:
                return 'Club Member';
            }
          };

          return (
            <Card key={member.id || member._id} className="group hover:border-primary/50 transition-all hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-background group-hover:border-primary/20 transition-colors">
                  <AvatarImage src={member?.avatar} />
                  <AvatarFallback>{member?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{member?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-tight">
                      {formatRole(member.role || 'member')}
                    </Badge>
                    {member.branch && <span className="text-[10px] text-muted-foreground font-medium">- {member.branch}</span>}
                    {member.year && <span className="text-[10px] text-muted-foreground font-medium">- {member.year}</span>}
                    <span className="text-[10px] font-bold text-primary ml-auto">{member.points || 0} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function EventReportContent({ item, onClose }: { item: any, title: string, onClose?: () => void }) {
  const challengeId = item?.challengeId || item?.id || (item?._id && typeof item._id === 'string' && !item._id.startsWith('history-') ? item._id : null);

  // Connect to Backend: Fetch live data if available
  const { data: liveChallenge, isLoading: isLoadingChallenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => api.getChallenge(challengeId!),
    enabled: !!challengeId && (!item?.leaderboard || item?.leaderboard.length === 0 || !item?.points)
  });

  const { data: liveLeaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['challenge-leaderboard', challengeId],
    queryFn: () => api.getChallengeLeaderboard(challengeId!),
    enabled: !!challengeId && (!item?.leaderboard || item?.leaderboard.length === 0)
  });

  if (!item) return null;

  // Data mapping with priority: Live -> Historical Snapshot -> Defaults
  const displayCategory = liveChallenge?.category || item.category || (item.type === 'challenge' ? 'Challenge' : 'Event');
  const displayPoints = liveChallenge?.points ?? item.points ?? 0;
  const displayDifficulty = liveChallenge?.difficulty || item.difficulty || 'Medium';
  const displayDescription = liveChallenge?.description || item.description || "No overview details provided for this record.";

  const leaderboard = Array.isArray(liveLeaderboard) ? liveLeaderboard : Array.isArray(item.leaderboard) ? item.leaderboard : [];

  const isDataLoading = isLoadingChallenge || isLoadingLeaderboard;

  return (
    <div className="text-left bg-white">
      {/* Short & Sweet Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#0f172a]">{item.title}</h2>
          <Badge className="bg-[#ef4444] hover:bg-[#ef4444] text-white rounded-full px-2.5 py-0 h-5 text-[9px] font-black uppercase tracking-wider border-none flex items-center justify-center">
            Ended
          </Badge>
          {isDataLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full text-slate-400">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-[13px] text-slate-500 font-medium mb-6 leading-tight">
        This challenge has ended. View the final results and submissions below.
      </p>

      {/* Hero Section - Compact */}
      <div className="flex justify-between items-start gap-4 mb-8">
        <div className="flex-1 space-y-2">
          <Badge variant="secondary" className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-100 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
            {displayCategory}
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-[#0f172a] leading-none">{item.title}</h1>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="rounded-full flex items-center gap-1.5 px-3 py-1 text-slate-600 border-slate-100 bg-white font-bold text-[10px]">
              <Users className="h-3 w-3" />
              {item.type === 'challenge' ? 'Solo Challenge' : 'Group Event'}
            </Badge>
            <Badge className={cn(
              "rounded-full px-4 py-1 text-white font-black border-none uppercase text-[9px] tracking-wider",
              "bg-[#ef4444]"
            )}>
              {displayDifficulty}
            </Badge>
          </div>
        </div>

        {/* Compact Reward Card */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 min-w-[120px] flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 leading-none">REWARD</p>
          <div className="flex items-center gap-1.5 text-[#3b82f6] mb-1">
            <Zap className="h-5 w-5 fill-[#3b82f6]" />
            <span className="text-2xl font-black tracking-tighter leading-none">{displayPoints}</span>
          </div>
          <p className="text-[9px] font-black uppercase text-[#3b82f6] tracking-widest leading-none">XP Points</p>
        </div>
      </div>

      {/* Simplified Overview */}
      <div className="space-y-3 mb-8">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Info className="h-3.5 w-3.5" /> CHALLENGE OVERVIEW
        </h4>
        <div className="text-[14px] font-medium text-slate-600 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm leading-relaxed whitespace-pre-wrap">
          {displayDescription}
        </div>
      </div>

      {/* Results Table - Streamlined */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5" /> FINAL RESULTS
        </h4>
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="grid grid-cols-[50px_1fr_80px] gap-3 p-3.5 bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-50">
            <div className="text-center">#</div>
            <div>PARTICIPANT / TEAM</div>
            <div className="text-right pr-4">SCORE</div>
          </div>
          <div className="divide-y divide-slate-50">
            {Array.isArray(leaderboard) && leaderboard.length > 0 ? (
              [...leaderboard].sort((a: any, b: any) => (a?.rank || 999) - (b?.rank || 999)).map((entry: any, idx: number) => {
                if (!entry) return null;
                return (
                  <div key={idx} className="grid grid-cols-[50px_1fr_80px] gap-3 p-4 hover:bg-slate-50/30 items-center transition-colors">
                    <div className="flex justify-center items-center">
                      {idx === 0 ? <span>1st</span> : idx === 1 ? <span>2nd</span> : idx === 2 ? <span>3rd</span> : <span className="text-slate-300 font-bold text-[11px]">#{idx + 1}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white shadow-sm">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-[11px]">{entry.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-slate-700 text-sm tracking-tight">{entry.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-right font-black text-xl text-[#3b82f6] pr-4 tabular-nums leading-none">
                      {entry.score || entry.marks || 0}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-300 font-black text-xs uppercase tracking-widest">
                No Results Available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetailsDialog({ item, title, open, onOpenChange }: { item: any, title: string, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  if (typeof open !== 'undefined') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-[32px] border-none shadow-2xl">
          <EventReportContent item={item} title={title} onClose={() => onOpenChange?.(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-black flex items-center gap-1 group">
          View Detailed Report
          <ChevronLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-[32px] border-none shadow-2xl">
        <EventReportContent item={item} title={title} />
      </DialogContent>
    </Dialog>
  );
}

export default function ClubDetail() {
  return (
    <ClubDetailErrorBoundary>
      <ClubDetailContent />
    </ClubDetailErrorBoundary>
  );
}

function EditAboutDialog({ club }: { club: any }) {
  const [description, setDescription] = useState(club.description || '');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateClub(club.id || club._id, data),
    onSuccess: () => {
      toast({ title: 'Club description updated!' });
      queryClient.invalidateQueries({ queryKey: ['club', club.id || club._id] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit About
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Club Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="w-full min-h-[150px] p-3 rounded-md border bg-background"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write about your club..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate({ description })} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
