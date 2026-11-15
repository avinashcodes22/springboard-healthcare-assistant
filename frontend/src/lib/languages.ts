import type { DocumentCategory } from "../types";

export interface LanguageOption {
  code: string;
  english: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", english: "English", native: "English" },
  { code: "te", english: "Telugu", native: "తెలుగు" },
  { code: "hi", english: "Hindi", native: "हिन्दी" },
  { code: "ta", english: "Tamil", native: "தமிழ்" },
  { code: "kn", english: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", english: "Malayalam", native: "മലയാളം" },
  { code: "mr", english: "Marathi", native: "मराठी" },
  { code: "gu", english: "Gujarati", native: "ગુજરાતી" },
  { code: "bn", english: "Bengali", native: "বাংলা" },
];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "prescription",
  "discharge_summary",
  "medical_report",
];

const _LANGUAGE_ALIASES: Record<string, string> = {
  "english": "en",
  "telugu": "te",
  "hindi": "hi",
  "tamil": "ta",
  "kannada": "kn",
  "malayalam": "ml",
  "marathi": "mr",
  "gujarati": "gu",
  "bengali": "bn",
  "bangla": "bn",
};

export function languageByCode(code: string | null | undefined) {
  if (!code) return undefined;
  const normalized = code.trim().toLowerCase();

  const direct = LANGUAGES.find((language) => language.code === normalized);
  if (direct) return direct;

  const englishMatch = LANGUAGES.find(
    (language) => language.english.toLowerCase() === normalized
  );
  if (englishMatch) return englishMatch;

  const aliasCode = _LANGUAGE_ALIASES[normalized];
  if (aliasCode) {
    return LANGUAGES.find((language) => language.code === aliasCode) || undefined;
  }

  return undefined;
}

export function languageName(code: string | null | undefined): string {
  const language = languageByCode(code);
  return language ? `${language.native} · ${language.english}` : code ?? "—";
}

export function languageShortName(code: string | null | undefined): string {
  const language = languageByCode(code);
  return language ? language.native : code ?? "—";
}

export function documentCategoryLabel(category: string): string {
  switch (category) {
    case "prescription":
      return "Prescription";
    case "discharge_summary":
      return "Discharge summary";
    case "medical_report":
      return "Medical report";
    default:
      return humanize(category);
  }
}

export function contentCategoryLabel(category: string): string {
  return humanize(category);
}

export function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function relativeFileType(contentType: string): string {
  if (contentType === "application/pdf") return "PDF";
  if (contentType === "image/jpeg") return "JPEG image";
  if (contentType === "image/png") return "PNG image";
  return contentType;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
