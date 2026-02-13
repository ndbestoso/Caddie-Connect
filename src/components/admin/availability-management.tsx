"use client";

import * as React from "react";
import { collection, query, orderBy, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type AvailabilityData, type UserDoc, type AssignmentData, TIME_SLOTS, ASSIGNMENT_TYPES } from "@/lib/types/firestore";

// Get the "current" week start (with Saturday 15:00 EST rotation)
function getBaseWeekStart() {
  const now = new Date();
  const estTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const dayOfWeek = estTime.getDay();
  const hour = estTime.getHours();
  const shouldShowNextWeek = dayOfWeek === 6 && hour >= 15;

  let weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  if (shouldShowNextWeek) {
    weekStart = addDays(weekStart, 7);
  }
  return weekStart;
}

// Get week days for a given offset from the base week (0 = current, -1 = last week, etc.)
function getWeekDays(weekOffset: number) {
  const base = getBaseWeekStart();
  const weekStart = addDays(base, weekOffset * 7);
  return Array.from({ length: 8 }, (_, i) => addDays(weekStart, i));
}

export function AvailabilityManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availabilities, setAvailabilities] = React.useState<AvailabilityData[]>([]);
  const [users, setUsers] = React.useState<Record<string, UserDoc>>({});
  const [assignments, setAssignments] = React.useState<AssignmentData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchName, setSearchName] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [sortColumn, setSortColumn] = React.useState<"name" | "time" | "timeAssigned">("name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignCaddie, setAssignCaddie] = React.useState<AvailabilityData | null>(null);
  const [assignTime, setAssignTime] = React.useState("");
  const [assignNotes, setAssignNotes] = React.useState("");
  const [assignType, setAssignType] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const weekDays = getWeekDays(weekOffset);

  // Scope availability query to the displayed week range
  React.useEffect(() => {
    const days = getWeekDays(weekOffset);
    const weekStart = new Date(days[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(days[days.length - 1]);
    weekEnd.setHours(23, 59, 59, 999);

    const availabilityRef = collection(db, "availability");
    const q = query(
      availabilityRef,
      where("date", ">=", weekStart.toISOString()),
      where("date", "<=", weekEnd.toISOString()),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AvailabilityData[];
        setAvailabilities(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching availability:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [weekOffset]);

  React.useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userData: Record<string, UserDoc> = {};
        snapshot.docs.forEach((doc) => {
          userData[doc.id] = doc.data() as UserDoc;
        });
        setUsers(userData);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return unsubscribe;
  }, []);

  // Scope assignments query to the displayed week range
  React.useEffect(() => {
    const days = getWeekDays(weekOffset);
    const weekStart = new Date(days[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(days[days.length - 1]);
    weekEnd.setHours(23, 59, 59, 999);

    const assignmentsRef = collection(db, "assignments");
    const q = query(
      assignmentsRef,
      where("date", ">=", weekStart.toISOString()),
      where("date", "<=", weekEnd.toISOString()),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AssignmentData[];
        setAssignments(data);
      },
      (error) => {
        console.error("Error fetching assignments:", error);
      }
    );

    return unsubscribe;
  }, [weekOffset]);

  const getUserName = (userId: string, email: string) => {
    const user = users[userId];
    if (user && (user.firstName || user.lastName)) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return email;
  };

  // Count availabilities per day for the week view
  const getCountForDay = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return availabilities.filter(
      (a) => format(new Date(a.date), "yyyy-MM-dd") === dayKey
    ).length;
  };

  const TIME_ORDER: string[] = [...TIME_SLOTS];

  const handleSort = (column: "name" | "time" | "timeAssigned") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Returns true if it's past 10pm EST the night before the given date
  const isPastAssignmentCutoff = (date: Date) => {
    const now = new Date();
    const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    // Cutoff is 10pm EST the day before
    const cutoff = new Date(date);
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(22, 0, 0, 0);
    return estNow >= cutoff;
  };

  const isCaddieAssigned = (caddieId: string, date: Date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    return assignments.some(
      (a) => a.caddieId === caddieId && format(new Date(a.date), "yyyy-MM-dd") === dayKey
    );
  };

  const getAssignedTime = (userId: string, date: Date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    const assignment = assignments.find(
      (a) => a.caddieId === userId && format(new Date(a.date), "yyyy-MM-dd") === dayKey
    );
    return assignment ? (assignment.time || "") : "";
  };

  const openAssignDialog = (item: AvailabilityData) => {
    setAssignCaddie(item);
    setAssignTime("");
    setAssignNotes("");
    setAssignType("");
    setAssignDialogOpen(true);
  };

  const handleCreateAssignment = async () => {
    if (!user || !assignCaddie || !selectedDate || !assignTime) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "assignments"), {
        caddieId: assignCaddie.userId,
        caddieEmail: assignCaddie.userEmail,
        date: selectedDate.toISOString(),
        time: assignTime,
        notes: assignNotes,
        ...(assignType ? { assignment: assignType } : {}),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Assignment created",
        description: `Assignment created for ${getUserName(assignCaddie.userId, assignCaddie.userEmail)}.`,
      });

      setAssignDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create assignment",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get caddies available for the selected day, filtered by search and sorted
  const caddiesForSelectedDay = React.useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, "yyyy-MM-dd");
    return availabilities
      .filter((a) => format(new Date(a.date), "yyyy-MM-dd") === dayKey)
      .filter((a) => {
        if (!searchName) return true;
        const name = getUserName(a.userId, a.userEmail);
        return name.toLowerCase().includes(searchName.toLowerCase());
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortColumn === "name") {
          const nameA = getUserName(a.userId, a.userEmail).toLowerCase();
          const nameB = getUserName(b.userId, b.userEmail).toLowerCase();
          comparison = nameA.localeCompare(nameB);
        } else if (sortColumn === "time") {
          const indexA = TIME_ORDER.indexOf(a.time);
          const indexB = TIME_ORDER.indexOf(b.time);
          comparison = (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        } else if (sortColumn === "timeAssigned" && selectedDate) {
          const timeA = getAssignedTime(a.userId, selectedDate);
          const timeB = getAssignedTime(b.userId, selectedDate);
          const indexA = timeA ? TIME_ORDER.indexOf(timeA) : 999;
          const indexB = timeB ? TIME_ORDER.indexOf(timeB) : 999;
          comparison = (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [availabilities, selectedDate, searchName, users, sortColumn, sortDirection]);

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">All Caddie Availability</CardTitle>
        <CardDescription className="text-base">
          Select a day to view which caddies are available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week View */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-card-foreground">
              {format(weekDays[0], "MMM d")} – {format(weekDays[7], "MMM d, yyyy")}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setWeekOffset(weekOffset - 1); setSelectedDate(undefined); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {weekOffset !== 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setWeekOffset(0); setSelectedDate(undefined); }}
                >
                  This Week
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setWeekOffset(weekOffset + 1); setSelectedDate(undefined); }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {weekDays.map((day) => {
              const count = getCountForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayKey = format(day, "yyyy-MM-dd");
              const hasAssignments = assignments.some(
                (a) => format(new Date(a.date), "yyyy-MM-dd") === dayKey
              );
              const closed = isPastAssignmentCutoff(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    "hover:shadow-md",
                    isSelected && hasAssignments
                      ? "bg-green-500 text-white border-green-600 shadow-md"
                      : isSelected && closed
                      ? "bg-red-500 text-white border-red-600 shadow-md"
                      : isSelected
                      ? "bg-green-500 text-white border-green-600 shadow-md"
                      : closed
                      ? "bg-red-100 border-red-400 text-red-900"
                      : count > 0
                      ? "bg-green-100 border-green-500 text-green-900"
                      : isToday(day)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <span className="text-xs font-medium uppercase mb-1">
                    {format(day, "EEE")}
                  </span>
                  <span className="text-2xl font-bold">{format(day, "d")}</span>
                  {count > 0 && (
                    <span className="text-xs mt-1 font-medium">
                      {count} {count === 1 ? "caddie" : "caddies"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-semibold text-lg text-card-foreground">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <Input
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="max-w-sm h-10"
              />
            </div>

            {caddiesForSelectedDay.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">
                        <Button variant="ghost" onClick={() => handleSort("name")} className="h-8 px-2 -ml-2 font-medium">
                          Name
                          {sortColumn === "name" ? (
                            sortDirection === "asc" ? <ArrowUp className="ml-1.5 h-4 w-4" /> : <ArrowDown className="ml-1.5 h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="ml-1.5 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[20%]">
                        <Button variant="ghost" onClick={() => handleSort("time")} className="h-8 px-2 -ml-2 font-medium">
                          Time Submitted
                          {sortColumn === "time" ? (
                            sortDirection === "asc" ? <ArrowUp className="ml-1.5 h-4 w-4" /> : <ArrowDown className="ml-1.5 h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="ml-1.5 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[20%]">
                        <Button variant="ghost" onClick={() => handleSort("timeAssigned")} className="h-8 px-2 -ml-2 font-medium">
                          Time Assigned
                          {sortColumn === "timeAssigned" ? (
                            sortDirection === "asc" ? <ArrowUp className="ml-1.5 h-4 w-4" /> : <ArrowDown className="ml-1.5 h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="ml-1.5 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[30%] text-right">Set Assignment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caddiesForSelectedDay.map((item) => {
                      const assigned = isCaddieAssigned(item.userId, selectedDate);
                      const locked = isPastAssignmentCutoff(selectedDate);
                      return (
                        <TableRow key={item.id} className="h-14">
                          <TableCell className="font-medium text-sm">
                            {getUserName(item.userId, item.userEmail)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-sm",
                                assigned
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              )}
                            >
                              {item.time === "7am-9am" ? "7am - 9am" : item.time}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const assignedTime = getAssignedTime(item.userId, selectedDate);
                              return assignedTime ? (
                                <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 border-green-300">
                                  {assignedTime}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            {assigned ? (
                              <Button variant="outline" size="sm" className="h-8 w-[100px] pointer-events-none text-green-600 border-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Assigned
                              </Button>
                            ) : locked ? (
                              <Button variant="outline" size="sm" className="h-8 w-[100px] pointer-events-none text-muted-foreground" disabled>
                                Closed
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-[100px]"
                                onClick={() => openAssignDialog(item)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                {searchName
                  ? "No caddies found matching your search."
                  : "No caddies available for this day."}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              {assignCaddie && selectedDate && (
                <>Assign <strong>{getUserName(assignCaddie.userId, assignCaddie.userEmail)}</strong> for <strong>{format(selectedDate, "EEE, MMM d")}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Arrival Time</label>
              <Select value={assignTime} onValueChange={setAssignTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7am">7am</SelectItem>
                  <SelectItem value="8am">8am</SelectItem>
                  <SelectItem value="9am">9am</SelectItem>
                  <SelectItem value="10am">10am</SelectItem>
                  <SelectItem value="11am">11am</SelectItem>
                  <SelectItem value="12pm">12pm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment Type</label>
              <Select value={assignType} onValueChange={setAssignType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateAssignment}
              disabled={isSubmitting || !assignTime}
            >
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
