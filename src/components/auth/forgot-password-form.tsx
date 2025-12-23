"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
}

export function ForgotPasswordForm({ onBackToSignIn }: ForgotPasswordFormProps) {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      toast({
        title: "Password reset email sent",
        description: "Please check your inbox for the password reset link.",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={onBackToSignIn}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sign In
      </Button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Reset password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Email"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
