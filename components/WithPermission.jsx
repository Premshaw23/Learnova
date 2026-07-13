import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if current logged in user has a specific permission.
 */
export function usePermission(permission) {
  const { hasPermission, loading } = useAuth();
  return {
    allowed: hasPermission ? hasPermission(permission) : false,
    loading,
  };
}

/**
 * Higher-Order Component to protect pages or components based on permissions.
 */
export function withPermission(WrappedComponent, permission, FallbackComponent = null) {
  return function WithPermissionWrapper(props) {
    const { allowed, loading } = usePermission(permission);

    if (loading) {
      return <div>Loading permissions...</div>;
    }

    if (!allowed) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Declarative component to conditionally render children based on permission.
 */
export function PermissionBoundary({ permission, fallback = null, children }) {
  const { allowed, loading } = usePermission(permission);

  if (loading) {
    return null;
  }

  if (!allowed) {
    return fallback;
  }

  return <>{children}</>;
}
