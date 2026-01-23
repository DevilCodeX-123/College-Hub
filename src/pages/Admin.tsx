import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { RoleGate } from '@/components/common/RoleGate';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';
import { CollegeDetailView } from '@/components/common/CollegeDetailView';

export default function Admin() {
  const { user } = useAuth();

  return (
    <RoleGate
      allowedRoles={['admin']}
      fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md text-center p-8">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Access Restricted</h2>
              <p className="text-muted-foreground mt-2">
                You need admin privileges to access this page.
              </p>
            </Card>
          </div>
        </Layout>
      }
    >
      <Layout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              College Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your college ecosystem: <span className="font-semibold text-primary">{user?.college}</span>
            </p>
          </section>

          <CollegeDetailView collegeName={user?.college || ''} />
        </div>
      </Layout>
    </RoleGate>
  );
}



