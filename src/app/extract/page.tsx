"use client";

import { useActionState, useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/page-header";
import { extractEmailsAction } from "@/lib/actions";
import { 
  Loader2, 
  Copy, 
  Save, 
  History, 
  Trash2, 
  Send, 
  ExternalLink, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ExtractionSnapshot, ContactList } from "@/lib/types";
import { formatDistanceToNow, isToday, isWithinInterval, subDays, subMonths } from "date-fns";

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
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

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

  // Filtering Logic
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snapshot) => {
      // Search Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        snapshot.title.toLowerCase().includes(searchLower) ||
        snapshot.rawText.toLowerCase().includes(searchLower) ||
        snapshot.emails.some(email => email.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Date Filter
      if (dateFilter === "all") return true;
      
      const createdAt = new Date(snapshot.createdAt);
      const now = new Date();

      if (dateFilter === "today") return isToday(createdAt);
      if (dateFilter === "week") return isWithinInterval(createdAt, { start: subDays(now, 7), end: now });
      if (dateFilter === "month") return isWithinInterval(createdAt, { start: subMonths(now, 1), end: now });

      return true;
    });
  }, [snapshots, searchQuery, dateFilter]);

  const handleCopy = () => {
    if (state?.emails && state.emails.length > 0) {
      navigator.clipboard.writeText(state.emails.join("\n"));
      toast({
        title: "Copied!",
        description: `${state.emails.length} emails copied to clipboard.`,
      });
    }
  };

  const handleExportCSV = () => {
    if (!state?.emails || state.emails.length === 0) return;
    const csvContent = "Email\n" + state.emails.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extracted_emails_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Exported", description: "Your file is ready." });
  };

  const handleExportJSON = () => {
    if (!state?.emails || state.emails.length === 0) return;
    const jsonContent = JSON.stringify(
      { 
        emails: state.emails, 
        count: state.emails.length, 
        extractedAt: new Date().toISOString() 
      }, 
      null, 
      2
    );
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extracted_emails_${new Date().getTime()}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "JSON Exported", description: "Your file is ready." });
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
    toast({
        title: "Snapshot Loaded",
        description: `Loaded "${snapshot.title}"`,
    });
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(snapshots.filter(s => s.id !== id));
    toast({ title: "Snapshot Deleted" });
  };

  const handleCreateCampaign = () => {
    if (!state?.emails || state.emails.length === 0) return;

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Snapshots</CardTitle>
                </div>
                
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search history..."
                      className="w-full pl-8 sm:w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>Reload previous extractions to reuse data.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSnapshots.length > 0 ? (
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
                      {filteredSnapshots.map((snapshot) => (
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the snapshot "{snapshot.title}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSnapshot(snapshot.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || dateFilter !== "all" 
                      ? "No snapshots match your filters." 
                      : "No snapshots saved yet."}
                  </p>
                  {(searchQuery || dateFilter !== "all") && (
                    <Button 
                      variant="link" 
                      className="mt-2 text-primary"
                      onClick={() => { setSearchQuery(""); setDateFilter("all"); }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Results</CardTitle>
              {state?.emails && state.emails.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportJSON}>
                        <FileJson className="h-4 w-4 mr-2" />
                        Export JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                        <Button variant="secondary" onClick={handleSaveSnapshot} title="Save Snapshot">
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
