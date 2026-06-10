/** Tarifas padrão para demo local (centavos). Espelha seed-pricing + utilitário. */

export type DemoVehicleType = "moto" | "carro" | "van" | "utilitario";

export type DemoPricingRow = {
  vehicleType: DemoVehicleType;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumPrice: number;
};

export const DEMO_PRICING: DemoPricingRow[] = [
  {
    vehicleType: "moto",
    basePrice: 500,
    pricePerKm: 150,
    pricePerMinute: 30,
    minimumPrice: 800,
  },
  {
    vehicleType: "carro",
    basePrice: 700,
    pricePerKm: 250,
    pricePerMinute: 50,
    minimumPrice: 1200,
  },
  {
    vehicleType: "van",
    basePrice: 1000,
    pricePerKm: 350,
    pricePerMinute: 70,
    minimumPrice: 1800,
  },
  {
    vehicleType: "utilitario",
    basePrice: 1500,
    pricePerKm: 400,
    pricePerMinute: 80,
    minimumPrice: 2000,
  },
];

export function getDemoPricingByVehicleType(
  vehicleType: DemoVehicleType
): DemoPricingRow | undefined {
  return DEMO_PRICING.find((p) => p.vehicleType === vehicleType);
}
