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
        winners: [] as { name: string; position: string; prize: string }[],
        location: '',
        duration: '',
        participantCount: '',
        scope: 'Club',
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
        xpReward: 50
    });
    const [newProgram, setNewProgram] = useState('');

    const [allClubs, setAllClubs] = useState<any[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [newChiefGuest, setNewChiefGuest] = useState({ name: '', designation: '' });
    const [newWinner, setNewWinner] = useState({ name: '', position: '', prize: '' });
    const [newCompetition, setNewCompetition] = useState('');

    // Active Announcements Viewing
    const [viewRegistrationsEvent, setViewRegistrationsEvent] = useState<any>(null);
    const [isViewRegistrationsOpen, setIsViewRegistrationsOpen] = useState(false);

    const { data: allEvents = [] } = useQuery({
        queryKey: ['events', user?.college],
        queryFn: () => api.getEvents(user?.college || ''),
    });

    const activeAnnouncements = allEvents.filter((event: any) =>
        event.clubId === (club._id || club.id) && !event.isCompleted
    );

    useEffect(() => {
        api.getClubs().then(setAllClubs).catch(console.error);
    }, []);

    const updateClubMutation = useMutation({
        mutationFn: (data: any) => api.updateClub(club._id || club.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clubs'] });
            queryClient.invalidateQueries({ queryKey: ['college-clubs'] });
            queryClient.invalidateQueries({ queryKey: ['my-club'] });
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
                    title: eventReport.title,
                    date: eventReport.date,
                    description: eventReport.description,
                    location: eventReport.location,
                    type: eventReport.type,
                    coverImage: eventReport.coverImage,
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
                driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club',
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
            participantCount: parseInt(eventReport.participantCount) || 0
        };

        if (completingEventId) {
            completeEventMutation.mutate(newItem);
        } else if (editingId) {
            const updatedHistory = history.map((item: any) =>
                item._id === editingId ? { ...newItem, _id: editingId } : item
            );
            updateClubMutation.mutate({ history: updatedHistory }, {
                onSuccess: () => {
                    setIsAddingEvent(false);
                    setEditingId(null);
                    setEventReport({
                        title: '', date: '', type: 'event', description: '', link: '',
                        organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
                        driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club',
                        coverImage: ''
                    });
                }
            });
        } else {
            const updatedHistory = [...history, { ...newItem, _id: Date.now().toString() }];
            updateClubMutation.mutate({ history: updatedHistory }, {
                onSuccess: () => {
                    setIsAddingEvent(false);
                    setEditingId(null);
                    setEventReport({
                        title: '', date: '', type: 'event', description: '', link: '',
                        organizingClub: club?.name || '', collaboratingClubs: [], chiefGuests: [], competitions: [],
                        driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club',
                        coverImage: ''
                    });
                }
            });
        }
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
            driveLink: item.driveLink || '',
            winners: item.winners || [],
            location: item.location || '',
            duration: item.duration || '',
            participantCount: item.participantCount?.toString() || '',
            scope: item.scope || 'Club',
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
            driveLink: '', winners: [], location: '', duration: '', participantCount: '', scope: 'Club',
            coverImage: ''
        });
    };

    const handleDeleteHistory = (id: string) => {
        const updatedHistory = history.filter((h: any) => h._id !== id);
        updateClubMutation.mutate({ history: updatedHistory });
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
                college: user?.college
            });
            toast({ title: 'Event announced successfully!' });
            setIsAnnouncingEvent(false);
            setAnnouncement({
                title: '', date: '', type: 'meetup', description: '', location: '',
                coverImage: '', programs: [], xpReward: 50
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
                                <Label>Date</Label>
                                <Input
                                    type="date"
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
                                <Label>XP Reward for Participating</Label>
                                <Input
                                    type="number"
                                    value={announcement.xpReward}
                                    onChange={(e) => setAnnouncement({ ...announcement, xpReward: parseInt(e.target.value) || 0 })}
                                />
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
                                    value={eventReport.organizingClub}
                                    onChange={(e) => setEventReport({ ...eventReport, organizingClub: e.target.value })}
                                    placeholder="Club Name"
                                />
                            </div>
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
                                        <SelectItem value="Club">Club Level</SelectItem>
                                        <SelectItem value="College">College Level</SelectItem>
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
                                                {allClubs.filter(c => c.name !== club.name && !eventReport.collaboratingClubs.includes(c.name)).map((c: any) => (
                                                    <CommandItem
                                                        key={c._id || c.id}
                                                        value={c.name}
                                                        onSelect={(currentValue) => {
                                                            setEventReport({
                                                                ...eventReport,
                                                                collaboratingClubs: [...eventReport.collaboratingClubs, currentValue]
                                                            });
                                                            setOpenCombobox(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={
                                                                eventReport.collaboratingClubs.includes(c.name)
                                                                    ? "mr-2 h-4 w-4 opacity-100"
                                                                    : "mr-2 h-4 w-4 opacity-0"
                                                            }
                                                        />
                                                        {c.name}
                                                    </CommandItem>
                                                ))}
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

                        <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                            <Label className="flex items-center gap-2 mb-2"><Trophy className="h-4 w-4 text-purple-500" /> Competitions Held</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Competition Name (e.g. Coding Quiz)"
                                    value={newCompetition}
                                    onChange={(e) => setNewCompetition(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (newCompetition.trim()) {
                                                setEventReport({
                                                    ...eventReport,
                                                    competitions: [...eventReport.competitions, newCompetition.trim()]
                                                });
                                                setNewCompetition('');
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    disabled={!newCompetition.trim()}
                                    onClick={() => {
                                        if (newCompetition.trim()) {
                                            setEventReport({
                                                ...eventReport,
                                                competitions: [...eventReport.competitions, newCompetition.trim()]
                                            });
                                            setNewCompetition('');
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {eventReport.competitions.map((comp, idx) => (
                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                                        {comp}
                                        <Button
                                            variant="ghost"
                                            className="h-4 w-4 p-0 ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => {
                                                const newComps = [...eventReport.competitions];
                                                newComps.splice(idx, 1);
                                                setEventReport({ ...eventReport, competitions: newComps });
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                            <Label className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-amber-500" /> Winners</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    placeholder="Winner Name"
                                    value={newWinner.name}
                                    onChange={(e) => setNewWinner({ ...newWinner, name: e.target.value })}
                                />
                                <Input
                                    placeholder="Position (1st)"
                                    value={newWinner.position}
                                    onChange={(e) => setNewWinner({ ...newWinner, position: e.target.value })}
                                />
                                <Input
                                    placeholder="Prize (Gold)"
                                    value={newWinner.prize}
                                    onChange={(e) => setNewWinner({ ...newWinner, prize: e.target.value })}
                                />
                            </div>
                            <Button
                                type="button"
                                className="w-full mt-2"
                                variant="secondary"
                                disabled={!newWinner.name}
                                onClick={() => {
                                    if (newWinner.name) {
                                        setEventReport({
                                            ...eventReport,
                                            winners: [...eventReport.winners, newWinner]
                                        });
                                        setNewWinner({ name: '', position: '', prize: '' });
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Winner
                            </Button>

                            <div className="space-y-2 mt-3">
                                {eventReport.winners.map((winner, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-card p-2 rounded border text-sm">
                                        <div className="flex gap-2 items-center">
                                            <Trophy className="h-3 w-3 text-gold" />
                                            <span className="font-medium">{winner.name}</span>
                                            <span className="text-muted-foreground">- {winner.position}</span>
                                            {winner.prize && <Badge variant="outline" className="text-[10px] h-5">{winner.prize}</Badge>}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => {
                                                const newWinners = [...eventReport.winners];
                                                newWinners.splice(idx, 1);
                                                setEventReport({ ...eventReport, winners: newWinners });
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
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
                                        disabled={updateEventMutation.isPending}
                                    >
                                        <Save className="h-5 w-5 mr-2" /> Update Event
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
                                        onClick={handleAddEventReport}
                                        disabled={completeEventMutation.isPending}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" /> End Event
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold"
                                    onClick={handleAddEventReport}
                                    disabled={updateClubMutation.isPending}
                                >
                                    <Save className="h-5 w-5 mr-2" /> {editingId ? 'Update Event Report' : 'Save Event Report'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
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

                                            <div className="flex justify-between items-center pt-2 mt-auto border-t border-purple-50/50">
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

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={ann.stopRegistration ? "h-8 text-xs font-bold text-green-600 border-green-200 hover:bg-green-50" : "h-8 text-xs font-bold text-amber-600 border-amber-200 hover:bg-amber-50"}
                                                        onClick={() => stopRegistrationMutation.mutate({ id: ann._id, stop: !ann.stopRegistration })}
                                                    >
                                                        {ann.stopRegistration ? (
                                                            <><RefreshCw className="h-3 w-3 mr-1" /> Resume Reg</>
                                                        ) : (
                                                            <><Ban className="h-3 w-3 mr-1" /> Stop Reg</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
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
                                                                scope: 'Club',
                                                                coverImage: ann.coverImage || ''
                                                            });
                                                            setIsAddingEvent(true);
                                                        }}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Complete Event
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button onClick={() => setIsAnnouncingEvent(true)} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12">
                            <Megaphone className="h-5 w-5 mr-2" /> Announce a New Event
                        </Button>
                        <Button onClick={() => setIsAddingEvent(true)} className="flex-1 border-dashed h-12" variant="outline">
                            <Plus className="h-5 w-5 mr-2" /> Add Detailed Event Report
                        </Button>
                    </div>
                </>
            )}

            <EventRegistrationsDialog
                open={isViewRegistrationsOpen}
                onOpenChange={setIsViewRegistrationsOpen}
                event={viewRegistrationsEvent}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {history.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground italic text-sm bg-muted/20 rounded-xl border-2 border-dashed">
                        No events recorded yet.
                    </div>
                ) : (
                    history.map((item: any) => (
                        <Card key={item._id} className="group relative overflow-hidden flex flex-col h-full hover:shadow-lg transition-all border-0 ring-1 ring-border bg-card/50 backdrop-blur-sm">
                            {/* Image Header */}
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                <img
                                    src={item.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 bg-white/90 hover:bg-white text-purple-600"
                                        onClick={() => {
                                            const matchedEvent = allEvents.find((e: any) =>
                                                e.title.toLowerCase() === item.title.toLowerCase()
                                            );
                                            setViewRegistrationsEvent(matchedEvent || item);
                                            setIsViewRegistrationsOpen(true);
                                        }}
                                        title="See Registrations"
                                    >
                                        <Users className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 bg-white/90 hover:bg-white text-blue-600"
                                        onClick={() => handleEditClick(item)}
                                        title="Edit Report"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 bg-white/90 hover:bg-white text-destructive"
                                        onClick={() => handleDeleteHistory(item._id)}
                                        disabled={updateClubMutation.isPending}
                                        title="Delete Report"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                                    <Badge className="bg-blue-600 text-white border-0 uppercase text-[10px] font-bold">
                                        {item.type}
                                    </Badge>
                                    {item.scope && (
                                        <Badge className="bg-amber-600 text-white border-0 uppercase text-[10px] font-bold">
                                            {item.scope}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                                    </div>
                                    <h5 className="font-bold text-xl leading-tight text-foreground group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h5>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {item.description}
                                </p>

                                <div className="grid grid-cols-2 gap-3 py-3 border-y text-xs text-muted-foreground">
                                    {item.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                                            <span className="truncate">{item.location}</span>
                                        </div>
                                    )}
                                    {item.duration && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            <span>{item.duration}</span>
                                        </div>
                                    )}
                                    {item.participantCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-green-500" />
                                            <span>{item.participantCount}+ attendees</span>
                                        </div>
                                    )}
                                    {item.driveLink && (
                                        <a href={item.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-bold">
                                            <ExternalLink className="h-3.5 w-3.5" /> Highlights
                                        </a>
                                    )}
                                </div>

                                {(item.chiefGuests?.length > 0 || item.winners?.length > 0) && (
                                    <div className="space-y-3 pt-1">
                                        {item.chiefGuests?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.chiefGuests.map((g: any, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="text-[10px] font-normal border-blue-200 bg-blue-50/50">
                                                        <Crown className="h-2.5 w-2.5 mr-1 text-amber-500" />
                                                        {g.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {item.winners?.length > 0 && (
                                            <div className="space-y-2">
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
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
