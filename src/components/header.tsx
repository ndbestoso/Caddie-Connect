"use client";

import Link from "next/link";
import { LogOut, Shield, User } from "lucide-react";
import { GolfIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function Header() {
  const { signOut, user, userName } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
      <div className="flex items-center gap-3">
        <GolfIcon className="h-8 w-8 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
          Caddie Connect
        </h1>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="default" size="sm" className="h-9" asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-9 hidden md:flex" asChild>
            <Link href="/account">
              <User className="h-4 w-4 mr-2" />
              {userName || user.email}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-9">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      )}
    </header>
  );
}
