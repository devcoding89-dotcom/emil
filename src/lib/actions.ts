
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

/**
 * HARDCODED SMTP CONFIGURATION
 * Edit these values to match your email provider's settings.
 */
const SMTP_SERVER_CONFIG: SmtpConfig = {
  host: "smtp.example.com", // e.g., smtp.sendgrid.net, smtp.gmail.com
  port: 587,                // 587 for STARTTLS, 465 for SSL
  secure: false,            // true for 465, false for 587
  user: "your-username",    // your SMTP username or API key
  pass: "your-password",    // your SMTP password or API key
};

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

// SMTP Testing Action
export async function testSmtpConnectionAction(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_SERVER_CONFIG.host,
      port: SMTP_SERVER_CONFIG.port,
      secure: SMTP_SERVER_CONFIG.secure,
      auth: {
        user: SMTP_SERVER_CONFIG.user,
        pass: SMTP_SERVER_CONFIG.pass,
      },
    });

    await transporter.verify();
    return { success: true, message: "SMTP connection verified successfully using hardcoded config!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to connect to SMTP server." };
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

export async function sendCampaignAction(
  campaign: Campaign,
  contacts: Contact[]
): Promise<SendCampaignResult> {
  const transporter = nodemailer.createTransport({
    host: SMTP_SERVER_CONFIG.host,
    port: SMTP_SERVER_CONFIG.port,
    secure: SMTP_SERVER_CONFIG.secure,
    auth: {
      user: SMTP_SERVER_CONFIG.user,
      pass: SMTP_SERVER_CONFIG.pass,
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
        from: `"EmailCraft Studio" <${SMTP_SERVER_CONFIG.user}>`,
        to: contact.email,
        subject: personalizedSubject,
        html: `<div style="font-family: sans-serif; line-height: 1.6;">${personalizedBody.replace(/\n/g, '<br/>')}</div>`,
      });
      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Failed to send to ${contact.email}: ${error.message}`);
    }
  }

  return results;
}
