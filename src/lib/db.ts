import fs from 'fs';
import path from 'path';
import { Customer, Contact } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON<T>(filePath: string, data: T[]) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Customers
export function getCustomers(): Customer[] {
  return readJSON<Customer>(CUSTOMERS_FILE);
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

export function createCustomer(customer: Customer): Customer {
  const customers = getCustomers();
  customers.push(customer);
  writeJSON(CUSTOMERS_FILE, customers);
  return customer;
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  customers[idx] = { ...customers[idx], ...updates };
  writeJSON(CUSTOMERS_FILE, customers);
  return customers[idx];
}

// Contacts
export function getContacts(customerId?: string): Contact[] {
  const contacts = readJSON<Contact>(CONTACTS_FILE);
  if (customerId) return contacts.filter(c => c.customerId === customerId);
  return contacts;
}

export function createContact(contact: Contact): Contact {
  const contacts = readJSON<Contact>(CONTACTS_FILE);
  contacts.push(contact);
  writeJSON(CONTACTS_FILE, contacts);
  return contact;
}

export function updateContact(id: string, updates: Partial<Contact>): Contact | null {
  const contacts = readJSON<Contact>(CONTACTS_FILE);
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return null;
  contacts[idx] = { ...contacts[idx], ...updates };
  writeJSON(CONTACTS_FILE, contacts);
  return contacts[idx];
}

export function deleteContact(id: string): boolean {
  const contacts = readJSON<Contact>(CONTACTS_FILE);
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return false;
  contacts.splice(idx, 1);
  writeJSON(CONTACTS_FILE, contacts);
  return true;
}

export function deleteCustomer(id: string): boolean {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return false;
  customers.splice(idx, 1);
  writeJSON(CUSTOMERS_FILE, customers);
  // Also delete associated contacts
  const contacts = readJSON<Contact>(CONTACTS_FILE).filter(c => c.customerId !== id);
  writeJSON(CONTACTS_FILE, contacts);
  return true;
}
