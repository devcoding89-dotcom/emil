
"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import type { Campaign, ContactList, SenderSettings } from "@/lib/types";
import { draftCampaignContentAction, processBatchAction } from "@/lib/actions";
import { Loader2, Wand2, Send, ChevronLeft, Info, CheckCircle2, AlertTriangle, Globe, Play } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

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
  const { user } = useUser();
  const db = useFirestore();
  const { setIsLoading } = useGlobalLoading();
  
  const [contactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [sender] = useLocalStorage<SenderSettings>("sender-settings", {
    fromName: "",
    fromEmail: "",
    domain: "",
    isDomainVerified: false,
    isSenderVerified: false,
  });

  const campaignRef = useMemo(() => {
    if (!db || !user || !campaignId) return null;
    return doc(db, "users", user.uid, "campaigns", campaignId);
  }, [db, user, campaignId]);

  const { data: campaignData, loading: campaignLoading } = useDoc(campaignRef);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      contactListId: null,
    },
  });

  // Sync form with Firestore data if editing
  useEffect(() => {
    if (campaignData) {
      form.reset({
        name: campaignData.name,
        subject: campaignData.subject,
        body: campaignData.body,
        contactListId: campaignData.contactListId,
      });
    }
  }, [campaignData, form]);

  const [aiState, draftAction, isDrafting] = useActionState<
    { suggestedSubject?: string; suggestedBody?: string; error?: string },
    FormData
  >(async (prevState, formData) => {
    setIsLoading(true);
    try {
      const result = await draftCampaignContentAction({
        campaignName: formData.get("name") as string,
        emailSubjectPrompt: formData.get("subject") as string,
        emailBodyPrompt: formData.get("body") as string,
        availableTokens: availableTokens,
      });
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

  async function onSubmit(values: CampaignFormData) {
    if (!db || !user) return;
    
    setIsLoading(true);
    const id = campaignId || crypto.randomUUID();
    const docRef = doc(db, "users", user.uid, "campaigns", id);

    const data = {
      ...values,
      status: campaignData?.status || "draft",
      sentCount: campaignData?.sentCount || 0,
      failedCount: campaignData?.failedCount || 0,
      totalCount: campaignData?.totalCount || 0,
      updatedAt: new Date().toISOString(),
      createdAt: campaignData?.createdAt || new Date().toISOString(),
    };

    setDoc(docRef, data, { merge: true });
    
    toast({ title: campaignId ? "Campaign Updated" : "Campaign Created" });
    setIsLoading(false);
    
    if (!campaignId) {
      router.push(`/campaigns/${id}/edit`);
    }
  }

  const handleDispatch = async () => {
    if (!campaignRef || !campaignData || !user || !db) return;
    
    const selectedList = contactLists.find(cl => cl.id === campaignData.contactListId);
    if (!selectedList || selectedList.contacts.length === 0) {
      toast({ variant: "destructive", title: "Empty Contact List", description: "No contacts to send to." });
      return;
    }

    if (!sender.isDomainVerified) {
      toast({ variant: "destructive", title: "Domain Unverified", description: "Verify your domain in Settings first." });
      return;
    }

    // Move status to sending and reset counters
    updateDoc(campaignRef, {
      status: "sending",
      sentCount: 0,
      failedCount: 0,
      totalCount: selectedList.contacts.length,
      updatedAt: serverTimestamp(),
    });

    // Process in batches
    const contacts = selectedList.contacts;
    const batchSize = 50;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const result = await processBatchAction(campaignData as Campaign, batch, sender);
      
      totalSent += result.sent;
      totalFailed += result.failed;

      // Update Firestore after each batch for real-time progress
      updateDoc(campaignRef, {
        sentCount: totalSent,
        failedCount: totalFailed,
        updatedAt: serverTimestamp(),
      });
      
      // Delay between batches to respect simulated rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    // Final completion status
    updateDoc(campaignRef, {
      status: "completed",
      updatedAt: serverTimestamp(),
    });

    toast({ title: "Dispatch Complete!", description: `Success: ${totalSent}, Failed: ${totalFailed}` });
  };

  const isSending = campaignData?.status === "sending";
  const progress = campaignData?.totalCount 
    ? Math.round(((campaignData.sentCount + campaignData.failedCount) / campaignData.totalCount) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={campaignId ? "Edit Campaign" : "New Campaign"}
        description="Craft, personalize, and scale your outreach with platform infrastructure."
      >
        <Button variant="outline" asChild>
          <Link href="/campaigns">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
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
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q4 Enterprise Outreach" {...field} />
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
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Personalized subject..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Hi {{firstName}}, I noticed {{company}} is..."
                          className="min-h-[400px] font-sans"
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
                <CardTitle>Controls</CardTitle>
                <CardDescription>AI drafting and state management.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full" 
                  disabled={isDrafting || isSending}
                  onClick={() => {
                    const values = form.getValues();
                    const formData = new FormData();
                    Object.entries(values).forEach(([k, v]) => formData.append(k, v as string));
                    draftAction(formData);
                  }}
                >
                    <Wand2 className="mr-2 h-4 w-4"/>
                    {isDrafting ? "AI Drafting..." : "Draft with AI"}
                </Button>
                <Button type="submit" className="w-full" disabled={isSending}>
                  Save Changes
                </Button>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Available Tokens</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTokens.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isSending ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Batch Dispatch</CardTitle>
                  {campaignData?.status === "completed" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <CardDescription>Scalable platform-managed delivery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="contactListId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipients</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={contactLists.length === 0 || isSending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select list" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.contacts.length} leads)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {isSending ? (
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="animate-pulse flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Processing Batch...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                      <div className="p-2 bg-green-50 text-green-700 rounded border border-green-100">
                        SENT: {campaignData.sentCount}
                      </div>
                      <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        FAILED: {campaignData.failedCount}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleDispatch}
                    className="w-full h-12 text-lg font-bold"
                    disabled={!campaignId || !form.getValues().contactListId || !sender.isDomainVerified}
                  >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Start Dispatch
                  </Button>
                )}

                {!sender.isDomainVerified && (
                  <Alert variant="destructive" className="py-2">
                    <Globe className="h-4 w-4" />
                    <AlertDescription className="text-[10px]">
                      Domain unverified. <Link href="/settings" className="underline font-bold">Fix in Settings</Link>
                    </AlertDescription>
                  </Alert>
                )}
                
                {!campaignId && (
                  <p className="text-[10px] text-center text-muted-foreground italic">Save campaign to unlock bulk sending.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
