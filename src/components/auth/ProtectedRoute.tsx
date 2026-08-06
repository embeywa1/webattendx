import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LoadingPanel } from "@/components/ui/state";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathFor, type AppRole } from "@/services/authApi";

/**
 * Renders children only when the signed-in user holds `role`.
 * Route-level auth is enforced by the `_authenticated` layout; this guards role mismatch.
 */
export function ProtectedRoute({ role, children }: { role: AppRole; children: ReactNode }) {
  const { loading, session, role: currentRole } = useAuth();

  if (loading) {
    return (
      <div className="p-8">
        <LoadingPanel label="Verifying clearance" />
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;
  if (currentRole && currentRole !== role) {
    return <Navigate to={dashboardPathFor(currentRole)} replace />;
  }
  return <>{children}</>;
}