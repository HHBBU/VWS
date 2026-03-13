import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ 
  children, 
  allowedRole 
}: { 
  children: React.ReactNode;
  allowedRole?: 'student' | 'instructor';
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>Loading application state...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but could save return URL in session storage if needed
    return <Redirect to="/login" />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to appropriate home if wrong role
    return <Redirect to={user?.role === 'instructor' ? "/instructor/gradebook" : "/dashboard"} />;
  }

  return <>{children}</>;
}
