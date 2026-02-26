
"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageHeader from "@/components/page-header";
import { extractEmailsAction } from "@/lib/actions";
import { Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";

type ExtractedState = {
  emails?: string[];
  error?: string;
} | null;

export default function ExtractPage() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const { setIsLoading } = useGlobalLoading();

  const [state, formAction, isPending] = useActionState<
    ExtractedState,
    FormData
  >(async (previousState, formData) => {
    const text = formData.get("text") as string;
    if (!text.trim()) {
      return { error: "Text block cannot be empty." };
    }
    
    // Set loading globally for the "long" E experience
    setIsLoading(true);
    
    // Ensure the loading state stays for at least 2.5 seconds
    const minWait = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      const [result] = await Promise.all([
        extractEmailsAction({ text }),
        minWait
      ]);
      setIsLoading(false);
      return { emails: result.emails };
    } catch (e: any) {
      setIsLoading(false);
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
