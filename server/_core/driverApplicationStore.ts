import type {
  DriverApplication,
  DriverApplicationDraft,
  DriverApplicationStatus,
} from "@shared/driverRegistration";
import type { DriverApplicationRow } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import {
  createDemoPendingDriverProfile,
  createDemoVehicle,
  getDemoDriverProfileByUserId,
  updateDemoDriverProfileStatus,
} from "./demoDriver";
import * as db from "../db";

const applicationsByUserId = new Map<number, DriverApplication>();
const applicationsById = new Map<number, DriverApplication>();
let nextApplicationId = 950_001;

function nowIso(): string {
  return new Date().toISOString();
}

function rowToApplication(row: DriverApplicationRow): DriverApplication {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    personal: row.personalData ?? undefined,
    cnh: row.cnhData ?? undefined,
    vehicle: row.vehicleData ?? undefined,
    security: row.securityData ?? undefined,
    terms: row.termsData ?? undefined,
    reviewNotes: row.reviewNotes ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function persistMemory(app: DriverApplication): DriverApplication {
  applicationsByUserId.set(app.userId, app);
  applicationsById.set(app.id, app);
  return app;
}

export function getDriverApplicationByUserId(userId: number): DriverApplication | null {
  return applicationsByUserId.get(userId) ?? null;
}

export function getDriverApplicationById(id: number): DriverApplication | null {
  return applicationsById.get(id) ?? null;
}

export function listDriverApplications(): DriverApplication[] {
  return Array.from(applicationsById.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function loadDriverApplicationForUser(userId: number): Promise<DriverApplication | null> {
  const memory = getDriverApplicationByUserId(userId);
  if (memory) return memory;

  const row = await db.getDriverApplicationByUserId(userId);
  if (!row) return null;
  const app = rowToApplication(row);
  return persistMemory(app);
}

export async function listDriverApplicationsForAdmin(): Promise<DriverApplication[]> {
  const memory = listDriverApplications().filter((a) => a.status !== "rascunho");
  if (memory.length > 0) return memory;

  const rows = await db.listDriverApplications();
  return rows.map((row) => {
    const app = rowToApplication(row);
    persistMemory(app);
    return app;
  });
}

export async function saveDriverApplicationDraft(
  userId: number,
  payload: DriverApplicationDraft
): Promise<DriverApplication> {
  const existing = (await loadDriverApplicationForUser(userId)) ?? null;
  const now = nowIso();

  const merged: DriverApplication = {
    id: existing?.id ?? nextApplicationId++,
    userId,
    status: existing?.status === "rascunho" || !existing ? "rascunho" : existing.status,
    personal: { ...existing?.personal, ...payload.personal } as DriverApplication["personal"],
    cnh: { ...existing?.cnh, ...payload.cnh } as DriverApplication["cnh"],
    vehicle: { ...existing?.vehicle, ...payload.vehicle } as DriverApplication["vehicle"],
    security: { ...existing?.security, ...payload.security } as DriverApplication["security"],
    terms: { ...existing?.terms, ...payload.terms } as DriverApplication["terms"],
    reviewNotes: existing?.reviewNotes ?? null,
    submittedAt: existing?.submittedAt ?? null,
    reviewedAt: existing?.reviewedAt ?? null,
    reviewedBy: existing?.reviewedBy ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  persistMemory(merged);
  await db.upsertDriverApplicationDraft(userId, merged);
  return merged;
}

async function ensurePendingDriverProfile(userId: number, cpf: string, cnh: string, cnhImageUrl?: string) {
  const existing = getDemoDriverProfileByUserId(userId);
  if (existing) return existing;

  const dbProfile = await db.getDriverProfileByUserId(userId);
  if (dbProfile) return dbProfile;

  return createDemoPendingDriverProfile({
    userId,
    cpf,
    cnh,
    cnhImageUrl: cnhImageUrl ?? null,
  });
}

export async function submitDriverApplication(
  user: Pick<User, "id" | "name" | "email">,
  payload: {
    personal: NonNullable<DriverApplication["personal"]>;
    cnh: NonNullable<DriverApplication["cnh"]>;
    vehicle: NonNullable<DriverApplication["vehicle"]>;
    security: NonNullable<DriverApplication["security"]>;
    terms: NonNullable<DriverApplication["terms"]>;
  }
): Promise<DriverApplication> {
  const now = nowIso();
  const existing = await loadDriverApplicationForUser(user.id);
  const id = existing?.id ?? nextApplicationId++;

  const app: DriverApplication = {
    id,
    userId: user.id,
    status: "enviado",
    personal: payload.personal,
    cnh: payload.cnh,
    vehicle: payload.vehicle,
    security: payload.security,
    terms: payload.terms as DriverApplication["terms"],
    reviewNotes: null,
    submittedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    applicantName: payload.personal?.fullName ?? user.name ?? undefined,
    applicantEmail: payload.personal?.email ?? user.email ?? undefined,
  };

  persistMemory(app);
  await db.submitDriverApplicationRow(user.id, app);

  if (payload.personal && payload.cnh) {
    await ensurePendingDriverProfile(
      user.id,
      payload.personal.cpf,
      payload.cnh.number,
      payload.cnh.frontImageUrl
    );
    await db.updateUserRole(user.id, "driver");
    await db.updateUserProfile(user.id, {
      name: payload.personal.fullName,
      phone: payload.personal.phone,
    });
  }

  return app;
}

export async function reviewDriverApplication(
  applicationId: number,
  adminUserId: number,
  action: "em_analise" | "pendente" | "aprovado" | "reprovado",
  reviewNotes?: string
): Promise<DriverApplication | null> {
  let app = getDriverApplicationById(applicationId);
  if (!app) {
    const row = await db.getDriverApplicationById(applicationId);
    if (row) app = rowToApplication(row);
  }
  if (!app) return null;

  const now = nowIso();
  const updated: DriverApplication = {
    ...app,
    status: action,
    reviewNotes: reviewNotes ?? app.reviewNotes ?? null,
    reviewedAt: now,
    reviewedBy: adminUserId,
    updatedAt: now,
  };

  if (action === "aprovado" && app.personal && app.cnh && app.vehicle) {
    const profile =
      getDemoDriverProfileByUserId(app.userId) ??
      (await db.getDriverProfileByUserId(app.userId)) ??
      createDemoPendingDriverProfile({
        userId: app.userId,
        cpf: app.personal.cpf,
        cnh: app.cnh.number,
        cnhImageUrl: app.cnh.frontImageUrl,
      });

    updateDemoDriverProfileStatus(profile.id, "approved");
    await db.updateDriverProfile(profile.id, {
      status: "approved",
      cpf: app.personal.cpf,
      cnh: app.cnh.number,
      cnhImageUrl: app.cnh.frontImageUrl,
    });

    const vehicles = await db.getVehiclesByDriverId(profile.id);
    if (vehicles.length === 0) {
      createDemoVehicle(profile.id, {
        type: app.vehicle.type,
        brand: app.vehicle.brand,
        model: app.vehicle.model,
        year: app.vehicle.year,
        plate: app.vehicle.plate,
        color: app.vehicle.color,
      });
      await db.createVehicle({
        driverId: profile.id,
        type: app.vehicle.type,
        brand: app.vehicle.brand,
        model: app.vehicle.model,
        year: app.vehicle.year,
        plate: app.vehicle.plate,
        color: app.vehicle.color,
        photoUrl: app.vehicle.vehiclePhotoUrls[0] ?? null,
        status: "active",
      });
    }

    await db.updateUserRole(app.userId, "driver");
  }

  if (action === "reprovado") {
    const profile = getDemoDriverProfileByUserId(app.userId) ?? (await db.getDriverProfileByUserId(app.userId));
    if (profile) {
      updateDemoDriverProfileStatus(profile.id, "rejected");
      await db.updateDriverProfile(profile.id, { status: "rejected" });
    }
  }

  persistMemory(updated);
  await db.updateDriverApplicationStatus(applicationId, updated);
  return updated;
}

/** Cadastros demo para Central Operacional em ambiente sem DB. */
export function seedDemoDriverApplications(): void {
  if (applicationsById.size > 0) return;

  const sample = {
    personal: {
      fullName: "Marcos Oliveira",
      cpf: "529.982.247-25",
      birthDate: "1990-05-12",
      phone: "(79) 99999-1234",
      email: "marcos@demo.fui",
      address: "Rua das Flores, 120",
      city: "Aracaju",
      neighborhood: "Centro",
    },
    cnh: {
      number: "12345678901",
      category: "B",
      expiry: "2028-12-31",
      ear: true,
      frontImageUrl: "https://ui-avatars.com/api/?name=CNH+Frente&background=1e293b&color=fff",
      backImageUrl: "https://ui-avatars.com/api/?name=CNH+Verso&background=1e293b&color=fff",
    },
    vehicle: {
      type: "carro" as const,
      brand: "Fiat",
      model: "Argo",
      year: 2022,
      color: "Branco",
      plate: "ABC1D23",
      crlvNumber: "CRLV-998877",
      crlvImageUrl: "https://ui-avatars.com/api/?name=CRLV&background=F39200&color=fff",
      vehiclePhotoUrls: ["https://ui-avatars.com/api/?name=Veiculo&background=334155&color=fff"],
      platePhotoUrl: "https://ui-avatars.com/api/?name=Placa&background=334155&color=fff",
    },
    security: {
      selfieUrl: "https://ui-avatars.com/api/?name=Marcos&background=F39200&color=fff",
      criminalRecordUrl: "https://ui-avatars.com/api/?name=Antecedentes&background=1e293b&color=fff",
      emergencyContactName: "Ana Oliveira",
      emergencyContactPhone: "(79) 98888-4321",
      pixKey: "marcos@demo.fui",
      bankName: "Banco Demo",
      bankAgency: "0001",
      bankAccount: "12345-6",
    },
    terms: {
      termsAccepted: true as const,
      conductAccepted: true as const,
      privacyAccepted: true as const,
      documentReviewAck: true as const,
    },
  };

  const now = nowIso();
  persistMemory({
    id: nextApplicationId++,
    userId: 920_001,
    status: "enviado",
    ...sample,
    reviewNotes: null,
    submittedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: now,
    updatedAt: now,
    applicantName: sample.personal.fullName,
    applicantEmail: sample.personal.email,
  });
}
