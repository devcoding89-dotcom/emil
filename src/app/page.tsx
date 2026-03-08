
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
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-Powered Outreach for Modern Studios</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            Extract Leads. <span className="text-primary">Verify </span> Accuracy. <br />
            <span className="text-accent">Personalize</span> at Scale.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl mb-10">
            EmailCraft Studio is the all-in-one workspace for identifying prospects from raw text, 
            verifying deliverability, and launching hyper-personalized email campaigns in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
              <Link href="/pricing">View Elite Pricing</Link>
            </Button>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 -z-10 h-full w-full opacity-30 dark:opacity-20">
          <div className="absolute top-1/2 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-primary blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-80 w-80 -translate-y-1/2 rounded-full bg-accent blur-[120px]" />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">Everything You Need to Scale</h2>
            <p className="text-muted-foreground">Built for serious marketing teams who value precision and speed.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={<Mailbox className="h-10 w-10 text-primary" />}
              title="AI Extraction"
              description="Paste raw text from LinkedIn, signatures, or lists. Our AI identifies names, roles, and emails instantly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-10 w-10 text-green-500" />}
              title="MX Verification"
              description="Auto-check mail server records to ensure your emails actually land in the inbox, not the void."
            />
            <FeatureCard 
              icon={<Zap className="h-10 w-10 text-amber-500" />}
              title="Dynamic Templates"
              description="Use {{firstName}} and {{company}} tokens to personalize content for thousands of recipients automatically."
            />
            <FeatureCard 
              icon={<Rocket className="h-10 w-10 text-primary" />}
              title="Batch Dispatch"
              description="Safe, rate-limited email delivery powered by industry-leading infrastructure. No SMTP setup required."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Launch in 4 Steps</h2>
          <div className="grid gap-12 lg:grid-cols-4 relative">
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-muted -z-10" />
            <Step 
              number="1" 
              title="Extract" 
              description="Identify unique leads from raw text or CSV imports." 
            />
            <Step 
              number="2" 
              title="Verify" 
              description="Clean your list with real-time domain verification." 
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
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionContent>
                Yes. Every account uses an isolated Firestore collection. Your contacts and campaigns are private and encrypted at rest.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do I need to connect my own email?</AccordionTrigger>
              <AccordionContent>
                No. EmailCraft Studio provides managed sending infrastructure. You just need to verify your business domain in Settings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How many emails can I send?</AccordionTrigger>
              <AccordionContent>
                The Free tier includes 50 AI extractions. Our Elite plan unlocks unlimited campaigns and high-volume sending limits.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            
            <h2 className="text-3xl font-bold sm:text-5xl mb-6">Ready to scale your outreach?</h2>
            <p className="mx-auto max-w-xl text-lg mb-10 opacity-90 text-primary-foreground/80">
              Join hundreds of studios automating their sales intelligence and closing more deals today.
            </p>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-xl font-bold" asChild>
              <Link href="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EmailCraft Studio. All rights reserved. Proudly built for modern sales teams.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center relative">
      <div className="mx-auto h-16 w-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-2xl font-black mb-6">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
