"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthForms } from "@/components/auth";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { AvailabilityForm } from "@/components/availability-form";
import { ScheduleView } from "@/components/schedule-view";
import { Announcements } from "@/components/announcements";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (!user) {
    return <AuthForms />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
        <div className="grid gap-6 lg:grid-cols-2">
          <AvailabilityForm />
          <ScheduleView />
        </div>
        <Announcements />
      </main>
    </div>
  );
}
