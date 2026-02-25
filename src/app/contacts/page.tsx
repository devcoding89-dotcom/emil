"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ContactList, Contact } from "@/lib/types";

import { ContactListControls } from "./components/contact-list-controls";
import { ContactsTable } from "./components/contacts-table";
import { ContactForm } from "./components/contact-form";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const { toast } = useToast();
  const [contactLists, setContactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [selectedListId, setSelectedListId] = useState<string | null>(
    contactLists.length > 0 ? contactLists[0].id : null
  );

  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

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
    const updatedLists = contactLists.filter(list => list.id !== id);
    setContactLists(updatedLists);
    if (selectedListId === id) {
      setSelectedListId(updatedLists.length > 0 ? updatedLists[0].id : null);
    }
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

  const handleImportCSV = (file: File) => {
    if (!selectedListId) {
      toast({
        variant: "destructive",
        title: "No list selected",
        description: "Please create or select a contact list first."
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim());
      const contacts: Contact[] = lines.slice(1).map(line => {
        const values = line.split(',');
        const contactData: any = { id: crypto.randomUUID() };
        headers.forEach((header, index) => {
          contactData[header] = values[index]?.trim() || '';
        });
        return contactData;
      });

      const updatedLists = contactLists.map(list => 
        list.id === selectedListId ? { ...list, contacts: [...list.contacts, ...contacts] } : list
      );
      setContactLists(updatedLists);
      toast({
        title: "Import successful",
        description: `${contacts.length} contacts have been added.`
      });
    };
    reader.readAsText(file);
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
               <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={(e) => e.target.files && handleImportCSV(e.target.files[0])} />
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
