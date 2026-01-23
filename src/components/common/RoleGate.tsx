import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
