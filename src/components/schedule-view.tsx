"use client";

import * as React from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { type AssignmentData } from "@/lib/types/firestore";

export function ScheduleView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = React.useState<AssignmentData[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Your Assigned Schedule</CardTitle>
        <CardDescription className="text-base">
          Here are your upcoming work assignments from the caddiemaster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead className="w-[140px]">Arrival Time</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(new Date(item.date), "EEE, MMM d")}
                    </TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.notes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    You have no assignments at this time.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
