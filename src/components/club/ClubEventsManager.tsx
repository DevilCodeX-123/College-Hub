import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Plus,
    Save,
    Trash2,
    XCircle,
    Calendar,
    MapPin,
    Link as LinkIcon,
    Award,
    Trophy,
    Crown,
    Users,
    Check,
    ChevronsUpDown,
    X,
    Clock,
    Edit,
    Image as ImageIcon,
    ExternalLink,
    Megaphone,
    CheckCircle,
    Ban,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { EventRegistrationsDialog } from '@/components/events/EventRegistrationsDialog';

interface ClubEventsManagerProps {
    club: any;
}

export function ClubEventsManager({ club }: ClubEventsManagerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const history = club?.history || [];

    // Event Report Detailed State
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [eventReport, setEventReport] = useState({
        title: '',
        date: '',
        type: 'meetup',
        description: '',
        link: '',
        organizingClub: club?.name || '',
        collaboratingClubs: [] as string[],
        chiefGuests: [] as { name: string; designation: string }[],
        competitions: [] as string[],
        driveLink: '',
        winners: [] as { name: string; position: string; prize: string; competition?: string }[],
        location: '',
        duration: '',
        participantCount: '',
        scope: 'Club Level',
        coverImage: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [completingEventId, setCompletingEventId] = useState<string | null>(null);
    const { user } = useAuth();

    // Upcoming Event Announcement State
    const [isAnnouncingEvent, setIsAnnouncingEvent] = useState(false);
    const [announcement, setAnnouncement] = useState({
        title: '',
        date: '',
        type: 'meetup',
        description: '',
        location: '',
        coverImage: '',
        programs: [] as string[],
        xpReward: 50,
        paymentQRCode: '',
        paymentAmountIndividual: '',
        paymentAmountTeam: ''
    });
    const [newProgram, setNewProgram] = useState('');

    const [allClubs, setAllClubs] = useState<any[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [newChiefGuest, setNewChiefGuest] = useState({ name: '', designation: '' });
    const [newWinner, setNewWinner] = useState({ name: '', position: '', prize: '' });
    const [newCompetition, setNewCompetition] = useState('');
    const [groupedComp, setGroupedComp] = useState({
        name: '',
        individualWinners: [
            { position: '1st', name: '', prize: '' },
            { position: '2nd', name: '', prize: '' },
            { position: '3rd', name: '', prize: '' }
        ],
        teamWinners: [
            { position: '1st', name: '', prize: '' },
            { position: '2nd', name: '', prize: '' },
            { position: '3rd', name: '', prize: '' }
        ]
    });

    // Active Announcements Viewing
    const [viewRegistrationsEvent, setViewRegistrationsEvent] = useState<any>(null);
    const [isViewRegistrationsOpen, setIsViewRegistrationsOpen] = useState(false);

    const { data: allEvents = [] } = useQuery({
        queryKey: ['events', user?.college],
        queryFn: () => api.getEvents(user?.college || ''),
    });

    // Fetch registrations for the completing event to populate dropdowns
    const [completingEventRegistrations, setCompletingEventRegistrations] = useState<any[]>([]);

    useEffect(() => {
        if (completingEventId) {
            const ev = allEvents.find((e: any) => e._id === completingEventId || e.id === completingEventId);
            if (ev && ev.registrations) {
                setCompletingEventRegistrations(ev.registrations);
                // Auto-fill and lock participant count if registrations exist
                if (ev.registrations.length > 0) {
                    setEventReport(prev => ({
                        ...prev,
                        participantCount: ev.registrations.length.toString()
                    }));
                }
            } else {
                setCompletingEventRegistrations([]);
            }
        }
    }, [completingEventId, allEvents]);

    const activeAnnouncements = (allEvents || []).filter((event: any) =>
        event && event.clubId === (club?._id || club?.id) && !event.isCompleted
    );

    const pastEvents = (allEvents || []).filter((event: any) =>
        event && event.clubId === (club?._id || club?.id) && event.isCompleted
    );

    useEffect(() => {
        api.getClubs(user?.college).then(setAllClubs).catch(console.error);
    }, [user?.college]);

    const updateClubMutation = useMutation({
        mutationFn: (data: any) => api.updateClub(club._id || club.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast({ title: 'Club updated successfully!' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update club',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    });

    const stopRegistrationMutation = useMutation({
        mutationFn: ({ id, stop }: { id: string, stop: boolean }) => api.updateEvent(id, { stopRegistration: stop }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast({ title: 'Registration status updated' });
        }
    });

    const updateEventMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.updateEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast({ title: 'Event updated successfully' });
        }
    });

    const handleUpdateActiveEvent = () => {
        if (completingEventId) {
            updateEventMutation.mutate({
                id: completingEventId,
                data: {
                    ...eventReport,
                    organizingClub: club.name, // Ensure it's always the current club
                    highlightsLink: eventReport.driveLink, // Map for backend compatibility
                    participantCount: parseInt(eventReport.participantCount) || 0
                }
            });
        }
    };

    const completeEventMutation = useMutation({
        mutationFn: (data: any) => api.completeEvent(completingEventId!, {
            reportData: data,
            coordinatorId: user?.id || user?._id
        }),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            setIsAddingEvent(false);
            setCompletingEventId(null);
            setEventReport({
                title: '', date: '', type: 'meetup', description: '', link: '',
                organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
                driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club Level',
                coverImage: ''
            });
            toast({
                title: 'Event Completed successfully!',
                description: `Saved to history. Awarded ${res.awardedPoints} points to club. Rating poll generated.`,
                className: "bg-green-50 border-green-200"
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to complete event',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    });

    const deleteEventMutation = useMutation({
        mutationFn: (id: string) => api.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
            toast({ title: 'Event record deleted permanently' });
        },
        onError: (error: any) => {
            toast({
                title: 'Deletion failed',
                description: error.response?.data?.message || 'Unauthorized or server error',
                variant: 'destructive'
            });
        }
    });

    const createEventManualMutation = useMutation({
        mutationFn: (data: any) => api.createEvent({
            ...data,
            clubId: club._id || club.id,
            clubName: club.name,
            college: user?.college,
            isCompleted: true,
            stopRegistration: true
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
        }
    });

    const handleAddEventReport = () => {
        if (!eventReport.title || !eventReport.date) {
            toast({
                title: "Missing Information",
                description: "Title and Date are required.",
                variant: "destructive"
            });
            return;
        }

        const newItem = {
            ...eventReport,
            organizingClub: club.name, // Ensure it's always the host club
            highlightsLink: eventReport.driveLink, // Map for backend compatibility
            participantCount: parseInt(eventReport.participantCount) || 0
        };

        if (completingEventId) {
            completeEventMutation.mutate(newItem);
        } else if (editingId) {
            // 1. Update the Event document in the Global Registry
            updateEventMutation.mutate({ id: editingId, data: newItem });

            // 2. Keep the legacy club history in sync
            const updatedHistory = history.map((item: any) =>
                item._id === editingId ? { ...newItem, _id: editingId } : item
            );
            updateClubMutation.mutate({ history: updatedHistory }, {
                onSuccess: () => {
                    setIsAddingEvent(false);
                    setEditingId(null);
                    setEventReport({
                        title: '', date: '', type: 'meetup', description: '', link: '',
                        organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
                        driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club Level',
                        coverImage: ''
                    });
                }
            });
        } else {
            // Manual entry - create in global registry AND club history
            createEventManualMutation.mutate(newItem);

            const updatedHistory = [...history, { ...newItem, _id: Date.now().toString() }];
            updateClubMutation.mutate({ history: updatedHistory }, {
                onSuccess: () => {
                    setIsAddingEvent(false);
                    setEditingId(null);
                    setEventReport({
                        title: '', date: '', type: 'meetup', description: '', link: '',
                        organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
                        driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club Level',
                        coverImage: ''
                    });
                    toast({ title: 'Event record saved successfully!' });
                }
            });
        }
    };

    const handleAddGroupedCompetition = () => {
        if (!groupedComp.name.trim()) return toast({ title: "Please enter competition name" });

        const winnersToAdd = [
            ...groupedComp.individualWinners
                .filter(w => w.name.trim() !== '')
                .map(w => ({ ...w, competition: groupedComp.name.trim(), isTeam: false })),
            ...groupedComp.teamWinners
                .filter(w => w.name.trim() !== '')
                .map(w => ({ ...w, competition: groupedComp.name.trim(), isTeam: true }))
        ];

        if (winnersToAdd.length === 0) return toast({ title: "Please add at least one winner" });

        setEventReport(prev => ({
            ...prev,
            competitions: [...prev.competitions, groupedComp.name.trim()],
            winners: [...prev.winners, ...winnersToAdd]
        }));

        setGroupedComp({
            name: '',
            individualWinners: [
                { position: '1st', name: '', prize: '' },
                { position: '2nd', name: '', prize: '' },
                { position: '3rd', name: '', prize: '' }
            ],
            teamWinners: [
                { position: '1st', name: '', prize: '' },
                { position: '2nd', name: '', prize: '' },
                { position: '3rd', name: '', prize: '' }
            ]
        });
        toast({ title: 'Competition and winners added!' });
    };

    const handleEditClick = (item: any) => {
        setEditingId(item._id);
        setEventReport({
            title: item.title || '',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            type: item.type || 'meetup',
            description: item.description || '',
            link: item.link || '',
            organizingClub: item.organizingClub || club?.name || '',
            collaboratingClubs: item.collaboratingClubs || [],
            chiefGuests: item.chiefGuests || [],
            competitions: item.competitions || [],
            driveLink: item.driveLink || item.highlightsLink || '',
            winners: item.winners || [],
            location: item.location || '',
            duration: item.duration || '',
            participantCount: item.participantCount?.toString() || '',
            scope: item.scope === 'Club' ? 'Club Level' : (item.scope || 'Club Level'),
            coverImage: item.coverImage || ''
        });
        setIsAddingEvent(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setIsAddingEvent(false);
        setEditingId(null);
        setCompletingEventId(null);
        setEventReport({
            title: '', date: '', type: 'meetup', description: '', link: '',
            organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
            driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club Level',
            coverImage: ''
        });
    };

    const handleDeleteHistory = (id: string) => {
        if (window.confirm("Are you absolutely sure you want to delete this event record? This action is permanent and will remove the record from both the club history and the global events registry.")) {
            // 1. Delete the Event document from the registry
            deleteEventMutation.mutate(id);

            // 2. Remove from the Club's internal history array if it exists there
            const updatedHistory = history.filter((h: any) => h._id !== id);
            updateClubMutation.mutate({ history: updatedHistory });
        }
    };

    const handleAnnounceEvent = async () => {
        if (!announcement.title || !announcement.date) {
            toast({
                title: "Missing Information",
                description: "Title and Date are required.",
                variant: "destructive"
            });
            return;
        }

        try {
            await api.createEvent({
                ...announcement,
                clubId: club._id || club.id,
                clubName: club.name,
                college: user?.college,
                paymentAmountIndividual: announcement.paymentAmountIndividual ? parseInt(announcement.paymentAmountIndividual) : undefined,
                paymentAmountTeam: announcement.paymentAmountTeam ? parseInt(announcement.paymentAmountTeam) : undefined
            });
            toast({ title: 'Event announced successfully!' });
            setIsAnnouncingEvent(false);
            setAnnouncement({
                title: '', date: '', type: 'meetup', description: '', location: '',
                coverImage: '', programs: [], xpReward: 50,
                paymentQRCode: '', paymentAmountIndividual: '', paymentAmountTeam: ''
            });
        } catch (error: any) {
            toast({
                title: 'Announcement failed',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-6">
            {isAnnouncingEvent ? (
                <Card className="bg-purple-50/50 border-purple-100">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-6 w-6 text-purple-600" />
                                <h4 className="font-bold text-xl text-purple-900">Announce Upcoming Event</h4>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsAnnouncingEvent(false)}><XCircle className="h-5 w-5" /></Button>
                        </div>

                        <p className="text-sm text-purple-600 font-medium">This will show up in the global events page for all students to see and register.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Event Title</Label>
                                <Input
                                    value={announcement.title}
                                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                    placeholder="e.g. Workshop on AI"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Event Type</Label>
                                <Select
                                    value={announcement.type}
                                    onValueChange={(val) => setAnnouncement({ ...announcement, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="workshop">Workshop</SelectItem>
                                        <SelectItem value="competition">Competition</SelectItem>
                                        <SelectItem value="meetup">Meetup</SelectItem>
                                        <SelectItem value="hackathon">Hackathon</SelectItem>
                                        <SelectItem value="cultural">Cultural</SelectItem>
                                        <SelectItem value="sports">Sports</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={announcement.date}
                                    onChange={(e) => setAnnouncement({ ...announcement, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location / Venue</Label>
                                <Input
                                    value={announcement.location}
                                    onChange={(e) => setAnnouncement({ ...announcement, location: e.target.value })}
                                    placeholder="e.g. Room 101 or Online"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={announcement.description}
                                onChange={(e) => setAnnouncement({ ...announcement, description: e.target.value })}
                                placeholder="What is this event about?"
                            />
                        </div>

                        <div className="space-y-4 border rounded-md p-3 bg-white">
                            <Label className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-blue-500" /> Programs / Schedule</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Keynote Speech"
                                    value={newProgram}
                                    onChange={(e) => setNewProgram(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (newProgram.trim()) {
                                                setAnnouncement({
                                                    ...announcement,
                                                    programs: [...announcement.programs, newProgram.trim()]
                                                });
                                                setNewProgram('');
                                            }
                                        }
                                    }}
                                />
                                <Button size="icon" variant="ghost" onClick={() => {
                                    if (newProgram.trim()) {
                                        setAnnouncement({ ...announcement, programs: [...announcement.programs, newProgram.trim()] });
                                        setNewProgram('');
                                    }
                                }}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {announcement.programs.map((p, idx) => (
                                    <Badge key={idx} variant="outline" className="flex items-center gap-1 border-blue-200">
                                        {p}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => {
                                            const filtered = announcement.programs.filter((_, i) => i !== idx);
                                            setAnnouncement({ ...announcement, programs: filtered });
                                        }} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Poster Image URL</Label>
                                <Input
                                    value={announcement.coverImage}
                                    onChange={(e) => setAnnouncement({ ...announcement, coverImage: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    XP Reward
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Standard Attendance</span>
                                </Label>
                                <Input
                                    type="number"
                                    value={100}
                                    readOnly
                                    className="bg-muted font-bold"
                                />
                            </div>
                        </div>

                        {/* Payment Configuration (Optional) */}
                        <div className="space-y-3 border-2 border-dashed border-amber-200 rounded-lg p-4 bg-amber-50/30">
                            <Label className="flex items-center gap-2 text-amber-700 font-bold">
                                💳 Payment Configuration (Optional)
                            </Label>
                            <p className="text-xs text-amber-600">If payment is required, add QR code and amounts below. Leave blank for free events.</p>

                            <div className="space-y-2">
                                <Label className="text-xs">Payment QR Code URL</Label>
                                <Input
                                    value={announcement.paymentQRCode}
                                    onChange={(e) => setAnnouncement({ ...announcement, paymentQRCode: e.target.value })}
                                    placeholder="https://your-qr-code-image-url.png"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Amount for Individual (₹)</Label>
                                    <Input
                                        type="number"
                                        value={announcement.paymentAmountIndividual}
                                        onChange={(e) => setAnnouncement({ ...announcement, paymentAmountIndividual: e.target.value })}
                                        placeholder="e.g. 100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Amount for Team (₹)</Label>
                                    <Input
                                        type="number"
                                        value={announcement.paymentAmountTeam}
                                        onChange={(e) => setAnnouncement({ ...announcement, paymentAmountTeam: e.target.value })}
                                        placeholder="e.g. 300"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-bold" onClick={handleAnnounceEvent}>
                            <Megaphone className="h-5 w-5 mr-2" /> Broadcast Announcement
                        </Button>
                    </CardContent>
                </Card>
            ) : isAddingEvent ? (
                <Card className="bg-muted/30">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-lg">{editingId ? 'Edit Event Report' : 'New Event Report'}</h4>
                            <Button variant="ghost" size="sm" onClick={handleCancel}><XCircle className="h-5 w-5" /></Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Event Title</Label>
                                <Input
                                    value={eventReport.title}
                                    onChange={(e) => setEventReport({ ...eventReport, title: e.target.value })}
                                    placeholder="e.g. Annual Tech Fest"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={eventReport.date}
                                    onChange={(e) => setEventReport({ ...eventReport, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input
                                    value={eventReport.duration}
                                    onChange={(e) => setEventReport({ ...eventReport, duration: e.target.value })}
                                    placeholder="e.g. 10 AM - 5 PM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={eventReport.location}
                                    onChange={(e) => setEventReport({ ...eventReport, location: e.target.value })}
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Organized By</Label>
                                <Input
                                    value={club.name}
                                    readOnly
                                    className="bg-slate-50 border-2 font-black text-primary pointer-events-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Participant Count {completingEventId && completingEventRegistrations.length > 0 && <span className="text-emerald-600 text-[10px] ml-2">(Verified)</span>}</Label>
                                <Input
                                    value={completingEventId && completingEventRegistrations.length > 0 ? completingEventRegistrations.length.toString() : eventReport.participantCount}
                                    readOnly={!!(completingEventId && completingEventRegistrations.length > 0)}
                                    onChange={(e) => setEventReport({ ...eventReport, participantCount: e.target.value })}
                                    className={`${completingEventId && completingEventRegistrations.length > 0 ? 'bg-slate-100 font-bold text-slate-600 cursor-not-allowed' : ''}`}
                                    placeholder="Approx count"
                                />
                                {completingEventId && completingEventRegistrations.length > 0 && (
                                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                        Locked to verified registrations
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scope</Label>
                                <Select
                                    value={eventReport.scope}
                                    onValueChange={(val) => setEventReport({ ...eventReport, scope: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Club Level">Club Level</SelectItem>
                                        <SelectItem value="College Level">College Level</SelectItem>
                                        <SelectItem value="Inter-College">Inter-College</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>Collaborating Clubs (Optional)</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
                                    >
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {eventReport.collaboratingClubs.length > 0 ? (
                                                eventReport.collaboratingClubs.map((clubName) => (
                                                    <Badge key={clubName} variant="secondary" className="mr-1 mb-1">
                                                        {clubName}
                                                        <div
                                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    setEventReport({
                                                                        ...eventReport,
                                                                        collaboratingClubs: eventReport.collaboratingClubs.filter((c) => c !== clubName)
                                                                    });
                                                                }
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                            onClick={() => {
                                                                setEventReport({
                                                                    ...eventReport,
                                                                    collaboratingClubs: eventReport.collaboratingClubs.filter((c) => c !== clubName)
                                                                });
                                                            }}
                                                        >
                                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                        </div>
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground font-normal">Select clubs...</span>
                                            )}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search clubs..." />
                                        <CommandEmpty>No club found.</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {(allClubs || []).filter(c => c && c.name !== club?.name).map((c: any) => {
                                                    const isSelected = eventReport.collaboratingClubs?.includes(c.name);
                                                    return (
                                                        <CommandItem
                                                            key={c._id || c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                const newCollaborators = isSelected
                                                                    ? eventReport.collaboratingClubs.filter(name => name !== c.name)
                                                                    : [...eventReport.collaboratingClubs, c.name];
                                                                setEventReport({
                                                                    ...eventReport,
                                                                    collaboratingClubs: newCollaborators
                                                                });
                                                            }}
                                                        >
                                                            <Check
                                                                className={
                                                                    isSelected ? "mr-2 h-4 w-4 opacity-100 text-primary" : "mr-2 h-4 w-4 opacity-0"
                                                                }
                                                            />
                                                            <span className={isSelected ? "font-bold text-primary" : ""}>{c.name}</span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                            <Label className="flex items-center gap-2 mb-2"><Crown className="h-4 w-4 text-gold" /> Chief Guests</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Name"
                                    value={newChiefGuest.name}
                                    onChange={(e) => setNewChiefGuest({ ...newChiefGuest, name: e.target.value })}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Designation"
                                    value={newChiefGuest.designation}
                                    onChange={(e) => setNewChiefGuest({ ...newChiefGuest, designation: e.target.value })}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    disabled={!newChiefGuest.name}
                                    onClick={() => {
                                        if (newChiefGuest.name) {
                                            setEventReport({
                                                ...eventReport,
                                                chiefGuests: [...eventReport.chiefGuests, newChiefGuest]
                                            });
                                            setNewChiefGuest({ name: '', designation: '' });
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {eventReport.chiefGuests.map((guest, idx) => (
                                    <Badge key={idx} variant="outline" className="flex items-center gap-1 pl-2 pr-1 py-1">
                                        <span className="font-semibold">{guest.name}</span>
                                        {guest.designation && <span className="text-muted-foreground ml-1">({guest.designation})</span>}
                                        <Button
                                            variant="ghost"
                                            className="h-4 w-4 p-0 ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => {
                                                const newGuests = [...eventReport.chiefGuests];
                                                newGuests.splice(idx, 1);
                                                setEventReport({ ...eventReport, chiefGuests: newGuests });
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Event Description & Highlights</Label>
                            <Textarea
                                value={eventReport.description}
                                onChange={(e) => setEventReport({ ...eventReport, description: e.target.value })}
                                placeholder="Detailed description of what happened..."
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-4 border-2 border-primary/10 rounded-xl p-5 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2 font-bold text-primary">
                                <Trophy className="h-5 w-5" /> Add Competition Result
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Competition Name</Label>
                                    <Input
                                        placeholder="e.g. Coding Competition, Dance Battle..."
                                        value={groupedComp.name}
                                        onChange={(e) => setGroupedComp({ ...groupedComp, name: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>

                                {/* Individual Winners Section */}
                                <div className="space-y-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-blue-700 flex items-center gap-2">
                                        👤 Individual Winners (Top 3)
                                    </Label>
                                    {groupedComp.individualWinners.map((w, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
                                            <div className="col-span-1 text-center font-black text-lg">
                                                {w.position === '1st' ? '🥇' : w.position === '2nd' ? '🥈' : '🥉'}
                                            </div>
                                            <div className="col-span-6">
                                                {completingEventId && completingEventRegistrations.length > 0 ? (
                                                    <Select
                                                        value={w.name}
                                                        onValueChange={(val) => {
                                                            const newWinners = [...groupedComp.individualWinners];
                                                            newWinners[idx].name = val;
                                                            setGroupedComp({ ...groupedComp, individualWinners: newWinners });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select Individual" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {completingEventRegistrations
                                                                .filter((reg: any) => !reg.teamMembers || reg.teamMembers.length === 0)
                                                                .map((reg: any) => {
                                                                    const isSelectedElsewhere = groupedComp.individualWinners.some((winner, winnerIdx) => winnerIdx !== idx && winner.name === reg.name);
                                                                    return (
                                                                        <SelectItem
                                                                            key={reg.userId || reg._id}
                                                                            value={reg.name}
                                                                            disabled={isSelectedElsewhere}
                                                                        >
                                                                            {reg.name} (Individual)
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        placeholder="Individual Name"
                                                        value={w.name}
                                                        onChange={(e) => {
                                                            const newWinners = [...groupedComp.individualWinners];
                                                            newWinners[idx].name = e.target.value;
                                                            setGroupedComp({ ...groupedComp, individualWinners: newWinners });
                                                        }}
                                                        className="h-8 text-sm"
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Prize (e.g. $100 / Gold)"
                                                    value={w.prize}
                                                    onChange={(e) => {
                                                        const newWinners = [...groupedComp.individualWinners];
                                                        newWinners[idx].prize = e.target.value;
                                                        setGroupedComp({ ...groupedComp, individualWinners: newWinners });
                                                    }}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Team Winners Section */}
                                <div className="space-y-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-purple-700 flex items-center gap-2">
                                        👥 Team Winners (Top 3)
                                    </Label>
                                    {groupedComp.teamWinners.map((w, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
                                            <div className="col-span-1 text-center font-black text-lg">
                                                {w.position === '1st' ? '🥇' : w.position === '2nd' ? '🥈' : '🥉'}
                                            </div>
                                            <div className="col-span-6">
                                                {completingEventId && completingEventRegistrations.length > 0 ? (
                                                    <Select
                                                        value={w.name}
                                                        onValueChange={(val) => {
                                                            const newWinners = [...groupedComp.teamWinners];
                                                            newWinners[idx].name = val;
                                                            setGroupedComp({ ...groupedComp, teamWinners: newWinners });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select Team Lead" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {completingEventRegistrations
                                                                .filter((reg: any) => reg.teamMembers && reg.teamMembers.length > 0)
                                                                .map((reg: any) => {
                                                                    const isSelectedElsewhere = groupedComp.teamWinners.some((winner, winnerIdx) => winnerIdx !== idx && winner.name === reg.name);
                                                                    return (
                                                                        <SelectItem
                                                                            key={reg.userId || reg._id}
                                                                            value={reg.name}
                                                                            disabled={isSelectedElsewhere}
                                                                        >
                                                                            {reg.name} (Team: {reg.teamMembers.length + 1} members)
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        placeholder="Team Lead Name"
                                                        value={w.name}
                                                        onChange={(e) => {
                                                            const newWinners = [...groupedComp.teamWinners];
                                                            newWinners[idx].name = e.target.value;
                                                            setGroupedComp({ ...groupedComp, teamWinners: newWinners });
                                                        }}
                                                        className="h-8 text-sm"
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Prize (e.g. $100 / Gold)"
                                                    value={w.prize}
                                                    onChange={(e) => {
                                                        const newWinners = [...groupedComp.teamWinners];
                                                        newWinners[idx].prize = e.target.value;
                                                        setGroupedComp({ ...groupedComp, teamWinners: newWinners });
                                                    }}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary font-bold border-2 border-primary/20 border-dashed"
                                    onClick={handleAddGroupedCompetition}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Competition to Report
                                </Button>
                            </div>

                            {/* Preview of added Results */}
                            {eventReport.competitions.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-primary/10">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-3 block">Current Results Preview</Label>
                                    <div className="space-y-3">
                                        {eventReport.competitions.map((compName) => {
                                            const compWinners = eventReport.winners.filter(w => w.competition === compName);
                                            return (
                                                <div key={compName} className="bg-white rounded-lg border p-3 shadow-sm">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-sm text-slate-700">{compName}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-red-400 hover:text-red-600"
                                                            onClick={() => {
                                                                setEventReport({
                                                                    ...eventReport,
                                                                    competitions: eventReport.competitions.filter(c => c !== compName),
                                                                    winners: eventReport.winners.filter(w => w.competition !== compName)
                                                                });
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {compWinners.length > 0 ? compWinners.map((w, i) => (
                                                            <Badge key={i} variant="outline" className="text-[10px] font-bold bg-slate-50">
                                                                {w.position}: {w.name}
                                                            </Badge>
                                                        )) : <span className="text-[10px] text-muted-foreground italic">No winners added</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-blue-500" /> Event Cover Image URL
                            </Label>
                            <Input
                                value={eventReport.coverImage}
                                onChange={(e) => setEventReport({ ...eventReport, coverImage: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-green-500" /> Google Drive Link (Photos/Videos)
                            </Label>
                            <Input
                                value={eventReport.driveLink}
                                onChange={(e) => setEventReport({ ...eventReport, driveLink: e.target.value })}
                                placeholder="https://drive.google.com/..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Participants</Label>
                                <Input
                                    type="number"
                                    value={eventReport.participantCount}
                                    onChange={(e) => setEventReport({ ...eventReport, participantCount: e.target.value })}
                                    placeholder="Approx count"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {completingEventId ? (
                                <>
                                    <Button
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 h-12 text-base font-bold"
                                        onClick={handleUpdateActiveEvent}
                                        disabled={updateEventMutation.isPending || completeEventMutation.isPending}
                                    >
                                        <Save className="h-5 w-5 mr-2" /> Update Event
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
                                        onClick={handleAddEventReport}
                                        disabled={completeEventMutation.isPending || updateEventMutation.isPending}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" /> End Event
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold"
                                    onClick={handleAddEventReport}
                                    disabled={updateClubMutation.isPending || updateEventMutation.isPending || createEventManualMutation.isPending}
                                >
                                    <Save className="h-5 w-5 mr-2" /> {editingId ? 'Update Event Report' : 'Save Event Report'}
                                </Button>
                            )}
                        </div>
                    </CardContent >
                </Card >
            ) : (
                <>
                    {/* Active Announcements Section */}
                    {activeAnnouncements.length > 0 && (
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Megaphone className="h-5 w-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-purple-900">Active Announcements</h3>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                    {activeAnnouncements.length} Live
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeAnnouncements.map((ann: any) => (
                                    <Card key={ann._id} className="group relative bg-white/50 border-purple-100/50 hover:shadow-lg transition-all overflow-hidden border-0 ring-1 ring-purple-100">
                                        {/* Announcement Image Header */}
                                        <div className="aspect-[16/7] w-full relative overflow-hidden bg-purple-50">
                                            <img
                                                src={ann.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                                                alt={ann.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                            {/* Status Badges on Image */}
                                            <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                                                {ann.stopRegistration && (
                                                    <Badge variant="destructive" className="bg-red-500/90 text-white border-0 text-[10px] font-bold shadow-sm">
                                                        <Ban className="h-2.5 w-2.5 mr-1" /> REG CLOSED
                                                    </Badge>
                                                )}
                                                <Badge className="bg-purple-600/90 text-white border-0 text-[10px] font-bold shadow-sm">
                                                    LIVE
                                                </Badge>
                                            </div>
                                        </div>

                                        <CardContent className="p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-purple-900 leading-tight text-lg group-hover:text-purple-700 transition-colors uppercase tracking-tight">{ann.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-purple-600/70 font-medium">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(ann.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-100 text-[10px] uppercase font-bold">
                                                    {ann.type}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 mt-auto border-t border-purple-50/50">
                                                <button
                                                    onClick={() => {
                                                        setViewRegistrationsEvent(ann);
                                                        setIsViewRegistrationsOpen(true);
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
                                                >
                                                    <Users className="h-4 w-4 text-purple-500" />
                                                    <span className="text-purple-900 underline decoration-purple-200 underline-offset-2">{ann.registrations?.length || 0}</span> Registered
                                                </button>

                                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={ann.stopRegistration ? "flex-1 sm:flex-none h-8 text-[10px] sm:text-xs font-bold text-green-600 border-green-200 hover:bg-green-50" : "flex-1 sm:flex-none h-8 text-[10px] sm:text-xs font-bold text-amber-600 border-amber-200 hover:bg-amber-50"}
                                                        onClick={() => stopRegistrationMutation.mutate({ id: ann._id, stop: !ann.stopRegistration })}
                                                    >
                                                        {ann.stopRegistration ? (
                                                            <><RefreshCw className="h-3 w-3 mr-1" /> Resume</>
                                                        ) : (
                                                            <><Ban className="h-3 w-3 mr-1" /> Stop Reg</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 sm:flex-none h-8 text-[10px] sm:text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setCompletingEventId(ann._id);
                                                            setEventReport({
                                                                title: ann.title || '',
                                                                date: ann.date ? new Date(ann.date).toISOString().split('T')[0] : '',
                                                                type: ann.type || 'meetup',
                                                                description: ann.description || '',
                                                                link: '',
                                                                organizingClub: club?.name || '',
                                                                collaboratingClubs: [],
                                                                chiefGuests: [],
                                                                competitions: [],
                                                                driveLink: '',
                                                                winners: [],
                                                                location: ann.location || '',
                                                                duration: '',
                                                                participantCount: (ann.registrations?.length || 0).toString(),
                                                                scope: 'Club Level',
                                                                coverImage: ann.coverImage || ''
                                                            });
                                                            setIsAddingEvent(true);
                                                        }}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Complete
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button onClick={() => setIsAnnouncingEvent(true)} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black h-11 text-xs uppercase tracking-widest">
                            <Megaphone className="h-4 w-4 mr-2" /> Announce New Event
                        </Button>
                        <Button onClick={() => setIsAddingEvent(true)} className="flex-1 border-dashed h-11 font-bold text-xs" variant="outline">
                            <Plus className="h-4 w-4 mr-2" /> Detailed Report
                        </Button>
                    </div>
                </>
            )
            }

            <EventRegistrationsDialog
                open={isViewRegistrationsOpen}
                onOpenChange={setIsViewRegistrationsOpen}
                event={viewRegistrationsEvent}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {pastEvents.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground italic text-sm bg-muted/20 rounded-xl border-2 border-dashed">
                        No events recorded yet.
                    </div>
                ) : (
                    pastEvents.map((item: any) => (
                        <Card key={item._id || item.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white ring-1 ring-slate-200">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Compact Poster */}
                                    <div className="w-full md:w-56 h-48 md:h-auto relative overflow-hidden bg-muted">
                                        <img
                                            src={item.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            <Badge className="bg-white/90 text-primary hover:bg-white border-none shadow-sm text-[9px] font-black uppercase">
                                                {item.type}
                                            </Badge>
                                            <Badge className="bg-emerald-500 text-white border-none shadow-sm text-[8px] font-black uppercase">
                                                Verified
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 p-5 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    <Calendar className="h-3 w-3 text-primary" />
                                                    {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                                                    {item.location && (
                                                        <>
                                                            <span className="opacity-30">•</span>
                                                            <MapPin className="h-3 w-3 text-primary" />
                                                            <span className="truncate max-w-[120px]">{item.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                                                {item.description || 'Verified record of achievement and participation.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-3">
                                                {item.duration && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                                        {item.duration}
                                                    </div>
                                                )}

                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 text-purple-600 rounded-full"
                                                    onClick={() => {
                                                        const matchedEvent = allEvents.find((e: any) =>
                                                            e.title.toLowerCase() === item.title.toLowerCase()
                                                        );
                                                        setViewRegistrationsEvent(matchedEvent || item);
                                                        setIsViewRegistrationsOpen(true);
                                                    }}
                                                >
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 rounded-full"
                                                    onClick={() => handleEditClick(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive rounded-full"
                                                    onClick={() => handleDeleteHistory(item._id)}
                                                    disabled={updateClubMutation.isPending || deleteEventMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            {/* Additional sections moved here */}
                            {(item.chiefGuests?.length > 0 || item.winners?.length > 0 || item.collaboratingClubs?.length > 0 || item.driveLink) && (
                                <div className="p-5 pt-0">
                                    {item.driveLink && (
                                        <a href={item.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-bold text-sm mb-3">
                                            <ExternalLink className="h-4 w-4 shrink-0" /> View Highlights
                                        </a>
                                    )}
                                    {item.chiefGuests?.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <Crown className="h-3 w-3 text-amber-500" /> Chief Guests
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.chiefGuests.map((g: any, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="text-[10px] font-normal border-blue-200 bg-blue-50/50">
                                                        {g.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {item.winners?.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                <Trophy className="h-3 w-3 text-amber-500" /> Winners
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {item.winners.map((winner: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between bg-amber-50/30 p-1.5 rounded border border-amber-100/50 text-xs">
                                                        <span className="font-bold text-amber-900 line-clamp-1">{winner.name}</span>
                                                        <Badge className="bg-amber-500 text-[9px] font-black h-4 px-1 leading-none">{winner.position}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {item.collaboratingClubs?.length > 0 && (
                                        <div className="mt-auto pt-3 border-t">
                                            <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <Users className="h-2.5 w-2.5" /> Powered By
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {item.collaboratingClubs.map((clubName: string, idx: number) => (
                                                    <Badge key={idx} variant="secondary" className="bg-zinc-100 text-zinc-600 text-[9px] font-bold border-0 h-4 px-1.5">
                                                        {clubName}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
}
