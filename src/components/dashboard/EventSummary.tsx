import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EventSummaryProps {
    events: any[];
}

export function EventSummary({ events }: EventSummaryProps) {
    return (
        <Card variant="elevated">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Upcoming Events
                    </CardTitle>
                    <Link
                        to="/events"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        View all <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {events.map((event) => (
                    <div key={event._id || event.id} className="group cursor-pointer">
                        <Link to="/events" className="block p-3 rounded-lg hover:bg-secondary/5 border border-transparent hover:border-border transition-all">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold group-hover:text-primary transition-colors truncate">{event.title}</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-primary" />
                                            {format(new Date(event.date), 'MMM d, h:mm a')}
                                        </span>
                                        {event.location && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3 text-primary" />
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {event.xpReward && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        +{event.xpReward} XP
                                    </Badge>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}

                {events.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming events. Stay tuned!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
