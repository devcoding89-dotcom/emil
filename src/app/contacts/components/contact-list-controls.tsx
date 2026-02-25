"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { ContactList } from "@/lib/types";

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
} from "@/components/ui/alert-dialog"

interface ContactListControlsProps {
  lists: ContactList[];
  selectedListId: string | null;
  onSelectList: (id: string | null) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (id: string) => void;
}

export function ContactListControls({
  lists,
  selectedListId,
  onSelectList,
  onCreateList,
  onDeleteList
}: ContactListControlsProps) {
  const [newListName, setNewListName] = useState("");

  const handleCreate = () => {
    if (newListName.trim()) {
      onCreateList(newListName.trim());
      setNewListName("");
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <Select
          onValueChange={(value) => onSelectList(value)}
          value={selectedListId ?? ""}
          disabled={lists.length === 0}
        >
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder="Select a contact list" />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="flex-1"
        />
        <Button onClick={handleCreate} disabled={!newListName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

       {selectedListId && (
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" title="Delete selected list">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected contact list and all its contacts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteList(selectedListId)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
