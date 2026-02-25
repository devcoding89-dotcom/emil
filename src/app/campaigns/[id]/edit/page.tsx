"use client";

import { useParams } from "next/navigation";
import { CampaignForm } from "../components/campaign-form";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function EditCampaignPage() {
  useAuthGuard();
  const params = useParams();
  const { id } = params;

  return <CampaignForm campaignId={Array.isArray(id) ? id[0] : id} />;
}
