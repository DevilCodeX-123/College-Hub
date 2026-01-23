import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, ArrowRight, Loader2, Sparkles, ExternalLink, History, Ban, CheckCircle } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

export default function Events() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

    // Admin View Registrations State
    const [viewRegistrationsEvent, setViewRegistrationsEvent] = useState<any>(null);
    const [isViewRegistrationsOpen, setIsViewRegistrationsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('last_viewed_events', new Date().toISOString());
    }, []);

    const { data: events = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['events'],
        queryFn: () => api.getEvents(),
        retry: 1, // Don't retry indefinitely
    });

    const canViewRegistrations = (event: any) => {
        if (!user) return false;
        if (['admin', 'co_admin', 'owner'].includes(user.role)) return true;
        if (['club_coordinator', 'club_head'].includes(user.role) && user.joinedClubs?.includes(event.clubId)) return true;
        return false;
    };

    const today = startOfDay(new Date());

    const upcomingEvents = events.filter((event: any) =>
        !event.isCompleted && (isAfter(new Date(event.date), today) || format(new Date(event.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastEvents = events.filter((event: any) =>
        event.isCompleted || (isBefore(new Date(event.date), today) && format(new Date(event.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleRegisterClick = (event: any) => {
        setSelectedEvent(event);
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
        // @ts-ignore
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
                            {upcomingEvents.map((event: any) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    isUpcoming
                                    onRegister={() => handleRegisterClick(event)}
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
                            {pastEvents.map((event: any) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
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
                onOpenChange={setIsRegistrationOpen}
                event={selectedEvent}
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
    onRegister,
    showViewRegistrations,
    onViewRegistrations
}: {
    event: any;
    isUpcoming?: boolean;
    onRegister?: () => void;
    showViewRegistrations?: boolean;
    onViewRegistrations?: () => void;
}) {
    return (
        <Card className={cn(
            "group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm flex flex-col h-full",
            isUpcoming ? "ring-1 ring-primary/20 hover:ring-primary/40" : "bg-muted/30"
        )}>
            <div className="aspect-video relative overflow-hidden bg-muted">
                <img
                    src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-md text-foreground border-0">
                    {event.category || 'General'}
                </Badge>
                {isUpcoming && event.xpReward && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-0">
                        +{event.xpReward} XP
                    </Badge>
                )}
                {event.stopRegistration && !event.isCompleted && (
                    <Badge variant="destructive" className="absolute top-4 left-4 border-0">
                        <Ban className="h-3 w-3 mr-1" /> Reg Closed
                    </Badge>
                )}
            </div>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                    <CardTitle className="leading-tight group-hover:text-primary transition-colors">
                        {event.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description || 'No description available for this event.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {event.time || 'All Day'}
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium col-span-2">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <div className="px-5 pb-5 mt-auto">
                {isUpcoming ? (
                    <Button
                        variant="gradient"
                        className="w-full group/btn"
                        onClick={onRegister}
                        disabled={event.stopRegistration || event.isCompleted}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {event.stopRegistration || event.isCompleted ? (
                                <><Ban className="h-4 w-4" /> Registration Closed</>
                            ) : (
                                <>
                                    <span>Register Interest</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                </>
                            )}
                        </div>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full group/btn"
                        asChild
                        disabled={!event.highlightsLink}
                    >
                        <a href={event.highlightsLink} target="_blank" rel="noopener noreferrer">
                            <div className="flex items-center justify-center gap-2">
                                <span>View Highlights</span>
                                {event.highlightsLink ? (
                                    <ExternalLink className="h-4 w-4" />
                                ) : (
                                    <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>
                                )}
                            </div>
                        </a>
                    </Button>
                )}
            </div>
        </Card>
    );
}

function EventRegistrationDialog({ open, onOpenChange, event }: { open: boolean; onOpenChange: (open: boolean) => void; event: any }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        program: '',
        comments: ''
    });

    // Reset form when dialog opens/closes or event changes
    if (!open && (formData.name || formData.email)) {
        // Optional: clear form on close if desired, strictly handled in useEffect usually
    }

    const { user } = useAuth();

    const registerMutation = useMutation({
        mutationFn: (data: any) => api.registerEvent(event._id || event.id, data),
        onSuccess: () => {
            // Invalidate events query to refresh registration counts/lists
            queryClient.invalidateQueries({ queryKey: ['events'] });

            toast({
                title: "Registration Successful!",
                description: `You have registered for ${event?.title}. Check your email for details.`,
            });
            onOpenChange(false);
            setFormData({ name: '', email: '', program: '', comments: '' });
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

        registerMutation.mutate({
            userId: user.id || user._id,
            name: formData.name,
            email: formData.email,
            program: formData.program,
            comments: formData.comments
        });
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Register for {event.title}</DialogTitle>
                    <DialogDescription>
                        Fill in your details to register your interest for this event.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="john@college.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="program">Program / Activity Interest</Label>
                        <Select
                            value={formData.program}
                            onValueChange={(val) => setFormData({ ...formData, program: val })}
                        >
                            <SelectTrigger id="program">
                                <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                            <SelectContent>
                                {event.programs && event.programs.length > 0 ? (
                                    <>
                                        {event.programs.map((prog: string, idx: number) => (
                                            <SelectItem key={idx} value={prog}>
                                                {prog}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="General">General Interest</SelectItem>
                                    </>
                                ) : (
                                    <SelectItem value="General">General Interest</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Specify which program or activity you are interested in.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comments">Additional Comments (Optional)</Label>
                        <Textarea
                            id="comments"
                            placeholder="Any questions or special requirements?"
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full sm:w-auto">Confirm Registration</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
