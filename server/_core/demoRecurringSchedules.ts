import type { DemoVehicleType } from "@shared/demoPricing";
import type { BookedForThirdParty, IntermediateStop, RecurrenceRule } from "@shared/passengerPremium";

export type RecurringScheduleTemplate = {
  vehicleType: DemoVehicleType;
  originAddress: string;
  originLat: string;
  originLng: string;
  destinationAddress: string;
  destinationLat: string;
  destinationLng: string;
  paymentMethod: "pix" | "card" | "cash";
  estimatedPrice?: number;
  distance?: number;
  duration?: number;
  bookedFor?: BookedForThirdParty;
  intermediateStops?: IntermediateStop[];
};

export type DemoRecurringSchedule = {
  id: number;
  passengerId: number;
  template: RecurringScheduleTemplate;
  recurrenceRule: RecurrenceRule;
  timeOfDay: string;
  active: boolean;
  createdAt: Date;
};

const schedules = new Map<number, DemoRecurringSchedule>();
let nextScheduleId = 1;

export function createDemoRecurringSchedule(input: {
  passengerId: number;
  template: RecurringScheduleTemplate;
  recurrenceRule: RecurrenceRule;
  timeOfDay: string;
}): DemoRecurringSchedule {
  const schedule: DemoRecurringSchedule = {
    id: nextScheduleId++,
    passengerId: input.passengerId,
    template: input.template,
    recurrenceRule: input.recurrenceRule,
    timeOfDay: input.timeOfDay,
    active: true,
    createdAt: new Date(),
  };
  schedules.set(schedule.id, schedule);
  return schedule;
}

export function getDemoRecurringSchedulesForPassenger(passengerId: number): DemoRecurringSchedule[] {
  return Array.from(schedules.values())
    .filter((s) => s.passengerId === passengerId && s.active)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getDemoRecurringSchedule(id: number): DemoRecurringSchedule | undefined {
  return schedules.get(id);
}

export function cancelDemoRecurringSchedule(id: number, passengerId: number): boolean {
  const schedule = schedules.get(id);
  if (!schedule || schedule.passengerId !== passengerId) return false;
  schedule.active = false;
  schedules.set(id, schedule);
  return true;
}

/** Restaura séries recorrentes demo enviadas pelo cliente (localStorage). */
export function hydrateDemoRecurringSchedules(items: DemoRecurringSchedule[]): void {
  for (const raw of items) {
    const schedule: DemoRecurringSchedule = {
      ...raw,
      createdAt: new Date(raw.createdAt),
    };
    const existing = schedules.get(schedule.id);
    if (existing && existing.createdAt.getTime() > schedule.createdAt.getTime()) {
      continue;
    }
    schedules.set(schedule.id, schedule);
    if (schedule.id >= nextScheduleId) {
      nextScheduleId = schedule.id + 1;
    }
  }
}

/** Próxima data futura que satisfaz a regra de recorrência. */
export function computeNextOccurrence(
  from: Date,
  rule: RecurrenceRule,
  timeOfDay: string
): Date {
  const [hours, minutes] = timeOfDay.split(":").map(Number);
  const candidate = new Date(from);
  candidate.setHours(hours || 8, minutes || 0, 0, 0);

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1);
  }

  const endDate = rule.endDate ? new Date(rule.endDate) : null;
  const maxDays = 366;

  for (let i = 0; i < maxDays; i++) {
    const day = candidate.getDay();

    if (rule.type === "daily") {
      if (candidate > from && (!endDate || candidate <= endDate)) return candidate;
    } else if (rule.type === "weekly") {
      const targetDay = rule.daysOfWeek?.[0] ?? day;
      if (day === targetDay && candidate > from && (!endDate || candidate <= endDate)) {
        return candidate;
      }
    } else if (rule.type === "custom") {
      const days = rule.daysOfWeek ?? [];
      if (days.includes(day) && candidate > from && (!endDate || candidate <= endDate)) {
        return candidate;
      }
    }

    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}
