"use client";

import * as React from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface AvailabilityData {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  times: string[];
  createdAt: string;
}

export function AvailabilityManagement() {
  const [availabilities, setAvailabilities] = React.useState<AvailabilityData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchEmail, setSearchEmail] = React.useState("");

  React.useEffect(() => {
    const availabilityRef = collection(db, "availability");
    const q = query(availabilityRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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
  }, []);

  const filteredAvailabilities = availabilities.filter((item) =>
    searchEmail ? item.userEmail.toLowerCase().includes(searchEmail.toLowerCase()) : true
  );

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">All Caddie Availability</CardTitle>
        <CardDescription className="text-base">
          View all caddie availability submissions across all dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="max-w-sm h-10"
        />
        <div className="border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caddie Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time Preferences</TableHead>
                  <TableHead className="text-right">Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvailabilities.length > 0 ? (
                  filteredAvailabilities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.userEmail}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.date), "EEE, MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.times.map((time) => (
                            <Badge key={time} variant="secondary">
                              {time === "7am-9am" ? "7am - 9am" : time}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {searchEmail
                        ? "No availability found for this search."
                        : "No availability submissions yet."}
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
