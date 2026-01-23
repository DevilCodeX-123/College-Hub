import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Settings as SettingsIcon,
  Edit,
  Trophy,
  Users,
  Target,
  Calendar,
  Award,
  Zap,
  ChevronRight,
  Loader2,
  LogOut,
  User as UserIcon,
  Mail,
  Building,
  Lock,
  GraduationCap
} from 'lucide-react';
import { UserRole } from '@/types';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateLevelData } from '@/lib/leveling';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  club_member: 'Club Member',
  core_member: 'Core Member',
  club_coordinator: 'Club Coordinator',
  admin: 'College Admin',
  owner: 'Owner',
  co_admin: 'Co-Admin',
  club_co_coordinator: 'Club Co-Coordinator',
  club_head: 'Club Head',
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('goals');
  const [openEdit, setOpenEdit] = useState(false);
  const [openGoals, setOpenGoals] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const levelData = calculateLevelData(user?.totalEarnedXP || user?.points || 0);

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    avatar: '',
    primaryGoal: '',
    secondaryGoal: '',
    skills: '', // Combined string for editing
    branch: '',
    year: '',
    customTitle: ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        college: user.college || '',
        avatar: user.avatar || '',
        primaryGoal: user.primaryGoal || 'Software Engineer',
        secondaryGoal: user.secondaryGoal || 'Tech Entrepreneur',
        skills: user.skills?.join(', ') || 'Web Development, Problem Solving, Leadership',
        branch: user.branch || '',
        year: user.year || '',
        customTitle: user.customTitle || ''
      });
    }
  }, [user]);

  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: api.getActiveColleges
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => {
      // Handle skills string to array conversion
      const processedData = {
        ...data,
        skills: data.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
      };
      return api.updateUser(user!.id, processedData);
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Profile updated successfully' });
      setOpenEdit(false);
      setOpenGoals(false);
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => {
      return api.changePassword({ ...data, userId: user!.id });
    },
    onSuccess: () => {
      toast({ title: 'Password updated successfully' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update password',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    changePasswordMutation.mutate({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword
    });
  };

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => api.getClubs(user?.college, user?.id || user?._id),
  });

  // Fetch fresh user data to keep XP updated
  const { data: freshUserData } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => api.getProfile(user?.id || '', user?.id || user?._id),
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  useEffect(() => {
    if (freshUserData) {
      const hasChanged = freshUserData.points !== user?.points ||
        freshUserData.level !== user?.level ||
        freshUserData.weeklyXP !== user?.weeklyXP ||
        freshUserData.badges?.length !== user?.badges?.length;

      if (hasChanged) {
        updateUser(freshUserData);
      }
    }
  }, [freshUserData, updateUser]); // Removed user from deps to avoid loop

  // Ensure joinedClubs is an array before filtering
  const safeJoinedClubs = Array.isArray(user?.joinedClubs) ? user.joinedClubs : [];
  const joinedClubs = clubs.filter(c => safeJoinedClubs.includes(c.id || (c as any)._id));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card variant="gradient" className="overflow-hidden">
          <div className="h-24 gradient-primary" />
          <CardContent className="-mt-12 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                    <Badge variant="secondary">{roleLabels[user?.role || 'student']}</Badge>
                  </div>
                  {user?.customTitle && (
                    <p className="text-sm font-semibold text-primary/80 italic">
                      {user.customTitle}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" />{user?.college}</p>
                  {user?.branch && <p className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{user.branch}</p>}
                  {user?.year && <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{user.year} Year</p>}
                </div>
              </div>

              <div className="flex gap-2">
                {/* Edit Profile Dialog */}
                <Dialog open={openEdit} onOpenChange={(open) => {
                  setOpenEdit(open);
                  if (!open) setShowPasswordChange(false);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>

                    {!showPasswordChange ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>College</Label>
                          <Select
                            value={formData.college}
                            onValueChange={(value) => setFormData({ ...formData, college: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select College" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleges.map((college: string) => (
                                <SelectItem key={college} value={college}>
                                  {college}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Branch / Course</Label>
                            <Input
                              placeholder="e.g. CSE, Mechanical"
                              value={formData.branch}
                              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                              placeholder="e.g. 1st, 2nd, Final"
                              value={formData.year}
                              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Custom Title (Optional)</Label>
                          <Input
                            placeholder="e.g. Aspiring Developer"
                            value={formData.customTitle}
                            onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                          />
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPasswordChange(true)}
                            className="w-full sm:w-auto"
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            Change Password
                          </Button>
                          <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto">
                            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    ) : (
                      <form onSubmit={handlePasswordUpdate} className="space-y-4 animate-in slide-in-from-right-5 fade-in">
                        <div className="space-y-2">
                          <Label>Current Password</Label>
                          <Input
                            type="password"
                            placeholder="Enter current password"
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Confirm New Password</Label>
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowPasswordChange(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto">
                            {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Settings Dialog */}
                <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Account Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Account Type</p>
                          <p className="text-sm text-muted-foreground">{roleLabels[user?.role || 'student']}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Address</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">College Instance</p>
                          <p className="text-sm text-muted-foreground">{user?.college || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            logout();
                            toast({ title: 'Logged out successfully' });
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout Account
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress */}
        <LevelProgress
          level={levelData.level}
          currentXP={levelData.currentXPInLevel}
          requiredXP={levelData.nextLevelXPRequired}
        />
        {/* Stats Section with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8 px-4 sm:px-0">
          <div
            onClick={() => setActiveTab('activity')}
            className="block cursor-pointer"
          >
            <Card className="text-center p-4 hover:shadow-md hover:border-xp/50 transition-all group">
              <div className="h-10 w-10 rounded-full bg-xp/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-xp/20 transition-colors">
                <Shield className="h-5 w-5 text-xp" />
              </div>
              <p className="text-2xl font-bold group-hover:text-xp transition-colors">Level {levelData.level}</p>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </Card>
          </div>
          <div
            onClick={() => setActiveTab('challenges')}
            className="block cursor-pointer"
          >
            <Card className="text-center p-4 hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold group-hover:text-primary transition-colors">
                {user?.activity?.filter(a => a.type === 'challenge').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Challenges</p>
            </Card>
          </div>
          <div
            onClick={() => setActiveTab('clubs')}
            className="block cursor-pointer"
          >
            <Card className="text-center p-4 hover:shadow-md hover:border-accent/50 transition-all group">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-accent/20 transition-colors">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold group-hover:text-accent transition-colors">{user?.joinedClubs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Clubs</p>
            </Card>
          </div>
          <div
            onClick={() => setActiveTab('badges')}
            className="block cursor-pointer"
          >
            <Card className="text-center p-4 hover:shadow-md hover:border-gold/50 transition-all group">
              <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-gold/20 transition-colors">
                <Award className="h-5 w-5 text-gold" />
              </div>
              <p className="text-2xl font-bold group-hover:text-gold transition-colors">
                {(user?.badges?.length || 0) + [
                  { name: 'Early Adopter', icon: '🚀', locked: false },
                  { name: 'First Challenge', icon: '🏆', locked: false },
                  { name: 'Team Player', icon: '🤝', locked: (user?.joinedClubs?.length || 0) < 1 },
                ].filter(sb => !user?.badges?.some((ub: any) => ub.name === sb.name)).filter(b => !b.locked).length}
              </p>
              <p className="text-sm text-muted-foreground">Badges</p>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Career Goals</CardTitle>
                <Dialog open={openGoals} onOpenChange={setOpenGoals}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" size="sm" className="shadow-md">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Goals & Skills
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Career Hub</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Primary Goal</Label>
                        <Input
                          placeholder="e.g. Software Engineer"
                          value={formData.primaryGoal}
                          onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Goal</Label>
                        <Input
                          placeholder="e.g. Entrepreneur"
                          value={formData.secondaryGoal}
                          onChange={(e) => setFormData({ ...formData, secondaryGoal: e.target.value })}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full">
                          {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Hub
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/40">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Target className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{user?.primaryGoal || 'Software Engineer'}</h3>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Primary Target</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/40">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{user?.secondaryGoal || 'Tech Entrepreneur'}</h3>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Secondary Target</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technical Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(user?.skills || ['Web Development', 'Problem Solving', 'Leadership']).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-secondary/50 border-none font-medium text-secondary-foreground">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {user?.activity?.filter(a => a.type === 'challenge').length === 0 ? (
                <div className="md:col-span-2 text-center py-12 px-4 bg-secondary/20 rounded-2xl border-2 border-dashed">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-muted-foreground">No Challenges Accepted Yet</p>
                  <Link to="/challenges">
                    <Button variant="link" className="text-primary mt-2">Browse available challenges</Button>
                  </Link>
                </div>
              ) : (
                user?.activity?.filter(a => a.type === 'challenge').map((item, idx) => (
                  <Card key={idx} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all group">
                    <CardHeader className="bg-primary/5 flex flex-row items-center justify-between pb-2">
                      <h4 className="font-bold text-primary">{item.title}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase">{item.status || 'Active'}</Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground font-mono">Accepted on: {new Date(item.timestamp).toLocaleDateString()}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm font-bold flex items-center gap-1">
                          <Zap className="h-3 w-3 text-xp" /> Potential 500 XP
                        </p>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2">View Task</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="clubs">
            <div className="grid sm:grid-cols-2 gap-4">
              {joinedClubs.length === 0 ? (
                <div className="sm:col-span-2 text-center py-12 px-4 bg-secondary/20 rounded-2xl border-2 border-dashed">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-muted-foreground">Start Joining Clubs</p>
                  <Link to="/clubs">
                    <Button variant="link" className="text-accent mt-2">Discover Campus Communities</Button>
                  </Link>
                </div>
              ) : joinedClubs.map((club) => (
                <Link key={club.id} to={`/clubs/${club.id || (club as any)._id}`} className="block">
                  <Card variant="interactive">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={club.logo} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {club.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{club.name}</p>
                        <p className="text-sm text-muted-foreground">{club.category}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="py-6">
                {!user?.activity || user.activity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent activity found. Jump into some challenges!</p>
                  </div>
                ) : (
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-secondary before:to-transparent">
                    {[...user.activity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((item, idx) => (
                      <div key={idx} className="relative flex items-center gap-6 group">
                        {/* Icon/Dot */}
                        <div className={cn(
                          "relative z-10 flex items-center justify-center h-10 w-10 rounded-full border-4 border-card shadow-sm transition-transform group-hover:scale-110",
                          item.type === 'challenge' ? 'bg-primary text-primary-foreground' :
                            item.type === 'project' ? 'bg-accent text-accent-foreground' :
                              'bg-secondary text-secondary-foreground'
                        )}>
                          {item.type === 'challenge' && <Trophy className="h-4 w-4" />}
                          {item.type === 'project' && <Users className="h-4 w-4" />}
                          {item.type === 'event' && <Calendar className="h-4 w-4" />}
                          {item.type === 'club' && <Building className="h-4 w-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 rounded-xl bg-secondary/20 border border-border/50 transition-all hover:bg-secondary/30">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-base">{item.title}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 capitalize">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            {item.status || 'Engaged'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Actual Badges from Database */}
              {user?.badges?.map((badge: any, idx: number) => (
                <div key={idx} className="block hover:scale-[1.02] transition-transform">
                  <Card className="text-center p-4 hover:shadow-md transition-all relative border-gold/20 hover:border-gold/50 bg-gold/5">
                    <div className="text-4xl mb-2">{badge.icon || '🏅'}</div>
                    <p className="text-sm font-bold text-gold-foreground">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                  </Card>
                </div>
              ))}

              {/* System/Standard Badges */}
              {[
                { name: 'Early Adopter', icon: '🚀', locked: false },
                { name: 'First Challenge', icon: '🏆', locked: false },
                { name: 'Team Player', icon: '🤝', locked: joinedClubs.length < 1 },
              ]
                .filter(sb => !user?.badges?.some((ub: any) => ub.name === sb.name))
                .filter(badge => !badge.locked)
                .map((badge) => (
                  <div key={badge.name} className="block opacity-80 hover:opacity-100 transition-opacity">
                    <Card className="text-center p-4 hover:shadow-md transition-all relative">
                      <div className="text-4xl mb-2 grayscale-[0.5]">{badge.icon}</div>
                      <p className="text-sm font-medium">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">System Achievement</p>
                    </Card>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
