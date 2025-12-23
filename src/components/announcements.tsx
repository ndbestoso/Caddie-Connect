"use client";

import * as React from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
}

export function Announcements() {
  const [announcements, setAnnouncements] = React.useState<AnnouncementData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const announcementsRef = collection(db, "announcements");
    const q = query(
      announcementsRef,
      where("isActive", "==", true),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnnouncementData[];
        setAnnouncements(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching announcements:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

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
        <CardTitle className="text-2xl">Broadcast Announcements</CardTitle>
        <CardDescription className="text-base">
          Updates and important notices from the caddiemaster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {announcements.length > 0 ? (
            announcements.map((item) => (
              <AccordionItem value={item.id} key={item.id} className="border rounded-lg px-1">
                <AccordionTrigger className="rounded-lg px-4 hover:bg-muted/50 data-[state=open]:bg-muted/50 py-4">
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="font-semibold text-left text-base">{item.title}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-1 pb-4 text-muted-foreground">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No announcements at this time.
            </p>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
