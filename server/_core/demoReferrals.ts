import {
  DEMO_SAMPLE_REFERRAL_CODE,
  DEMO_SAMPLE_REFERRER_ID,
  type DemoReferralRecord,
  type DemoReferralsSnapshot,
} from "@shared/demoReferrals";

let referrals: DemoReferralRecord[] = [];
let nextId = 960_001;
let seeded = false;

function seedIfNeeded(): void {
  if (seeded) return;
  seeded = true;
  referrals.push({
    id: nextId++,
    referrerId: DEMO_SAMPLE_REFERRER_ID,
    referredId: null,
    referralCode: DEMO_SAMPLE_REFERRAL_CODE,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

export function hydrateDemoReferrals(snapshot: DemoReferralsSnapshot): void {
  if (snapshot.referrals?.length) {
    referrals = snapshot.referrals.map((r) => ({ ...r }));
    nextId = Math.max(nextId, snapshot.nextId ?? 960_001);
    seeded = true;
  } else {
    seedIfNeeded();
  }
}

export function exportDemoReferralsSnapshot(): DemoReferralsSnapshot {
  seedIfNeeded();
  return {
    referrals: referrals.map((r) => ({ ...r })),
    nextId,
  };
}

function generateCode(): string {
  return "FUI" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getDemoReferralCode(userId: number): string {
  seedIfNeeded();
  const pending = referrals.find(
    (r) => r.referrerId === userId && r.status === "pending" && !r.referredId
  );
  if (pending) return pending.referralCode;

  const code = generateCode();
  referrals.push({
    id: nextId++,
    referrerId: userId,
    referredId: null,
    referralCode: code,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return code;
}

export function getDemoReferralByCode(code: string): DemoReferralRecord | null {
  seedIfNeeded();
  return referrals.find((r) => r.referralCode === code.toUpperCase()) ?? null;
}

export function getDemoReferralByReferredUser(userId: number): DemoReferralRecord | null {
  seedIfNeeded();
  return referrals.find((r) => r.referredId === userId) ?? null;
}

export function getDemoUserReferrals(userId: number) {
  seedIfNeeded();
  return referrals
    .filter((r) => r.referrerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => ({
      ...r,
      referredUser: r.referredUser ?? null,
    }));
}

export function getDemoReferralStats(userId: number) {
  seedIfNeeded();
  const mine = referrals.filter((r) => r.referrerId === userId);
  const totalReferred = mine.filter((r) => r.referredId != null).length;
  const totalCompleted = mine.filter((r) => r.status === "completed").length;
  const pendingCode =
    mine.find((r) => r.status === "pending" && !r.referredId)?.referralCode ?? null;

  return {
    totalReferred,
    totalCompleted,
    totalEarned: totalCompleted * 500,
    pendingCode,
  };
}

export function registerDemoReferral(
  code: string,
  referredUserId: number,
  referredUser?: { name?: string; email?: string }
): { ok: true } | { ok: false; reason: "invalid" | "used" | "self" | "already_applied" } {
  seedIfNeeded();

  if (getDemoReferralByReferredUser(referredUserId)) {
    return { ok: false, reason: "already_applied" };
  }

  const referral = getDemoReferralByCode(code);
  if (!referral) return { ok: false, reason: "invalid" };
  if (referral.referrerId === referredUserId) return { ok: false, reason: "self" };
  if (referral.status !== "pending" || referral.referredId != null) {
    return { ok: false, reason: "used" };
  }

  referral.referredId = referredUserId;
  referral.status = "registered";
  referral.referredUser = {
    name: referredUser?.name ?? "Novo indicado",
    email: referredUser?.email,
  };

  const newCode = generateCode();
  referrals.push({
    id: nextId++,
    referrerId: referral.referrerId,
    referredId: null,
    referralCode: newCode,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  return { ok: true };
}

export function demoReferralErrorMessage(
  reason: "invalid" | "used" | "self" | "already_applied"
): string {
  switch (reason) {
    case "invalid":
      return "Código de indicação inválido";
    case "used":
      return "Este código já foi utilizado";
    case "self":
      return "Você não pode usar seu próprio código de indicação";
    case "already_applied":
      return "Você já utilizou um código de indicação";
  }
}
