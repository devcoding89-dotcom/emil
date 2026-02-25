"use client";

import { CampaignForm } from "../components/campaign-form";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function NewCampaignPage() {
  useAuthGuard();
  return <CampaignForm />;
}
