import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, Zap, BookOpen, Users, Target, MessageSquare, Loader2, Link as LinkIcon, AlertCircle, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Users,
  Target,
  MessageSquare,
};

interface DailyTasksProps {
  tasks: any[];
  userSubmissions?: any[];
}

export function DailyTasks({ tasks, userSubmissions = [] }: DailyTasksProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submissionLink, setSubmissionLink] = useState('');

  // Filter tasks based on "Daily" or "Joined Club"
  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(task => {
    if (task.category === 'daily') return true;
    if (task.category === 'club' && Array.isArray(user?.joinedClubs) && user?.joinedClubs.includes(task.clubId)) return true;
    return false;
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task submitted for review!' });
      setSelectedTask(null);
      setSubmissionLink('');
    },
    onError: (err: any) => {
      toast({ title: err.response?.data?.message || 'Failed to submit task', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink) return;

    submitMutation.mutate({
      taskId: selectedTask._id,
      userId: user?.id,
      userName: user?.name,
      taskTitle: selectedTask.title,
      submissionLink
    });
  };

  const getTaskStatus = (taskId: string) => {
    const sub = userSubmissions.find(s => s.taskId === taskId);
    return sub ? sub.status : 'not_started';
  };

  const allTasksCompleted = filteredTasks.length > 0 &&
    filteredTasks.every(task => {
      const status = getTaskStatus(task._id);
      return status === 'approved' || status === 'pending';
    });

  return (
    <Card variant="elevated" className={cn(allTasksCompleted && "border-success/50 bg-success/5")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Daily Reward Tasks
              {allTasksCompleted && <Badge variant="success" className="animate-bounce-subtle">All Done!</Badge>}
            </CardTitle>
            <CardDescription>
              {allTasksCompleted ? "You've finished all your tasks for today!" : "Submit proof to earn XP"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xp bg-xp/10 px-2 py-1 rounded text-xs font-bold">
            <Zap className="h-3 w-3" />
            <span>20 XP Login Reward Added!</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {allTasksCompleted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-success">Today tasks completed!</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold font-mono">
              Great job, {user?.name?.split(' ')[0]}! Come back tomorrow for more.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <ClipboardList className="h-10 w-10 mx-auto opacity-20" />
            <p className="text-sm">No tasks available for today.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const status = getTaskStatus(task._id);
            const isPending = status === 'pending';
            const isApproved = status === 'approved';
            const isRejected = status === 'rejected';

            return (
              <div
                key={task._id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                  isApproved ? 'bg-success/5 border-success/20' :
                    isPending ? 'bg-warning/5 border-warning/20' :
                      isRejected ? 'bg-destructive/5 border-destructive/20' :
                        'bg-card hover:bg-secondary/50 border-border'
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                  isApproved ? "bg-success text-white border-success" :
                    isPending ? "bg-warning/20 text-warning border-warning/30" :
                      isRejected ? "bg-destructive/20 text-destructive border-destructive/30" :
                        "bg-secondary/50 text-muted-foreground border-border"
                )}>
                  {isApproved ? <Check className="h-4 w-4" /> :
                    isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
                      isRejected ? <AlertCircle className="h-4 w-4" /> :
                        <Target className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isApproved && 'text-muted-foreground'
                    )}>
                      {task.title}
                    </p>
                    {task.category === 'club' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{task.clubName || 'Club'}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                </div>

                <Dialog open={selectedTask?._id === task._id} onOpenChange={(open) => !open && setSelectedTask(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant={isApproved ? "ghost" : "outline"}
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={isApproved || isPending}
                      onClick={() => setSelectedTask(task)}
                    >
                      {isApproved ? "Finished" : isPending ? "Reviewing" : isRejected ? "Re-submit" : "Submit"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Task Proof</DialogTitle>
                      <CardDescription>{task.title}</CardDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="link">Submission Link (GitHub, Drive, LinkedIn, etc.)</Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="link"
                            className="pl-9"
                            placeholder="https://..."
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Provide a link to verify your completion.</p>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                          {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Proof
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
