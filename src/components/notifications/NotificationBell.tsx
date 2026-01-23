import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    // Fetch Notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => (user ? api.getNotifications(user.id, user.role) : []),
        enabled: !!user,
        refetchInterval: 30000, // Poll every 30s
    });

    // Mark as Read Mutation
    const markReadMutation = useMutation({
        mutationFn: (id: string) => api.markNotificationRead(id, user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        },
    });

    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const unreadCount = safeNotifications.filter((n: any) => n && Array.isArray(n.readBy) && !n.readBy.includes(user?.id)).length;

    const handleMarkRead = (id: string) => {
        if (user) markReadMutation.mutate(id);
    };

    if (!user) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                </div>
                <ScrollArea className="h-[300px]">
                    {safeNotifications.length > 0 ? (
                        <div className="divide-y">
                            {safeNotifications.map((notification: any) => {
                                if (!notification) return null;
                                const isRead = Array.isArray(notification.readBy) && notification.readBy.includes(user.id);
                                return (
                                    <div
                                        key={notification._id || notification.id}
                                        className={cn(
                                            "p-4 hover:bg-muted/50 transition-colors flex gap-3",
                                            !isRead ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-sm font-medium", !isRead && "text-primary")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {!isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(notification._id || notification.id)}
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"
                                                >
                                                    <Check className="h-3 w-3" /> Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No notifications yet
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
