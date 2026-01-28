import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, MapPin, Clock, History } from 'lucide-react';
import { format } from 'date-fns';

interface EndedEventSummaryProps {
    events: any[];
}

export function EndedEventSummary({ events }: EndedEventSummaryProps) {
    if (events.length === 0) return null;

    return (
        <Card variant="outline" className="bg-slate-50/50 border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                        <History className="h-5 w-5" />
                        Ended Events Highlights
                    </CardTitle>
                    <Link
                        to="/events"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                        View Archive <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {events.map((event) => (
                    <div key={event._id || event.id} className="group relative opacity-70 hover:opacity-100 transition-opacity">
                        <Link to="/events" className="block p-3 rounded-lg border border-transparent hover:bg-white hover:border-slate-200 transition-all">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-700 truncate line-through decoration-slate-400/50">{event.title}</h4>
                                    <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(event.date), 'MMMM d, yyyy')}
                                        </span>
                                        {event.location && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3" />
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-slate-100/50">
                                    CONCLUDED
                                </Badge>
                            </div>
                        </Link>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
