import type { DemoVehicleType } from "./demoPricing";

export type IntermediateStopInput = {
  address: string;
  placeId?: string;
};

export type IntermediateStop = {
  address: string;
  lat: string;
  lng: string;
  placeId?: string;
};

export type BookedForThirdParty = {
  name: string;
  phone: string;
  notes?: string;
};

/** 0 = domingo, 1 = segunda, … 6 = sábado */
export type RecurrenceRule = {
  type: "daily" | "weekly" | "custom";
  daysOfWeek?: number[];
  endDate?: string;
};

export type PassengerPremiumMeta = {
  bookedFor?: BookedForThirdParty;
  intermediateStops?: IntermediateStop[];
  recurrenceRule?: RecurrenceRule;
  recurringScheduleId?: number;
};

export type RidePrefill = {
  originAddress: string;
  destinationAddress: string;
  originLat?: string;
  originLng?: string;
  destinationLat?: string;
  destinationLng?: string;
  vehicleType?: DemoVehicleType;
};

export function formatRecurrenceLabel(rule: RecurrenceRule): string {
  if (rule.type === "daily") return "Diária";
  if (rule.type === "weekly") {
    const day = rule.daysOfWeek?.[0];
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return day != null ? `Semanal (${names[day]})` : "Semanal";
  }
  if (rule.type === "custom" && rule.daysOfWeek?.length) {
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const labels = rule.daysOfWeek.map((d) => names[d] ?? String(d));
    return `Dias: ${labels.join(", ")}`;
  }
  return "Recorrente";
}

export function buildPremiumMeta(input: {
  bookedFor?: BookedForThirdParty;
  intermediateStops?: IntermediateStop[];
  recurrenceRule?: RecurrenceRule;
  recurringScheduleId?: number;
}): PassengerPremiumMeta | null {
  const meta: PassengerPremiumMeta = {};
  if (input.bookedFor?.name?.trim()) meta.bookedFor = input.bookedFor;
  if (input.intermediateStops?.length) meta.intermediateStops = input.intermediateStops;
  if (input.recurrenceRule) meta.recurrenceRule = input.recurrenceRule;
  if (input.recurringScheduleId) meta.recurringScheduleId = input.recurringScheduleId;
  return Object.keys(meta).length > 0 ? meta : null;
}
