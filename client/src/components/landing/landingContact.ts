import type { CommercialLeadInput } from "@shared/commercialLead";

const DEFAULT_EMAIL = "contato@contentfy.com.br";
/** Padrão: +55 79 99934-8812 (Romário) — sobrescreva via VITE_LANDING_WHATSAPP */
const DEFAULT_WHATSAPP = "79999348812";

export const LANDING_CONTACT_NAME =
  (import.meta.env.VITE_LANDING_CONTACT_NAME as string | undefined)?.trim() || "Romário";

export const LANDING_CONTACT = {
  whatsapp:
    (import.meta.env.VITE_LANDING_WHATSAPP as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined)?.trim() ||
    DEFAULT_WHATSAPP,
  email:
    (import.meta.env.VITE_LANDING_EMAIL as string | undefined)?.trim() ||
    DEFAULT_EMAIL,
  contactName: LANDING_CONTACT_NAME,
};

function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function landingWhatsAppUrl(message: string): string | null {
  const normalized = normalizeWhatsAppDigits(LANDING_CONTACT.whatsapp);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function openLandingWhatsApp(message: string): boolean {
  const url = landingWhatsAppUrl(message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

const greet = () => `Olá, ${LANDING_CONTACT_NAME}.`;

export const LANDING_WHATSAPP_MESSAGES = {
  city: `${greet()} Quero conhecer melhor o Fui para avaliar a implantação na minha cidade.`,
  demo: `${greet()} Quero agendar uma demonstração da plataforma Fui para avaliar uma operação na minha cidade.`,
  proposal: `${greet()} Tenho interesse em conhecer melhor o Fui e receber uma proposta comercial para implantação na minha cidade.`,
  founder: `${greet()} Quero conversar sobre o Fui e entender como a plataforma pode operar mobilidade, entregas e utilitários na minha cidade.`,
} as const;

export function buildLeadWhatsAppMessage(lead: CommercialLeadInput): string {
  const lines = [
    `${greet()} Quero apresentar o Fui na minha cidade.`,
    "",
    `Nome: ${lead.name}`,
    `Cidade: ${lead.city} — ${lead.state}`,
    `WhatsApp: ${lead.whatsapp}`,
    `E-mail: ${lead.email}`,
    `Perfil: ${lead.profileType}`,
  ];
  if (lead.message?.trim()) {
    lines.push(`Observação: ${lead.message.trim()}`);
  }
  return lines.join("\n");
}
