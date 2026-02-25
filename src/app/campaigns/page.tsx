"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Campaign } from "@/lib/types";
import { CampaignCard } from "./components/campaign-card";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function CampaignsPage() {
  useAuthGuard();
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>("campaigns", []);

  const handleDelete = (id: string) => {
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };
  
  const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Campaigns"
        description="Manage your saved email campaigns."
      >
        <Button asChild size="sm">
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </PageHeader>

      {sortedCampaigns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-8 text-center">
          <h3 className="text-xl font-semibold tracking-tight">
            No Campaigns Yet
          </h3>
          <p className="text-muted-foreground">
            Get started by creating a new campaign.
          </p>
          <Button asChild className="mt-4">
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
