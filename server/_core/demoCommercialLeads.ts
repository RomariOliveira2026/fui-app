import type { CommercialLeadInput, CommercialLeadRecord } from "@shared/commercialLead";
import { nanoid } from "nanoid";

const leads: CommercialLeadRecord[] = [];

export function saveDemoCommercialLead(input: CommercialLeadInput): CommercialLeadRecord {
  const record: CommercialLeadRecord = {
    ...input,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
  };
  leads.unshift(record);
  if (leads.length > 200) leads.pop();
  console.info("[CommercialLead] Novo lead registrado:", {
    id: record.id,
    city: record.city,
    state: record.state,
    profileType: record.profileType,
  });
  return record;
}

export function getDemoCommercialLeads(): CommercialLeadRecord[] {
  return [...leads];
}

export function resetDemoCommercialLeadsForTests(): void {
  leads.length = 0;
}

export function formatCommercialLeadNotification(input: CommercialLeadInput): {
  title: string;
  content: string;
} {
  const lines = [
    `Nome: ${input.name}`,
    `Cidade: ${input.city} — ${input.state}`,
    `WhatsApp: ${input.whatsapp}`,
    `E-mail: ${input.email}`,
    `Perfil: ${input.profileType}`,
  ];
  if (input.message?.trim()) {
    lines.push(`Observação: ${input.message.trim()}`);
  }
  return {
    title: `Lead Fui Licenciamento — ${input.city}/${input.state}`,
    content: lines.join("\n"),
  };
}
