"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "@/views/LoginPage";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--bg-primary] flex items-center justify-center">
        <div className="text-[--text-secondary]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
