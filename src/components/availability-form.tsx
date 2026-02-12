"use client";

import * as React from "react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarCheck } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
}

const TIME_OPTIONS = [
  { id: "7am-9am", label: "7am - 9am" },
  { id: "10am", label: "10am" },
  { id: "11am", label: "11am" },
  { id: "12pm", label: "12pm" },
];

export function AvailabilityForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined
  );
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedDates, setSubmittedDates] = React.useState<Date[]>([]);
  const [availabilityData, setAvailabilityData] = React.useState<Record<string, string>>({});
  const [events, setEvents] = React.useState<EventData[]>([]);

  // Get current week's days (Sunday to Sunday)
  // Rotates to next week on Saturday at 15:00 EST
  const getCurrentWeekDays = () => {
    const now = new Date();

    // Convert to EST/EDT (America/New_York timezone)
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const dayOfWeek = estTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = estTime.getHours();

    // If it's Saturday (6) and time is >= 15:00 EST, show next week
    const shouldShowNextWeek = dayOfWeek === 6 && hour >= 15;

    let weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

    // If we should show next week, advance by 7 days
    if (shouldShowNextWeek) {
      weekStart = addDays(weekStart, 7);
    }

    return Array.from({ length: 8 }, (_, i) => addDays(weekStart, i));
  };

  const weekDays = getCurrentWeekDays();

  // Fetch user's submitted availability dates
  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "availability"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dates = snapshot.docs.map((doc) => new Date(doc.data().date));
        setSubmittedDates(dates);

        // Store availability data with date as key and time as value
        const availData: Record<string, string> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const dateKey = format(new Date(data.date), "yyyy-MM-dd");
          availData[dateKey] = data.time || "";
        });
        setAvailabilityData(availData);
      },
      (error) => {
        console.error("Error fetching availability:", error);
        toast({
          variant: "destructive",
          title: "Failed to load availability",
          description: "Please make sure Firestore rules are deployed.",
        });
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

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

    return () => unsubscribe();
  }, []);

  // Filter submitted dates: locked if passed or within 8 hours
  const now = new Date();
  const eightHoursFromNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const lockedDates = submittedDates.filter((date) => date <= eightHoursFromNow || date < now);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Check if this date has existing availability data
    const dateKey = format(date, "yyyy-MM-dd");
    const existingTime = availabilityData[dateKey];
    if (existingTime) {
      setSelectedTime(existingTime);
    } else {
      setSelectedTime("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "No Date Selected",
        description: "Please select a day from the calendar.",
      });
      return;
    }

    if (!selectedTime) {
      toast({
        variant: "destructive",
        title: "No Time Selected",
        description: "Please select a time preference.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Please sign in to submit availability.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "availability"), {
        userId: user.uid,
        userEmail: user.email,
        date: selectedDate.toISOString(),
        time: selectedTime,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Availability Submitted",
        description: `You have submitted your availability for ${format(selectedDate, "EEE, MMM d")}.`,
      });
      // Reset form state after submission
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to save availability.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">Submit Your Availability</CardTitle>
        <CardDescription className="text-base">
          Select a day from the current week that you are available to work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-8">
            {/* Week View */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-card-foreground">
                Select a Day (Current Week)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {weekDays.map((day) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = day < today;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isSubmitted = submittedDates.some((date) =>
                    format(date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  );
                  const isLocked = lockedDates.some((date) =>
                    format(date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  );

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                        "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                        isSelected && selectedTime
                          ? "bg-green-500 text-white border-green-600 shadow-md"
                          : isSelected
                          ? "bg-red-500 text-white border-red-600 shadow-md"
                          : isSubmitted && !isLocked
                          ? "bg-green-100 border-green-500 text-green-900"
                          : isLocked
                          ? "bg-green-100 border-green-500 text-green-900 line-through"
                          : isToday(day)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted/50"
                      )}
                    >
                      <span className="text-xs font-medium uppercase mb-1">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-2xl font-bold">
                        {format(day, "d")}
                      </span>
                      {isSubmitted && (
                        <span className="text-xs mt-1">
                          {isLocked ? "Locked" : "Submitted"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection and Selected Day Summary */}
            <div className="flex flex-col items-start gap-8 lg:flex-row">
              <div className="w-full space-y-4 lg:w-auto">
                <h3 className="font-semibold text-lg text-card-foreground">
                  Time Preference
                </h3>
                <RadioGroup value={selectedTime} onValueChange={setSelectedTime}>
                  <div className="space-y-4">
                    {TIME_OPTIONS.map((time) => (
                      <div
                        key={time.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                      >
                        <RadioGroupItem value={time.id} id={time.id} className="h-5 w-5" />
                        <Label htmlFor={time.id} className="text-base flex-1 cursor-pointer">
                          {time.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Display selected day to the right of times */}
              {selectedDate && (
                <div className="w-full lg:w-auto space-y-4">
                <h3 className="font-semibold text-card-foreground">
                  Selected Day
                </h3>
                <div className={cn(
                  "rounded-xl border-2 p-6 space-y-4 transition-all shadow-lg",
                  selectedTime
                    ? "bg-green-50 border-green-400 shadow-green-200/50"
                    : "bg-red-50 border-red-400 shadow-red-200/50"
                )}>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Day:</p>
                    <Badge variant="secondary" className="text-base">
                      {format(selectedDate, "EEE, MMM d, yyyy")}
                    </Badge>
                  </div>

                  {/* Events for selected day */}
                  {(() => {
                    const dayEvents = events.filter(
                      (event) => format(new Date(event.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                    );
                    return dayEvents.length > 0 ? (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <CalendarCheck className="h-4 w-4" />
                          Events:
                        </p>
                        <div className="space-y-2">
                          {dayEvents.map((event) => (
                            <div key={event.id} className="bg-white/60 rounded-md p-2">
                              <p className="font-medium text-sm">{event.title}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{event.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {selectedTime && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold mb-2">Selected Time:</p>
                      <Badge variant="outline">
                        {TIME_OPTIONS.find((t) => t.id === selectedTime)?.label}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>

          <Button type="submit" variant="destructive" size="lg" className="h-11 text-base font-medium" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Availability"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
