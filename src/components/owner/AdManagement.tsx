import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ad } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Megaphone, Image as ImageIcon, Video, Globe, GraduationCap, Link as LinkIcon, ExternalLink, Clock, PlayCircle, Users, FileCheck, Check, X as CloseX, Save, Zap, Maximize2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdManagement() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'image',
        url: '',
        duration: 5,
        skipDelay: 3,
        frequencyPerUser: 1,
        frequencyInterval: 24,
        maxTotalViews: 1000,
        targetingType: 'worldwide',
        targetColleges: [] as string[],
        targetClubs: [] as string[],
        targetPages: ['all'] as string[],
        clickUrl: '',
        isActive: true
    });

    const { data: ads, isLoading } = useQuery<Ad[]>({
        queryKey: ['ads'],
        queryFn: () => api.getAds(user?.id || ''),
        enabled: !!user?.id
    });

    const { data: colleges } = useQuery({
        queryKey: ['colleges'],
        queryFn: () => api.getActiveColleges()
    });

    const { data: allClubs = [] } = useQuery({
        queryKey: ['all-clubs'],
        queryFn: () => api.getClubs()
    });

    const pageOptions = [
        { id: 'all', label: 'All Pages' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'clubs', label: 'Club List' },
        { id: 'club_detail', label: 'Club Details' },
        { id: 'challenges', label: 'Challenges' },
        { id: 'projects', label: 'Projects' },
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'events', label: 'Events' },
        { id: 'profile', label: 'Profile' }
    ];

    const createAdMutation = useMutation({
        mutationFn: (data: Partial<Ad>) => api.createAd({ ...data, requestingUserId: user?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast({ title: 'Ad created successfully!' });
            setIsCreateDialogOpen(false);
            resetForm();
        }
    });

    const updateAdMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Ad> }) => api.updateAd(id, { ...data, requestingUserId: user?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast({ title: 'Ad updated successfully!' });
        }
    });

    const deleteAdMutation = useMutation({
        mutationFn: (id: string) => api.deleteAd(id, user?.id || ''),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast({ title: 'Ad deleted' });
        }
    });

    const approveAdMutation = useMutation({
        mutationFn: ({ id, status, reason, paymentStatus }: { id: string; status: 'approved' | 'rejected', reason?: string, paymentStatus?: string }) =>
            api.updateAdStatus(id, { status, rejectionReason: reason, paymentStatus, requestingUserId: user?.id || '' }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
            toast({
                title: data.status === 'approved' ? 'Request Approved' : 'Request Rejected',
                variant: data.status === 'approved' ? 'default' : 'destructive'
            });
        }
    });

    const { data: pendingAds } = useQuery({
        queryKey: ['pending-ads'],
        queryFn: () => api.getPendingAds(user?.id || ''),
        enabled: !!user?.id
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'image',
            url: '',
            duration: 5,
            skipDelay: 3,
            frequencyPerUser: 1,
            frequencyInterval: 24,
            maxTotalViews: 1000,
            targetingType: 'worldwide',
            targetColleges: [],
            targetClubs: [],
            targetPages: ['all'],
            clickUrl: '',
            isActive: true
        });
    };

    const [monetizationSettings, setMonetizationSettings] = useState({
        adPaymentEnabled: false,
        minSelfCollegePrice: 0,
        specificCollegePrice: 0,
        worldwidePrice: 0,
        minSelfCollegeVideoPrice: 0,
        specificCollegeVideoPrice: 0,
        worldwideVideoPrice: 0,
        qrCodeUrl: '',
        paymentWarning: ''
    });

    const [isSavingMonetization, setIsSavingMonetization] = useState(false);

    const { data: config } = useQuery({
        queryKey: ['platform-config'],
        queryFn: () => api.getConfig()
    });

    const { data: userCounts } = useQuery({
        queryKey: ['user-count', user?.id],
        queryFn: () => api.getUserCount(user?.id)
    });

    useEffect(() => {
        if (config) {
            setMonetizationSettings({
                adPaymentEnabled: config.adPaymentEnabled || false,
                minSelfCollegePrice: config.minSelfCollegePrice || 0,
                specificCollegePrice: config.specificCollegePrice || 0,
                worldwidePrice: config.worldwidePrice || 0,
                minSelfCollegeVideoPrice: config.minSelfCollegeVideoPrice || 0,
                specificCollegeVideoPrice: config.specificCollegeVideoPrice || 0,
                worldwideVideoPrice: config.worldwideVideoPrice || 0,
                qrCodeUrl: config.qrCodeUrl || '',
                paymentWarning: config.paymentWarning || ''
            } as any); // Cast to any or define a proper FormData interface
        }
    }, [config]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createAdMutation.mutate(formData as unknown as Partial<Ad>);
    };

    const handleSaveMonetization = async () => {
        if (!user) return;
        setIsSavingMonetization(true);
        try {
            await api.updateConfig({ ...monetizationSettings, requestingUserId: user.id });
            queryClient.invalidateQueries({ queryKey: ['platform-config'] });
            toast({ title: 'Monetization settings saved!' });
        } catch (err: any) {
            toast({
                title: 'Error saving settings',
                description: err.response?.data?.message || err.message,
                variant: 'destructive'
            });
        } finally {
            setIsSavingMonetization(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Ad Campaigns</h2>
                    <p className="text-muted-foreground">Manage image and video advertisements across the platform.</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Ad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-primary" />
                                Create New Advertisement
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 text-primary font-bold">Basic Information</div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Title</Label>
                                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Campaign Title" required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Description (Internal)</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Internal notes about this ad..." />
                                </div>

                                <div className="space-y-2">
                                    <Label>Ad Type</Label>
                                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as 'image' | 'video' })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image Ad</SelectItem>
                                            <SelectItem value="video">Video Ad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Total Duration (seconds)</Label>
                                    <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} min={1} />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Media URL (Image or Video)</Label>
                                    <Input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://example.com/ad.jpg" required />
                                </div>

                                {formData.type === 'video' && (
                                    <div className="space-y-2">
                                        <Label>Skip delay (seconds)</Label>
                                        <Input type="number" value={formData.skipDelay} onChange={e => setFormData({ ...formData, skipDelay: parseInt(e.target.value) })} min={0} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Max Views Per User</Label>
                                    <Input type="number" value={formData.frequencyPerUser} onChange={e => setFormData({ ...formData, frequencyPerUser: parseInt(e.target.value) })} min={1} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Hours Between Views (Per User)</Label>
                                    <Input type="number" value={formData.frequencyInterval} onChange={e => setFormData({ ...formData, frequencyInterval: parseInt(e.target.value) })} min={0} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Total Reach Limit (Global Views)</Label>
                                    <Input type="number" value={formData.maxTotalViews} onChange={e => setFormData({ ...formData, maxTotalViews: parseInt(e.target.value) })} min={1} />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Click-through Link (Learn More)</Label>
                                    <Input value={formData.clickUrl} onChange={e => setFormData({ ...formData, clickUrl: e.target.value })} placeholder="https://example.com/landing-page" />
                                </div>

                                <div className="space-y-2 col-span-2 mt-2 pt-2 border-t text-primary font-bold">Targeting</div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Targeting Type</Label>
                                    <Select value={formData.targetingType} onValueChange={v => setFormData({ ...formData, targetingType: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="worldwide">Worldwide (All Users)</SelectItem>
                                            <SelectItem value="college">Global College (Any College)</SelectItem>
                                            <SelectItem value="specific_colleges">Specific Colleges</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.targetingType === 'specific_colleges' && (
                                    <div className="space-y-2 col-span-2">
                                        <Label>Select Colleges</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                            {colleges?.map((c: string) => (
                                                <div key={c} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetColleges.includes(c)}
                                                        onChange={(e) => {
                                                            const newColleges = e.target.checked
                                                                ? [...formData.targetColleges, c]
                                                                : formData.targetColleges.filter(col => col !== c);
                                                            setFormData({ ...formData, targetColleges: newColleges });
                                                        }}
                                                    />
                                                    <span className="text-sm">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 col-span-2">
                                    <Label>Target Specific Clubs (Optional)</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                        {allClubs.map((club: any) => (
                                            <div key={club._id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetClubs.includes(club._id)}
                                                    onChange={(e) => {
                                                        const newClubs = e.target.checked
                                                            ? [...formData.targetClubs, club._id]
                                                            : formData.targetClubs.filter(id => id !== club._id);
                                                        setFormData({ ...formData, targetClubs: newClubs });
                                                    }}
                                                />
                                                <span className="text-xs truncate">{club.name} ({club.college})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Select Target Pages</Label>
                                    <div className="grid grid-cols-3 gap-2 p-2 border rounded-md">
                                        {pageOptions.map((page) => (
                                            <div key={page.id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetPages.includes(page.id)}
                                                    onChange={(e) => {
                                                        const newPages = e.target.checked
                                                            ? [...formData.targetPages, page.id]
                                                            : formData.targetPages.filter(p => p !== page.id);
                                                        setFormData({ ...formData, targetPages: newPages });
                                                    }}
                                                />
                                                <span className="text-xs">{page.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createAdMutation.isPending}>
                                    {createAdMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Create Ad Campaign'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="live" className="w-full">
                <div className="mb-8">
                    <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                        <TabsTrigger value="live" className="rounded-lg gap-2">
                            <Megaphone className="h-4 w-4" />
                            Live Campaigns ({ads?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-lg gap-2">
                            <Clock className="h-4 w-4" />
                            Pending Requests ({pendingAds?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="monetization" className="rounded-lg gap-2">
                            <Zap className="h-4 w-4" />
                            Monetization
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="live">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ads?.map((ad: any) => (
                            <Card key={ad._id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
                                <div className="aspect-video relative bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {ad.type === 'image' ? (
                                        <img src={ad.url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <PlayCircle className="h-10 w-10" />
                                            <span className="text-xs font-medium">Video Content</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Badge variant={ad.isActive ? "default" : "secondary"}>
                                            {ad.isActive ? 'Active' : 'Completed'}
                                        </Badge>
                                        <Badge variant="outline" className="bg-white/80">
                                            {ad.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                                            {ad.type}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold truncate">{ad.title}</CardTitle>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => setSelectedAd(ad)}>
                                                <Maximize2 className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={ad.isActive}
                                                onCheckedChange={(checked) => updateAdMutation.mutate({ id: ad._id, data: { isActive: checked } })}
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteAdMutation.mutate(ad._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                                        <span className="font-semibold text-slate-900">{typeof ad.requestedBy === 'object' ? ad.requestedBy.name : 'Unknown User'}</span>
                                        <span>{typeof ad.requestedBy === 'object' ? ad.requestedBy.role : 'Owner'} • {typeof ad.requestedBy === 'object' ? ad.requestedBy.college : 'Admin'}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Campaign Progress</span>
                                            <span>{Math.min(100, Math.round((ad.totalViewsCount / (ad.maxTotalViews || 1)) * 100))}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${ad.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                                                style={{ width: `${Math.min(100, (ad.totalViewsCount / (ad.maxTotalViews || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="h-3.5 w-3.5 text-primary" />
                                            <span className="font-medium">{ad.totalViewsCount} / {ad.maxTotalViews}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                            <span>{ad.duration}s display</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <PlayCircle className="h-3.5 w-3.5 text-primary" />
                                            <span>{ad.frequencyPerUser}x / {ad.frequencyInterval}h</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {ad.targetingType === 'worldwide' ? <Globe className="h-3.5 w-3.5 text-primary" /> : <GraduationCap className="h-3.5 w-3.5 text-primary" />}
                                            <span className="truncate" title={ad.targetingType === 'specific_colleges' ? `${ad.targetColleges.length} Colleges` : ad.targetingType}>
                                                {ad.targetingType === 'specific_colleges' ? 'Multi-College' : 'Worldwide'}
                                            </span>
                                        </div>
                                    </div>

                                    {ad.clickUrl && (
                                        <div className="pt-2 flex items-center gap-2 text-xs text-primary font-medium border-t border-slate-100 mt-2">
                                            <LinkIcon className="h-3 w-3" />
                                            <a href={ad.clickUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                {new URL(ad.clickUrl).hostname}
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {ads?.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-xl">
                                <Megaphone className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-medium">No live campaigns found</p>
                                <p className="text-sm">Created approved ads will appear here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pending">
                    <div className="space-y-4">
                        {pendingAds?.map((ad: any) => (
                            <Card key={ad._id} className="group border-amber-200/50 bg-amber-50/20 overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-64 aspect-video relative bg-slate-100 flex items-center justify-center shrink-0">
                                        {ad.type === 'image' ? (
                                            <img src={ad.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <PlayCircle className="h-12 w-12 text-slate-300" />
                                        )}
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="outline" className="bg-white/90">
                                                {ad.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="flex-1 p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg">{ad.title}</h3>
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Review</Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    Requested by <span className="font-bold text-slate-600">{ad.requestedBy?.name}</span>
                                                    <span>•</span>
                                                    <span>{ad.requestedBy?.role} from {ad.requestedBy?.college}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                                                            <FileCheck className="h-4 w-4 mr-2" />
                                                            View Payment
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Payment Verification</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Transaction ID</p>
                                                                    <p className="font-mono text-sm font-bold">{ad.transactionId || 'N/A'}</p>
                                                                </div>
                                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Amount Paid</p>
                                                                    <p className="text-sm font-bold text-primary">₹{ad.amountPaid || '0'}</p>
                                                                </div>
                                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Required Amount</p>
                                                                    <p className="text-sm font-bold">₹{ad.totalRequiredAmount || '0'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <p className="text-[10px] uppercase font-bold text-slate-400">Payment Screenshot</p>
                                                                {ad.screenshotUrl ? (
                                                                    <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                                                        <img src={ad.screenshotUrl} alt="Payment Proof" className="max-h-full max-w-full object-contain" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">No screenshot provided</div>
                                                                )}
                                                                {ad.screenshotUrl && (
                                                                    <a href={ad.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 justify-center mt-2">
                                                                        Open Screenshot in New Tab <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <DialogFooter className="grid grid-cols-2 gap-3">
                                                            <Button
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() => {
                                                                    const reason = prompt("Enter rejection reason:");
                                                                    approveAdMutation.mutate({ id: ad._id, status: 'rejected', reason: reason || undefined, paymentStatus: 'failed' });
                                                                }}
                                                            >
                                                                <CloseX className="h-4 w-4 mr-2" />
                                                                Invalid Payment
                                                            </Button>
                                                            <Button
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => approveAdMutation.mutate({ id: ad._id, status: 'approved', paymentStatus: 'verified' })}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Verify & Approve
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                                                    onClick={() => approveAdMutation.mutate({ id: ad._id, status: 'approved', paymentStatus: 'verified' })}
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="shadow-lg shadow-red-600/20"
                                                    onClick={() => {
                                                        const reason = prompt("Enter rejection reason (optional):");
                                                        approveAdMutation.mutate({ id: ad._id, status: 'rejected', reason: reason || undefined, paymentStatus: 'failed' });
                                                    }}
                                                >
                                                    <CloseX className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="shadow-sm"
                                                            onClick={() => {
                                                                setFormData({
                                                                    title: ad.title,
                                                                    description: ad.description || '',
                                                                    type: ad.type,
                                                                    url: ad.url,
                                                                    duration: ad.duration,
                                                                    skipDelay: ad.skipDelay || 3,
                                                                    frequencyPerUser: ad.frequencyPerUser,
                                                                    frequencyInterval: ad.frequencyInterval,
                                                                    maxTotalViews: ad.maxTotalViews,
                                                                    targetingType: ad.targetingType,
                                                                    targetColleges: ad.targetColleges || [],
                                                                    targetClubs: ad.targetClubs || [],
                                                                    targetPages: ad.targetPages || ['all'],
                                                                    clickUrl: ad.clickUrl || '',
                                                                    isActive: ad.isActive
                                                                } as any);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Ad Request</DialogTitle>
                                                        </DialogHeader>
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                updateAdMutation.mutate({ id: ad._id, data: formData as unknown as Partial<Ad> });
                                                            }}
                                                            className="space-y-4 py-4"
                                                        >
                                                            {/* Reuse the same form fields as Create Ad */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2 col-span-2">
                                                                    <Label>Title</Label>
                                                                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                                                </div>
                                                                <div className="space-y-2 col-span-2">
                                                                    <Label>Description</Label>
                                                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-2 col-span-2">
                                                                    <Label>Media URL</Label>
                                                                    <Input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Duration (s)</Label>
                                                                    <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Total Views</Label>
                                                                    <Input type="number" value={formData.maxTotalViews} onChange={e => setFormData({ ...formData, maxTotalViews: parseInt(e.target.value) })} />
                                                                </div>
                                                                <div className="space-y-2 col-span-2">
                                                                    <Label>Click URL</Label>
                                                                    <Input value={formData.clickUrl} onChange={e => setFormData({ ...formData, clickUrl: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="submit" disabled={updateAdMutation.isPending}>
                                                                    {updateAdMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Save Changes'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Display Time</p>
                                                <p className="text-sm font-semibold">{ad.duration} Seconds</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Frequency</p>
                                                <p className="text-sm font-semibold">{ad.frequencyPerUser}x / {ad.frequencyInterval}h</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Target Reach</p>
                                                <p className="text-sm font-semibold">{ad.maxTotalViews || 0} Views</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Scope</p>
                                                <p className="text-sm font-semibold capitalize">{ad.targetingType.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground bg-white/50 p-3 rounded-lg border border-border/50 italic">
                                            "{ad.description || "No notes provided by requester."}"
                                        </p>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}

                        {pendingAds?.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border-2 border-dashed rounded-2xl">
                                <FileCheck className="h-16 w-16 mb-4 opacity-10" />
                                <p className="font-medium text-lg">Clean Dashboard!</p>
                                <p className="text-sm">No pending ad requests to review.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="monetization" className="space-y-6 pt-4 animate-in fade-in duration-500">
                    <Card className="border-emerald-200/50 bg-emerald-50/5">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-emerald-600" />
                                    Ad Monetization Control
                                </CardTitle>
                                <p className="text-sm text-muted-foreground font-medium">Toggle payments and configure system-wide pricing rules.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{userCounts?.total || 0} Total Users</span>
                                </div>
                                <div className="flex items-center gap-3 bg-emerald-100/50 px-4 py-2 rounded-full border border-emerald-200">
                                    <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">Monetization: {monetizationSettings.adPaymentEnabled ? 'ACTIVE' : 'DISABLED'}</span>
                                    <Switch
                                        checked={monetizationSettings.adPaymentEnabled}
                                        onCheckedChange={(checked) => setMonetizationSettings({ ...monetizationSettings, adPaymentEnabled: checked })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-emerald-500 border-none p-0" />
                                        Pricing Rules - IMAGE ADS (INR)
                                    </h4>
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Self College Price
                                                <Badge variant="secondary" className="text-[9px] h-4">Per 100 Views</Badge>
                                                <span className="text-[10px] text-muted-foreground ml-auto bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                    Target Reach: ~{userCounts?.college || 0} Students
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.minSelfCollegePrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, minSelfCollegePrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Specific Colleges (Per College)
                                                <Badge variant="secondary" className="text-[9px] h-4">Per 100 Views</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.specificCollegePrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, specificCollegePrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Worldwide Access
                                                <Badge variant="secondary" className="text-[9px] h-4">Per 100 Views</Badge>
                                                <span className="text-[10px] text-muted-foreground ml-auto bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                    Target Reach: ~{userCounts?.total || 0} Users
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.worldwidePrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, worldwidePrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 mt-8 border-t border-emerald-100 pt-6">
                                        <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-emerald-500 border-none p-0" />
                                        Video Ad Pricing (Per 100 Views)
                                    </h4>
                                    <div className="grid gap-6 mt-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Self College Price
                                                <Badge variant="secondary" className="text-[9px] h-4">Video Base</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.minSelfCollegeVideoPrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, minSelfCollegeVideoPrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Specific Colleges
                                                <Badge variant="secondary" className="text-[9px] h-4">Video</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.specificCollegeVideoPrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, specificCollegeVideoPrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                Worldwide Access
                                                <Badge variant="secondary" className="text-[9px] h-4">Video Global</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={monetizationSettings.worldwideVideoPrice}
                                                    onChange={e => setMonetizationSettings({ ...monetizationSettings, worldwideVideoPrice: parseFloat(e.target.value) })}
                                                    className="pl-7 bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-emerald-500 border-none p-0" />
                                        Payment Assets
                                    </h4>
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold">UPI QR Image Link</Label>
                                            <Input
                                                value={monetizationSettings.qrCodeUrl}
                                                onChange={e => setMonetizationSettings({ ...monetizationSettings, qrCodeUrl: e.target.value })}
                                                placeholder="https://imgur.com/your-qr.png"
                                                className="bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors h-11"
                                            />
                                            <p className="text-[10px] text-muted-foreground italic">Use a direct image link from Imgur, PostImages, or Google Drive (Direct URL).</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold">User Instructions / Disclaimer</Label>
                                            <Textarea
                                                value={monetizationSettings.paymentWarning}
                                                onChange={e => setMonetizationSettings({ ...monetizationSettings, paymentWarning: e.target.value })}
                                                placeholder="Enter payment warning or verification instructions..."
                                                className="min-h-[140px] bg-white/50 border-emerald-100 hover:border-emerald-300 transition-colors resize-none text-sm p-4"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-emerald-100">
                                <Button
                                    onClick={handleSaveMonetization}
                                    disabled={isSavingMonetization}
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-500/20 rounded-2xl transition-all active:scale-[0.98] gap-3"
                                >
                                    {isSavingMonetization ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    Update Payment Configuration
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Master Monetization Control & Systems</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {/* Full Screen View & Edit Dialog */}
            <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                    {selectedAd && (
                        <div className="flex flex-col md:flex-row h-full">
                            {/* Left: Preview */}
                            <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4 relative min-h-[300px]">
                                {selectedAd.type === 'image' ? (
                                    <img src={selectedAd.url} alt={selectedAd.title} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <video src={selectedAd.url} controls className="max-w-full max-h-full" />
                                )}
                                <div className="absolute top-4 left-4">
                                    <Badge variant={selectedAd.isActive ? "default" : "secondary"}>
                                        {selectedAd.isActive ? 'Active' : 'Completed'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div className="w-full md:w-1/2 p-6 flex flex-col h-full overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedAd.title}</h2>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <span className="font-semibold text-primary">{typeof selectedAd.requestedBy === 'object' ? selectedAd.requestedBy.name : 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{typeof selectedAd.requestedBy === 'object' ? selectedAd.requestedBy.college : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline">
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Advertisement</DialogTitle>
                                                </DialogHeader>
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        updateAdMutation.mutate({ id: selectedAd._id || '', data: formData as unknown as Partial<Ad> });
                                                        setSelectedAd(null);
                                                    }}
                                                    className="space-y-4 py-4"
                                                >
                                                    {/* Reusing fields manually for now, ideally refactor into a component */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Title</Label>
                                                            <Input defaultValue={selectedAd.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Media URL</Label>
                                                            <Input defaultValue={selectedAd.url} onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))} required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Duration (s)</Label>
                                                            <Input type="number" defaultValue={selectedAd.duration} onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Total Views Limit</Label>
                                                            <Input type="number" defaultValue={selectedAd.maxTotalViews} onChange={e => setFormData(prev => ({ ...prev, maxTotalViews: parseInt(e.target.value) }))} />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Click URL</Label>
                                                            <Input defaultValue={selectedAd.clickUrl} onChange={e => setFormData(prev => ({ ...prev, clickUrl: e.target.value }))} />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit">Save Changes</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Performance</h3>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-3xl font-black text-slate-900">{selectedAd.totalViewsCount}</p>
                                                <p className="text-xs text-muted-foreground">Total Views Delivered</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-slate-400">/ {selectedAd.maxTotalViews || '∞'}</p>
                                                <p className="text-xs text-muted-foreground">Target Goal</p>
                                            </div>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${selectedAd.isActive ? 'bg-primary' : 'bg-slate-400'}`}
                                                style={{ width: `${Math.min(100, (selectedAd.totalViewsCount / (selectedAd.maxTotalViews || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Duration</p>
                                            <p className="font-bold">{selectedAd.duration} Seconds</p>
                                        </div>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Frequency</p>
                                            <p className="font-bold">{selectedAd.frequencyPerUser}x / {selectedAd.frequencyInterval}h</p>
                                        </div>
                                        <div className="p-3 border rounded-lg col-span-2">
                                            <p className="text-xs text-muted-foreground">Targeting</p>
                                            <p className="font-bold capitalize">{selectedAd.targetingType.replace('_', ' ')}</p>
                                            {selectedAd.targetingType === 'specific_colleges' && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {selectedAd.targetColleges?.map((c: string) => (
                                                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedAd.description && (
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                                            <p className="text-sm text-slate-600 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 italic">
                                                "{selectedAd.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
