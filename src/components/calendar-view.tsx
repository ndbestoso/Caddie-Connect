"use client";

import * as React from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay } from "date-fns";
import { CheckCircle2, CalendarCheck, Calendar as CalendarIcon } from "lucide-react";

interface AssignmentData {
  id: string;
  date: string;
  time: string;
  notes: string;
}

interface AvailabilityData {
  id: string;
  date: string;
  time: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
}

export function CalendarView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [assignments, setAssignments] = React.useState<AssignmentData[]>([]);
  const [availabilities, setAvailabilities] = React.useState<AvailabilityData[]>([]);
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch assignments
  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const assignmentsRef = collection(db, "assignments");
    const q = query(
      assignmentsRef,
      where("caddieId", "==", user.uid),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AssignmentData[];
        setAssignments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching assignments:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Fetch availability
  React.useEffect(() => {
    if (!user) return;

    const availabilityRef = collection(db, "availability");
    const q = query(
      availabilityRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AvailabilityData[];
        setAvailabilities(data);
      },
      (error) => {
        console.error("Error fetching availability:", error);
      }
    );

    return unsubscribe;
  }, [user]);

  // Fetch events
  React.useEffect(() => {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventData[];
        setEvents(data);
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );

    return unsubscribe;
  }, []);

  // Get dates with assignments
  const assignmentDates = assignments.map(a => new Date(a.date));

  // Get dates with availability
  const availabilityDates = availabilities.map(a => new Date(a.date));

  // Get dates with events
  const eventDates = events.map(e => new Date(e.date));

  // Get selected date details
  const selectedAssignments = selectedDate
    ? assignments.filter(a => isSameDay(new Date(a.date), selectedDate))
    : [];

  const selectedAvailability = selectedDate
    ? availabilities.filter(a => isSameDay(new Date(a.date), selectedDate))
    : [];

  const selectedEvents = selectedDate
    ? events.filter(e => isSameDay(new Date(e.date), selectedDate))
    : [];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_400px]">
      {/* Calendar */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">My Calendar</CardTitle>
          <CardDescription className="text-base">
            View your assignments and availability in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border"
            modifiers={{
              assignment: assignmentDates,
              availability: availabilityDates,
              event: eventDates,
            }}
            modifiersClassNames={{
              assignment: "has-assignment",
              availability: "has-availability",
              event: "has-event",
            }}
          />
          <style jsx global>{`
            .has-assignment,
            .has-availability,
            .has-event {
              position: relative;
            }
            .has-assignment::after,
            .has-availability::after,
            .has-event::after {
              content: '';
              position: absolute;
              bottom: 2px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
            .has-assignment::after {
              background-color: hsl(var(--primary));
              left: calc(50% - 3px);
            }
            .has-availability::after {
              background-color: #22c55e;
              left: calc(50% - 3px);
            }
            .has-event::after {
              background-color: #f97316;
              left: calc(50% - 3px);
            }
            .has-assignment.has-availability::after {
              left: calc(50% - 8px);
            }
            .has-assignment.has-availability::before {
              content: '';
              position: absolute;
              bottom: 2px;
              left: calc(50% + 2px);
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #22c55e;
            }
            .has-assignment.has-event::after {
              left: calc(50% - 8px);
            }
            .has-assignment.has-event::before {
              content: '';
              position: absolute;
              bottom: 2px;
              left: calc(50% + 2px);
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #f97316;
            }
            .has-availability.has-event::after {
              left: calc(50% - 8px);
            }
            .has-availability.has-event::before {
              content: '';
              position: absolute;
              bottom: 2px;
              left: calc(50% + 2px);
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #f97316;
            }
          `}</style>
        </CardContent>
        <CardContent className="pt-4 border-t">
          <div className="flex gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-sm text-muted-foreground">Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-muted-foreground">Availability Submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-sm text-muted-foreground">Event</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assignments */}
            {selectedAssignments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Assignments</h3>
                </div>
                {selectedAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">{assignment.time}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Availability */}
            {selectedAvailability.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold">Availability</h3>
                </div>
                {selectedAvailability.map((avail) => (
                  <div key={avail.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 space-y-2">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Submitted</p>
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                      {avail.time === "7am-9am" ? "7am - 9am" : avail.time}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Events */}
            {selectedEvents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold">Events</h3>
                </div>
                {selectedEvents.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20 space-y-2">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No items */}
            {selectedAssignments.length === 0 && selectedAvailability.length === 0 && selectedEvents.length === 0 && selectedDate && (
              <div className="py-8 text-center text-muted-foreground">
                <p>No assignments, availability, or events for this date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Assignments</span>
              <Badge variant="default">{assignments.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Availability Submitted</span>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                {availabilities.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
