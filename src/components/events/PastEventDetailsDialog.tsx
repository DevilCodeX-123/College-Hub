import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Trophy,
    Calendar,
    MapPin,
    Clock,
    ExternalLink,
    Zap,
    Sparkles,
    History,
    Info,
    X,
    Users2
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PastEventDetailsDialogProps {
    event: any;
    children: React.ReactNode;
}

export function PastEventDetailsDialog({ event, children }: PastEventDetailsDialogProps) {
    const [open, setOpen] = useState(false);
    if (!event) return <>{children}</>;

    // Group winners by competition
    const groupedWinners = (Array.isArray(event.winners) ? event.winners : []).reduce((acc: any, winner: any) => {
        if (!winner) return acc;
        const comp = winner.competition || 'Other Achievements';
        if (!acc[comp]) acc[comp] = [];
        acc[comp].push(winner);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] bg-[#f8fafc]">
                {/* Official Report Container - Formal Paper Aesthetic */}
                <div className="bg-white m-0 sm:m-6 rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative transition-all">

                    {/* Official Record Stamp */}
                    <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Trophy className="h-64 w-64 text-blue-900" />
                    </div>

                    {/* 1. Header Section - Matches Row 1 of Input */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative z-10 flex justify-between items-start">
                        <div className="space-y-4 max-w-[70%]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Trophy className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Event Completion Report</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Event Title</Label>
                                    <h1 className="text-2xl font-black text-slate-800 leading-tight">{event.title}</h1>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date</Label>
                                    <div className="flex items-center gap-2 pt-1 font-bold text-slate-700">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        {event.date ? format(new Date(event.date), 'PPPP') : 'Date Unrecorded'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider border-none shadow-sm shadow-emerald-100">
                                Officially Verified
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full hover:bg-slate-200 text-slate-400">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-8 space-y-12 relative z-10">

                        {/* 2. Logistics Grid - Matches Row 2 of Input */}
                        <div className="grid md:grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Duration</Label>
                                <div className="flex items-center gap-2 pt-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    {event.duration || 'Full Session'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Location</Label>
                                <div className="flex items-center gap-2 pt-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    {event.location || 'College Campus'}
                                </div>
                            </div>
                        </div>

                        {/* 3. Organization & Scope - Matches Row 3 of Input */}
                        <div className="grid md:grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Organized By</Label>
                                <div className="pt-2 text-sm font-bold text-slate-700 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                                        {event.clubName?.charAt(0) || 'C'}
                                    </div>
                                    {event.organizingClub || event.clubName}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Event Scope</Label>
                                <div className="pt-2">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-[10px] px-4 py-1 rounded-md uppercase tracking-wide">
                                        {event.scope || 'Club Level'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* 4. Collaboration - Matches Row 4 of Input */}
                        {event.collaboratingClubs && event.collaboratingClubs.length > 0 && (
                            <div className="space-y-3 pb-8 border-b border-slate-100">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Collaborating Clubs</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {Array.isArray(event.collaboratingClubs) && event.collaboratingClubs.map((club: string, idx: number) => {
                                        if (!club) return null;
                                        return (
                                            <Badge key={idx} variant="outline" className="text-[10px] font-bold text-slate-500 px-3 py-1 bg-white border-slate-200 shadow-sm">
                                                {club}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. Chief Guests - Matches Row 5 of Input */}
                        <div className="space-y-4 pb-8 border-b border-slate-100">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-[2px] w-6 bg-blue-500" /> Distinguished Guests
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {Array.isArray(event.chiefGuests) && event.chiefGuests.length > 0 ? (
                                    event.chiefGuests.map((guest: any, idx: number) => {
                                        if (!guest) return null;
                                        return (
                                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                                <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {guest.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm leading-none mb-1">{guest.name || 'Honored Guest'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{guest.designation || 'Dignitary'}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No special guests recorded for this session.</p>
                                )}
                            </div>
                        </div>

                        {/* 6. Description - Matches Row 6 of Input */}
                        <div className="space-y-4 pb-8 border-b border-slate-100">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Event Description & Highlights</Label>
                            <div className="text-[15px] font-medium text-slate-600 leading-relaxed bg-slate-900/[0.02] p-8 rounded-[32px] border border-slate-100/50 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30" />
                                "{event.description || 'No detailed highlights provided for this event.'}"
                            </div>
                        </div>

                        {/* 7. Competition & Winners - Matches Row 7 & 8 of Input */}
                        <div className="space-y-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-[2px] w-6 bg-blue-500" /> Competition Records & Results
                            </h3>

                            <div className="space-y-12">
                                {Object.keys(groupedWinners).length > 0 ? (
                                    Object.entries(groupedWinners).map(([compName, winners]: [string, any], cIdx) => (
                                        <div key={cIdx} className="space-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl">
                                                    {cIdx + 1}
                                                </div>
                                                <h4 className="text-xl font-black text-slate-800 tracking-tight">{compName}</h4>
                                            </div>

                                            <div className="grid sm:grid-cols-3 gap-6">
                                                {['1st', '2nd', '3rd'].map((pos) => {
                                                    const winner = winners.find((w: any) => w.position === pos);
                                                    if (!winner) return (
                                                        <div key={pos} className="border-2 border-dashed border-slate-200 rounded-[28px] p-6 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                                            <div className="text-3xl mb-2">{pos === '1st' ? '🥇' : pos === '2nd' ? '🥈' : '🥉'}</div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pos}</p>
                                                        </div>
                                                    );

                                                    return (
                                                        <div key={pos} className={cn(
                                                            "relative rounded-[28px] p-8 border-2 flex flex-col items-center text-center shadow-md transition-all group hover:scale-[1.02]",
                                                            pos === '1st' ? "bg-amber-50 border-amber-200" :
                                                                pos === '2nd' ? "bg-slate-50 border-slate-300" : "bg-orange-50/50 border-orange-200"
                                                        )}>
                                                            <div className="absolute -top-3 bg-white px-4 py-1 rounded-full border border-inherit shadow-sm font-black text-[9px] tracking-widest uppercase text-slate-500">
                                                                {pos === '1st' ? 'Winner' : pos === '2nd' ? 'Runner Up' : '2nd Runner Up'}
                                                            </div>
                                                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">{pos === '1st' ? '🥇' : pos === '2nd' ? '🥈' : '🥉'}</div>
                                                            <h5 className="font-black text-slate-800 text-lg leading-tight px-2">{winner.name}</h5>
                                                            <div className="mt-6 pt-6 border-t border-slate-200/50 w-full">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">RECORDED PRIZE</p>
                                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{winner.prize || 'CERTIFICATE'}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] p-16 text-center text-slate-400">
                                        <History className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Awaiting Final Registry Confirmation</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 8. Media & Links - Matches Row 9 & 10 of Input */}
                        <div className="grid md:grid-cols-2 gap-8 pt-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Event Cover Image</Label>
                                <div className="aspect-video rounded-[32px] overflow-hidden border border-slate-200 shadow-xl group cursor-help relative">
                                    <img
                                        src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'}
                                        alt="Event Record"
                                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                </div>
                            </div>

                            <div className="flex flex-col justify-center space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Photo & Video Registry</Label>
                                    {event.highlightsLink || event.driveLink ? (
                                        <a
                                            href={event.highlightsLink || event.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-16 px-8 flex items-center justify-between bg-blue-600 text-white rounded-[24px] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 group"
                                        >
                                            OPEN OFFICIAL ALBUM
                                            <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                                                <ExternalLink className="h-5 w-5" />
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="h-16 px-8 flex items-center bg-slate-50 text-slate-400 rounded-[24px] font-bold text-xs border border-dashed border-slate-200 italic">
                                            No external media registry provided.
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-[28px] p-6 flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">XP DISTRIBUTED</p>
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Zap className="h-6 w-6 fill-blue-600" />
                                            <span className="text-3xl font-black">+{event.xpReward || 0}</span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 9. Final Attendance - Matches Stats at Bottom of Input */}
                        <div className="bg-slate-900 rounded-[40px] p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-full aspect-square bg-white/[0.03] rounded-full blur-3xl" />
                            <div className="space-y-2 relative z-10 text-center md:text-left">
                                <Badge className="bg-white/10 hover:bg-white/20 text-blue-400 border-none font-bold text-[9px] uppercase tracking-[0.2em] px-4">Registry Summary</Badge>
                                <p className="text-slate-400 text-sm font-medium">This document certifies the participation and achievements recorded.</p>
                            </div>

                            <div className="flex items-end gap-3 relative z-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 opacity-80">Official Count</p>
                                    <h4 className="text-6xl font-black text-white leading-none tracking-tighter">{event.participantCount || event.registrations?.length || 0}</h4>
                                </div>
                                <div className="pb-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Students<br />Attended</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Official Registry Footer */}
                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-double flex flex-col items-center justify-center text-[7px] font-black text-slate-300 text-center leading-[1.1] opacity-50">
                                <span className="text-[10px]">CH</span>
                                ACADEMIC<br />TRANSCRIPT
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-800 leading-none">CAMPUS HUB REGISTRY</p>
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                    Standard Verification Code: {event._id?.slice(0, 4)}-{event.clubId?.slice(-4)}-VALID
                                </p>
                            </div>
                        </div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center sm:text-right leading-relaxed">
                            This report is an automated generation of the college hub system.<br />
                            Data authenticity is verified by the {event.clubName} coordinator.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
