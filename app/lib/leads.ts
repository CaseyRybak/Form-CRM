export const LEAD_SOURCES = ["Холодный", "Тёплый"] as const;
export const LEAD_OWNERS = ["Лидоруб", "МОП"] as const;
export const LEAD_STAGES = [
  "Новый лид",
  "Квалифицирован",
  "Назначена консультация",
  "Отказ",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadOwner = (typeof LEAD_OWNERS)[number];
export type LeadStage = (typeof LEAD_STAGES)[number];

export type LeadDraft = {
  name: string;
  phone: string;
  source: LeadSource;
  owner: LeadOwner;
  stage: LeadStage;
  specRequested: boolean;
};

export type Lead = LeadDraft & {
  id: string;
  createdAt: string;
};

export type LeadErrors = Partial<Record<"name" | "phone", string>>;

export const EMPTY_LEAD: LeadDraft = {
  name: "",
  phone: "",
  source: "Холодный",
  owner: "Лидоруб",
  stage: "Новый лид",
  specRequested: false,
};

export function validateLead(draft: LeadDraft): LeadErrors {
  const errors: LeadErrors = {};

  if (!draft.name.trim()) {
    errors.name = "Введите имя клиента";
  }

  if (!draft.phone.trim()) {
    errors.phone = "Введите номер телефона";
  }

  return errors;
}

export function createLead(draft: LeadDraft): Lead {
  const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    ...draft,
    id: globalThis.crypto?.randomUUID?.() ?? fallbackId,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function getNextStage(stage: LeadStage): LeadStage {
  const currentIndex = LEAD_STAGES.indexOf(stage);
  return LEAD_STAGES[Math.min(currentIndex + 1, LEAD_STAGES.length - 1)];
}

export function isLead(value: unknown): value is Lead {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasText = (field: unknown): field is string =>
    typeof field === "string" && field.trim().length > 0;

  return (
    hasText(candidate.id) &&
    hasText(candidate.name) &&
    hasText(candidate.phone) &&
    typeof candidate.createdAt === "string" &&
    Number.isFinite(Date.parse(candidate.createdAt)) &&
    typeof candidate.specRequested === "boolean" &&
    LEAD_SOURCES.includes(candidate.source as LeadSource) &&
    LEAD_OWNERS.includes(candidate.owner as LeadOwner) &&
    LEAD_STAGES.includes(candidate.stage as LeadStage)
  );
}
