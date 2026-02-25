export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
}

export interface ContactList {
  id: string;
  name: string;
  contacts: Contact[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  contactListId: string | null;
  createdAt: string;
}
