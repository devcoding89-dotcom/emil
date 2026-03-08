"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Rocket, AlertTriangle, CheckCircle2, BarChart3, Loader2, Target, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const parsesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "parses"));
  }, [db, user]);

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "campaigns"));
  }, [db, user]);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "contacts"));
  }, [db, user]);

  const { data: parses, isLoading: parsesLoading } = useCollection(parsesQuery);
  const { data: campaigns, isLoading: campaignsLoading } = useCollection(campaignsQuery);
  const { data: contacts, isLoading: contactsLoading } = useCollection(contactsQuery);

  const stats = useMemo(() => {
    if (!contacts) return { total: 0, valid: 0, invalid: 0 };
    return {
      total: contacts.length,
      valid: contacts.filter(c => c.isValid).length,
      invalid: contacts.filter(c => c.isValid === false).length,
    };
  }, [contacts]);

  const chartData = useMemo(() => [
    { name: "Verified", value: stats.valid, fill: "hsl(var(--primary))" },
    { name: "Pending", value: stats.total - stats.valid - stats.invalid, fill: "hsl(var(--muted))" },
    { name: "Flagged", value: stats.invalid, fill: "hsl(var(--destructive))" },
  ], [stats]);

  const chartConfig = {
    value: { label: "Recipients" },
  };

  if (isUserLoading || parsesLoading || campaignsLoading || contactsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-7xl">
      <PageHeader
        title="Studio Insights"
        description={`Welcome back, ${user?.displayName || 'User'}. Your sender reputation is currently stable.`}
      />
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Audience" 
          value={stats.total.toLocaleString()} 
          label="Unique verified leads" 
          icon={<Users className="h-4 w-4 text-primary" />} 
        />
        <StatCard 
          title="AI Intelligence" 
          value={(parses?.length || 0).toString()} 
          label="Successful extractions" 
          icon={<Target className="h-4 w-4 text-accent" />} 
        />
        <StatCard 
          title="Active Outreach" 
          value={(campaigns?.length || 0).toString()} 
          label="Managed campaigns" 
          icon={<Rocket className="h-4 w-4 text-primary" />} 
        />
        <StatCard 
          title="Delivery Trust" 
          value={`${stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 100}%`} 
          label="Verified email percentage" 
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} 
          className="text-green-600"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 order-2 lg:order-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Audience Health</CardTitle>
            </div>
            <CardDescription>Real-time breakdown of your database verification status.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[400px] pt-4">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                   stroke="hsl(var(--muted-foreground))" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 order-1 lg:order-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Growth Strategy</CardTitle>
            </div>
            <CardDescription>Optimization steps for your outreach studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             {stats.total > 0 && stats.valid / stats.total < 0.9 && (
              <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="mt-1 rounded-full bg-amber-100 dark:bg-amber-900 p-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Cleaning Recommended</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">You have {stats.total - stats.valid} unverified contacts. Clean your list in the <Link href="/contacts" className="font-bold underline">Intelligence</Link> panel.</p>
                </div>
              </div>
            )}
            
            <ActionCard 
              icon={<Mail className="h-4 w-4" />}
              title="Ready for Launch"
              description={`You have ${stats.valid} verified leads ready for immediate high-performance outreach.`}
              linkText="Draft Campaign"
              href="/campaigns/new"
            />
            
            <ActionCard 
              icon={<Users className="h-4 w-4" />}
              title="Scale Audience"
              description="Use the AI Extract tool to find more qualified leads from your existing data sources."
              linkText="Open Extractor"
              href="/extract"
              variant="accent"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, label, icon, className }: { title: string; value: string; label: string; icon: React.ReactNode; className?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-black", className)}>{value}</div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon, title, description, linkText, href, variant = "primary" }: { icon: React.ReactNode; title: string; description: string; linkText: string; href: string; variant?: "primary" | "accent" }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 border-border/50">
      <div className={cn(
        "mt-1 rounded-full p-2",
        variant === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
        <Button size="sm" variant="link" asChild className="p-0 h-auto text-xs mt-2 font-bold">
          <Link href={href}>{linkText} →</Link>
        </Button>
      </div>
    </div>
  );
}
