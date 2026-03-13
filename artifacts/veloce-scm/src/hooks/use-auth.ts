import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetCurrentUser, 
  useLoginUser, 
  useLogoutUser, 
  useRegisterUser,
  getGetCurrentUserQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data.user);
        toast({
          title: "Welcome back!",
          description: data.message,
        });
        if (data.user.role === 'instructor') {
          setLocation("/instructor/gradebook");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.error || "Please check your credentials and try again.",
        });
      }
    }
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Registration successful",
          description: data.message + " Please log in.",
        });
        setLocation("/login");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.error || "An error occurred during registration.",
        });
      }
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        queryClient.invalidateQueries(); // Clear all other cached data
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: "An error occurred while logging out.",
        });
      }
    }
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isAuthenticated: !!user,
  };
}
