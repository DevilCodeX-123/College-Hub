import { useState } from 'react';
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
  ClipboardList,
  Link as LinkIcon,
} from 'lucide-react';
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

export default function ClubDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('challenges');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [lastViewedChat, setLastViewedChat] = useState<number>(() => {
    const stored = localStorage.getItem(`lastViewedChat_${id}`);
    return stored ? parseInt(stored) : Date.now();
  });

  // Fetch Club Data (Using API)
  const { data: club, isLoading: isLoadingClub } = useQuery({
    queryKey: ['club', id],
    queryFn: () => (id ? api.getClub(id, user?.id || user?._id) : null),
    enabled: !!id,
  });

  // Fetch Club Challenges (Using API - filtering by clubId if backend supports, else filtering frontend)
  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api.getChallenges(),
  });
  const clubChallenges = challenges.filter(c => c.clubId === id);

  // Fetch Chat Messages
  const { data: messages = [], isLoading: isLoadingChat } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => (id ? api.getMessages(id) : []),
    enabled: !!id, // Enable always to catch background messages
    refetchInterval: 3000,
  });

  const hasUnreadMessages = messages.some((m: any) =>
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

  const isMember = user?.joinedClubs?.includes(id!);
  const isPending = club?.pendingMembers?.some((m: any) => m.userId === user?.id);

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
    { id: 'history', label: 'History', icon: History },
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
              <AvatarImage src={club.logo} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {club.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold">{club.name}</h1>
                <Badge variant="secondary">{club.category}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {club.memberCount} members
                </span>
                <span>Coordinator: {club.coordinator}</span>
              </div>
            </div>

            <div className="flex gap-2 pb-4">
              <Button
                variant={isMember ? "secondary" : isPending ? "outline" : "gradient"}
                disabled={isMember || isPending || !user || requestJoinClubMutation.isPending || (club.joiningDeadline && new Date(club.joiningDeadline) < new Date())}
                onClick={() => requestJoinClubMutation.mutate()}
              >
                {requestJoinClubMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : !isMember && !isPending && (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {club.joiningDeadline && !isMember && !isPending && new Date(club.joiningDeadline) < new Date()
                  ? 'Joining Closed'
                  : isMember
                    ? 'Member'
                    : isPending
                      ? 'Request Pending'
                      : 'Join Club'}
              </Button>
              <RoleGate allowedRoles={['club_coordinator', 'admin']}>
                <Link to="/coordinator">
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </RoleGate>
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
              {clubChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
            {clubChallenges.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No active challenges at the moment.
              </p>
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
                <RoleGate allowedRoles={['club_coordinator', 'admin']}>
                  <EditAboutDialog club={club} />
                </RoleGate>
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
                      ) : messages.length > 0 ? (
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
                                {msg.sender?.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Past Challenges & Events</h2>
              <SystemBadge type="read_only" />
            </div>
            {club.history && club.history.length > 0 ? (
              <div className="space-y-4">
                {club.history.map((item: any, idx: number) => (
                  <Card key={idx} className="overflow-hidden border-l-4 border-l-primary/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tight">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2 font-medium"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View Resource
                            </a>
                          )}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          <History className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">
                    Past events and challenges will appear here
                  </p>
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
            {club.achievements && club.achievements.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {club.achievements.map((achievement: any, idx: number) => (
                  <Card key={idx} className="group hover:border-primary/30 transition-all">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold leading-tight">{achievement.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {achievement.earnedAt ? new Date(achievement.earnedAt).getFullYear() : 'Recent'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">{achievement.description}</p>
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

  const clubMembers = users.filter((u: any) => u.joinedClubs?.includes(clubId));

  if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading members...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubMembers.length === 0 ? (
        <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No members have joined this club yet.</p>
        </div>
      ) : (
        clubMembers.map((member: any) => (
          <Card key={member.id} className="group hover:border-primary/50 transition-all hover:shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-background group-hover:border-primary/20 transition-colors">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{member.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-tight">
                    {member.role || 'Member'}
                  </Badge>
                  {member.branch && <span className="text-[10px] text-muted-foreground font-medium">• {member.branch}</span>}
                  {member.year && <span className="text-[10px] text-muted-foreground font-medium">• {member.year}</span>}
                  <span className="text-[10px] font-bold text-primary ml-auto">{member.points} XP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
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
