"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole, roleLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        router.push("/");
      } else if (userRole !== 'admin') {
        router.push("/");
      }
    }
  }, [user, loading, userRole, roleLoading, router]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {children}
    </div>
  );
}
