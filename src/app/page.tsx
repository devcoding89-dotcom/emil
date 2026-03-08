"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Mail, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Rocket, 
  Users, 
  BarChart3,
  Mailbox
} from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-20 lg:pt-32 lg:pb-32 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span>AI-Powered Outreach for Modern Studios</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6 leading-[1.1]">
            Extract Leads. <span className="text-primary">Verify </span> Accuracy. <br className="hidden sm:block" />
            <span className="text-accent">Personalize</span> at Scale.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-xl mb-10 px-2">
            EmailCraft Studio is the all-in-one workspace for identifying prospects from raw text, 
            verifying deliverability, and launching hyper-personalized email campaigns in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button size="lg" className="h-12 sm:h-14 px-8 text-base sm:text-lg font-bold w-full sm:w-auto" asChild>
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 sm:h-14 px-8 text-base sm:text-lg w-full sm:w-auto" asChild>
              <Link href="/pricing">View Elite Pricing</Link>
            </Button>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 -z-10 h-full w-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/2 rounded-full bg-primary blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] -translate-y-1/2 rounded-full bg-accent blur-[80px] sm:blur-[120px]" />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 tracking-tight">Everything You Need to Scale</h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">Built for serious marketing teams who value precision, speed, and clean data.</p>
          </div>
          <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={<Mailbox className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="AI Extraction"
              description="Paste raw text from LinkedIn, signatures, or lists. Our AI identifies names, roles, and emails instantly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />}
              title="MX Verification"
              description="Auto-check mail server records to ensure your emails actually land in the inbox, not the void."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />}
              title="Dynamic Templates"
              description="Use {{firstName}} and {{company}} tokens to personalize content for thousands of recipients automatically."
            />
            <FeatureCard 
              icon={<Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="Batch Dispatch"
              description="Safe, rate-limited email delivery powered by industry-leading infrastructure. No SMTP setup required."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center sm:text-5xl mb-12 sm:mb-20 tracking-tight">Launch in 4 Simple Steps</h2>
          <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-muted -z-10" />
            <Step 
              number="1" 
              title="Extract" 
              description="Identify unique leads from raw text or CSV imports using AI." 
            />
            <Step 
              number="2" 
              title="Verify" 
              description="Clean your list with real-time domain and syntax verification." 
            />
            <Step 
              number="3" 
              title="Craft" 
              description="Build reusable templates with personalization tags." 
            />
            <Step 
              number="4" 
              title="Dispatch" 
              description="Hit send and track your campaign's live progress." 
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-muted/20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8 sm:mb-12 tracking-tight">Questions & Answers</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base sm:text-lg">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Yes. Every account uses an isolated Firestore collection. Your contacts and campaigns are private and encrypted at rest.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base sm:text-lg">Do I need to connect my own email?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                No. EmailCraft Studio provides managed sending infrastructure. You just need to verify your business domain in Settings to start sending.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-base sm:text-lg">How many emails can I send?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                The Free tier includes 50 AI extractions. Our Elite plan unlocks unlimited campaigns and high-volume sending limits for serious growth.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-primary px-6 py-12 sm:py-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 sm:mb-6 tracking-tight">Ready to scale your outreach?</h2>
            <p className="mx-auto max-w-xl text-base sm:text-lg mb-8 sm:mb-10 opacity-90 text-primary-foreground/80">
              Join hundreds of studios automating their sales intelligence and closing more deals today.
            </p>
            <Button size="lg" variant="secondary" className="h-12 sm:h-14 px-10 text-lg sm:text-xl font-bold w-full sm:w-auto" asChild>
              <Link href="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t mt-auto px-4">
        <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EmailCraft Studio. All rights reserved. Built for modern sales teams.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center relative">
      <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl sm:text-2xl font-black mb-4 sm:mb-6 shadow-sm">
        {number}
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px] mx-auto">{description}</p>
    </div>
  );
}
