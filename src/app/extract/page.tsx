"use client";

import { useActionState, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageHeader from "@/components/page-header";
import { extractEmailsAction } from "@/lib/actions";
import { Loader2, Copy, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useUser, useFirestore, useCollection } from "@/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import type { Extraction } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

type ExtractedState = {
  emails?: string[];
  error?: string;
} | null;

function ExtractionHistory() {
  const { user } = useUser();
  const firestore = useFirestore();

  const extractionsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "extractions"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [user, firestore]);

  const { data: extractions, loading } = useCollection<Extraction>(extractionsQuery);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!extractions || extractions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No extraction history found.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {extractions.map((extraction) => (
        <AccordionItem key={extraction.id} value={extraction.id}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-4">
              <span className="text-sm font-medium">
                {extraction.emails.length} emails found
              </span>
              <span className="text-sm text-muted-foreground">
                {extraction.createdAt
                  ? formatDistanceToNow(extraction.createdAt.toDate(), {
                      addSuffix: true,
                    })
                  : "Just now"}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Extracted Emails</h4>
                <div className="mt-2 h-32 overflow-y-auto rounded-md border bg-muted/50 p-2 text-sm">
                  {extraction.emails.join("\n")}
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Original Text</h4>
                <div className="mt-2 h-32 overflow-y-auto rounded-md border bg-muted/50 p-2 text-sm">
                  {extraction.rawText}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function ExtractPage() {
  useAuthGuard();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [text, setText] = useState("");

  const [state, formAction, isPending] = useActionState<
    ExtractedState,
    FormData
  >(async (previousState, formData) => {
    const text = formData.get("text") as string;
    if (!text.trim()) {
      return { error: "Text block cannot be empty." };
    }
    try {
      const result = await extractEmailsAction({ text });

      if (user && firestore && result.emails) {
        const extractionData = {
          rawText: text,
          emails: result.emails,
          createdAt: serverTimestamp(),
        };
        const extractionsCol = collection(
          firestore,
          "users",
          user.uid,
          "extractions"
        );
        addDoc(extractionsCol, extractionData).catch((err) => {
          const permissionError = new FirestorePermissionError({
            path: extractionsCol.path,
            operation: "create",
            requestResourceData: extractionData,
          });
          errorEmitter.emit("permission-error", permissionError);
          toast({
            variant: "destructive",
            title: "Could not save history",
            description: "Failed to save extraction results to your history.",
          });
        });
      }

      return { emails: result.emails };
    } catch (e: any) {
      return { error: e.message || "An unknown error occurred." };
    }
  }, null);

  const handleCopy = () => {
    if (state?.emails && state.emails.length > 0) {
      navigator.clipboard.writeText(state.emails.join("\n"));
      toast({
        title: "Copied!",
        description: `${state.emails.length} emails copied to clipboard.`,
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Extract Emails"
        description="Paste any block of text to intelligently extract all unique email addresses."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction}>
                <div className="grid w-full gap-4">
                  <Textarea
                    name="text"
                    placeholder="Paste your text here..."
                    className="min-h-[300px] resize-y"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button type="submit" disabled={isPending || !text}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isPending ? "Extracting..." : "Extract Emails"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Extraction History
              </CardTitle>
              <CardDescription>
                Your past 10 extractions are saved here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExtractionHistory />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Extracted Emails</CardTitle>
              {state?.emails && state.emails.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isPending && (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {state?.error && (
                <div className="flex h-[300px] items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                  <p>{state.error}</p>
                </div>
              )}
              {state?.emails && (
                <div className="h-[300px] overflow-y-auto rounded-md border bg-muted/50 p-4">
                  {state.emails.length > 0 ? (
                    <ul className="space-y-2">
                      {state.emails.map((email, index) => (
                        <li key={index} className="text-sm">
                          {email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <p>No emails found.</p>
                    </div>
                  )}
                </div>
              )}
              {!isPending && !state && (
                <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-muted-foreground">
                    Results will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
