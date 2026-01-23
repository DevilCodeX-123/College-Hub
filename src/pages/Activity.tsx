import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Building, History, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Activity() {
    const { user } = useAuth();

    const activities = user?.activity || [
        { type: 'challenge', title: 'Code Sprinter 2024', status: 'Completed', timestamp: new Date() },
        { type: 'club', title: 'Tech Odyssey Joined', status: 'Joined', timestamp: new Date() },
    ];

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-12">
                {/* Header */}
                <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-foreground uppercase tracking-tight">
                            <History className="h-8 w-8 text-primary" />
                            Your Activity
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Live feed of your participations and achievements
                        </p>
                    </div>
                    <Link to="/challenges">
                        <Button variant="gradient" className="shadow-lg shadow-primary/20">
                            <Trophy className="h-4 w-4 mr-2" />
                            View New Challenges
                        </Button>
                    </Link>
                </section>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Activity Feed */}
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-sm h-full">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg">Recent Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {activities.length === 0 ? (
                                    <div className="text-center py-20 px-4">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-bold">No activity yet</p>
                                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mt-1">
                                            Start by joining a club or taking a challenge.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {activities.map((item, idx) => (
                                            <div key={idx} className="p-4 flex gap-4 hover:bg-secondary/10 transition-colors group">
                                                <div className={cn(
                                                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm border",
                                                    item.type === 'challenge' ? 'bg-xp/10 text-xp border-xp/20' :
                                                        item.type === 'club' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            'bg-accent/10 text-accent border-accent/20'
                                                )}>
                                                    {item.type === 'challenge' && <Trophy className="h-5 w-5" />}
                                                    {item.type === 'club' && <Building className="h-5 w-5" />}
                                                    {item.type === 'event' && <Calendar className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold truncate group-hover:text-primary transition-colors">{item.title}</h4>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{item.status || 'Engaged'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats & Shortcuts */}
                    <div className="space-y-6">
                        <Card className="bg-primary overflow-hidden border-none text-primary-foreground shadow-xl shadow-primary/20">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Zap className="h-24 w-24 -rotate-12" />
                            </div>
                            <CardContent className="p-6 relative">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Activity Score</p>
                                <h3 className="text-4xl font-black mt-1">{user?.points || 0}</h3>
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Rank #142</span>
                                        <span>Next Level in 420 XP</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3">
                            <h3 className="font-bold px-1">Quick Links</h3>
                            <Link to="/clubs">
                                <Button variant="outline" className="w-full justify-between hover:border-primary/50 group">
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4" /> Discover Clubs
                                    </div>
                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                </Button>
                            </Link>
                            <Link to="/leaderboard">
                                <Button variant="outline" className="w-full justify-between hover:border-primary/50 group">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4" /> Hall of Fame
                                    </div>
                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
