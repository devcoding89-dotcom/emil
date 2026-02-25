"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Rocket } from "lucide-react";
import type { ContactList, Campaign } from "@/lib/types";
import PageHeader from "@/components/page-header";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  useAuthGuard();
  const { user, loading: userLoading } = useUser();
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalLists, setTotalLists] = useState(0);

  useEffect(() => {
    if (user) {
      try {
        const storedLists = localStorage.getItem("contact-lists");
        if (storedLists) {
          const lists: ContactList[] = JSON.parse(storedLists);
          const contactsCount = lists.reduce(
            (acc, list) => acc + list.contacts.length,
            0
          );
          setTotalLists(lists.length);
          setTotalContacts(contactsCount);
        }

        const storedCampaigns = localStorage.getItem("campaigns");
        if (storedCampaigns) {
          const campaigns: Campaign[] = JSON.parse(storedCampaigns);
          setTotalCampaigns(campaigns.length);
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
      }
    }
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Dashboard"
          description="An overview of your EmailCraft Studio activity."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-1" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saved Campaigns
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Get Started</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-1" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Dashboard"
        description="An overview of your EmailCraft Studio activity."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalLists} list(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Ready to be edited or sent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Get Started</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Ready to launch?</div>
            <p className="text-xs text-muted-foreground">
              Create a new campaign and reach your audience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
