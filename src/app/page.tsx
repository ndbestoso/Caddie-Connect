"use client";

import { CalendarDays, ListChecks, Megaphone, Calendar } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { AvailabilityForm } from "@/components/availability-form";
import { ScheduleView } from "@/components/schedule-view";
import { CalendarView } from "@/components/calendar-view";
import { Announcements } from "@/components/announcements";
import { AuthForms } from "@/components/auth";
import { useAuth } from "@/contexts/auth-context";

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
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full">
        <Tabs defaultValue="availability" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
            <TabsTrigger value="availability" className="text-sm data-[state=active]:bg-background">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-sm data-[state=active]:bg-background">
              <ListChecks className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-sm data-[state=active]:bg-background">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm data-[state=active]:bg-background">
              <Megaphone className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="availability" className="mt-0 flex justify-center">
            <div className="w-full max-w-4xl">
              <AvailabilityForm />
            </div>
          </TabsContent>
          <TabsContent value="schedule" className="mt-0">
            <ScheduleView />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <CalendarView />
          </TabsContent>
          <TabsContent value="announcements" className="mt-0">
            <Announcements />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
