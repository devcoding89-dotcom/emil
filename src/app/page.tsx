"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Rocket, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import type { ContactList, Campaign } from "@/lib/types";
import PageHeader from "@/components/page-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

export default function DashboardPage() {
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalLists, setTotalLists] = useState(0);
  const [validContacts, setValidContacts] = useState(0);
  const [invalidContacts, setInvalidContacts] = useState(0);

  useEffect(() => {
    try {
      const storedLists = localStorage.getItem("contact-lists");
      if (storedLists) {
        const lists: ContactList[] = JSON.parse(storedLists);
        let contactsCount = 0;
        let validCount = 0;
        let invalidCount = 0;

        lists.forEach(list => {
          contactsCount += list.contacts.length;
          list.contacts.forEach(contact => {
            if (contact.isValid === true) validCount++;
            if (contact.isValid === false) invalidCount++;
          });
        });

        setTotalLists(lists.length);
        setTotalContacts(contactsCount);
        setValidContacts(validCount);
        setInvalidContacts(invalidCount);
      }

      const storedCampaigns = localStorage.getItem("campaigns");
      if (storedCampaigns) {
        const campaigns: Campaign[] = JSON.parse(storedCampaigns);
        setTotalCampaigns(campaigns.length);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  const chartData = useMemo(() => [
    { name: "Valid", value: validContacts, fill: "hsl(var(--primary))" },
    { name: "Invalid", value: invalidContacts, fill: "hsl(var(--destructive))" },
    { name: "Unverified", value: totalContacts - validContacts - invalidContacts, fill: "hsl(var(--muted))" },
  ], [validContacts, invalidContacts, totalContacts]);

  const chartConfig = {
    value: {
      label: "Contacts",
    },
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Analytics Dashboard"
        description="A real-time overview of your EmailCraft Studio performance and data health."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalLists} managed list(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Drafts and active dispatches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Invalid Emails</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{invalidContacts}</div>
            <p className="text-xs text-muted-foreground">
              Failed verification checks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalContacts > 0 ? Math.round((validContacts / totalContacts) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of healthy emails
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Contact Health Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of valid vs. invalid email addresses in your database.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                   stroke="hsl(var(--muted-foreground))" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => `${value}`}
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

        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <CardTitle>Next Steps</CardTitle>
            </div>
            <CardDescription>Get the most out of EmailCraft Studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Draft a Campaign</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Use AI to generate engaging subjects and bodies for your next outreach.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-accent/10 p-2 text-accent-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Expand Your Lists</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Extract new leads from raw text or LinkedIn profiles intelligently.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Clean Your Data</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Regularly validate your contacts to keep your sender reputation high.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
