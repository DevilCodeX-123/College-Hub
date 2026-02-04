import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, FileCheck, Clock, Megaphone } from 'lucide-react';

interface AdRequestFormProps {
    onSuccess?: () => void;
}

export function AdRequestForm({ onSuccess }: AdRequestFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();

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
        transactionId: '',
        screenshotUrl: '',
        amountPaid: 0
    });

    const { data: config } = useQuery({
        queryKey: ['platform-config'],
        queryFn: () => api.getConfig()
    });

    const calculatePrice = () => {
        if (!config || !config.adPaymentEnabled) return 0;
        let basePrice = 0;
        const isVideo = formData.type === 'video';

        if (formData.targetingType === 'worldwide') {
            basePrice = isVideo ? (config.worldwideVideoPrice || 0) : config.worldwidePrice;
        } else if (formData.targetingType === 'specific_colleges') {
            const rate = isVideo ? (config.specificCollegeVideoPrice || 0) : config.specificCollegePrice;
            basePrice = formData.targetColleges.length * rate;
        } else if (formData.targetingType === 'college') {
            basePrice = isVideo ? (config.minSelfCollegeVideoPrice || 0) : config.minSelfCollegePrice;
        }

        // Scale by reach (base reach is 100)
        const reachMultiplier = Math.ceil(formData.maxTotalViews / 100);
        return Math.ceil(basePrice * reachMultiplier);
    };

    const totalPrice = calculatePrice();

    const { data: colleges = [] } = useQuery({
        queryKey: ['colleges'],
        queryFn: () => api.getActiveColleges()
    });

    const requestAdMutation = useMutation({
        mutationFn: (data: any) => {
            console.log('Submitting ad request:', data);
            const payload = {
                ...data,
                requestingUserId: user?.id,
                totalRequiredAmount: totalPrice
            };
            return api.requestAd(payload);
        },
        onSuccess: () => {
            toast({ title: 'Ad Request Submitted!', description: 'Your ad is now pending owner approval.' });
            resetForm();
            if (onSuccess) onSuccess();
        },
        onError: (error: any) => {
            console.error('Ad request failed:', error);
            toast({
                title: 'Submission Failed',
                description: error?.response?.data?.message || error?.message || 'Failed to submit ad request. Please try again.',
                variant: 'destructive'
            });
        }
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
            transactionId: '',
            screenshotUrl: '',
            amountPaid: 0
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (config?.adPaymentEnabled) {
            if (!formData.transactionId || !formData.screenshotUrl) {
                toast({
                    title: 'Payment Required',
                    description: 'Please complete the payment and provide transaction details.',
                    variant: 'destructive'
                });
                return;
            }

            if (formData.amountPaid !== totalPrice) {
                toast({
                    title: 'Incorrect Amount',
                    description: `The amount paid (₹${formData.amountPaid}) must match the required total (₹${totalPrice}).`,
                    variant: 'destructive'
                });
                return;
            }
        }
        requestAdMutation.mutate(formData);
    };

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

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 md:col-span-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-primary/70">Campaign Details</Label>
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-bold text-slate-500">Campaign Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Annual Tech Fest 2024"
                            className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="description" className="text-xs font-bold text-slate-500">Description (Notes for Owner)</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Explain the purpose of this ad..."
                        className="min-h-[100px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl p-4"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500">Ad Type</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as 'image' | 'video' })}>
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="image" className="font-medium">🖼️ Image Banner</SelectItem>
                            <SelectItem value="video" className="font-medium">🎥 Video Ad</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="url" className="text-xs font-bold text-slate-500">Media URL</Label>
                    <Input
                        id="url"
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                        placeholder="Direct link to image/video"
                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                        required
                    />
                </div>

                <div className="md:col-span-2 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900">Targeting & Reach</h4>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Define where and how often people see your ad</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500">Targeting Scope</Label>
                            <Select value={formData.targetingType} onValueChange={v => setFormData({ ...formData, targetingType: v })}>
                                <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="worldwide" className="font-medium">🌎 Worldwide</SelectItem>
                                    <SelectItem value="college" className="font-medium">🏛️ All Colleges</SelectItem>
                                    <SelectItem value="specific_colleges" className="font-medium">📍 Specific Colleges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="reach" className="text-xs font-bold text-slate-500">Total Reach Cap</Label>
                            <Input
                                id="reach"
                                type="number"
                                value={formData.maxTotalViews}
                                onChange={e => setFormData({ ...formData, maxTotalViews: parseInt(e.target.value) })}
                                min={1}
                                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                            />
                        </div>

                        {formData.targetingType === 'specific_colleges' && (
                            <div className="space-y-3 md:col-span-2">
                                <Label className="text-xs font-bold text-slate-500">Select Target Colleges</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/30 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {colleges.map((c: string) => (
                                        <div key={c} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={formData.targetColleges.includes(c)}
                                                onChange={(e) => {
                                                    const newColleges = e.target.checked
                                                        ? [...formData.targetColleges, c]
                                                        : formData.targetColleges.filter(col => col !== c);
                                                    setFormData({ ...formData, targetColleges: newColleges });
                                                }}
                                                className="h-4 w-4 rounded-md border-slate-300 text-primary focus:ring-primary ring-offset-2 transition-all"
                                            />
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="frequency" className="text-xs font-bold text-slate-500">Max Views Per User</Label>
                            <Input
                                id="frequency"
                                type="number"
                                value={formData.frequencyPerUser}
                                onChange={e => setFormData({ ...formData, frequencyPerUser: parseInt(e.target.value) })}
                                min={1}
                                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="interval" className="text-xs font-bold text-slate-500">Hours Between Views</Label>
                            <Input
                                id="interval"
                                type="number"
                                value={formData.frequencyInterval}
                                onChange={e => setFormData({ ...formData, frequencyInterval: parseInt(e.target.value) })}
                                min={0}
                                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                            />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <Label className="text-xs font-bold text-slate-500">Target Pages</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/30">
                                {pageOptions.map((page) => (
                                    <div key={page.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                                        <input
                                            type="checkbox"
                                            checked={formData.targetPages.includes(page.id)}
                                            onChange={(e) => {
                                                const newPages = e.target.checked
                                                    ? [...formData.targetPages, page.id]
                                                    : formData.targetPages.filter(p => p !== page.id);
                                                setFormData({ ...formData, targetPages: newPages });
                                            }}
                                            className="h-4 w-4 rounded-md border-slate-300 text-primary focus:ring-primary ring-offset-2 transition-all"
                                        />
                                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">{page.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="clickUrl" className="text-xs font-bold text-slate-500">Click-through Link</Label>
                            <Input
                                id="clickUrl"
                                value={formData.clickUrl}
                                onChange={e => setFormData({ ...formData, clickUrl: e.target.value })}
                                placeholder="https://yourclub.com/event"
                                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                {config?.adPaymentEnabled && (
                    <div className="md:col-span-2 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Megaphone className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-slate-900">Payment Required</h4>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Complete the payment to launch your campaign</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL AMOUNT</p>
                                <p className="text-2xl font-black text-primary">₹{totalPrice}</p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                    Based on {Math.ceil(formData.maxTotalViews / 100)} × {formData.type === 'video' ? 'Video' : 'Image'} Rate (per 100 views)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center min-h-[240px]">
                                    {config.qrCodeUrl ? (
                                        <img src={config.qrCodeUrl} alt="UPI QR Code" className="max-h-48 w-auto rounded-xl shadow-lg border-4 border-white" />
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">QR Code not provided by owner.</p>
                                    )}
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[11px] font-bold text-amber-600 flex gap-2">
                                        <span className="shrink-0 text-lg">⚠️</span>
                                        {config.paymentWarning}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="txnId" className="text-xs font-bold text-slate-500">Transaction ID / UTR</Label>
                                    <Input
                                        id="txnId"
                                        value={formData.transactionId}
                                        onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                        placeholder="12-digit number"
                                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="screenshot" className="text-xs font-bold text-slate-500">Payment Screenshot URL</Label>
                                    <Input
                                        id="screenshot"
                                        value={formData.screenshotUrl}
                                        onChange={e => setFormData({ ...formData, screenshotUrl: e.target.value })}
                                        placeholder="Imgur/Google Drive link"
                                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-xs font-bold text-slate-500">Amount Paid (Confirmation)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={formData.amountPaid}
                                        onChange={e => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) })}
                                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium rounded-xl"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4" />
                    <p className="text-xs font-medium italic">Owner approval typically takes 12-24 hours</p>
                </div>
                <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto px-10 h-14 font-black uppercase tracking-widest text-xs gap-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    disabled={requestAdMutation.isPending}
                >
                    {requestAdMutation.isPending ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <FileCheck className="h-5 w-5" />
                    )}
                    Submit Ad Request
                </Button>
            </div>
        </form>
    );
}
