"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import type { Campaign, ContactList, SmtpConfig } from "@/lib/types";
import { draftCampaignContentAction, sendCampaignAction } from "@/lib/actions";
import { Loader2, Wand2, Send, ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  contactListId: z.string().nullable(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const availableTokens = [
  "{{firstName}}",
  "{{lastName}}",
  "{{email}}",
  "{{company}}",
  "{{position}}",
];

export function CampaignForm({ campaignId }: { campaignId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { setIsLoading } = useGlobalLoading();
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>("campaigns", []);
  const [contactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [smtpConfig] = useLocalStorage<SmtpConfig | null>("smtp-config", null);

  const [isSending, setIsSending] = useState(false);

  const existingCampaign = campaignId
    ? campaigns.find((c) => c.id === campaignId)
    : null;

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: existingCampaign || {
      name: "",
      subject: "",
      body: "",
      contactListId: null,
    },
  });

  const [aiState, draftAction, isDrafting] = useActionState<
    { suggestedSubject?: string; suggestedBody?: string; error?: string },
    FormData
  >(async (prevState, formData) => {
    setIsLoading(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 2500));
    try {
      const [result] = await Promise.all([
        draftCampaignContentAction({
          campaignName: formData.get("name") as string,
          emailSubjectPrompt: formData.get("subject") as string,
          emailBodyPrompt: formData.get("body") as string,
          availableTokens: availableTokens,
        }),
        minWait
      ]);
      form.setValue("subject", result.suggestedSubject, { shouldValidate: true });
      form.setValue("body", result.suggestedBody, { shouldValidate: true });
      toast({ title: "AI suggestions applied!" });
      setIsLoading(false);
      return { suggestedSubject: result.suggestedSubject, suggestedBody: result.suggestedBody };
    } catch (e: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "AI Draft Failed", description: e.message });
      return { error: e.message };
    }
  }, { error: undefined });

  function onSubmit(values: CampaignFormData) {
    if (campaignId) {
      const updatedCampaigns = campaigns.map((c) =>
        c.id === campaignId ? { ...c, ...values } : c
      );
      setCampaigns(updatedCampaigns);
      toast({ title: "Campaign Updated" });
    } else {
      const newCampaign: Campaign = {
        id: crypto.randomUUID(),
        ...values,
        createdAt: new Date().toISOString(),
      };
      setCampaigns([...campaigns, newCampaign]);
      toast({ title: "Campaign Saved" });
      router.push(`/campaigns/${newCampaign.id}/edit`);
    }
  }

  const handleSendCampaign = async () => {
    if (!smtpConfig || !smtpConfig.host) {
      toast({ variant: "destructive", title: "SMTP Not Configured", description: "Please configure your SMTP settings before sending." });
      return;
    }
    const values = form.getValues();
    if (!values.contactListId) {
      toast({ variant: "destructive", title: "No Contact List", description: "Please select a contact list." });
      return;
    }
    const contactList = contactLists.find(cl => cl.id === values.contactListId);
    if (!contactList || contactList.contacts.length === 0) {
      toast({ variant: "destructive", title: "Empty Contact List", description: "The selected contact list has no contacts." });
      return;
    }
    
    setIsSending(true);
    setIsLoading(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      const campaignData = { ...existingCampaign, ...values } as Campaign;
      const [result] = await Promise.all([
        sendCampaignAction(campaignData, contactList.contacts, smtpConfig),
        minWait
      ]);
      toast({
        title: "Campaign Dispatch Complete",
        description: `${result.sent} sent, ${result.failed} failed.`,
      });
      if (result.errors.length > 0) {
          console.error("Sending errors:", result.errors);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to Send Campaign", description: e.message });
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleDraftWithAI = () => {
    const values = form.getValues();
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("subject", values.subject);
    formData.append("body", values.body);
    draftAction(formData);
  };

  useEffect(() => {
    if (campaignId && !existingCampaign) {
      router.push("/campaigns");
    }
  }, [campaignId, existingCampaign, router]);

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={campaignId ? "Edit Campaign" : "New Campaign"}
        description="Craft your message, personalize it with tokens, and send it to your audience."
      >
        <Button variant="outline" asChild>
          <Link href="/campaigns">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 lg:grid-cols-3"
        >
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q3 Product Launch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="An exciting update for you!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi {{firstName}}, we have an exciting announcement..."
                          className="min-h-[300px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  disabled={isDrafting}
                  onClick={handleDraftWithAI}
                >
                    <Wand2 className="mr-2 h-4 w-4"/>
                    {isDrafting ? "Drafting with AI..." : "Draft with AI"}
                </Button>
                <Button type="submit" className="w-full">
                  Save Campaign
                </Button>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Available Tokens</AlertTitle>
                  <AlertDescription className="text-xs break-all">
                    {availableTokens.join(", ")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dispatch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="contactListId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact List</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={contactLists.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a list to send to" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.contacts.length} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={handleSendCampaign}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!existingCampaign || isSending || !form.getValues().contactListId}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Sending..." : "Send Campaign Now"}
                </Button>
                {!existingCampaign && (
                  <p className="text-xs text-muted-foreground text-center">Save the campaign to enable sending.</p>
                )}
                 {!smtpConfig?.host && (
                  <p className="text-xs text-destructive text-center">SMTP not configured in settings.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
