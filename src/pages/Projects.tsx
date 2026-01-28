import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Clock, Users, ChevronRight, Loader2, Key, Shield, MessageSquare, CheckCircle, CheckCircle2, Target, Link as LinkIcon, Trash2, ExternalLink, AlertCircle, Calendar, Zap, Edit, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project, Club } from '@/types';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Safety logic for dates to prevent white screen crashes
  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'TBA';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'TBA';
      return format(d, formatStr);
    } catch (e) {
      return 'TBA';
    }
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
    projectTypeDescription: '',
    teamName: '',
    memberLimit: '4',
    problemStatement: '',
    idea: '',
    isPublicChallenge: false,
    clubId: '',
  });

  const [joinRequestData, setJoinRequestData] = useState({ reason: '', skills: '', experiences: '', comments: '' });

  const requestJoinMutation = useMutation({
    mutationFn: (data: any) => api.requestJoinProject(selectedProject?.id || selectedProject?._id, { ...data, userId: user?.id || '' }),
    onSuccess: () => {
      toast({ title: 'Request Sent', description: 'The project leader will review your request.' });
      setJoinRequestData({ reason: '', skills: '', experiences: '', comments: '' });
    },
    onError: (err: any) => {
      toast({ title: 'Request Failed', description: err.response?.data?.message || 'Could not send request', variant: 'destructive' });
    }
  });

  const resolveRequestMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string, status: 'accepted' | 'rejected' }) => {
      const uId = user?.id || (user as any)?._id;
      return api.resolveProjectJoinRequest(selectedProject?.id || selectedProject?._id, requestId, { status, requestingUserId: uId || '' });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: `Recruitment ${resolveRequestMutation.variables?.status || 'Resolved'}` });
    },
    onError: (err: any) => {
      toast({
        title: 'Action Failed',
        description: err.response?.data?.message || 'Verification failed. Only the project leader can authorize enlistments.',
        variant: 'destructive'
      });
    }
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

  // Keep selected project in sync with query data (e.g. after join/update)
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const updated = projects.find((p: Project) => (p.id || p._id) === (selectedProject.id || selectedProject._id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProject)) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

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

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string, progress: number }) =>
      api.updateProjectProgress(id, progress, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Progress Updated' });
    }
  });

  const addGoalMutation = useMutation({
    mutationFn: (goal: any) => api.addProjectGoal(selectedProject?.id || selectedProject?._id, { ...goal, requestingUserId: user?.id }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setGoalData({ title: '', description: '', deadline: '', requirementKey: '', assignedType: 'specific', assignees: [] });
      toast({ title: 'Mission Deployed!' });
    },
    onError: (err: any) => {
      toast({
        title: 'Mission Deploy Failed',
        description: err.response?.data?.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) =>
      api.deleteProjectGoal(selectedProject?.id || selectedProject?._id, goalId, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Goal Removed' });
    }
  });

  const submitGoalMutation = useMutation({
    mutationFn: ({ goalId, link, title, description, key }: { goalId: string, link: string, title?: string, description?: string, key?: string }) =>
      api.submitProjectGoal(selectedProject?.id || selectedProject?._id, goalId, link, user?.id || '', title, description, key),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setSubmissionLink('');
      setSubmissionTitle('');
      setSubmissionDescription('');
      setSubmissionKey('');
      setSubmittingGoalId(null);
      toast({ title: 'Goal Submitted!' });
    },
    onError: (err: any) => {
      toast({
        title: 'Submission Failed',
        description: err.response?.data?.message || 'Deadline may have passed.',
        variant: 'destructive'
      });
    }
  });

  const addResourceMutation = useMutation({
    mutationFn: (resource: any) =>
      api.addProjectResource(selectedProject?.id || selectedProject?._id, {
        ...resource,
        addedBy: user?.id,
        addedByName: user?.name
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setResourceData({ title: '', description: '', url: '' });
      toast({ title: 'Resource Added' });
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) =>
      api.deleteProjectResource(selectedProject?.id || selectedProject?._id, resourceId, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Resource Removed' });
    }
  });

  const [goalData, setGoalData] = useState<{
    title: string;
    description: string;
    deadline: string;
    requirementKey: string;
    assignedType: 'all' | 'specific';
    assignees: string[];
  }>({
    title: '',
    description: '',
    deadline: '',
    requirementKey: '',
    assignedType: 'specific',
    assignees: []
  });

  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [missionEditData, setMissionEditData] = useState<{
    deadline: string;
    assignees: string[];
    assignedType: 'all' | 'specific';
    requirementKey: string;
    submissionKey: string;
  }>({ deadline: '', assignees: [], assignedType: 'specific', requirementKey: '', submissionKey: '' });

  const updateGoalMutation = useMutation({
    mutationFn: (data: any) => api.updateProjectGoal(selectedProject?.id || selectedProject?._id, editingMissionId!, { ...data, requestingUserId: user?.id || '' }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setEditingMissionId(null);
      toast({ title: 'Mission Updated' });
    }
  });

  const postponeGoalMutation = useMutation({
    mutationFn: (data: any) => api.updateProjectGoal(selectedProject?.id || selectedProject?._id, postponingGoalId!, { ...data, requestingUserId: user?.id || '' }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setPostponingGoalId(null);
      toast({ title: 'Mission Postponed' });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to postpone",
        description: err.response?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const [postponingGoalId, setPostponingGoalId] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState('');

  const accomplishGoalMutation = useMutation({
    mutationFn: (goalId: string) => api.accomplishProjectGoal(selectedProject?.id || selectedProject?._id, goalId, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Mission Accomplished' });
    }
  });

  const requestPostponeMutation = useMutation({
    mutationFn: (data: { requestedDate: string, personalNote: string }) =>
      api.requestMissionPostpone(selectedProject?.id || selectedProject?._id, memberRequestingPostponeId!, { ...data, requestingUserId: user?.id || '' }),
    onSuccess: () => {
      setMemberRequestingPostponeId(null);
      setRequestedDate('');
      setPersonalNote('');
      toast({ title: 'Request Sent', description: 'Postponement request posted to chat.' });
    }
  });

  const [memberRequestingPostponeId, setMemberRequestingPostponeId] = useState<string | null>(null);
  const [requestedDate, setRequestedDate] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [resourceData, setResourceData] = useState({ title: '', description: '', url: '' });
  const [tempProgress, setTempProgress] = useState(0);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [submissionKey, setSubmissionKey] = useState('');
  const [submittingGoalId, setSubmittingGoalId] = useState<string | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({ problemStatement: '', idea: '', description: '', teamName: '' });

  useEffect(() => {
    if (selectedProject) {
      setTempProgress(selectedProject.progress || 0);
      setEditedDetails({
        problemStatement: selectedProject.problemStatement || '',
        idea: selectedProject.idea || '',
        description: selectedProject.description || '',
        teamName: selectedProject.teamName || ''
      });
    }
  }, [selectedProject]);

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.removeProjectMember(selectedProject?.id || selectedProject?._id, memberId, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Member Removed' });
    }
  });

  const reviewGoalMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string, status: 'approved' | 'rejected' }) =>
      api.reviewProjectGoal(selectedProject?.id || selectedProject?._id, goalId, status, user?.id || ''),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      toast({ title: 'Submission Reviewed' });
    }
  });

  const updateDetailsMutation = useMutation({
    mutationFn: (data: any) => api.updateProjectDetails(selectedProject?.id || selectedProject?._id, { ...data, requestingUserId: user?.id || '' }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(updated);
      setIsEditingDetails(false);
      toast({ title: 'Project Details Updated' });
    }
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

  const isMember = (project: Project | null) => {
    if (!project) return false;
    const uId = user?.id || (user as any)?._id;
    const isTeamMember = project.team?.some((m: any) => {
      if (!m) return false;
      const mId = typeof m === 'string' ? m : (m.id || m._id);
      return mId === uId;
    });
    const leader = project.requestedBy;
    const leaderId = typeof leader === 'string' ? leader : (leader?.id || leader?._id);
    const isProjectLeader = leaderId === uId;

    return isTeamMember || isProjectLeader;
  };

  const isLeader = (project: Project | null) => {
    if (!project || !project.requestedBy) return false;
    const uId = user?.id || (user as any)?._id;
    const leaderId = typeof project.requestedBy === 'string' ? project.requestedBy : project.requestedBy?.id || (project.requestedBy as any)?._id;
    const isOwner = user?.role === 'owner' || user?.role === 'admin';
    return uId === leaderId || isOwner;
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
            <p className="text-muted-foreground mt-1">Collaborate on innovative campus solutions</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openJoin} onOpenChange={setOpenJoin}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Key className="h-4 w-4 mr-2" /> Join Project
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
                  <Plus className="h-4 w-4 mr-2" /> New Project
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
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        required
                        placeholder="e.g. Code Warriors"
                        value={proposalData.teamName}
                        onChange={(e) => setProposalData({ ...proposalData, teamName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="club">Target Club</Label>
                      <Select
                        value={proposalData.clubId}
                        onValueChange={(val) => setProposalData({ ...proposalData, clubId: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a club" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs.map((club: Club) => (
                            <SelectItem key={club.id || (club as any)._id} value={club.id || (club as any)._id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="problem">Problem Statement</Label>
                      <Textarea
                        id="problem"
                        required
                        value={proposalData.problemStatement}
                        onChange={(e) => setProposalData({ ...proposalData, problemStatement: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="gradient" className="w-full mt-4" disabled={createProposalMutation.isPending}>
                    {createProposalMutation.isPending ? 'Submitting...' : 'Send Proposal'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Project Details Dialog */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[3.5rem] border-4 p-0 bg-white">
            {selectedProject && (
              <div className="space-y-0">
                {isMember(selectedProject) ? (
                  <div className="p-8 space-y-6">
                    <CardHeader className="p-0 pb-4 border-b border-dashed">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Zap className="h-6 w-6 text-primary fill-primary" />
                            {selectedProject.title}
                          </CardTitle>
                          <Badge variant={statusColors[selectedProject.status as keyof typeof statusColors]} className="uppercase text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                            {statusLabels[selectedProject.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/50 p-1.5 rounded-[2rem] border-2">
                        <TabsTrigger value="overview" className="rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Overview</TabsTrigger>
                        <TabsTrigger value="management" className="rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                          {isLeader(selectedProject) ? 'Manage Ops' : 'Missions'}
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Intel/Docs</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-8 pt-6">
                        <div className="flex items-center justify-between">
                          <Badge className="font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20 px-4">Strategic Briefing</Badge>
                          {isLeader(selectedProject) && (
                            <Button size="sm" variant="outline" className="h-9 px-4 text-[10px] font-bold uppercase rounded-full border-2 hover:bg-slate-50" onClick={() => { setIsEditingDetails(!isEditingDetails); if (isEditingDetails) updateDetailsMutation.mutate(editedDetails); }}>
                              {isEditingDetails ? <><Save className="h-3.5 w-3.5 mr-2" /> Save Changes</> : <><Edit className="h-3.5 w-3.5 mr-2" /> Modify Intel</>}
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-8">
                            <div className="space-y-2.5">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Team Designation</Label>
                              {isEditingDetails ? <Input className="rounded-xl border-2 font-bold" value={editedDetails.teamName} onChange={(e) => setEditedDetails({ ...editedDetails, teamName: e.target.value })} /> : <p className="text-lg font-black tracking-tight text-slate-800">{selectedProject.teamName}</p>}
                            </div>
                            <div className="space-y-2.5">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Problem Statement</Label>
                              {isEditingDetails ? <Textarea className="rounded-xl border-2 min-h-[100px] text-sm" value={editedDetails.problemStatement} onChange={(e) => setEditedDetails({ ...editedDetails, problemStatement: e.target.value })} /> : <p className="text-sm font-medium italic text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-dashed">"{selectedProject.problemStatement}"</p>}
                            </div>
                            <div className="space-y-2.5">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Operation Idea/Solution</Label>
                              {isEditingDetails ? <Textarea className="rounded-xl border-2 min-h-[100px] text-sm" value={editedDetails.idea} onChange={(e) => setEditedDetails({ ...editedDetails, idea: e.target.value })} /> : <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedProject.idea || "No specific solution details provided yet."}</p>}
                            </div>

                            <div className="pt-4 border-t border-dashed">
                              <div className="bg-primary/5 rounded-3xl p-5 border-2 border-primary/10 flex flex-col items-center justify-center space-y-2 group/code">
                                <Label className="text-[9px] font-black uppercase text-primary tracking-[0.3em]">Project Authorization Key</Label>
                                <div className="flex items-center gap-3">
                                  <code className="text-3xl font-black tracking-[0.4em] text-primary">{selectedProject.joinCode || '------'}</code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-primary opacity-0 group-hover/code:opacity-100 transition-opacity"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedProject.joinCode || '');
                                      toast({ title: 'Code Copied', description: 'Authorization Key added to clipboard.' });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Share this code for instant team enlistment</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Assigned Force ({selectedProject.team?.length || 0})</Label>
                            <div className="grid gap-3">
                              {selectedProject.team?.map((member: any, i: number) => {
                                const mId = typeof member === 'string' ? member : member.id || member._id;
                                const mName = typeof member === 'string' ? `User ${member.slice(-4)}` : member.name || "Unknown";
                                const isSelf = mId === user?.id;
                                const canManage = isLeader(selectedProject) && !isSelf;

                                return (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary/20 transition-all shadow-sm group">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-slate-100">
                                        <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                                          {mName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-black uppercase tracking-tight text-slate-700">{mName} {isSelf && "(You)"}</span>
                                    </div>
                                    {canManage && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 rounded-full"
                                        onClick={() => {
                                          if (confirm(`Remove ${mName} from this project?`)) {
                                            removeMemberMutation.mutate(mId);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="management" className="space-y-6 pt-6">
                        <div className="space-y-8">
                          {/* Leader-only: Recruit Candidates Section */}
                          {isLeader(selectedProject) && selectedProject.joinRequests?.some((r: any) => r.status === 'pending') && (
                            <div className="space-y-4 p-8 rounded-[3rem] bg-amber-50/50 border-2 border-amber-100 shadow-inner">
                              <div className="flex items-center justify-between border-b border-amber-200/40 pb-4 mb-2">
                                <Label className="font-black text-amber-800 text-[11px] uppercase tracking-[0.3em] flex items-center gap-2">
                                  <Users className="h-5 w-5" /> RECRUITMENT COMMAND
                                </Label>
                                <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase">{selectedProject.joinRequests.filter((r: any) => r.status === 'pending').length} PENDING</Badge>
                              </div>
                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedProject.joinRequests.filter((r: any) => r.status === 'pending').map((req: any, i: number) => (
                                  <Card key={i} className="border-2 border-amber-200/30 rounded-3xl overflow-hidden shadow-sm bg-white/80 hover:bg-white transition-all">
                                    <CardContent className="p-6">
                                      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="space-y-4 flex-1 w-full">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-black uppercase tracking-tight text-amber-900 px-3 py-1 rounded-full bg-amber-100/50">{req.user?.name || (typeof req.user === 'string' ? `Recruit ${req.user.slice(-4)}` : "Candidate")}</p>
                                            <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">ENLISTMENT REQUEST</span>
                                          </div>
                                          <p className="text-xs text-slate-700 italic font-medium leading-relaxed border-l-4 border-amber-300 pl-4 py-1 bg-amber-50/30">"{req.reason || "No reason provided"}"</p>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-amber-100/50 shadow-sm">
                                            <div className="space-y-1.5">
                                              <Label className="text-[9px] font-black uppercase text-amber-500/50 tracking-widest">Expertise</Label>
                                              <p className="text-[11px] font-black text-amber-900">{req.skills || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label className="text-[9px] font-black uppercase text-amber-500/50 tracking-widest">Tactical Exp</Label>
                                              <p className="text-[11px] font-black text-amber-900">{req.experiences || 'N/A'}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0">
                                          <Button size="sm" className="flex-1 h-12 md:w-32 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest rounded-xl text-[10px]" onClick={() => resolveRequestMutation.mutate({ requestId: req._id, status: 'accepted' })}>Authorize</Button>
                                          <Button size="sm" variant="ghost" className="flex-1 h-12 md:w-32 text-amber-700/50 hover:text-rose-500 font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl text-[10px]" onClick={() => {
                                            const reason = prompt("State reason for rejection (this will be transmitted to the recruit):");
                                            if (reason !== null) {
                                              resolveRequestMutation.mutate({ requestId: req._id, status: 'rejected', rejectionReason: reason } as any);
                                            }
                                          }}>Dismiss</Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mission Operations Section */}
                          <div className="space-y-8">
                            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                  <Target className="h-5 w-5 text-primary" /> {isLeader(selectedProject) ? "MISSION CONTROL CENTER" : "ACTIVE OBJECTIVES"}
                                </Label>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-7">
                                  {isLeader(selectedProject) ? "Deploy and monitor tactical goals" : "Execute assigned mission parameters"}
                                </p>
                              </div>
                              {isLeader(selectedProject) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="gradient" size="sm" className="rounded-full px-6 h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                                      <Plus className="h-4 w-4 mr-2" /> NEW MISSION
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="rounded-[3rem] p-8">
                                    <DialogHeader>
                                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Deploy New Mission</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-5 pt-4">
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Objective Title</Label>
                                        <Input placeholder="e.g. Design System Implementation" value={goalData.title} onChange={(e) => setGoalData({ ...goalData, title: e.target.value })} className="h-12 rounded-2xl border-2 font-bold" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Operational Parameters (Description)</Label>
                                        <Textarea placeholder="Details of the mission objectives..." value={goalData.description} onChange={(e) => setGoalData({ ...goalData, description: e.target.value })} className="rounded-2xl border-2 min-h-[100px] font-medium" />
                                      </div>
                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Deadline Date</Label>
                                          <Input type="date" value={goalData.deadline} onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })} className="h-12 rounded-2xl border-2 font-bold" />
                                        </div>
                                      </div>

                                      <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Assign Specialists</Label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                          {selectedProject.team?.map((member: any) => {
                                            const mId = typeof member === 'string' ? member : member.id || member._id;
                                            const mName = typeof member === 'string' ? `User ${member.slice(-4)}` : member.name;
                                            const isAssigned = goalData.assignees.includes(mId);

                                            return (
                                              <div
                                                key={mId}
                                                className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all cursor-pointer ${isAssigned ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                                onClick={() => {
                                                  const newAssignees = isAssigned
                                                    ? goalData.assignees.filter(id => id !== mId)
                                                    : [...goalData.assignees, mId];
                                                  setGoalData({ ...goalData, assignees: newAssignees });
                                                }}
                                              >
                                                <Checkbox checked={isAssigned} onCheckedChange={() => { }} />
                                                <span className="text-[10px] font-bold uppercase truncate">{mName}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 mt-2" variant="gradient" onClick={() => addGoalMutation.mutate(goalData)} disabled={!goalData.title || (goalData.assignedType === 'specific' && goalData.assignees.length === 0) || addGoalMutation.isPending}>
                                        {addGoalMutation.isPending ? 'DEPLOYING...' : 'INITIALIZE MISSION'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>

                            <div className="space-y-6">
                              {(isLeader(selectedProject) ? (selectedProject.timeGoals || []) : (selectedProject.timeGoals || []).filter((g: any) => !g.assignees || g.assignees.length === 0 || g.assignedType === 'all' || g.assignees.includes(user?.id))).length > 0 ? (
                                <div className="grid gap-6">
                                  {(isLeader(selectedProject) ? (selectedProject.timeGoals || []) : (selectedProject.timeGoals || []).filter((g: any) => !g.assignees || g.assignees.length === 0 || g.assignedType === 'all' || g.assignees.includes(user?.id))).map((goal: any, i: number) => {
                                    const isCompleted = goal.status === 'completed' || goal.status === 'approved';
                                    const effectiveAssignees = goal.assignedType === 'all' ? selectedProject.team : (goal.assignees || []);
                                    const completionCount = goal.completedBy?.length || 0;
                                    const totalAssigned = effectiveAssignees.length || 1;
                                    const progressPercent = Math.min(100, (completionCount / totalAssigned) * 100);

                                    return (
                                      <Card key={i} className={`border-2 rounded-[2.5rem] overflow-hidden transition-all ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                                        <CardContent className="p-8">
                                          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                            <div className="space-y-4 flex-1">
                                              <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                                  <Zap className="h-5 w-5" />
                                                </div>
                                                <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">{goal.title}</h4>
                                                <Badge className={`uppercase text-[9px] font-black px-3 py-1 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                                                  {isCompleted ? 'MISSION SECURED' : 'OPERATIONAL'}
                                                </Badge>
                                              </div>
                                              <p className="text-sm font-medium text-slate-600 leading-relaxed pl-12 border-l-2 border-slate-100 italic">"{goal.description}"</p>

                                              <div className="flex flex-wrap gap-4 pl-12 pt-2">
                                                <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-100">
                                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target: {safeFormat(goal.deadline, 'MMM dd, yyyy')}</span>
                                                </div>
                                                {goal.requirementKey && (
                                                  <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-full border border-blue-100">
                                                    <Key className="h-3.5 w-3.5 text-blue-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Task: {goal.requirementKey}</span>
                                                  </div>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-6 pl-12 pt-4">
                                                <div className="flex -space-x-3 overflow-hidden">
                                                  {effectiveAssignees.map((member: any, idx: number) => {
                                                    const mId = typeof member === 'string' ? member : member.id || member._id;
                                                    const memberObj = typeof member === 'string' ? selectedProject.team?.find((m: any) => (m.id || m._id) === mId) : member;
                                                    const isCompletedBy = goal.completedBy?.includes(mId);

                                                    return (
                                                      <div key={idx} className={`relative group h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black transition-all ${isCompletedBy ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                        {memberObj?.name?.slice(0, 1) || 'U'}
                                                        {isCompletedBy && (
                                                          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-100 rounded-full p-0.5 shadow-sm border border-emerald-500">
                                                            <CheckCircle2 className="h-2 w-2 text-emerald-600" />
                                                          </div>
                                                        )}
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                          {memberObj?.name || 'Assignee'} {isCompletedBy ? '(Success)' : '(In Progress)'}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Tactical Progress</p>
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden border">
                                                      <div
                                                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                                                        style={{ width: `${progressPercent}%` }}
                                                      ></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-900">{completionCount}/{totalAssigned}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="w-full md:w-auto shrink-0 flex flex-col gap-3 min-w-[200px]">
                                              {!isCompleted ? (
                                                <>
                                                  <Button
                                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]"
                                                    variant={goal.completedBy?.includes(user?.id) ? "secondary" : "gradient"}
                                                    disabled={goal.completedBy?.includes(user?.id) || accomplishGoalMutation.isPending}
                                                    onClick={() => accomplishGoalMutation.mutate(goal._id)}
                                                  >
                                                    {goal.completedBy?.includes(user?.id) ? (
                                                      <><CheckCircle2 className="h-4 w-4 mr-2" /> OBJECTIVE SECURED</>
                                                    ) : (
                                                      <><Zap className="h-4 w-4 mr-2" /> ACCOMPLISH MISSION</>
                                                    )}
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    className="w-full h-12 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-amber-50"
                                                    onClick={() => setMemberRequestingPostponeId(goal._id)}
                                                  >
                                                    <AlertCircle className="h-4 w-4 mr-2" /> Request Postpone
                                                  </Button>
                                                  {isLeader(selectedProject) && (
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      className="h-10 rounded-xl opacity-50 hover:opacity-100 font-black text-[9px] uppercase tracking-[0.2em]"
                                                      onClick={() => { if (confirm('Abort this mission objective?')) deleteGoalMutation.mutate(goal._id); }}
                                                    >
                                                      ABORT MISSION
                                                    </Button>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="bg-emerald-100/50 p-6 rounded-[2rem] border-2 border-emerald-100 space-y-3">
                                                  <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest text-center">MISSION COMPLETE</p>
                                                  <div className="flex justify-center">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-6">
                                  <div className="p-6 bg-white rounded-full shadow-xl">
                                    <Target className="h-12 w-12 text-slate-200" />
                                  </div>
                                  <div className="space-y-2">
                                    <h5 className="text-xl font-black uppercase text-slate-900 tracking-tighter">No Active Missions</h5>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting directive from field commander</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="resources" className="space-y-6 pt-2">
                        <div className="grid gap-3">
                          {selectedProject.resources?.map((res: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm group">
                              <div className="space-y-1">
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  {res.title}
                                </a>
                                {res.description && <p className="text-[10px] text-muted-foreground">{res.description}</p>}
                              </div>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { if (confirm('Remove this link?')) deleteResourceMutation.mutate(res._id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Resource</Label>
                          <div className="grid gap-2">
                            <Input placeholder="Resource Title (e.g. Design Assets)" value={resourceData.title} onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })} className="h-9 text-sm" />
                            <Input placeholder="URL (https://...)" value={resourceData.url} onChange={(e) => setResourceData({ ...resourceData, url: e.target.value })} className="h-9 text-sm" />
                            <Input placeholder="Description" value={resourceData.description} onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })} className="h-9 text-sm" />
                          </div>
                          <Button className="w-full h-9" variant="gradient" onClick={() => addResourceMutation.mutate(resourceData)} disabled={!resourceData.title || !resourceData.url || addResourceMutation.isPending}>
                            {addResourceMutation.isPending ? 'Adding...' : 'Add Link'}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="pt-8 border-t-4 border-slate-100 space-y-4">
                      <Button
                        variant="gradient"
                        className="w-full h-16 rounded-3xl font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl shadow-primary/30 group relative overflow-hidden"
                        onClick={() => navigate(`/projects/${selectedProject.id || selectedProject._id}/chat`)}
                      >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <MessageSquare className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                        Initialize Mission Chat Room
                      </Button>
                      <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 text-rose-500 border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-200 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest" onClick={() => { if (confirm('Request immediate extraction from this project?')) exitProjectMutation.mutate({ projectId: selectedProject.id || selectedProject._id, userId: user?.id || '' }); }}>Exit Project</Button>
                        {isLeader(selectedProject) && <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2" onClick={() => { if (confirm('Finalize and complete this project?')) completeProjectMutation.mutate(selectedProject.id || selectedProject._id); }}>Finalize Operation</Button>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="p-10 bg-slate-900 text-white rounded-t-[3rem] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield className="h-32 w-32" />
                      </div>
                      <Badge className="bg-primary hover:bg-primary text-white border-none font-black text-[11px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-6">Classified Intelligence</Badge>
                      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">MISSION BRIEFING</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">PROJECT CODE: {selectedProject?._id?.slice(-8).toUpperCase()}</p>
                    </div>

                    <div className="p-10 space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-12 bg-primary rounded-full"></div>
                          <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Objective Statement</Label>
                        </div>
                        <p className="text-xl font-bold leading-relaxed text-slate-800 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 italic shadow-inner">
                          "{selectedProject.problemStatement || "The core objectives for this project remain classified until you enlist."}"
                        </p>
                      </div>

                      <div className="space-y-6 bg-primary/5 p-8 rounded-[3.5rem] border-4 border-primary/20 shadow-xl relative overflow-hidden group/joinsec">
                        <div className="absolute -top-12 -right-12 h-32 w-32 bg-primary/10 rounded-full blur-3xl group-hover/joinsec:scale-150 transition-transform"></div>

                        <div className="space-y-2 relative">
                          <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-primary">
                            <Key className="h-6 w-6" /> Direct Access Point
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-9">Enter Authorization Key to join instantly</p>
                        </div>

                        <div className="flex gap-4 items-center bg-white p-4 rounded-3xl border-2 border-primary/10 shadow-sm relative">
                          <Input
                            placeholder="XXXXXX"
                            className="h-16 text-center text-3xl font-black tracking-[0.5em] border-none focus-visible:ring-0 placeholder:opacity-10 bg-slate-50 rounded-2xl"
                            maxLength={6}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          />
                          <Button
                            variant="gradient"
                            className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest group/joinbtn"
                            disabled={joinCode.length < 6 || joinProjectMutation.isPending}
                            onClick={() => joinProjectMutation.mutate({ userId: user?.id || '', code: joinCode })}
                          >
                            {joinProjectMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 group-hover/joinbtn:scale-110 transition-transform" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-10">
                        <div className="space-y-1">
                          <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                            <Target className="h-6 w-6 text-primary" /> Request Briefing
                          </h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-9">No access key? Submit credentials for commander review</p>
                        </div>

                        <div className="grid gap-6 bg-slate-50/50 p-8 rounded-[3rem] border-2 border-slate-100">
                          <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Why should you be part of this team?</Label>
                            <Textarea
                              placeholder="Describe your motivation and value to this mission..."
                              className="rounded-2xl border-2 min-h-[100px] text-sm font-medium focus-visible:ring-primary shadow-sm bg-white"
                              value={joinRequestData.reason}
                              onChange={(e) => setJoinRequestData({ ...joinRequestData, reason: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                              <Label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Specialist Skills</Label>
                              <Input
                                placeholder="React, Python, Design..."
                                className="rounded-xl border-2 h-12 text-sm bg-white font-bold"
                                value={joinRequestData.skills}
                                onChange={(e) => setJoinRequestData({ ...joinRequestData, skills: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2.5">
                              <Label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Field Experience</Label>
                              <Input
                                placeholder="Previous missions / projects..."
                                className="rounded-xl border-2 h-12 text-sm bg-white font-bold"
                                value={joinRequestData.experiences}
                                onChange={(e) => setJoinRequestData({ ...joinRequestData, experiences: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Additional Intel (Comments)</Label>
                            <Input
                              placeholder="Any other data for the commander?"
                              className="rounded-xl border-2 h-12 text-sm bg-white font-bold"
                              value={joinRequestData.comments}
                              onChange={(e) => setJoinRequestData({ ...joinRequestData, comments: e.target.value })}
                            />
                          </div>

                          <Button
                            variant="gradient"
                            className="w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl shadow-primary/30 group mt-4 transform hover:scale-[1.02] transition-all"
                            onClick={() => requestJoinMutation.mutate(joinRequestData)}
                            disabled={!joinRequestData.reason || requestJoinMutation.isPending}
                          >
                            {requestJoinMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Target className="h-5 w-5 mr-3 group-hover:rotate-45 transition-transform" />}
                            Transmit Enlistment Data
                          </Button>
                        </div>

                        <div className="text-center pt-2">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                            Already have an entrance key? <span className="text-primary hover:underline cursor-pointer" onClick={() => setOpenJoin(true)}>Enter Authorization Code</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Loading/Error/Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500 font-bold uppercase tracking-tighter shadow-sm bg-rose-50/50 rounded-3xl border border-rose-100">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
            Access Denied or Connection Failed.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {projects
              .map((project: Project) => {
                const userIsMember = isMember(project);
                return (
                  <Card
                    key={project.id || project._id}
                    className={`interactive transition-all duration-300 border-2 rounded-[2rem] overflow-hidden ${userIsMember ? 'border-primary/20 shadow-lg' : 'border-dashed opacity-80 hover:opacity-100 bg-slate-50/50'}`}
                    onClick={() => handleViewDetails(project)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">
                          {project.title}
                        </CardTitle>
                        {userIsMember && (
                          <Badge variant={statusColors[project.status as keyof typeof statusColors]} className="text-[9px] uppercase font-black px-1.5 h-4 shadow-sm">
                            {statusLabels[project.status as keyof typeof statusLabels]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> {project.clubName}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="relative">
                        <p className="text-[11px] line-clamp-3 leading-relaxed h-12 text-slate-600 font-medium">
                          {project.problemStatement || project.description}
                        </p>
                      </div>

                      {userIsMember ? (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-t border-dashed pt-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.team?.length} Force
                          </span>
                          {project.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {safeFormat(project.deadline, 'MMM d')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-dashed">
                          <Badge variant="outline" className="text-[8px] uppercase font-black tracking-tighter text-primary/60 border-primary/20 bg-primary/5">Recruiting Active Force</Badge>
                        </div>
                      )}

                      <Button
                        variant={userIsMember ? "ghost" : "gradient"}
                        className="w-full h-10 justify-between group text-[10px] font-black uppercase tracking-widest rounded-xl"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(project); }}
                      >
                        {userIsMember ? 'Manage Operations' : 'Analyze Objective'}
                        <ChevronRight className={`h-4 w-4 transition-transform ${userIsMember ? 'group-hover:translate-x-1' : 'animate-pulse'}`} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Global Dialogs */}
      <Dialog open={!!postponingGoalId} onOpenChange={() => setPostponingGoalId(null)}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader><DialogTitle className="font-black text-amber-600">Modify Mission Deadline</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Authorize New Deadline</Label>
              <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="h-12 rounded-2xl border-2 text-lg font-bold" />
            </div>
            <p className="text-[11px] text-muted-foreground bg-amber-50 p-3 rounded-xl border border-amber-100 italic">Only the project leader can authorize deadline extensions. The team will be notified of the new milestone date.</p>
          </div>
          <DialogFooter>
            <Button className="w-full h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-600" onClick={() => postponeGoalMutation.mutate({ deadline: newDeadline })} disabled={postponeGoalMutation.isPending || !newDeadline}>
              {postponeGoalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!memberRequestingPostponeId} onOpenChange={() => setMemberRequestingPostponeId(null)}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader><DialogTitle className="font-black text-amber-600 flex items-center gap-2"><Clock className="h-5 w-5" /> Request Postpone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Desired Extension Date</Label>
              <Input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className="h-12 rounded-2xl border-2 text-lg font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Reason for Delay</Label>
              <Textarea
                placeholder="Briefly explain why more time is needed..."
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                className="rounded-2xl border-2 min-h-[100px] text-sm font-medium"
              />
            </div>
            <div className="text-[10px] text-muted-foreground bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-100">
              <p className="font-black mb-1 uppercase tracking-tighter text-blue-600">Transmission Preview:</p>
              <p className="italic leading-relaxed font-medium">"I won't be able to complete the mission till the given date due to <span className="text-blue-600 font-bold">"{personalNote || '...'}"</span> so plz postbone the date of the mission till the date <span className="text-blue-600 font-bold">"{requestedDate || '...'}"</span>"</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-200/50 bg-amber-500 hover:bg-amber-600 transition-all hover:scale-[1.02]"
              onClick={() => {
                requestPostponeMutation.mutate({ requestedDate, personalNote });
              }}
              disabled={requestPostponeMutation.isPending || !requestedDate || !personalNote}
            >
              {requestPostponeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "TRANSMIT REQUEST TO CHAT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
