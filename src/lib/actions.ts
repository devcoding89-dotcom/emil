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
import type { Campaign, Contact, SmtpConfig } from "./types";

import dns from "dns/promises";
import nodemailer from "nodemailer";

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
    return { isValid: false, reason: "No MX records" };
  } catch (error) {
    return { isValid: false, reason: "Domain not found" };
  }
}

// Email Sending Action
interface SendCampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

function personalize(template: string, contact: Contact): string {
    let content = template;
    const tokens = {
        '{{firstName}}': contact.firstName,
        '{{lastName}}': contact.lastName,
        '{{email}}': contact.email,
        '{{company}}': contact.company,
        '{{position}}': contact.position,
    };

    for (const [key, value] of Object.entries(tokens)) {
        content = content.replace(new RegExp(key, 'g'), value || '');
    }
    return content;
}

export async function sendCampaignAction(
  campaign: Campaign,
  contacts: Contact[],
  smtpConfig: SmtpConfig
): Promise<SendCampaignResult> {
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const results: SendCampaignResult = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const contact of contacts) {
    const { isValid, reason } = await validateEmailAction(contact.email);
    if (!isValid) {
      results.failed++;
      results.errors.push(`Skipped ${contact.email}: ${reason}`);
      continue;
    }

    try {
      const personalizedSubject = personalize(campaign.subject, contact);
      const personalizedBody = personalize(campaign.body, contact);

      await transporter.sendMail({
        from: `"EmailCraft Studio" <${smtpConfig.user}>`,
        to: contact.email,
        subject: personalizedSubject,
        html: personalizedBody,
      });
      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Failed to send to ${contact.email}: ${error.message}`);
    }
  }

  return results;
}
