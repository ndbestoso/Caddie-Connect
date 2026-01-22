"use client";

import * as React from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
}

function formatAnnouncementContent(content: string) {
  const lines = content.split('\n');
  const formatted: React.ReactElement[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      formatted.push(
        <ul key={`list-${formatted.length}`} className="list-disc list-inside space-y-1 my-2">
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
    } else {
      flushList();
      if (trimmed) {
        formatted.push(
          <p key={`p-${index}`} className="my-2">
            {trimmed}
          </p>
        );
      }
    }
  });

  flushList();
  return formatted;
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-7 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-7 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Broadcast Announcements</h2>
        <p className="text-muted-foreground text-base">
          Updates and important notices from the caddiemaster.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((item) => (
            <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1.5 whitespace-nowrap">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.date), "MMM d, yyyy")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="text-muted-foreground leading-relaxed announcement-content"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-none shadow-sm">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No announcements at this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
