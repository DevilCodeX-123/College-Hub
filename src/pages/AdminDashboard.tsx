import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CollegeAdminView } from '@/components/owner/CollegeAdminView';

export default function AdminDashboard() {
    const { user } = useAuth();

    // Redirect if not admin or owner
    if (!user || (user.role !== 'admin' && user.role !== 'co_admin' && user.role !== 'owner')) {
        return <Navigate to="/" replace />;
    }

    // Use the user's assigned college
    const collegeName = user.college || '';

    return (
        <Layout>
            <CollegeAdminView collegeName={collegeName} />
        </Layout>
    );
}


