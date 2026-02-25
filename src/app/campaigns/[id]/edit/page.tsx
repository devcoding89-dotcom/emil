"use client";

import { useParams } from "next/navigation";
import { CampaignForm } from "../components/campaign-form";

export default function EditCampaignPage() {
  const params = useParams();
  const { id } = params;

  return <CampaignForm campaignId={Array.isArray(id) ? id[0] : id} />;
}
