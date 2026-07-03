import {
  estimateDemoRidePriceCents,
  type DemoPricingRow,
  type DemoVehicleType,
} from "./demoPricing";
import { RIDE_CATEGORIES } from "./rideCategories";

export type CategoryQuote = {
  vehicleType: DemoVehicleType;
  estimatedPrice: number;
  durationS: number;
  durationText: string;
};

export function formatDurationText(durationS: number): string {
  const minutes = Math.max(1, Math.round(durationS / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Preços estimados para todas as categorias a partir da mesma rota OSRM. */
export function buildCategoryQuotes(
  distanceM: number,
  durationS: number,
  pricingRows?: DemoPricingRow[]
): CategoryQuote[] {
  return RIDE_CATEGORIES.map((category) => {
    const row = pricingRows?.find((p) => p.vehicleType === category.type);
    const estimate = estimateDemoRidePriceCents(category.type, distanceM, durationS);
    const estimatedPrice = row
      ? Math.max(estimate.estimatedPrice, row.minimumPrice)
      : estimate.estimatedPrice;

    return {
      vehicleType: category.type,
      estimatedPrice,
      durationS: estimate.durationS,
      durationText: formatDurationText(estimate.durationS),
    };
  });
}

export function pickCategoryQuote(
  quotes: CategoryQuote[],
  vehicleType: DemoVehicleType
): CategoryQuote | undefined {
  return quotes.find((q) => q.vehicleType === vehicleType);
}
