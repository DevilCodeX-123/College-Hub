import { Layout } from '@/components/layout/Layout';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RoleGate } from '@/components/common/RoleGate';
import { ClubCoordinatorView } from '@/components/club/ClubCoordinatorView';

export default function CoordinatorDashboard() {
    const { user } = useAuth();

    // Fetch Club by Coordinator ID
    const { data: club, isLoading } = useQuery({
        queryKey: ['my-club', user?.id],
        queryFn: () => user ? api.getClubByCoordinator(user.id, user.id) : null,
        enabled: !!user,
        retry: false
    });

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
        <RoleGate allowedRoles={['club_coordinator', 'club_co_coordinator', 'club_head', 'core_member']}>
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
