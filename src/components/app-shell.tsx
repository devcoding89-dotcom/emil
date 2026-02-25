'use client';

import { Sidebar } from '@/components/sidebar';
import React from 'react';
import { UserNav } from './user-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft, AlertTriangle } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import { useUser, useAuth } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (user && auth && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox to verify your email address.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error sending verification',
          description: 'There was a problem sending the verification email. Please try again.',
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <MobileNav />
            </SheetContent>
          </Sheet>
          
          <div className="relative ml-auto flex-1 md:grow-0">
             {/* Future search bar can go here */}
          </div>
          <UserNav />
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {user && !user.emailVerified && !loading && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verify Your Email Address</AlertTitle>
              <AlertDescription>
                Please check your inbox for a verification link. Not there?{' '}
                <Button variant="link" className="p-0 h-auto font-semibold text-destructive" onClick={handleResendVerification}>
                  Resend verification email.
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
