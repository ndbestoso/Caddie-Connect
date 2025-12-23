"use client";

import * as React from "react";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const availableDates = submittedDates.filter((date) => date > eightHoursFromNow);

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
          Select the day you are available to work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              modifiers={{
                submitted: availableDates,
                locked: lockedDates,
              }}
              modifiersClassNames={{
                submitted: "bg-green-500 text-white hover:bg-green-600",
                locked: "bg-green-500 text-white line-through hover:bg-green-600",
              }}
              classNames={{
                day_selected: selectedTimes.length > 0
                  ? "bg-green-500 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white"
                  : "bg-red-500 text-white hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white",
              }}
            />
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

          <Button type="submit" variant="destructive" size="lg" className="h-11 text-base font-medium" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Availability"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
