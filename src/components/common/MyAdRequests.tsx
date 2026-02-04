import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

export function MyAdRequests() {
    const { user } = useAuth();

    const { data: myAds = [], isLoading } = useQuery({
        queryKey: ['my-ad-requests', user?.id],
        queryFn: () => api.getAds(user?.id || ''),
        enabled: !!user?.id
    });

    // Fetch clubs where user is coordinator
    const { data: coordinatorClubs = [] } = useQuery({
        queryKey: ['coordinator-clubs', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const clubs = await api.getManagedClubs(user.id, user.id);
            return clubs || [];
        },
        enabled: !!user?.id
    });

    const getRoleLabels = (userData: any) => {
        const roles: string[] = [];

        // Add primary role
        const roleMap: Record<string, string> = {
            'admin': 'Admin',
            'co_admin': 'Co-Admin',
            'club_coordinator': 'Coordinator',
            'club_head': 'Secretary',
            'club_co_coordinator': 'Co-Coordinator',
            'owner': 'Owner',
            'core_member': 'Core Member',
            'club_member': 'Club Member',
            'student': 'Student'
        };

        if (userData?.role) {
            roles.push(roleMap[userData.role] || userData.role);
        }

        // Add coordinator clubs
        if (coordinatorClubs && coordinatorClubs.length > 0) {
            coordinatorClubs.forEach((club: any) => {
                roles.push(`${club.name} Coordinator`);
            });
        }

        return roles;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (myAds.length === 0) {
        return (
            <div className="text-center py-12 opacity-60">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No ad requests yet</p>
                <p className="text-sm text-muted-foreground">Submit your first ad request to see it here</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
            case 'pending':
            default:
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    My Ad Requests
                </h3>
            </div>
            <div className="grid gap-6">
                {myAds.map((ad: any) => {
                    const userRoles = getRoleLabels(ad.requestedBy || user);

                    return (
                        <Card key={ad._id || ad.id} className="overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-48 aspect-video md:aspect-square relative bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {ad.type === 'image' && ad.url ? (
                                        <img src={ad.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            {ad.type === 'video' ? <Clock className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{ad.type}</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        {getStatusBadge(ad.status)}
                                    </div>
                                </div>
                                <div className="flex-1 p-5 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-black text-lg text-slate-900 leading-tight mb-1 group-hover:text-primary transition-colors">{ad.title}</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {userRoles.map((role, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter bg-slate-100 text-slate-600 border-none">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted</p>
                                            <p className="text-sm font-bold text-slate-600">
                                                {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                                            </p>
                                        </div>
                                    </div>

                                    {ad.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 italic font-medium">"{ad.description}"</p>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-slate-50 mb-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Type</p>
                                            <p className="text-xs font-bold text-slate-700 capitalize">{ad.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Scope</p>
                                            <p className="text-xs font-bold text-slate-700 capitalize">{ad.targetingType?.replace('_', ' ') || 'Global'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Reach Limit</p>
                                            <p className="text-xs font-bold text-slate-700">{ad.maxTotalViews || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Progress</p>
                                            <p className="text-xs font-bold text-slate-700">{ad.totalViewsCount || 0} views</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        {ad.clickUrl ? (
                                            <a
                                                href={ad.clickUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                View Landing Page
                                            </a>
                                        ) : <div />}

                                        {ad.status === 'rejected' && ad.rejectionReason && (
                                            <Badge variant="outline" className="text-[10px] font-bold border-red-200 text-red-600 bg-red-50/50">
                                                Reason: {ad.rejectionReason}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
