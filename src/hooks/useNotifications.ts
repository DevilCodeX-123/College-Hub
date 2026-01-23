import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNotificationContext } from '@/contexts/NotificationContext';

export function useNotifications() {
    const { user } = useAuth();
    const location = useLocation();
    const { lastViewed, updateViewed } = useNotificationContext();
    const [notifications, setNotifications] = useState<{ [key: string]: boolean }>({});

    // 1. Fetch data
    const { data: challenges = [] } = useQuery({
        queryKey: ['challenges', user?.college],
        queryFn: () => api.getChallenges(user?.college || ''),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    const { data: events = [] } = useQuery({
        queryKey: ['events', user?.college],
        queryFn: () => api.getEvents(user?.college || ''),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    const { data: projectsData } = useQuery({
        queryKey: ['projects-chat', user?.id],
        queryFn: () => api.getLatestProjectMessageTimestamp(user?.id || ''),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['campus-locations', user?.college],
        queryFn: () => api.getLocations(user?.college || ''),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    // 2. Clear dot when on page
    useEffect(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        if (path === '/events' || path.startsWith('/events/')) updateViewed('events');
        if (path === '/challenges' || path.startsWith('/challenges/')) updateViewed('challenges');
        if (path === '/projects' || path.startsWith('/projects/')) updateViewed('projects');
        if (path === '/campus-map' || path.startsWith('/campus-map/')) updateViewed('campus');
    }, [location.pathname, updateViewed]);

    // 3. Logic: Should show dot?
    const checkNew = useCallback((type: 'challenges' | 'events' | 'projects' | 'campus', items: any[], latestTimestamp?: string | null) => {
        const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        const typePath = { challenges: '/challenges', events: '/events', projects: '/projects', campus: '/campus-map' }[type];

        // NUCLEAR FAILSAFE: If currently on the section, return FALSE immediately.
        if (path === typePath || path.startsWith(typePath + '/')) return false;

        const lastViewedStr = lastViewed[type];
        if (!lastViewedStr) return false;
        const lastViewedTime = new Date(lastViewedStr).getTime();

        if (type === 'projects') {
            if (!latestTimestamp) return false;
            return new Date(latestTimestamp).getTime() > lastViewedTime;
        }

        // Check if any item is newer than the last viewed time
        return items.some(item => {
            const time = new Date(item.createdAt || item.updatedAt || 0).getTime();
            return time > lastViewedTime && time > (Date.now() - 7 * 24 * 60 * 60 * 1000); // Also within 7 days
        });
    }, [location.pathname, lastViewed]);

    // 4. Update notification state
    useEffect(() => {
        const state = {
            '/challenges': checkNew('challenges', challenges),
            '/events': checkNew('events', events),
            '/projects': checkNew('projects', [], projectsData?.latestTimestamp),
            '/campus-map': checkNew('campus', locations),
        };

        if (JSON.stringify(state) !== JSON.stringify(notifications)) {
            setNotifications(state);
        }
    }, [challenges, events, projectsData, locations, checkNew, notifications]);

    return { notifications };
}
