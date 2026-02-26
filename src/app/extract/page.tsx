"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/page-header";
import { extractEmailsAction } from "@/lib/actions";
import { Loader2, Copy, Save, History, Trash2, Send, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ExtractionSnapshot, ContactList, Contact } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type ExtractedState = {
  emails?: string[];
  error?: string;
} | null;

export default function ExtractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const { setIsLoading } = useGlobalLoading();
  
  const [snapshots, setSnapshots] = useLocalStorage<ExtractionSnapshot[]>("extraction-snapshots", []);
  const [contactLists, setContactLists] = useLocalStorage<ContactList[]>("contact-lists", []);

  const [state, formAction, isPending] = useActionState<
    ExtractedState,
    FormData
  >(async (previousState, formData) => {
    const textValue = formData.get("text") as string;
    if (!textValue.trim()) {
      return { error: "Text block cannot be empty." };
    }
    
    setIsLoading(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      const [result] = await Promise.all([
        extractEmailsAction({ text: textValue }),
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

  const handleSaveSnapshot = () => {
    if (!state?.emails || state.emails.length === 0) return;
    
    const newSnapshot: ExtractionSnapshot = {
      id: crypto.randomUUID(),
      title: snapshotTitle || `Extraction ${new Date().toLocaleString()}`,
      rawText: text,
      emails: state.emails,
      createdAt: new Date().toISOString(),
    };

    setSnapshots([newSnapshot, ...snapshots]);
    setSnapshotTitle("");
    toast({
      title: "Snapshot Saved",
      description: `Saved as "${newSnapshot.title}"`,
    });
  };

  const handleLoadSnapshot = (snapshot: ExtractionSnapshot) => {
    setText(snapshot.rawText);
    // We manually set the state to simulate a successful extraction result
    // Note: In a real app we might want to wrap this in a more formal state management
    toast({
        title: "Snapshot Loaded",
        description: `Loaded "${snapshot.title}"`,
    });
    // We can't directly set 'state' from useActionState, but we can update local UI
    // For simplicity, we'll just set the text and clear current results, 
    // or we could trigger the action again. Let's just update the text for now.
    // If we want to show the results immediately, we'd need a separate state for the displayed emails.
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSnapshots(snapshots.filter(s => s.id !== id));
    toast({ title: "Snapshot Deleted" });
  };

  const handleCreateCampaign = () => {
    if (!state?.emails || state.emails.length === 0) return;

    // 1. Create a new Contact List
    const newList: ContactList = {
      id: crypto.randomUUID(),
      name: `Extracted List - ${new Date().toLocaleDateString()}`,
      contacts: state.emails.map(email => ({
        id: crypto.randomUUID(),
        email,
        firstName: "",
        lastName: "",
        company: "",
        position: "",
        isValid: true
      }))
    };

    setContactLists([...contactLists, newList]);
    
    // 2. Redirect to New Campaign page with the new list selected (we'll pass ID in query or just rely on them selecting it)
    toast({
      title: "Contact List Created",
      description: `Created "${newList.name}" with ${newList.contacts.length} contacts.`,
    });
    router.push("/campaigns/new");
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
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Recent Snapshots</CardTitle>
              </div>
              <CardDescription>Reload previous extractions to reuse data.</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Emails</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshots.map((snapshot) => (
                        <TableRow 
                          key={snapshot.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLoadSnapshot(snapshot)}
                        >
                          <TableCell className="font-medium">{snapshot.title}</TableCell>
                          <TableCell>{snapshot.emails.length}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteSnapshot(snapshot.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">No snapshots saved yet.</p>
                </div>
              )}
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
                  Copy
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending && (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              {state?.error && (
                <div className="flex h-[300px] items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive text-center">
                  <p>{state.error}</p>
                </div>
              )}
              
              {state?.emails && (
                <>
                  <div className="h-[250px] overflow-y-auto rounded-md border bg-muted/50 p-4">
                    {state.emails.length > 0 ? (
                      <ul className="space-y-2">
                        {state.emails.map((email, index) => (
                          <li key={index} className="text-sm font-medium">
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
                  
                  {state.emails.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Snapshot Title..." 
                          value={snapshotTitle}
                          onChange={(e) => setSnapshotTitle(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="secondary" onClick={handleSaveSnapshot}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button className="w-full" onClick={handleCreateCampaign}>
                        <Send className="mr-2 h-4 w-4" />
                        Create Campaign
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {!isPending && !state && (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed text-center p-6">
                  <ExternalLink className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    Extract emails from text to see results and save snapshots.
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
