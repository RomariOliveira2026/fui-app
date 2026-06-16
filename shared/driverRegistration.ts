import { z } from "zod";

export const DRIVER_APPLICATION_STATUSES = [
  "rascunho",
  "enviado",
  "em_analise",
  "pendente",
  "aprovado",
  "reprovado",
] as const;

export type DriverApplicationStatus = (typeof DRIVER_APPLICATION_STATUSES)[number];

export const DRIVER_APPLICATION_STATUS_LABELS: Record<DriverApplicationStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em análise",
  pendente: "Pendência",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const DRIVER_VEHICLE_TYPES = ["moto", "carro", "van", "utilitario"] as const;
export type DriverRegVehicleType = (typeof DRIVER_VEHICLE_TYPES)[number];

export const REGISTRATION_STEPS = [
  { id: 1, key: "personal", title: "Dados pessoais" },
  { id: 2, key: "cnh", title: "CNH" },
  { id: 3, key: "vehicle", title: "Veículo" },
  { id: 4, key: "security", title: "Segurança" },
  { id: 5, key: "terms", title: "Termos" },
] as const;

const cpfSchema = z
  .string()
  .min(11, "CPF inválido")
  .max(14)
  .refine((v) => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos");

const phoneSchema = z.string().min(10, "Telefone inválido").max(20);

export const driverPersonalSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  cpf: cpfSchema,
  birthDate: z.string().min(8, "Informe a data de nascimento"),
  phone: phoneSchema,
  email: z.string().email("E-mail inválido"),
  address: z.string().min(5, "Informe o endereço"),
  city: z.string().min(2, "Informe a cidade"),
  neighborhood: z.string().min(2, "Informe o bairro de atuação"),
});

export const driverCnhSchema = z.object({
  number: z.string().min(5, "Informe o número da CNH"),
  category: z.string().min(1, "Informe a categoria"),
  expiry: z.string().min(8, "Informe a validade"),
  ear: z.boolean(),
  frontImageUrl: z.string().min(1, "Envie a foto da frente da CNH"),
  backImageUrl: z.string().min(1, "Envie a foto do verso da CNH"),
});

export const driverVehicleSchema = z.object({
  type: z.enum(DRIVER_VEHICLE_TYPES),
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Informe a cor"),
  plate: z.string().min(7, "Informe a placa"),
  crlvNumber: z.string().min(1, "Informe o CRLV"),
  crlvImageUrl: z.string().min(1, "Envie o CRLV"),
  vehiclePhotoUrls: z.array(z.string()).min(1, "Envie ao menos uma foto do veículo"),
  platePhotoUrl: z.string().min(1, "Envie a foto da placa"),
});

export const driverSecuritySchema = z.object({
  selfieUrl: z.string().min(1, "Envie a selfie"),
  criminalRecordUrl: z.string().min(1, "Envie os antecedentes criminais"),
  emergencyContactName: z.string().min(2, "Informe o contato de emergência"),
  emergencyContactPhone: phoneSchema,
  pixKey: z.string().min(3, "Informe a chave PIX"),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
});

export const driverTermsSchema = z.object({
  termsAccepted: z.literal(true, { message: "Aceite os termos de uso" }),
  conductAccepted: z.literal(true, { message: "Aceite a política de conduta" }),
  privacyAccepted: z.literal(true, { message: "Aceite a política de privacidade" }),
  documentReviewAck: z.literal(true, {
    message: "Confirme ciência da análise documental",
  }),
});

export const driverApplicationSubmitSchema = z.object({
  personal: driverPersonalSchema,
  cnh: driverCnhSchema,
  vehicle: driverVehicleSchema,
  security: driverSecuritySchema,
  terms: driverTermsSchema,
});

export type DriverPersonalData = z.infer<typeof driverPersonalSchema>;
export type DriverCnhData = z.infer<typeof driverCnhSchema>;
export type DriverVehicleData = z.infer<typeof driverVehicleSchema>;
export type DriverSecurityData = z.infer<typeof driverSecuritySchema>;
export type DriverTermsData = z.infer<typeof driverTermsSchema>;

export type DriverApplicationDraft = {
  personal?: Partial<DriverPersonalData>;
  cnh?: Partial<DriverCnhData>;
  vehicle?: Partial<DriverVehicleData>;
  security?: Partial<DriverSecurityData>;
  terms?: Partial<{
    termsAccepted: boolean;
    conductAccepted: boolean;
    privacyAccepted: boolean;
    documentReviewAck: boolean;
  }>;
};

/** Estado completo do formulário no cliente. */
export type DriverApplicationFormState = {
  personal: DriverPersonalData;
  cnh: DriverCnhData;
  vehicle: DriverVehicleData;
  security: DriverSecurityData;
  terms: {
    termsAccepted: boolean;
    conductAccepted: boolean;
    privacyAccepted: boolean;
    documentReviewAck: boolean;
  };
};

export type DriverApplication = {
  id: number;
  userId: number;
  status: DriverApplicationStatus;
  personal?: DriverPersonalData;
  cnh?: DriverCnhData;
  vehicle?: DriverVehicleData;
  security?: DriverSecurityData;
  terms?: DriverTermsData;
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  /** Nome do usuário (admin). */
  applicantName?: string;
  applicantEmail?: string;
};

export const EMPTY_DRIVER_REGISTRATION: DriverApplicationFormState = {
  personal: {
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    neighborhood: "",
  },
  cnh: {
    number: "",
    category: "",
    expiry: "",
    ear: false,
    frontImageUrl: "",
    backImageUrl: "",
  },
  vehicle: {
    type: "carro",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    plate: "",
    crlvNumber: "",
    crlvImageUrl: "",
    vehiclePhotoUrls: [],
    platePhotoUrl: "",
  },
  security: {
    selfieUrl: "",
    criminalRecordUrl: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    pixKey: "",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
  },
  terms: {
    termsAccepted: false,
    conductAccepted: false,
    privacyAccepted: false,
    documentReviewAck: false,
  },
};
