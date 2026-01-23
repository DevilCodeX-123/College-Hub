import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { DailyTasks } from '@/components/dashboard/DailyTasks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectProgress } from '@/components/dashboard/ProjectProgress';
import { ChallengeSummary } from '@/components/dashboard/ChallengeSummary';
import { EventSummary } from '@/components/dashboard/EventSummary';
import { LeaderboardPreview } from '@/components/dashboard/LeaderboardPreview';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, isAfter, format } from 'date-fns';
import { api } from '@/lib/api';
import { calculateLevelData } from '@/lib/leveling';

export default function Index() {
  const { user } = useAuth();

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => api.getTasks({
      userId: user?.id,
      email: user?.email,
      joinedClubs: Array.isArray(user?.joinedClubs) ? user?.joinedClubs.join(',') : undefined,
      requestingUserId: user?.id || user?._id
    }),
    enabled: !!user
  });
  const tasks = Array.isArray(tasksData) ? tasksData : [];

  // Fetch My Submissions
  const { data: submissionsData } = useQuery({
    queryKey: ['task-submissions'],
    queryFn: () => api.getTaskSubmissions(),
  });
  const submissions = Array.isArray(submissionsData) ? submissionsData : [];

  const userSubmissions = useMemo(() => {
    return submissions.filter((s: any) => s.userId === user?.id);
  }, [submissions, user?.id]);

  // Fetch Projects (Only projects the user is part of)
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'my-projects', user?.id],
    queryFn: () => api.getProjects(undefined, undefined, user?.id, user?.id || user?._id),
    enabled: !!user?.id || !!user?._id
  });

  // Fetch Challenges for "Featured Challenge"
  const { data: challenges = [], isLoading: isLoadingChallenges } = useQuery({
    queryKey: ['challenges', user?.college],
    queryFn: () => api.getChallenges(user?.college, undefined, user?.id || user?._id),
  });

  // Fetch Leaderboard (College specific)
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', 'college', user?.college],
    queryFn: () => api.getLeaderboard(user?.college, user?.id || user?._id),
    enabled: !!user?.college
  });

  // Fetch Events
  const { data: eventsData = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: api.getEvents,
  });

  const upcomingEvents = useMemo(() => {
    const rawEvents = Array.isArray(eventsData) ? eventsData : [];
    const today = startOfDay(new Date());
    return rawEvents.filter((event: any) =>
      !event.isCompleted && (isAfter(new Date(event.date), today) || format(new Date(event.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  }, [eventsData]);

  const ongoingChallenges = useMemo(() => {
    const safeChallenges = Array.isArray(challenges) ? challenges : [];
    return safeChallenges.filter((c: any) => c.status !== 'completed').slice(0, 3);
  }, [challenges]);

  // Pick a random featured challenge or the first one
  const featuredChallenge = useMemo(() => {
    const safeChallenges = Array.isArray(challenges) ? challenges : [];
    if (safeChallenges.length === 0) return null;
    return safeChallenges[0];
  }, [challenges]);

  const isLoading = isLoadingTasks || isLoadingProjects || isLoadingChallenges || isLoadingLeaderboard || isLoadingEvents;

  // Calculate accurate level data
  const levelData = useMemo(() => {
    return calculateLevelData(user?.totalEarnedXP || 0);
  }, [user?.totalEarnedXP]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <Sparkles className="h-6 w-6 text-gold animate-bounce-subtle" />
          </div>
          <p className="text-muted-foreground">
            {user?.college} • Level {user?.level} Explorer
          </p>
        </section>

        {/* Level Progress */}
        <LevelProgress
          level={levelData.level}
          currentXP={levelData.currentXPInLevel}
          requiredXP={levelData.nextLevelXPRequired}
        />

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <QuickActions />
        </section>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Two Column Layout */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <DailyTasks tasks={tasks} userSubmissions={userSubmissions} />
              <ProjectProgress projects={Array.isArray(projects) ? projects.slice(0, 3) : []} />
              <ChallengeSummary challenges={ongoingChallenges} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <LeaderboardPreview
                entries={Array.isArray(leaderboard) ? leaderboard.filter(Boolean).slice(0, 5) : []}
                currentUserId={user?.id}
                title={`${user?.college || 'College'} Leaderboard`}
              />

              <EventSummary events={upcomingEvents} />

              {/* Featured Challenge */}
              {featuredChallenge && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Featured Challenge</h2>
                  <ChallengeCard challenge={featuredChallenge} />
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
