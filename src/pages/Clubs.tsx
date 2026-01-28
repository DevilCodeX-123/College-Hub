import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ClubCard } from '@/components/clubs/ClubCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Club } from '@/types';

const categories = ['All', 'Technology', 'Business', 'Creative', 'Cultural', 'Literary', 'Sports', 'Social', 'Others'];

export default function Clubs() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: clubs = [], isLoading } = useQuery<Club[]>({
    queryKey: ['clubs', user?.college],
    queryFn: () => api.getClubs(user?.college, user?.id || user?._id),
  });

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(search.toLowerCase()) ||
      club.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section>
          <h1 className="text-2xl sm:text-3xl font-bold">Clubs</h1>
          <p className="text-muted-foreground mt-1">
            Discover and join clubs that match your interests
          </p>
        </section>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors px-3 py-1.5',
                selectedCategory === category
                  ? 'bg-primary hover:bg-primary/90'
                  : 'hover:bg-secondary'
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Clubs Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}

        {filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No clubs found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
