'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticatedSync } from '../../lib/balena/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticatedSync();
      setAuthenticated(isAuth);

      // Don't redirect if already on login page
      if (!isAuth && pathname !== '/login') {
        router.push('/login');
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!authenticated && pathname !== '/login') {
    return null;
  }

  // Allow login page to render without authentication
  if (pathname === '/login' && !authenticated) {
    return <>{children}</>;
  }

  // Render protected content
  return <>{children}</>;
}

