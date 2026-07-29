import { isLead, type Lead } from "./leads";

const STORAGE_KEY = "form-crm:leads:v1";

export function loadLeads(): Lead[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isLead) : [];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    return true;
  } catch {
    return false;
  }
}
