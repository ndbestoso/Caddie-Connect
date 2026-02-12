"use client";

import * as React from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type SortColumn = "name" | "date";
type SortDirection = "asc" | "desc";

interface AvailabilityData {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  time: string;
  createdAt: string;
}

interface UserData {
  firstName?: string;
  lastName?: string;
}

export function AvailabilityManagement() {
  const [availabilities, setAvailabilities] = React.useState<AvailabilityData[]>([]);
  const [users, setUsers] = React.useState<Record<string, UserData>>({});
  const [loading, setLoading] = React.useState(true);
  const [searchName, setSearchName] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  React.useEffect(() => {
    const availabilityRef = collection(db, "availability");
    const q = query(availabilityRef, orderBy("date", "asc"));

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

  React.useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const userData: Record<string, UserData> = {};
        snapshot.docs.forEach(doc => {
          userData[doc.id] = doc.data() as UserData;
        });
        setUsers(userData);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return unsubscribe;
  }, []);

  const getUserName = (userId: string, email: string) => {
    const user = users[userId];
    if (user && (user.firstName || user.lastName)) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return email;
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const filteredAndSortedAvailabilities = availabilities
    .filter((item) => {
      if (!searchName) return true;
      const name = getUserName(item.userId, item.userEmail);
      return name.toLowerCase().includes(searchName.toLowerCase());
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "name") {
        const nameA = getUserName(a.userId, a.userEmail).toLowerCase();
        const nameB = getUserName(b.userId, b.userEmail).toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortColumn === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

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
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="max-w-sm h-10"
        />
        <div className="border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 px-2 -ml-2 font-medium"
                    >
                      Caddie Name
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="h-8 px-2 -ml-2 font-medium"
                    >
                      Date
                      {getSortIcon("date")}
                    </Button>
                  </TableHead>
                  <TableHead>Time Preferences</TableHead>
                  <TableHead className="text-right">Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAvailabilities.length > 0 ? (
                  filteredAndSortedAvailabilities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getUserName(item.userId, item.userEmail)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.date), "EEE, MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.time === "7am-9am" ? "7am - 9am" : item.time}
                        </Badge>
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
                      {searchName
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
