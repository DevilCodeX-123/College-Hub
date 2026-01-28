import { useState, useEffect } from 'react';
import { isBefore, endOfDay } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const categories = ['All', 'Hackathon', 'Competition', 'Creative', 'Coding', 'Literary'];

export default function Challenges() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    localStorage.setItem('last_viewed_challenges', new Date().toISOString());
  }, []);

  const { data: challenges = [], isLoading, error } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api.getChallenges(undefined, undefined, user?.id || user?._id),
  });

  const filterChallenges = (status: string) => {
    return challenges.filter(challenge => {
      const challengeTitle = challenge.title || '';
      const challengeDesc = challenge.description || '';
      const challengeDiff = challenge.difficulty || 'medium';

      const matchesSearch = challengeTitle.toLowerCase().includes(search.toLowerCase()) ||
        challengeDesc.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty = selectedDifficulty === 'All' ||
        challengeDiff.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;

      // Determine if challenge is live vs ended
      const deadlineDate = challenge.deadline ? new Date(challenge.deadline) : null;
      const isPastDeadline = deadlineDate ? isBefore(endOfDay(deadlineDate), new Date()) : false;
      const isCompleted = challenge.status === 'completed';

      let matchesStatus = status === 'all' || challenge.status === status;

      // Strict Tab Logic:
      // Active: status is 'active' AND deadline hasn't passed
      // Completed: status is 'completed' OR deadline HAS passed
      // Upcoming: status is 'upcoming' AND deadline hasn't passed
      if (status === 'active') {
        matchesStatus = challenge.status === 'active' && !isPastDeadline;
      } else if (status === 'completed') {
        matchesStatus = isCompleted || isPastDeadline;
      } else if (status === 'upcoming') {
        matchesStatus = challenge.status === 'upcoming' && !isPastDeadline;
      }

      return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Challenges</h1>
            <p className="text-muted-foreground mt-1">
              Complete challenges to earn XP and climb the leaderboard
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-xp/10">
            <Zap className="h-5 w-5 text-xp" />
            <span className="font-semibold text-xp">1,250 XP</span>
          </div>
        </section>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
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

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <Badge
              key={difficulty}
              variant={
                selectedDifficulty === difficulty
                  ? difficulty.toLowerCase() === 'easy'
                    ? 'easy'
                    : difficulty.toLowerCase() === 'medium'
                      ? 'medium'
                      : difficulty.toLowerCase() === 'hard'
                        ? 'hard'
                        : 'default'
                  : 'outline'
              }
              className="cursor-pointer transition-colors px-3 py-1.5"
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {difficulty}
            </Badge>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-red-500 text-center py-4">
            Failed to load challenges. Please try again later.
          </div>
        )}

        {!isLoading && !error && (
          /* Tabs */
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {(() => {
                const activeChallenges = filterChallenges('active');
                const joinedChallenges = activeChallenges.filter(challenge => {
                  const challengeId = challenge.id || challenge._id;
                  return user?.activity?.some(a =>
                    a.type === 'challenge' &&
                    (a.refId === challengeId || (challenge.id && a.refId === challenge.id) || (challenge._id && a.refId === challenge._id))
                  );
                });
                const availableChallenges = activeChallenges.filter(challenge => {
                  const challengeId = challenge.id || challenge._id;
                  return !user?.activity?.some(a =>
                    a.type === 'challenge' &&
                    (a.refId === challengeId || (challenge.id && a.refId === challenge.id) || (challenge._id && a.refId === challenge._id))
                  );
                });

                return (
                  <div className="space-y-6">
                    {/* My Challenges Section */}
                    {joinedChallenges.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">My Challenges</h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {joinedChallenges.length}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                          {joinedChallenges.map((challenge) => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Challenges Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">Available Challenges</h3>
                        <Badge variant="outline">
                          {availableChallenges.length}
                        </Badge>
                      </div>
                      {availableChallenges.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">
                          No more available challenges. Check back later!
                        </p>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {availableChallenges.map((challenge) => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* No challenges at all */}
                    {activeChallenges.length === 0 && (
                      <p className="text-center py-12 text-muted-foreground">
                        No active challenges found.
                      </p>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid md:grid-cols-2 gap-4">
                {filterChallenges('upcoming').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
              {filterChallenges('upcoming').length === 0 && (
                <p className="text-center py-12 text-muted-foreground">
                  No upcoming challenges found.
                </p>
              )}
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid md:grid-cols-2 gap-4">
                {filterChallenges('completed').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
              {filterChallenges('completed').length === 0 && (
                <p className="text-center py-12 text-muted-foreground">
                  No completed challenges found.
                </p>
              )}
            </TabsContent>

            <TabsContent value="all">
              <div className="grid md:grid-cols-2 gap-4">
                {filterChallenges('all').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
              {filterChallenges('all').length === 0 && (
                <p className="text-center py-12 text-muted-foreground">
                  No challenges found.
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
