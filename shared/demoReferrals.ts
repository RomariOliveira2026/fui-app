export type DemoReferralStatus = "pending" | "registered" | "completed" | "expired";

export type DemoReferralUser = {
  name: string;
  email?: string;
};

export type DemoReferralRecord = {
  id: number;
  referrerId: number;
  referredId: number | null;
  referralCode: string;
  status: DemoReferralStatus;
  referredUser?: DemoReferralUser | null;
  createdAt: string;
  completedAt?: string | null;
};

export type DemoReferralsSnapshot = {
  referrals: DemoReferralRecord[];
  nextId: number;
};

/** Código demo de outro “usuário” para testar o botão Aplicar localmente. */
export const DEMO_SAMPLE_REFERRAL_CODE = "FUIDEMO";

export const DEMO_SAMPLE_REFERRER_ID = 920_001;
