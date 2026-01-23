import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ExternalLink, Search, FileText, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Notes() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['public-notes', user?.college],
        queryFn: () => api.getPublicNotes(user?.college || ''),
        enabled: !!user?.college,
    });

    const filteredNotes = notes.filter((note: any) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <section>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Notes & Papers Hub
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Access study materials, previous year papers, and notes shared by your college.
                    </p>
                </section>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or description..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notes Grid */}
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-muted" />
                                <CardContent className="h-20 bg-muted/50 mt-4" />
                            </Card>
                        ))}
                    </div>
                ) : filteredNotes.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredNotes.map((note: any) => (
                            <Card key={note._id} className="hover:shadow-lg transition-all group border-primary/10 hover:border-primary/30">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <Badge variant="secondary" className="text-[10px]">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                        {note.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                                        {note.description || 'No description provided.'}
                                    </p>
                                    <div className="pt-4 border-t flex items-center justify-between">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button size="sm" className="gap-2" asChild>
                                            <a href={note.link} target="_blank" rel="noopener noreferrer">
                                                View Document
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-semibold">No notes found</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? "Try search with different keywords" : "Your college hasn't shared any public notes yet."}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
