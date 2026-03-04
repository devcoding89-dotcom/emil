
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  isValid?: boolean;
}

export interface ContactList {
  id: string;
  name: string;
  contacts: Contact[];
}

export interface SenderSettings {
  fromName: string;
  fromEmail: string;
  domain: string;
  isDomainVerified: boolean;
  isSenderVerified: boolean;
}

export interface ComplianceSettings {
  handleBounces: boolean;
  handleSpam: boolean;
  bounceRate: number;
  complaintRate: number;
}

export type CampaignStatus = "draft" | "queued" | "sending" | "completed" | "failed";

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  contactListId: string | null;
  status: CampaignStatus;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionSnapshot {
  id: string;
  title: string;
  rawText: string;
  contacts: Omit<Contact, "id">[];
  createdAt: string;
}
