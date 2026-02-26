
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
import { Badge } from "@/components/ui/badge";
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
  Filter,
  UserCheck,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import type { ExtractionSnapshot, ContactList, Contact } from "@/lib/types";
import { formatDistanceToNow, isToday, isWithinInterval, subDays, subMonths } from "date-fns";

type ExtractedState = {
  contacts?: Omit<Contact, "id">[];
  error?: string;
} | null;

export default function ExtractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = useState("");
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const { setIsLoading } = useGlobalLoading();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const [contactLists, setContactLists] = useLocalStorage<ContactList[]>("contact-lists", []);

  // Fetch parses from Firestore
  const parsesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "parses"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: parses, loading: parsesLoading } = useCollection(parsesQuery);

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
      return { contacts: result.contacts };
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || "An unknown error occurred." };
    }
  }, null);

  const filteredSnapshots = useMemo(() => {
    if (!parses) return [];
    return parses.filter((snapshot) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (snapshot.title?.toLowerCase() || "").includes(searchLower) ||
        (snapshot.text?.toLowerCase() || "").includes(searchLower) ||
        snapshot.contacts?.some((c: any) => 
          c.email.toLowerCase().includes(searchLower) || 
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.company.toLowerCase().includes(searchLower)
        );

      if (!matchesSearch) return false;

      if (dateFilter === "all") return true;
      
      const createdAt = snapshot.createdAt?.toDate ? snapshot.createdAt.toDate() : new Date(snapshot.createdAt);
      const now = new Date();

      if (dateFilter === "today") return isToday(createdAt);
      if (dateFilter === "week") return isWithinInterval(createdAt, { start: subDays(now, 7), end: now });
      if (dateFilter === "month") return isWithinInterval(createdAt, { start: subMonths(now, 1), end: now });

      return true;
    });
  }, [parses, searchQuery, dateFilter]);

  const handleCopy = () => {
    if (state?.contacts && state.contacts.length > 0) {
      const emailList = state.contacts.map(c => c.email).join("\n");
      navigator.clipboard.writeText(emailList);
      toast({
        title: "Copied!",
        description: `${state.contacts.length} emails copied to clipboard.`,
      });
    }
  };

  const handleExportCSV = () => {
    if (!state?.contacts || state.contacts.length === 0) return;
    const headers = "Email,First Name,Last Name,Company,Position\n";
    const rows = state.contacts.map(c => 
      `"${c.email}","${c.firstName || ""}","${c.lastName || ""}","${c.company || ""}","${c.position || ""}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extracted_contacts_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSnapshot = () => {
    if (!state?.contacts || state.contacts.length === 0 || !db || !user) return;
    
    const parseData = {
      title: snapshotTitle || `Extraction ${new Date().toLocaleString()}`,
      text: text,
      emails: state.contacts.map(c => c.email),
      contacts: state.contacts,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "users", user.uid, "parses"), parseData);
    setSnapshotTitle("");
    toast({
      title: "Snapshot Saved",
      description: `Saved as "${parseData.title}" to your history.`,
    });
  };

  const handleLoadSnapshot = (snapshot: any) => {
    setText(snapshot.text);
    toast({
        title: "Snapshot Loaded",
        description: `Text reloaded for "${snapshot.title}"`,
    });
  };

  const handleDeleteSnapshot = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, "users", user.uid, "parses", id));
    toast({ title: "Snapshot Deleted" });
  };

  const handleCreateCampaign = () => {
    if (!state?.contacts || state.contacts.length === 0) return;

    const newList: ContactList = {
      id: crypto.randomUUID(),
      name: `Extracted List - ${new Date().toLocaleDateString()}`,
      contacts: state.contacts.map(c => ({
        ...c,
        id: crypto.randomUUID(),
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      setText(fileText);
      toast({
        title: "File Loaded",
        description: `Successfully loaded ${file.name}. Click extract to process.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not read the file content.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Extract Contacts"
        description="Paste text or upload a file to intelligently extract emails, names, and company info."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
              <input 
                id="file-upload" 
                type="file" 
                accept=".txt,.csv" 
                className="sr-only" 
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </PageHeader>

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
                    placeholder="Paste email signatures, profiles, or text here..."
                    className="min-h-[300px] resize-y"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button type="submit" disabled={isPending || !text.trim()}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isPending ? "Extracting..." : "Intelligent Extraction"}
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
                  <CardTitle>Recent Parses</CardTitle>
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
                      <SelectValue placeholder="Date filter" />
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
            </CardHeader>
            <CardContent>
              {parsesLoading ? (
                <div className="flex h-[150px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSnapshots.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Contacts</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSnapshots.map((snapshot: any) => (
                        <TableRow 
                          key={snapshot.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLoadSnapshot(snapshot)}
                        >
                          <TableCell className="font-medium">{snapshot.title}</TableCell>
                          <TableCell>{snapshot.contacts?.length || snapshot.emails?.length || 0}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {snapshot.createdAt ? formatDistanceToNow(snapshot.createdAt.toDate ? snapshot.createdAt.toDate() : new Date(snapshot.createdAt), { addSuffix: true }) : 'N/A'}
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
                                    Permanently delete "{snapshot.title}"?
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
                  <p className="text-sm text-muted-foreground">No extractions saved yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Results</CardTitle>
                {state?.contacts && (
                  <Badge variant="secondary" className="font-mono">
                    {state.contacts.length}
                  </Badge>
                )}
              </div>
              {state?.contacts && state.contacts.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
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
                        CSV
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
              
              {state?.contacts && (
                <>
                  <div className="h-[350px] overflow-auto rounded-md border bg-muted/50">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-xs">Contact</TableHead>
                          <TableHead className="text-xs">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.contacts.map((contact, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold truncate">
                                  {contact.firstName || contact.lastName ? `${contact.firstName} ${contact.lastName}` : "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">{contact.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs">
                                <span>{contact.company}</span>
                                <span className="text-muted-foreground">{contact.position}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Save as..." 
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
                      New Campaign
                    </Button>
                  </div>
                </>
              )}
              
              {!isPending && !state && (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed text-center p-6 text-muted-foreground">
                  <ExternalLink className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Paste text to extract contacts.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
