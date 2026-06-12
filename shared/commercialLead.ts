import { z } from "zod";

export const COMMERCIAL_PROFILE_TYPES = [
  "Empresário local",
  "Investidor",
  "Operador de transporte",
  "Logística / entregas",
  "Cooperativa",
  "Outro",
] as const;

export type CommercialProfileType = (typeof COMMERCIAL_PROFILE_TYPES)[number];

export const commercialLeadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .min(2, "Informe o estado")
    .max(2, "Use a sigla do estado (ex.: SE)")
    .transform((v) => v.toUpperCase()),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe um WhatsApp válido")
    .max(20, "WhatsApp inválido"),
  email: z.string().trim().email("Informe um e-mail válido"),
  profileType: z.enum(COMMERCIAL_PROFILE_TYPES, {
    message: "Selecione o perfil da operação",
  }),
  message: z.string().trim().max(2000).optional(),
});

export type CommercialLeadInput = z.infer<typeof commercialLeadSchema>;

export type CommercialLeadRecord = CommercialLeadInput & {
  id: string;
  createdAt: string;
};
