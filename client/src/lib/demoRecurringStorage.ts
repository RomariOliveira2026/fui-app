import type { DemoRecurringSchedule } from "../../../server/_core/demoRecurringSchedules";

export const FUI_DEMO_RECURRING_SCHEDULES_KEY = "fui_demo_recurring_schedules";

function reviveSchedule(raw: DemoRecurringSchedule): DemoRecurringSchedule {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
  };
}

export function loadDemoRecurringSchedules(): DemoRecurringSchedule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_RECURRING_SCHEDULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoRecurringSchedule[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveSchedule);
  } catch {
    return [];
  }
}

export function saveDemoRecurringSchedules(schedules: DemoRecurringSchedule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_RECURRING_SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.warn("[demoRecurringStorage] save failed:", error);
  }
}

export function syncDemoRecurringSchedulesFromServer(schedules: DemoRecurringSchedule[]): void {
  saveDemoRecurringSchedules(schedules.map(reviveSchedule));
}
