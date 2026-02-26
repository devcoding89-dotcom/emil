import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppShell } from "@/components/app-shell";
import { LoadingProvider } from "@/hooks/use-global-loading";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "EmailCraft Studio",
  description: "Craft and dispatch your email campaigns with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          <LoadingProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </LoadingProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
