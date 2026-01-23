import React, { createContext, useContext, useState, useCallback } from 'react';

interface NotificationContextType {
    lastViewed: { [key: string]: string | null };
    updateViewed: (type: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [lastViewed, setLastViewed] = useState<{ [key: string]: string | null }>(() => {
        const types = ['challenges', 'events', 'projects', 'campus'];
        const initialState: { [key: string]: string | null } = {};
        const now = new Date().toISOString();

        types.forEach(type => {
            const stored = localStorage.getItem(`viewed_${type}`); // Simplified key
            if (!stored) {
                localStorage.setItem(`viewed_${type}`, now);
                initialState[type] = now;
            } else {
                initialState[type] = stored;
            }
        });

        return initialState;
    });

    const updateViewed = useCallback((type: string) => {
        const now = new Date().toISOString();
        localStorage.setItem(`viewed_${type}`, now);
        setLastViewed(prev => ({ ...prev, [type]: now }));
    }, []);

    return (
        <NotificationContext.Provider value={{ lastViewed, updateViewed }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
