import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Navigation,
  BookOpen,
  MapPin,
  Building,
  Utensils,
  Dumbbell,
  Car,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const categoryIcons: Record<string, any> = {
  'Academic': BookOpen,
  'Facilities': Building,
  'Food': Utensils,
  'Sports': Dumbbell,
  'Parking': Car,
  'General': MapPin,
};

const categories = ['All', 'Academic', 'Facilities', 'Food', 'Sports', 'Parking', 'General'];

export default function CampusMap() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('last_viewed_campus', new Date().toISOString());
  }, []);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['campus-locations', user?.college],
    queryFn: () => api.getLocations(user?.college || ''),
    enabled: !!user?.college
  });

  const filteredLocations = Array.isArray(locations) ? locations.filter((loc: any) =>
    loc && (selectedCategory === 'All' || loc.category === selectedCategory) &&
    (loc.name?.toLowerCase()?.includes(searchQuery.toLowerCase()))
  ) : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-primary/10 items-center justify-center text-primary border border-primary/20 shadow-inner mb-2">
            <Navigation className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Smart Campus
          </h1>
          <p className="text-muted-foreground font-medium max-w-lg mx-auto">
            Quick access to campus facilities and navigation links for {user?.college || 'your college'}
          </p>
        </section>

        {/* Search & Filter */}
        <div className="grid gap-6">
          <Card className="border-none bg-secondary/30 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Where are you heading?"
                  className="pl-9 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 -translate-y-0.5"
                        : "bg-background/50 border-transparent hover:border-border text-muted-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Locations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold">Campus Facilities</h2>
            <Badge variant="outline" className="font-mono text-[10px]">{filteredLocations.length} locations found</Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Scanning campus nodes...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-muted-foreground">No matches found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLocations.map((loc: any) => {
                if (!loc) return null;
                const Icon = categoryIcons[loc.category] || categoryIcons.General;
                return (
                  <a
                    key={loc._id}
                    href={loc.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <Card variant="interactive" className="overflow-hidden border-none shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner border transition-all duration-300 group-hover:scale-110",
                            loc.status === 'busy' ? "bg-warning/10 text-warning border-warning/20 group-hover:bg-warning/20" :
                              loc.status === 'full' ? "bg-destructive/10 text-destructive border-destructive/20 group-hover:bg-destructive/20" :
                                "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20"
                          )}>
                            <Icon className="h-7 w-7" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{loc.name}</h3>
                              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider h-5">
                                {loc.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{loc.description}</p>
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">View on Google Maps</span>
                              </div>
                              <div className="h-1 w-1 rounded-full bg-border" />
                              <span className="text-xs font-medium">Click to navigate</span>
                            </div>
                          </div>

                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20 border-dashed rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">
              All locations in this panel are verified by {user?.college} administration. Tap any location to open it directly in Google Maps.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
