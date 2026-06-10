import { drizzle } from "drizzle-orm/mysql2";
import { pricingConfig } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const pricingData = [
  {
    vehicleType: "moto",
    basePrice: 500, // R$ 5,00
    pricePerKm: 150, // R$ 1,50 por km
    pricePerMinute: 30, // R$ 0,30 por minuto
    minimumPrice: 800, // R$ 8,00 mínimo
  },
  {
    vehicleType: "carro",
    basePrice: 700, // R$ 7,00
    pricePerKm: 250, // R$ 2,50 por km
    pricePerMinute: 50, // R$ 0,50 por minuto
    minimumPrice: 1200, // R$ 12,00 mínimo
  },
  {
    vehicleType: "van",
    basePrice: 1000, // R$ 10,00
    pricePerKm: 350, // R$ 3,50 por km
    pricePerMinute: 70, // R$ 0,70 por minuto
    minimumPrice: 1800, // R$ 18,00 mínimo
  },
];

async function seed() {
  console.log("Seeding pricing configuration...");
  
  for (const pricing of pricingData) {
    await db.insert(pricingConfig).values(pricing).onDuplicateKeyUpdate({
      set: {
        basePrice: pricing.basePrice,
        pricePerKm: pricing.pricePerKm,
        pricePerMinute: pricing.pricePerMinute,
        minimumPrice: pricing.minimumPrice,
      }
    });
    console.log(`✓ Configured pricing for ${pricing.vehicleType}`);
  }
  
  console.log("Pricing seed completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
