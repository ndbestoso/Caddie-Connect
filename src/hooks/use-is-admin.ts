import { useAuth } from "@/contexts/auth-context";

export function useIsAdmin() {
  const { userRole, roleLoading } = useAuth();
  return {
    isAdmin: userRole === 'admin',
    loading: roleLoading,
  };
}
