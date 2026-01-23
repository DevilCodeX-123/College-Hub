import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Clock, Users, ChevronRight, Loader2, Key, Shield, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [openNew, setOpenNew] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('last_viewed_projects', new Date().toISOString());
  }, []);
  const [proposalData, setProposalData] = useState({
    title: '',
    description: '',
    type: 'Web Application',
    memberLimit: '4',
    problemStatement: '',
    idea: '',
    clubId: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('join') === 'true') {
      setOpenJoin(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', user?.college],
    queryFn: () => api.getProjects(user?.college, undefined, undefined, user?.id || user?._id),
    enabled: !!user?.college
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs', user?.college],
    queryFn: () => api.getClubs(user?.college, user?.id || user?._id),
    enabled: !!user?.college
  });

  const createProposalMutation = useMutation({
    mutationFn: (data: any) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpenNew(false);
      toast({
        title: 'Proposal Submitted',
        description: 'Your project proposal has been sent to the core team for approval.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Submission Failed',
        description: err.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const joinProjectMutation = useMutation({
    mutationFn: ({ userId, code }: { userId: string; code: string }) =>
      api.joinProjectByCode(userId, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpenJoin(false);
      setJoinCode('');
      toast({
        title: 'Joined Successfully',
        description: 'You are now a member of the project team.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Join Failed',
        description: err.response?.data?.message || 'Invalid code or team full',
        variant: 'destructive',
      });
    },
  });

  const exitProjectMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      api.exitProject(projectId, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpenDetails(false);
      toast({
        title: 'Exited Project',
        description: data.message || 'You have left the project.',
        variant: data.deleted ? 'destructive' : 'default'
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to Exit',
        description: err.response?.data?.message || 'Could not exit project',
        variant: 'destructive'
      });
    }
  });

  const completeProjectMutation = useMutation({
    mutationFn: (id: string) => api.completeProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpenDetails(false);
      toast({
        title: 'Project Completed!',
        description: 'Team members and coordinator have been notified.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Action Failed',
        description: err.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });



  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalData.clubId) return toast({ title: 'Please select a target club', variant: 'destructive' });

    const selectedClub = clubs.find((c: any) => (c.id || c._id) === proposalData.clubId);

    createProposalMutation.mutate({
      ...proposalData,
      requestedBy: user?.id,
      clubName: selectedClub?.name,
      memberLimit: parseInt(proposalData.memberLimit),
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    joinProjectMutation.mutate({ userId: user?.id || '', code: joinCode });
  };

  const isMember = (project: any) => {
    return project.team?.includes(user?.id) || user?.role === 'admin' || user?.id === project.requestedBy;
  };

  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    setOpenDetails(true);
  };

  const statusColors = {
    pending: 'outline',
    in_progress: 'default',
    completed: 'success',
    on_hold: 'warning',
    rejected: 'destructive',
  } as const;

  const statusLabels = {
    pending: 'Pending Approval',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
    rejected: 'Rejected',
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Collaborate on innovative campus solutions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openJoin} onOpenChange={setOpenJoin}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Key className="h-4 w-4 mr-2" />
                  Join Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Project Team</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Enter Join Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. A1B2C3"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Ask your project leader for the code.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={joinProjectMutation.isPending}>
                    {joinProjectMutation.isPending ? 'Joining...' : 'Join Team'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Propose New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProposalSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="title">Project Name</Label>
                      <Input
                        id="title"
                        required
                        value={proposalData.title}
                        onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="club">Target Club for Approval</Label>
                      <Select
                        value={proposalData.clubId}
                        onValueChange={(val) => setProposalData({ ...proposalData, clubId: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a club" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs.map((club: any) => (
                            <SelectItem key={club.id || club._id} value={club.id || club._id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="type">Project Type</Label>
                      <Select
                        value={proposalData.type}
                        onValueChange={(val) => setProposalData({ ...proposalData, type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Web Application">Web Application</SelectItem>
                          <SelectItem value="Mobile App">Mobile App</SelectItem>
                          <SelectItem value="AI/ML">AI/ML Model</SelectItem>
                          <SelectItem value="Hardware/IoT">Hardware/IoT</SelectItem>
                          <SelectItem value="Research">Research Paper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="limit">Member Limit</Label>
                      <Input
                        id="limit"
                        type="number"
                        min="2"
                        max="10"
                        value={proposalData.memberLimit}
                        onChange={(e) => setProposalData({ ...proposalData, memberLimit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="problem">Problem Statement</Label>
                      <Textarea
                        id="problem"
                        required
                        placeholder="What problem are you solving?"
                        value={proposalData.problemStatement}
                        onChange={(e) => setProposalData({ ...proposalData, problemStatement: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="idea">Your Idea/Solution</Label>
                      <Textarea
                        id="idea"
                        required
                        placeholder="Briefly describe your solution..."
                        value={proposalData.idea}
                        onChange={(e) => setProposalData({ ...proposalData, idea: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" variant="gradient" className="w-full" disabled={createProposalMutation.isPending}>
                      {createProposalMutation.isPending ? 'Submitting...' : 'Send to Core Team'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Project Details Dialog */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="max-w-2xl">
            {selectedProject && (
              <>
                <DialogHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                    <DialogTitle className="text-xl break-words max-w-[70%]">{selectedProject.title}</DialogTitle>
                    <Badge variant={statusColors[selectedProject.status as keyof typeof statusColors]} className="shrink-0">
                      {statusLabels[selectedProject.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <p className="text-sm text-primary font-medium break-words mt-1">{selectedProject.type} • {selectedProject.clubName || 'General'}</p>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  {isMember(selectedProject) ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Problem Statement</Label>
                          <p className="text-sm leading-relaxed break-words">{selectedProject.problemStatement || selectedProject.description}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">The Solution/Idea</Label>
                          <p className="text-sm leading-relaxed break-words">{selectedProject.idea || "No specific idea details provided yet."}</p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground">Team Members ({selectedProject.team?.length || 0} / {selectedProject.memberLimit})</Label>
                          {selectedProject.joinCode && (
                            <Badge variant="secondary" className="font-mono">Code: {selectedProject.joinCode}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.team?.map((memberId: string, i: number) => (
                            <Badge key={i} variant="outline" className="flex items-center gap-1 py-1">
                              <Users className="h-3 w-3" />
                              User {memberId.slice(-4)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {selectedProject.status !== 'pending' && (
                        <div className="space-y-2 border-t pt-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Current Progress</span>
                            <span className="font-bold">{selectedProject.progress}%</span>
                          </div>
                          <Progress value={selectedProject.progress} variant="accent" className="h-2" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center space-y-4 bg-secondary/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
                      <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">Confidential Project</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Full details including the idea and problem statement are only visible to team members.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setOpenDetails(false); setOpenJoin(true); }}>
                        Join this Project
                      </Button>
                    </div>
                  )}

                  {selectedProject.status === 'in_progress' && isMember(selectedProject) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Are you sure you want to exit this project? If you are the leader, leadership will be transferred. If you are the last member, the project will be deleted.')) {
                            exitProjectMutation.mutate({ projectId: selectedProject.id || selectedProject._id, userId: user?.id || user?._id });
                          }
                        }}
                        disabled={exitProjectMutation.isPending}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Exit Project
                      </Button>

                      <Button
                        variant="gradient"
                        className="flex-1"
                        onClick={() => completeProjectMutation.mutate(selectedProject.id || selectedProject._id)}
                        disabled={completeProjectMutation.isPending}
                      >
                        {completeProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Complete
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-red-500 text-center py-4">
            Failed to load projects: {error.message || 'Unknown error'}
            <br />
            Please try again later.
          </div>
        )}

        {!isLoading && !error && (
          /* Projects Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {projects.map((project: any) => {
              const joined = isMember(project);
              return (
                <Card key={project.id || project._id} variant="interactive" className={project.status === 'pending' ? 'opacity-75' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base truncate">{project.title}</CardTitle>
                      <Badge variant={statusColors[project.status as keyof typeof statusColors]}>
                        {statusLabels[project.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{project.clubName || 'General'}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {joined ? (
                      <>
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                          {project.description || project.problemStatement}
                        </p>

                        {/* Progress (Only if approved) */}
                        {project.status !== 'pending' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} variant="accent" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-4 text-center border rounded-md bg-secondary/5 flex flex-col items-center justify-center min-h-[100px] space-y-2">
                        <Users className="h-5 w-5 text-muted-foreground/30 mb-1" />
                        <p className="text-xs text-muted-foreground italic">Restricted View</p>
                        {project.joinCode ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">Join Code</span>
                              <Badge variant="secondary" className="font-mono text-xs tracking-widest px-3">
                                {project.joinCode}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 text-[10px] px-4"
                              onClick={() => { setJoinCode(project.joinCode); setOpenJoin(true); }}
                            >
                              Join with Key
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1">Join team to see details</p>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {project.team?.slice(0, 3).map((member: string, i: number) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-card">
                              <AvatarFallback className="text-xs bg-secondary">
                                {String.fromCharCode(65 + i)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.team?.length || 0} / {project.memberLimit} members
                        </span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(project.deadline), 'MMM d')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 justify-between" size="sm" onClick={() => handleViewDetails(project)}>
                        {project.status === 'pending' ? 'View Proposal' : 'View Details'}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      {joined && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-3"
                          onClick={() => navigate(`/projects/${project.id || project._id}/chat`)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {projects.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-muted-foreground/20">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium text-lg text-muted-foreground">No Projects Found</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to propose a new idea!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
