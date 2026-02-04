import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, ExternalLink, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useParams } from 'react-router-dom';

export function AdOverlay() {
    const { user } = useAuth();
    const [currentAd, setCurrentAd] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canSkip, setCanSkip] = useState(false);
    const [skipTimer, setSkipTimer] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const location = useLocation();
    const { id: clubId } = useParams();

    // Helper to determine current page name for targeting
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'dashboard';
        if (path === '/clubs') return 'clubs';
        if (path.startsWith('/club/')) return 'club_detail';
        if (path === '/challenges') return 'challenges';
        if (path === '/projects') return 'projects';
        if (path === '/leaderboard') return 'leaderboard';
        if (path === '/events') return 'events';
        if (path === '/profile') return 'profile';
        return 'all';
    };

    const { data: activeAds } = useQuery({
        queryKey: ['active-ads', user?.college, getCurrentPage(), clubId],
        queryFn: () => api.getActiveAds(user?.college, getCurrentPage(), clubId),
        enabled: !!user,
        staleTime: 0
    });

    useEffect(() => {
        if (activeAds && activeAds.length > 0) {
            // Pick a random ad from active ones
            const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];

            // Check frequency limit using localStorage
            const viewCountKey = `ad_view_count_${randomAd._id}`;
            const lastSeenKey = `ad_last_seen_${randomAd._id}`;

            const viewCount = parseInt(localStorage.getItem(viewCountKey) || '0');
            const lastSeen = parseInt(localStorage.getItem(lastSeenKey) || '0');
            const now = Date.now();

            // Convert interval hours to milliseconds
            const intervalMs = randomAd.frequencyInterval * 60 * 60 * 1000;

            if (viewCount < randomAd.frequencyPerUser && (now - lastSeen >= intervalMs)) {
                setCurrentAd(randomAd);
                setIsVisible(true);
                setTimeLeft(randomAd.duration);
                setSkipTimer(randomAd.skipDelay);

                // Increment view count locally
                localStorage.setItem(viewCountKey, (viewCount + 1).toString());
                localStorage.setItem(lastSeenKey, now.toString());

                // Increment view count on backend
                api.incrementAdView(randomAd._id).catch(err => console.error("Ad view tracking failed:", err));
            }
        }
    }, [activeAds]);

    useEffect(() => {
        if (!isVisible || !currentAd) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });

            setSkipTimer(prev => {
                if (prev <= 1) {
                    setCanSkip(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, currentAd]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible || !currentAd) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
            <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">

                {/* Ad Content */}
                {currentAd.type === 'image' ? (
                    <img
                        src={currentAd.url}
                        alt={currentAd.title}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="relative w-full h-full">
                        <video
                            src={currentAd.url}
                            autoPlay
                            muted={isMuted}
                            className="w-full h-full object-contain"
                            onEnded={handleClose}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-6 left-6 h-10 w-10 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md"
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                    </div>
                )}

                {/* Overlay UI: Top Bar */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                            <Play className="h-5 w-5 text-white fill-current" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-none">{currentAd.title}</h3>
                            <p className="text-white/60 text-xs mt-1">Sponsored Advertisement</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {timeLeft > 0 ? (
                            <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-bold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                {timeLeft}s
                            </div>
                        ) : (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-10 w-10 rounded-full shadow-lg items-center justify-center"
                                onClick={handleClose}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Overlay UI: Bottom Bar */}
                <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end bg-gradient-to-t from-black/60 to-transparent">
                    {currentAd.clickUrl && (
                        <a
                            href={currentAd.clickUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all duration-300 shadow-xl"
                        >
                            Visit Advertiser
                            <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}

                    {currentAd.type === 'video' && (
                        <div className="flex flex-col items-end gap-2">
                            {canSkip ? (
                                <Button
                                    variant="outline"
                                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full backdrop-blur-md px-6 font-bold flex items-center gap-2"
                                    onClick={handleClose}
                                >
                                    Skip Ad
                                    <SkipForward className="h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-black/20 rounded-full">
                                    Skip in {skipTimer}s
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Bar (at the top) */}
                <div className="absolute top-0 left-0 h-1 bg-white/10 w-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / currentAd.duration) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
