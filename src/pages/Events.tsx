import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, ArrowRight, Loader2, Sparkles, ExternalLink, History, Ban, CheckCircle, Trophy, Users2, UserCheck, Info, X, Zap, Plus } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EventRegistrationsDialog } from '@/components/events/EventRegistrationsDialog';
import { PastEventDetailsDialog } from '@/components/events/PastEventDetailsDialog';

export default function Events() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

    // Admin View Registrations State
    const [viewRegistrationsEvent, setViewRegistrationsEvent] = useState<Event | null>(null);
    const [isViewRegistrationsOpen, setIsViewRegistrationsOpen] = useState(false);

    // Edit registration state
    const [editMode, setEditMode] = useState(false);
    const [editRegistration, setEditRegistration] = useState<any>(null);

    useEffect(() => {
        localStorage.setItem('last_viewed_events', new Date().toISOString());
    }, []);

    const { data: events = [], isLoading, isError, refetch } = useQuery<Event[]>({
        queryKey: ['events', user?.college],
        queryFn: () => api.getEvents(user?.college || undefined),
        retry: 1, // Don't retry indefinitely
    });

    const canViewRegistrations = (event: Event) => {
        if (!user) return false;
        if (['admin', 'co_admin', 'owner'].includes(user.role)) return true;
        if (['club_coordinator', 'club_head'].includes(user.role) && user.joinedClubs?.includes(event.clubId)) return true;
        return false;
    };

    const today = startOfDay(new Date());

    const upcomingEvents = events.filter((event: Event) =>
        !event.isCompleted && (isAfter(new Date(event.date), today) || format(new Date(event.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastEvents = events.filter((event: Event) =>
        event.isCompleted || (isBefore(new Date(event.date), today) && format(new Date(event.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleRegisterClick = (event: any, isEdit: boolean = false, existingReg: any = null) => {
        setSelectedEvent(event);
        setEditMode(isEdit);
        setEditRegistration(existingReg);
        setIsRegistrationOpen(true);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (isError) {
        const errorMessage = isError instanceof Error ? isError.message : 'Unknown error';

        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                    <Ban className="h-12 w-12 text-destructive" />
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Connection Failed</h2>
                        <p className="text-muted-foreground">
                            Could not load events. The backend server might be offline.
                        </p>
                        <p className="text-xs text-red-500 font-mono bg-red-50 p-2 rounded">
                            Error: {JSON.stringify(errorMessage)}
                        </p>
                    </div>
                    <Button onClick={() => refetch()} variant="outline">
                        Retry Connection
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-12 animate-fade-in pb-10">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Campus Events</h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        Stay updated with the latest workshops, hackathons, and activities.
                    </p>
                </div>

                {/* Upcoming Events */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-gold" />
                        <h2 className="text-2xl font-bold">Upcoming Events</h2>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event: Event) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    isUpcoming
                                    user={user}
                                    onRegister={() => handleRegisterClick(event)}
                                    onEdit={(regType: string, reg: any) => handleRegisterClick(event, true, reg)}
                                    showViewRegistrations={canViewRegistrations(event)}
                                    onViewRegistrations={() => {
                                        setViewRegistrationsEvent(event);
                                        setIsViewRegistrationsOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">No upcoming events</h3>
                                <p className="text-muted-foreground">Check back later for new activities!</p>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* Past Events */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-2xl font-bold text-muted-foreground">Past Events</h2>
                    </div>

                    {pastEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                            {pastEvents.map((event: Event) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    user={user}
                                    showViewRegistrations={canViewRegistrations(event)}
                                    onViewRegistrations={() => {
                                        setViewRegistrationsEvent(event);
                                        setIsViewRegistrationsOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No past events found.</p>
                    )}
                </section>
            </div>

            <EventRegistrationDialog
                open={isRegistrationOpen}
                onOpenChange={(val) => {
                    setIsRegistrationOpen(val);
                    if (!val) {
                        setEditMode(false);
                        setEditRegistration(null);
                    }
                }}
                event={selectedEvent}
                editMode={editMode}
                editRegistration={editRegistration}
                onEdit={(reg: any) => {
                    setEditMode(true);
                    setEditRegistration(reg);
                }}
            />

            <EventRegistrationsDialog
                open={isViewRegistrationsOpen}
                onOpenChange={setIsViewRegistrationsOpen}
                event={viewRegistrationsEvent}
            />
        </Layout>
    );
}

function EventCard({
    event,
    isUpcoming,
    user,
    onRegister,
    onEdit,
    showViewRegistrations,
    onViewRegistrations
}: {
    event: Event;
    isUpcoming?: boolean;
    user?: any;
    onRegister?: () => void;
    onEdit?: (regType: string, reg: any) => void;
    showViewRegistrations?: boolean;
    onViewRegistrations?: () => void;
}) {
    const isRegisteredIndividual = event.registrations?.find((r: any) => r.userId === (user?.id || user?._id) && r.registrationType === 'individual');
    const isRegisteredTeam = event.registrations?.find((r: any) => r.userId === (user?.id || user?._id) && r.registrationType === 'team');

    const CardContentWrapper = () => (
        <div className="flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className={cn(
                "relative overflow-hidden bg-muted",
                isUpcoming ? "aspect-video" : "w-full md:w-56 h-48 md:h-auto"
            )}>
                <img
                    src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-0 text-[10px] font-bold">
                        {event.category || 'General'}
                    </Badge>
                    {!isUpcoming && (
                        <Badge variant="outline" className="bg-emerald-500 text-white border-0 text-[9px] font-black uppercase shadow-sm">
                            Verified
                        </Badge>
                    )}
                </div>

                {isUpcoming && event.xpReward && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-0">
                        +{event.xpReward} XP
                    </Badge>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Calendar className="h-3 w-3 text-primary" />
                            {event.date ? format(new Date(event.date), 'MMMM dd, yyyy') : 'TBD'}
                            {event.location && (
                                <>
                                    <span className="opacity-30">•</span>
                                    <MapPin className="h-3 w-3 text-primary" />
                                    <span className="truncate max-w-[120px]">{event.location}</span>
                                </>
                            )}
                        </div>
                        {event.organizingClub && (
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">{event.organizingClub}</p>
                        )}
                    </div>

                    <CardTitle className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                        {event.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                        {event.description || 'Verified record of achievement and participation.'}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {event.duration || event.time || 'All Day'}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isUpcoming ? (
                            <>
                                <Button
                                    variant="gradient"
                                    size="sm"
                                    className="h-8 px-4 text-xs font-bold group/btn"
                                    onClick={onRegister}
                                    disabled={event.stopRegistration || event.isCompleted}
                                >
                                    {event.stopRegistration || event.isCompleted ? 'Closed' : 'Register'}
                                </Button>
                                {(isRegisteredIndividual || isRegisteredTeam) && !event.stopRegistration && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-4 text-xs font-bold border-primary text-primary hover:bg-primary/5"
                                        onClick={() => {
                                            const reg = isRegisteredIndividual || isRegisteredTeam;
                                            onEdit?.(reg.registrationType, reg);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </>
                        ) : (
                            <PastEventDetailsDialog event={event}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-4 text-xs font-black text-primary hover:bg-primary/5 uppercase tracking-wider"
                                >
                                    Report
                                </Button>
                            </PastEventDetailsDialog>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Card className={cn(
            "group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm flex flex-col h-full ring-1",
            isUpcoming ? "ring-primary/20 hover:ring-primary/40 shadow-sm" : "ring-slate-200"
        )}>
            <CardContentWrapper />
        </Card>
    );
}

function EventRegistrationDialog({ open, onOpenChange, event, editMode = false, editRegistration = null, onEdit }: { open: boolean; onOpenChange: (open: boolean) => void; event: Event | null, editMode?: boolean, editRegistration?: any, onEdit?: (reg: any) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        programs: [] as string[],
        comments: '',
        teamMembers: [] as { name: string; email: string }[],
        paymentProofUrl: '',
        transactionId: ''
    });

    // Check if payment is required
    const isPaymentRequired = event?.paymentQRCode && (
        (registrationType === 'individual' && event.paymentAmountIndividual) ||
        (registrationType === 'team' && event.paymentAmountTeam)
    );
    const paymentAmount = registrationType === 'individual'
        ? event?.paymentAmountIndividual
        : event?.paymentAmountTeam;

    // Check existing registrations for this user
    const existingIndividualReg = event?.registrations?.find(
        (r: any) => r.userId === (user?.id || user?._id) && r.registrationType === 'individual'
    );
    const existingTeamReg = event?.registrations?.find(
        (r: any) => r.userId === (user?.id || user?._id) && r.registrationType === 'team'
    );

    // Reset form when dialog opens
    useEffect(() => {
        if (open && user) {
            if (editMode && editRegistration) {
                setRegistrationType(editRegistration.registrationType || 'individual');
                setFormData({
                    name: editRegistration.name || user.name || '',
                    email: editRegistration.email || user.email || '',
                    programs: typeof editRegistration.program === 'string' ? editRegistration.program.split(', ').filter(Boolean) : [],
                    comments: editRegistration.comments || '',
                    teamMembers: editRegistration.teamMembers || [],
                    paymentProofUrl: editRegistration.paymentProofUrl || '',
                    transactionId: editRegistration.transactionId || ''
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    name: user.name || '',
                    email: user.email || '',
                    programs: [],
                    comments: '',
                    teamMembers: [],
                    paymentProofUrl: '',
                    transactionId: ''
                }));
                setRegistrationType('individual');
            }
        }
    }, [open, user, editMode, editRegistration]);

    const registerMutation = useMutation({
        mutationFn: (data: any) => editMode
            ? api.updateEventRegistration(event?._id || event?.id || '', user?.id || user?._id, data)
            : api.registerEvent(event?._id || event?.id || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast({
                title: editMode ? "Update Successful!" : "Registration Successful!",
                description: editMode
                    ? `Your registration for ${event?.title} has been updated.`
                    : `You have registered as ${registrationType} for ${event?.title}.`,
            });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "Registration Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({ title: "Please login to register", variant: "destructive" });
            return;
        }

        if (isPaymentRequired && (!formData.paymentProofUrl || !formData.transactionId)) {
            toast({ title: "Payment proof and Transaction ID are required", variant: "destructive" });
            return;
        }

        registerMutation.mutate({
            userId: user.id || user._id,
            name: formData.name,
            email: formData.email,
            program: formData.programs.length > 0 ? formData.programs.join(', ') : 'General Interest',
            comments: formData.comments,
            registrationType,
            teamMembers: registrationType === 'team' ? formData.teamMembers : [],
            paymentProofUrl: formData.paymentProofUrl,
            transactionId: formData.transactionId
        });
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editMode ? 'Edit' : 'Register for'} {event.title}</DialogTitle>
                    <DialogDescription>
                        {editMode ? 'Update your registration details below.' : 'Choose your registration type and fill in the details.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Registration Type Selection */}
                    {!editMode && (
                        <div className="space-y-3">
                            <Label className="font-bold">Registration Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className={cn(
                                        "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all cursor-pointer",
                                        registrationType === 'individual'
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300",
                                        existingIndividualReg && "cursor-default select-none"
                                    )}
                                    onClick={() => !existingIndividualReg && setRegistrationType('individual')}
                                >
                                    <UserCheck className="h-6 w-6" />
                                    <span className="font-bold">Individual</span>
                                    {event.paymentAmountIndividual && (
                                        <span className="text-xs">₹{event.paymentAmountIndividual}</span>
                                    )}
                                    {existingIndividualReg && (
                                        <div className="mt-2 flex flex-col items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px]">Already Registered</Badge>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-4 text-[10px] font-bold border-blue-200 text-blue-700 hover:bg-blue-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit?.(existingIndividualReg);
                                                }}
                                            >
                                                Edit Detail
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all cursor-pointer",
                                        registrationType === 'team'
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-200 hover:border-gray-300",
                                        existingTeamReg && "cursor-default select-none"
                                    )}
                                    onClick={() => !existingTeamReg && setRegistrationType('team')}
                                >
                                    <Users2 className="h-6 w-6" />
                                    <span className="font-bold">Team</span>
                                    {event.paymentAmountTeam && (
                                        <span className="text-xs">₹{event.paymentAmountTeam}</span>
                                    )}
                                    {existingTeamReg && (
                                        <div className="mt-2 flex flex-col items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px]">Already Registered</Badge>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-4 text-[10px] font-bold border-purple-200 text-purple-700 hover:bg-purple-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit?.(existingTeamReg);
                                                }}
                                            >
                                                Edit Detail
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Registration Type Status (Read-only during edit) */}
                    {editMode && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                            {registrationType === 'individual' ? <UserCheck className="h-5 w-5 text-blue-600" /> : <Users2 className="h-5 w-5 text-purple-600" />}
                            <span className="font-bold uppercase text-xs tracking-wider">
                                Registered as: {registrationType}
                            </span>
                        </div>
                    )}

                    {/* Payment Section (if required) */}
                    {isPaymentRequired && (
                        <div className="space-y-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-700 font-bold">
                                💳 Payment Required: ₹{paymentAmount}
                            </div>
                            <div className="flex justify-center">
                                <img
                                    src={event.paymentQRCode}
                                    alt="Payment QR Code"
                                    className="max-w-[200px] rounded-lg border-2 border-amber-300"
                                />
                            </div>
                            <p className="text-xs text-amber-600 text-center">Scan the QR code and pay ₹{paymentAmount}</p>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Payment Screenshot URL {editMode && '(Read-only)'}</Label>
                                <Input
                                    value={formData.paymentProofUrl}
                                    onChange={(e) => setFormData({ ...formData, paymentProofUrl: e.target.value })}
                                    placeholder="https://drive.google.com/your-screenshot"
                                    required
                                    readOnly={editMode}
                                    className={cn(editMode && "bg-muted cursor-not-allowed")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Transaction/UPI ID {editMode && '(Read-only)'}</Label>
                                <Input
                                    value={formData.transactionId}
                                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                    placeholder="e.g. UPI123456789"
                                    required
                                    readOnly={editMode}
                                    className={cn(editMode && "bg-muted cursor-not-allowed")}
                                />
                            </div>
                        </div>
                    )}

                    {/* Basic Info (Read-only) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} readOnly className="bg-muted cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={formData.email} readOnly className="bg-muted cursor-not-allowed" />
                        </div>
                    </div>

                    {/* Program Selection */}
                    {event.programs && event.programs.length > 0 && (
                        <div className="space-y-2">
                            <Label>Program / Activity Interest</Label>
                            <div className="flex flex-wrap gap-2 border rounded-md p-3">
                                {event.programs.map((prog: string, idx: number) => {
                                    const isSelected = formData.programs.includes(prog);
                                    return (
                                        <Badge
                                            key={idx}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const newPrograms = isSelected
                                                    ? formData.programs.filter(p => p !== prog)
                                                    : [...formData.programs, prog];
                                                setFormData({ ...formData, programs: newPrograms });
                                            }}
                                        >
                                            {prog}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Team Members (only for team registration) */}
                    {registrationType === 'team' && (
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold flex items-center gap-2">
                                    <Users2 className="h-4 w-4" /> Team Members
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData({
                                        ...formData,
                                        teamMembers: [...formData.teamMembers, { name: '', email: '' }]
                                    })}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            {formData.teamMembers.map((member, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Name"
                                        value={member.name}
                                        onChange={(e) => {
                                            const newMembers = [...formData.teamMembers];
                                            newMembers[idx].name = e.target.value;
                                            setFormData({ ...formData, teamMembers: newMembers });
                                        }}
                                        className="h-9"
                                    />
                                    <Input
                                        placeholder="Email"
                                        value={member.email}
                                        onChange={(e) => {
                                            const newMembers = [...formData.teamMembers];
                                            newMembers[idx].email = e.target.value;
                                            setFormData({ ...formData, teamMembers: newMembers });
                                        }}
                                        className="h-9"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive"
                                        onClick={() => {
                                            const newMembers = formData.teamMembers.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, teamMembers: newMembers });
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-2">
                        <Label>Comments (Optional)</Label>
                        <Textarea
                            placeholder="Any questions or requirements?"
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editMode ? 'Update' : `Confirm ${registrationType === 'team' ? 'Team' : 'Individual'}`} Registration
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
