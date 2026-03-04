
"use server";

import { extractEmails } from "@/ai/flows/ai-email-extraction-flow";
import { draftCampaignContent } from "@/ai/flows/ai-campaign-content-drafting";
import type {
  AiEmailExtractionOutput,
  AiEmailExtractionInput,
} from "@/ai/flows/ai-email-extraction-flow";
import type {
  AICampaignContentDraftingInput,
  AICampaignContentDraftingOutput,
} from "@/ai/flows/ai-campaign-content-drafting";
import type { Campaign, Contact, SenderSettings } from "./types";

import dns from "dns/promises";

/**
 * PLATFORM-MANAGED INFRASTRUCTURE (Twilio SendGrid API Pattern)
 * Designed for bulk scaling and rate-controlled delivery.
 */

const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
  "icloud.com", "aol.com", "protonmail.com", "zoho.com"
];

const BATCH_SIZE = 50; // Recipients per API call

export async function isPublicDomain(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

// AI Actions
export async function extractEmailsAction(
  input: AiEmailExtractionInput
): Promise<AiEmailExtractionOutput> {
  return await extractEmails(input);
}

export async function draftCampaignContentAction(
  input: AICampaignContentDraftingInput
): Promise<AICampaignContentDraftingOutput> {
  return await draftCampaignContent(input);
}

// Validation Action
export async function validateEmailAction(
  email: string
): Promise<{ isValid: boolean; reason: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: "Invalid format" };
  }

  const domain = email.split("@")[1];
  try {
    const records = await dns.resolveMx(domain);
    if (records && records.length > 0) {
      return { isValid: true, reason: "" };
    }
    return { isValid: false, reason: "No MX records found for domain" };
  } catch (error) {
    return { isValid: false, reason: "Domain does not exist or has no mail server" };
  }
}

// Domain Verification Mock
export async function verifyDomainAction(domain: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (domain.includes(".")) {
    return { success: true, message: "Domain DNS records verified successfully!" };
  }
  return { success: false, message: "Could not find valid DNS records for this domain." };
}

// Personalization Helper
function personalize(template: string, contact: Contact): string {
  let content = template;
  const tokens: { [key: string]: string | undefined } = {
    '{{firstName}}': contact.firstName,
    '{{lastName}}': contact.lastName,
    '{{email}}': contact.email,
    '{{company}}': contact.company,
    '{{position}}': contact.position,
  };

  for (const [key, value] of Object.entries(tokens)) {
    content = content.replace(new RegExp(key, 'gi'), value || '');
  }
  return content;
}

// Bulk Send Logic (Batching recipients in one call)
// This simulates the SendGrid "Personalizations" API feature
export async function processBatchAction(
  campaign: Campaign,
  batchContacts: Contact[],
  sender: SenderSettings
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Simulate API Request to Provider
  // In real SendGrid, you'd send one POST /v3/mail/send with multiple personalizations
  for (const contact of batchContacts) {
    try {
      // Basic domain check before dispatch
      const { isValid } = await validateEmailAction(contact.email);
      if (!isValid) {
        failed++;
        errors.push(`Validation failed for ${contact.email}`);
        continue;
      }

      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 50)); 
      sent++;
    } catch (e: any) {
      failed++;
      errors.push(e.message);
    }
  }

  return { sent, failed, errors };
}
