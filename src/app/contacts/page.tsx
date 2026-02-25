"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ContactList, Contact } from "@/lib/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";

import { ContactListControls } from "./components/contact-list-controls";
import { ContactsTable } from "./components/contacts-table";
import { ContactForm } from "./components/contact-form";
import { useToast } from "@/hooks/use-toast";
import { validateEmailAction } from "@/lib/actions";

export default function ContactsPage() {
  useAuthGuard();
  const { toast } = useToast();
  const [contactLists, setContactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    // If no list is selected but lists exist, select the first one.
    if (!selectedListId && contactLists.length > 0) {
      setSelectedListId(contactLists[0].id);
    }
    // If the selected list was deleted, select a new one.
    else if (selectedListId && !contactLists.some((list) => list.id === selectedListId)) {
      setSelectedListId(contactLists.length > 0 ? contactLists[0].id : null);
    }
  }, [contactLists, selectedListId]);

  const selectedList = contactLists.find((list) => list.id === selectedListId);

  const handleCreateList = (name: string) => {
    const newList: ContactList = {
      id: crypto.randomUUID(),
      name,
      contacts: [],
    };
    const updatedLists = [...contactLists, newList];
    setContactLists(updatedLists);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = (id: string) => {
    setContactLists(contactLists.filter(list => list.id !== id));
  };
  
  const handleAddContact = (contact: Omit<Contact, "id">) => {
    if (!selectedListId) return;
    const newContact = { ...contact, id: crypto.randomUUID() };
    const updatedLists = contactLists.map((list) =>
      list.id === selectedListId
        ? { ...list, contacts: [...list.contacts, newContact] }
        : list
    );
    setContactLists(updatedLists);
    setIsContactFormOpen(false);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    if (!selectedListId) return;
    const updatedLists = contactLists.map((list) =>
      list.id === selectedListId
        ? { ...list, contacts: list.contacts.map(c => c.id === updatedContact.id ? updatedContact : c) }
        : list
    );
    setContactLists(updatedLists);
    setEditingContact(null);
    setIsContactFormOpen(false);
  };

  const handleDeleteContact = (contactId: string) => {
    if (!selectedListId) return;
    const updatedLists = contactLists.map((list) =>
      list.id === selectedListId
        ? { ...list, contacts: list.contacts.filter(c => c.id !== contactId) }
        : list
    );
    setContactLists(updatedLists);
  };

  const handleImportCSV = async (file: File) => {
    if (!selectedListId) {
      toast({
        variant: "destructive",
        title: "No list selected",
        description: "Please create or select a contact list first."
      });
      return;
    }
    
    const { id: toastId } = toast({
      title: "Importing contacts...",
      description: "Please wait while we validate and import your contacts. This may take a moment."
    });

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
          toast({
              id: toastId,
              variant: "destructive",
              title: "Import Failed",
              description: "CSV file is empty or contains only headers.",
          });
          return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      const headerMap: { [key: string]: number } = {};
      const contactKeys = ['email', 'firstname', 'first name', 'lastname', 'last name', 'company', 'position'];
      headers.forEach((h, i) => {
          if (contactKeys.includes(h)) {
              if (h === 'first name') headerMap['firstname'] = i;
              else if (h === 'last name') headerMap['lastname'] = i;
              else headerMap[h] = i;
          }
      });
      
      if (headerMap['email'] === undefined) {
          toast({
              id: toastId,
              variant: "destructive",
              title: "Import Failed",
              description: "CSV file must contain an 'email' column header.",
          });
          return;
      }

      const validContacts: Contact[] = [];
      const invalidDetails: { email: string, reason: string }[] = [];
      const contactRows = lines.slice(1);

      for (const line of contactRows) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const email = values[headerMap['email']];
        
        if (!email) continue;
        
        const { isValid, reason } = await validateEmailAction(email);
        
        if (isValid) {
          const contactData: Contact = {
              id: crypto.randomUUID(),
              email: email,
              firstName: values[headerMap['firstname']] || '',
              lastName: values[headerMap['lastname']] || '',
              company: values[headerMap['company']] || '',
              position: values[headerMap['position']] || '',
              isValid: true,
          };
          validContacts.push(contactData);
        } else {
          invalidDetails.push({ email, reason });
        }
      }
      
      if (validContacts.length > 0) {
          const updatedLists = contactLists.map(list => 
              list.id === selectedListId ? { ...list, contacts: [...list.contacts, ...validContacts] } : list
          );
          setContactLists(updatedLists);
      }
      
      let description = `${validContacts.length} contacts were successfully imported.`;
      if (invalidDetails.length > 0) {
          description += ` ${invalidDetails.length} contacts failed validation and were skipped.`;
      }

      toast({
          id: toastId,
          title: "Import Complete",
          description: description,
      });
    } catch (error) {
      toast({
        id: toastId,
        variant: 'destructive',
        title: 'Import Error',
        description: 'An unexpected error occurred during file processing.'
      })
    }
  };
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImportCSV(e.target.files[0]);
      e.target.value = ""; // Allow re-uploading the same file
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Contact Lists"
        description="Manage your contacts and organize them into lists."
      >
        <div className="flex items-center gap-2">
           <Button size="sm" variant="outline" asChild>
             <label htmlFor="csv-upload">
               <Upload className="mr-2 h-4 w-4" />
               Import CSV
               <input id="csv-upload" type="file" accept=".csv,.txt" className="sr-only" onChange={onFileChange} />
             </label>
           </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingContact(null);
              setIsContactFormOpen(true);
            }}
            disabled={!selectedListId}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </PageHeader>
      
      <ContactForm
        isOpen={isContactFormOpen}
        onOpenChange={setIsContactFormOpen}
        onSave={editingContact ? handleUpdateContact : handleAddContact}
        contact={editingContact}
      />
      
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <ContactListControls
              lists={contactLists}
              selectedListId={selectedListId}
              onSelectList={setSelectedListId}
              onCreateList={handleCreateList}
              onDeleteList={handleDeleteList}
            />
          </div>
          {selectedList ? (
            <ContactsTable 
              contacts={selectedList.contacts} 
              onEdit={(contact) => {
                setEditingContact(contact);
                setIsContactFormOpen(true);
              }}
              onDelete={handleDeleteContact}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No contact list selected.</p>
              <p className="text-sm">Create a new list to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
