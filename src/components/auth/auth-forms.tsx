"use client";

import * as React from "react";
import { SignUpForm } from "./sign-up-form";
import { SignInForm } from "./sign-in-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { GolfIcon } from "@/components/icons";
import { CalendarDays, Users, TrendingUp } from "lucide-react";

type FormView = "signin" | "signup" | "forgot";

export function AuthForms() {
  const [currentView, setCurrentView] = React.useState<FormView>("signin");

  const showSignIn = () => setCurrentView("signin");
  const showSignUp = () => setCurrentView("signup");
  const showForgotPassword = () => setCurrentView("forgot");

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding & Info */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 py-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <GolfIcon className="h-12 w-12" />
            <h1 className="text-4xl font-bold tracking-tight font-headline">
              Caddie Connect
            </h1>
          </div>

          <h2 className="text-3xl font-semibold mb-6">
            Streamline Your Caddie Operations
          </h2>

          <p className="text-lg text-primary-foreground/90 mb-12">
            The modern platform for managing caddie schedules, availability, and assignments all in one place.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Easy Scheduling</h3>
                <p className="text-primary-foreground/80">
                  Submit your availability and view your assignments in real-time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Team Communication</h3>
                <p className="text-primary-foreground/80">
                  Stay updated with announcements and important information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Efficient Management</h3>
                <p className="text-primary-foreground/80">
                  Streamlined workflow for coordinators and caddies alike
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <GolfIcon className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
              Caddie Connect
            </h1>
          </div>

          {currentView === "signup" && (
            <SignUpForm onToggleForm={showSignIn} />
          )}
          {currentView === "signin" && (
            <SignInForm onToggleForm={showSignUp} onForgotPassword={showForgotPassword} />
          )}
          {currentView === "forgot" && (
            <ForgotPasswordForm onBackToSignIn={showSignIn} />
          )}
        </div>
      </div>
    </div>
  );
}
