'use client';

import { Sidebar } from '@/components/sidebar';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import { useGlobalLoading } from '@/hooks/use-global-loading';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, setIsLoading } = useGlobalLoading();
  const pathname = usePathname();

  // Trigger a brief loading state on navigation to show the rolling "E"
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Show for 600ms to allow animation to play
    return () => clearTimeout(timer);
  }, [pathname, setIsLoading]);

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
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300">
          <div className="animate-bounce">
            <div className="animate-spin duration-700">
               <span className="text-[14rem] font-black text-primary drop-shadow-[0_0_30px_rgba(51,51,230,0.3)] select-none">
                 E
               </span>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-2">
            <p className="text-2xl font-bold text-primary animate-pulse tracking-widest">
              EmailCraft
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">
              Studio
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
