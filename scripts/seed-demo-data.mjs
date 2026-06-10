/**
 * Script para popular o banco de dados com dados de demonstração
 * Cria motoristas, veículos e cupons de exemplo para Itabaiana/SE
 * 
 * Execute com: node scripts/seed-demo-data.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import {
  users,
  driverProfiles,
  vehicles,
  coupons,
  pricingConfig,
} from "../drizzle/schema.ts";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

console.log("🌱 Iniciando seed de dados de demonstração...\n");

// ============= DADOS DE MOTORISTAS =============
const driversData = [
  {
    name: "João Silva",
    email: "joao.silva@demo.fui.app",
    phone: "(79) 99123-4567",
    cpf: "123.456.789-01",
    cnh: "12345678901",
    vehicles: [
      { type: "carro", brand: "Fiat", model: "Uno 1.0", year: 2020, color: "Branco", plate: "ABC1D23" },
    ],
  },
  {
    name: "Maria Santos",
    email: "maria.santos@demo.fui.app",
    phone: "(79) 99234-5678",
    cpf: "234.567.890-12",
    cnh: "23456789012",
    vehicles: [
      { type: "moto", brand: "Honda", model: "CG 160 Fan", year: 2022, color: "Vermelha", plate: "GHI2J34" },
    ],
  },
  {
    name: "Pedro Oliveira",
    email: "pedro.oliveira@demo.fui.app",
    phone: "(79) 99345-6789",
    cpf: "345.678.901-23",
    cnh: "34567890123",
    vehicles: [
      { type: "carro", brand: "Volkswagen", model: "Gol 1.6", year: 2019, color: "Azul", plate: "JKL3M56" },
      { type: "van", brand: "Fiat", model: "Ducato", year: 2021, color: "Branca", plate: "MNO4P78" },
    ],
  },
  {
    name: "Ana Costa",
    email: "ana.costa@demo.fui.app",
    phone: "(79) 99456-7890",
    cpf: "456.789.012-34",
    cnh: "45678901234",
    vehicles: [
      { type: "moto", brand: "Yamaha", model: "Factor 150", year: 2023, color: "Preta", plate: "PQR5S90" },
    ],
  },
  {
    name: "Carlos Mendes",
    email: "carlos.mendes@demo.fui.app",
    phone: "(79) 99567-8901",
    cpf: "567.890.123-45",
    cnh: "56789012345",
    vehicles: [
      { type: "carro", brand: "Hyundai", model: "HB20 1.0", year: 2022, color: "Vermelho", plate: "STU6V12" },
    ],
  },
  {
    name: "Fernanda Lima",
    email: "fernanda.lima@demo.fui.app",
    phone: "(79) 99678-9012",
    cpf: "678.901.234-56",
    cnh: "67890123456",
    vehicles: [
      { type: "carro", brand: "Chevrolet", model: "Onix 1.0", year: 2023, color: "Prata", plate: "VWX7Y34" },
    ],
  },
  {
    name: "Roberto Alves",
    email: "roberto.alves@demo.fui.app",
    phone: "(79) 99789-0123",
    cpf: "789.012.345-67",
    cnh: "78901234567",
    vehicles: [
      { type: "utilitario", brand: "Fiat", model: "Fiorino", year: 2020, color: "Branca", plate: "ZAB8C56" },
      { type: "carro", brand: "Toyota", model: "Etios 1.5", year: 2021, color: "Cinza", plate: "DEF9G78" },
    ],
  },
];

// ============= CUPONS =============
const couponsData = [
  {
    code: "PRIMEIRA",
    description: "100% de desconto na primeira corrida! Até R$ 50,00",
    discountType: "percentage",
    discountValue: 100,
    maxUses: 10000,
    maxUsesPerUser: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: 1,
  },
  {
    code: "ITABAIANA10",
    description: "10% de desconto para moradores de Itabaiana",
    discountType: "percentage",
    discountValue: 10,
    minRideValue: 500,
    maxUses: 5000,
    maxUsesPerUser: 10,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: 1,
  },
  {
    code: "BEMVINDO",
    description: "R$ 5,00 de desconto para novos usuários",
    discountType: "fixed",
    discountValue: 500,
    minRideValue: 1000,
    maxUses: 5000,
    maxUsesPerUser: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: 1,
  },
  {
    code: "FDS20",
    description: "20% de desconto nos finais de semana",
    discountType: "percentage",
    discountValue: 20,
    minRideValue: 800,
    maxUses: 2000,
    maxUsesPerUser: 5,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: 1,
  },
  {
    code: "FRETE30",
    description: "30% de desconto em fretes com utilitários",
    discountType: "percentage",
    discountValue: 30,
    minRideValue: 2000,
    maxUses: 500,
    maxUsesPerUser: 3,
    vehicleTypes: JSON.stringify(["utilitario"]),
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: 1,
  },
];

// ============= PREÇOS =============
const pricingData = [
  { vehicleType: "moto", basePrice: 500, pricePerKm: 150, pricePerMinute: 20, minimumPrice: 600 },
  { vehicleType: "carro", basePrice: 800, pricePerKm: 200, pricePerMinute: 30, minimumPrice: 1000 },
  { vehicleType: "van", basePrice: 1200, pricePerKm: 300, pricePerMinute: 40, minimumPrice: 1500 },
  { vehicleType: "utilitario", basePrice: 1500, pricePerKm: 400, pricePerMinute: 50, minimumPrice: 2000 },
];

try {
  // 1. Seed de preços
  console.log("💰 Configurando preços...");
  for (const p of pricingData) {
    const existing = await db.select().from(pricingConfig).where(eq(pricingConfig.vehicleType, p.vehicleType)).limit(1);
    if (existing.length === 0) {
      await db.insert(pricingConfig).values(p);
      console.log(`  ✅ Preço ${p.vehicleType}: base R$${(p.basePrice/100).toFixed(2)}, R$${(p.pricePerKm/100).toFixed(2)}/km`);
    } else {
      console.log(`  ⏭️  Preço ${p.vehicleType} já existe`);
    }
  }

  // 2. Seed de cupons
  console.log("\n📋 Criando cupons de desconto...");
  for (const c of couponsData) {
    const existing = await db.select().from(coupons).where(eq(coupons.code, c.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(coupons).values(c);
      console.log(`  ✅ Cupom "${c.code}" criado - ${c.description}`);
    } else {
      console.log(`  ⏭️  Cupom "${c.code}" já existe`);
    }
  }

  // 3. Seed de motoristas e veículos
  console.log("\n🚗 Criando motoristas e veículos...");
  for (const driverData of driversData) {
    // Verificar se usuário já existe por email
    const existingUser = await db.select().from(users).where(eq(users.email, driverData.email)).limit(1);
    
    let userId;
    if (existingUser.length === 0) {
      // Criar usuário
      const result = await db.insert(users).values({
        openId: `demo_${driverData.email.split("@")[0]}_${Date.now()}`,
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        role: "driver",
      });
      userId = result[0].insertId;
      console.log(`  ✅ Usuário "${driverData.name}" criado (ID: ${userId})`);
    } else {
      userId = existingUser[0].id;
      // Atualizar role para driver se necessário
      await db.update(users).set({ role: "driver" }).where(eq(users.id, userId));
      console.log(`  ⏭️  Usuário "${driverData.name}" já existe (ID: ${userId})`);
    }

    // Verificar se perfil de motorista existe
    const existingProfile = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
    
    let driverProfileId;
    if (existingProfile.length === 0) {
      // Criar perfil de motorista (aprovado)
      const rating = 400 + Math.floor(Math.random() * 100); // 4.00-5.00
      const totalRides = 20 + Math.floor(Math.random() * 180); // 20-200
      const profileResult = await db.insert(driverProfiles).values({
        userId,
        cpf: driverData.cpf,
        cnh: driverData.cnh,
        status: "approved",
        rating,
        totalRides,
        isAvailable: true,
      });
      driverProfileId = profileResult[0].insertId;
      console.log(`    ✅ Perfil motorista criado (avaliação: ${(rating/100).toFixed(1)}⭐, ${totalRides} corridas)`);
    } else {
      driverProfileId = existingProfile[0].id;
      console.log(`    ⏭️  Perfil motorista já existe`);
    }

    // Criar veículos
    for (const v of driverData.vehicles) {
      const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.plate, v.plate)).limit(1);
      if (existingVehicle.length === 0) {
        await db.insert(vehicles).values({
          driverId: driverProfileId,
          type: v.type,
          brand: v.brand,
          model: v.model,
          year: v.year,
          plate: v.plate,
          color: v.color,
          status: "active",
        });
        console.log(`    ✅ ${v.brand} ${v.model} (${v.plate}) - ${v.type}`);
      } else {
        console.log(`    ⏭️  Veículo ${v.plate} já existe`);
      }
    }
  }

  // Resumo
  console.log("\n" + "=".repeat(50));
  console.log("✅ SEED CONCLUÍDO COM SUCESSO!");
  console.log("=".repeat(50));
  console.log(`\n📊 Resumo:`);
  console.log(`  💰 ${pricingData.length} configurações de preço`);
  console.log(`  📋 ${couponsData.length} cupons de desconto`);
  console.log(`  👤 ${driversData.length} motoristas`);
  console.log(`  🚗 ${driversData.reduce((acc, d) => acc + d.vehicles.length, 0)} veículos`);
  console.log(`\n🎉 O Fui! App está pronto para demonstrações!`);
  console.log(`\n💡 Cupons disponíveis:`);
  couponsData.forEach(c => {
    const desc = c.discountType === "percentage" ? `${c.discountValue}% off` : `R$${(c.discountValue/100).toFixed(2)} off`;
    console.log(`   ${c.code} → ${desc} - ${c.description}`);
  });

} catch (error) {
  console.error("\n❌ Erro ao executar seed:", error);
  process.exit(1);
}

process.exit(0);
