"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { GolfIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

export function AdminHeader() {
  const { signOut, user, userName } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
      <div className="flex items-center gap-3">
        <GolfIcon className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
            Admin Panel
          </h1>
          <Badge variant="destructive" className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Back to Caddie View</span>
            <span className="md:hidden">Back</span>
          </Button>
        </Link>
        {user && (
          <>
            <span className="text-sm text-muted-foreground hidden lg:inline">
              {userName || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="h-9">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
