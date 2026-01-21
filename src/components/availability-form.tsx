"use client";

import * as React from "react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedDates, setSubmittedDates] = React.useState<Date[]>([]);

  // Get current week's days
  const getCurrentWeekDays = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
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

  // Filter submitted dates: locked if passed or within 8 hours
  const now = new Date();
  const eightHoursFromNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const lockedDates = submittedDates.filter((date) => date <= eightHoursFromNow || date < now);

  const handleTimeToggle = (timeId: string) => {
    setSelectedTimes((prev) =>
      prev.includes(timeId)
        ? prev.filter((t) => t !== timeId)
        : [...prev, timeId]
    );
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

    if (selectedTimes.length === 0) {
      toast({
        variant: "destructive",
        title: "No Times Selected",
        description: "Please select at least one time preference.",
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
        times: selectedTimes,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Availability Submitted",
        description: `You have submitted your availability for ${format(selectedDate, "EEE, MMM d")}.`,
      });
      // Reset form state after submission
      setSelectedDate(undefined);
      setSelectedTimes([]);
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
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
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                        "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                        isSelected && selectedTimes.length > 0
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
                <div className="space-y-4">
                  {TIME_OPTIONS.map((time) => (
                    <label
                      key={time.id}
                      htmlFor={time.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    >
                      <Checkbox
                        id={time.id}
                        checked={selectedTimes.includes(time.id)}
                        onCheckedChange={() => handleTimeToggle(time.id)}
                        className="h-5 w-5"
                      />
                      <span className="text-base flex-1">{time.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Display selected day to the right of times */}
              {selectedDate && (
                <div className="w-full lg:w-auto space-y-4">
                <h3 className="font-semibold text-card-foreground">
                  Selected Day
                </h3>
                <div className="rounded-md border p-4 bg-muted/50 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Day:</p>
                    <Badge variant="secondary" className="text-base">
                      {format(selectedDate, "EEE, MMM d, yyyy")}
                    </Badge>
                  </div>

                  {/* Show status of the day */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold mb-2">Day Status:</p>
                    {submittedDates.some(
                      (date) => format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                    ) ? (
                      <div className="space-y-2">
                        {lockedDates.some(
                          (date) => format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                        ) ? (
                          <p className="text-sm text-muted-foreground">
                            ✓ Availability submitted (Locked - within 8 hours or passed)
                          </p>
                        ) : (
                          <p className="text-sm text-green-600">
                            ✓ Availability already submitted for this day
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No availability submitted yet
                      </p>
                    )}
                  </div>

                  {selectedTimes.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold mb-2">Selected Times:</p>
                      <div className="flex flex-wrap gap-2">
                        {TIME_OPTIONS.filter((t) => selectedTimes.includes(t.id)).map(
                          (time) => (
                            <Badge key={time.id} variant="outline">
                              {time.label}
                            </Badge>
                          )
                        )}
                      </div>
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
