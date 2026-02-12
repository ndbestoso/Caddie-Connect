"use client";

import * as React from "react";
import { SignUpForm } from "./sign-up-form";
import { SignInForm } from "./sign-in-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { GolfIcon } from "@/components/icons";

type FormView = "signin" | "signup" | "forgot";

export function AuthForms() {
  const [currentView, setCurrentView] = React.useState<FormView>("signin");

  const showSignIn = () => setCurrentView("signin");
  const showSignUp = () => setCurrentView("signup");
  const showForgotPassword = () => setCurrentView("forgot");

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
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
  );
}
