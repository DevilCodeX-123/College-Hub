import { Layout } from '@/components/layout/Layout';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RoleGate } from '@/components/common/RoleGate';
import { ClubCoordinatorView } from '@/components/club/ClubCoordinatorView';
import { useParams } from 'react-router-dom';

export default function CoordinatorDashboard() {
    const { user } = useAuth();
    const { clubId } = useParams();

    // Fetch Club by ID from URL OR fetch user's first managed club if no ID provided
    const { data: club, isLoading, error } = useQuery({
        queryKey: ['my-club', user?.id, clubId],
        queryFn: async () => {
            if (!user) return null;

            if (clubId) {
                return api.getClub(clubId, user.id);
            }

            // Fallback to first managed club if no ID in URL
            const managed = await api.getManagedClubs(user.id, user.id);
            return managed && managed.length > 0 ? managed[0] : null;
        },
        enabled: !!user,
        retry: false
    });

    // Debug logging
    if (error) {
        console.error('[CoordinatorDashboard] Error fetching club:', error);
    }
    if (club) {
        console.log('[CoordinatorDashboard] Successfully loaded club:', club.name);
    }

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <RoleGate allowedRoles={['club_coordinator', 'club_head', 'core_member']}>
            {(!club) ? (
                <Layout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Club Assigned</h2>
                        <p className="text-muted-foreground max-w-md">
                            You are listed as a Coordinator, but no club is officially linked to your account yet.
                            Please contact the System Admin to link your account to a club.
                        </p>
                    </div>
                </Layout>
            ) : (
                <Layout>
                    <ClubCoordinatorView
                        clubId={club.id || (club as any)._id}
                        collegeName={user?.college || ''}
                    />
                </Layout>
            )}
        </RoleGate>
    );
}
