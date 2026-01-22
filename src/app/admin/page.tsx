"use client";

import { Users, CalendarDays, Megaphone, ClipboardList, CalendarCheck } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin-header";
import { AvailabilityManagement } from "@/components/admin/availability-management";
import { AssignmentManagement } from "@/components/admin/assignment-management";
import { AnnouncementManagement } from "@/components/admin/announcement-management";
import { UserManagement } from "@/components/admin/user-management";
import { EventManagement } from "@/components/admin/event-management";

export default function AdminPage() {
  return (
    <>
      <AdminHeader />
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your caddie operations, schedules, and team members
          </p>
        </div>

        <Tabs defaultValue="availability" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50">
            <TabsTrigger value="availability" className="text-sm data-[state=active]:bg-background">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-sm data-[state=active]:bg-background">
              <ClipboardList className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="text-sm data-[state=active]:bg-background">
              <CalendarCheck className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm data-[state=active]:bg-background">
              <Megaphone className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm data-[state=active]:bg-background">
              <Users className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="availability" className="mt-0 space-y-4">
            <AvailabilityManagement />
          </TabsContent>
          <TabsContent value="assignments" className="mt-0 space-y-4">
            <AssignmentManagement />
          </TabsContent>
          <TabsContent value="events" className="mt-0 space-y-4">
            <EventManagement />
          </TabsContent>
          <TabsContent value="announcements" className="mt-0 space-y-4">
            <AnnouncementManagement />
          </TabsContent>
          <TabsContent value="users" className="mt-0 space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
