/**
 * Script para popular o banco de dados com dados de demonstração
 * Cria motoristas, veículos, cupons e corridas de exemplo
 * 
 * Execute com: pnpm tsx scripts/seed-demo-data.ts
 */

import mysql from "mysql2/promise";

async function seed() {
  // Configuração do banco
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("🌱 Iniciando seed de dados de demonstração...\n");

  // Dados de motoristas de Itabaiana
  const driversData = [
    {
      name: "João Silva",
      email: "joao.silva@example.com",
      phone: "(79) 99123-4567",
      cpf: "123.456.789-01",
      cnh: "12345678901",
      vehicles: [
        { type: "carro", model: "Fiat Uno", color: "Branco", licensePlate: "ABC-1234" },
        { type: "carro", model: "Chevrolet Onix", color: "Prata", licensePlate: "DEF-5678" },
      ],
    },
    {
      name: "Maria Santos",
      email: "maria.santos@example.com",
      phone: "(79) 99234-5678",
      cpf: "234.567.890-12",
      cnh: "23456789012",
      vehicles: [
        { type: "moto", model: "Honda CG 160", color: "Vermelha", licensePlate: "GHI-9012" },
      ],
    },
    {
      name: "Pedro Oliveira",
      email: "pedro.oliveira@example.com",
      phone: "(79) 99345-6789",
      cpf: "345.678.901-23",
      cnh: "34567890123",
      vehicles: [
        { type: "carro", model: "Volkswagen Gol", color: "Azul", licensePlate: "JKL-3456" },
        { type: "van", model: "Fiat Ducato", color: "Branca", licensePlate: "MNO-7890" },
      ],
    },
    {
      name: "Ana Costa",
      email: "ana.costa@example.com",
      phone: "(79) 99456-7890",
      cpf: "456.789.012-34",
      cnh: "45678901234",
      vehicles: [
        { type: "moto", model: "Yamaha Factor 150", color: "Preta", licensePlate: "PQR-1234" },
      ],
    },
    {
      name: "Carlos Mendes",
      email: "carlos.mendes@example.com",
      phone: "(79) 99567-8901",
      cpf: "567.890.123-45",
      cnh: "56789012345",
      vehicles: [
        { type: "carro", model: "Hyundai HB20", color: "Vermelho", licensePlate: "STU-5678" },
        { type: "carro", model: "Toyota Etios", color: "Cinza", licensePlate: "VWX-9012" },
      ],
    },
  ];

  // Cupons de desconto
  const couponsData = [
    {
      code: "PRIMEIRA",
      description: "100% de desconto na primeira corrida",
      discountType: "percentage",
      discountValue: 10000, // 100%
      minRideValue: 0,
      maxDiscount: 5000, // R$ 50,00
      maxUses: 1000,
      usesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      isActive: true,
    },
    {
      code: "ITABAIANA10",
      description: "10% de desconto para moradores de Itabaiana",
      discountType: "percentage",
      discountValue: 1000, // 10%
      minRideValue: 500, // R$ 5,00
      maxDiscount: 1000, // R$ 10,00
      maxUses: 5000,
      usesPerUser: 10,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 dias
      isActive: true,
    },
    {
      code: "BEMVINDO",
      description: "R$ 5,00 de desconto para novos usuários",
      discountType: "fixed",
      discountValue: 500, // R$ 5,00
      minRideValue: 1000, // R$ 10,00
      maxDiscount: 500,
      maxUses: 2000,
      usesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
      isActive: true,
    },
    {
      code: "FDS20",
      description: "20% de desconto nos finais de semana",
      discountType: "percentage",
      discountValue: 2000, // 20%
      minRideValue: 800, // R$ 8,00
      maxDiscount: 1500, // R$ 15,00
      maxUses: 1000,
      usesPerUser: 5,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      isActive: true,
      applicableVehicleTypes: "carro,moto,van",
    },
  ];

  try {
    // 1. Criar cupons
    console.log("📋 Criando cupons de desconto...");
    for (const couponData of couponsData) {
      // Verificar se cupom já existe
      const [existing] = await connection.execute(
        "SELECT * FROM coupons WHERE code = ?",
        [couponData.code]
      );

      if ((existing as any[]).length === 0) {
        await connection.execute(
          `INSERT INTO coupons (code, description, discount_type, discount_value, min_ride_value, max_discount, max_uses, uses_per_user, valid_from, valid_until, is_active, applicable_vehicle_types, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            couponData.code,
            couponData.description,
            couponData.discountType,
            couponData.discountValue,
            couponData.minRideValue,
            couponData.maxDiscount,
            couponData.maxUses,
            couponData.usesPerUser,
            couponData.validFrom,
            couponData.validUntil,
            couponData.isActive ? 1 : 0,
            (couponData as any).applicableVehicleTypes || null,
          ]
        );
        console.log(`  ✅ Cupom "${couponData.code}" criado`);
      } else {
        console.log(`  ⏭️  Cupom "${couponData.code}" já existe`);
      }
    }

    // 2. Criar motoristas e veículos
    console.log("\n🚗 Criando motoristas e veículos...");
    for (const driverData of driversData) {
      // Verificar se usuário já existe
      const [existingUsers] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        [driverData.email]
      );

      let userId: number;

      if ((existingUsers as any[]).length === 0) {
        // Criar usuário
        const [result] = await connection.execute(
          `INSERT INTO users (email, name, phone, role, openId, createdAt, updatedAt, lastSignedIn)
           VALUES (?, ?, ?, 'user', ?, NOW(), NOW(), NOW())`,
          [driverData.email, driverData.name, driverData.phone, `demo_${driverData.email}`]
        );
        userId = (result as any).insertId;
        console.log(`  ✅ Usuário "${driverData.name}" criado`);
      } else {
        userId = (existingUsers as any[])[0].id;
        console.log(`  ⏭️  Usuário "${driverData.name}" já existe`);
      }

      // Verificar se já é motorista
      const [existingDrivers] = await connection.execute(
        "SELECT * FROM driver_profiles WHERE userId = ?",
        [userId]
      );

      let driverId: number;

      if ((existingDrivers as any[]).length === 0) {
        // Criar perfil de motorista
        const currentLat = -10.6850 + (Math.random() - 0.5) * 0.02;
        const currentLng = -37.4250 + (Math.random() - 0.5) * 0.02;
        const isAvailable = Math.random() > 0.3 ? 1 : 0;

        const [result] = await connection.execute(
          `INSERT INTO driver_profiles (userId, cpf, cnh, status, isAvailable, createdAt, updatedAt)
           VALUES (?, ?, ?, 'approved', ?, NOW(), NOW())`,
          [userId, driverData.cpf, driverData.cnh, isAvailable]
        );
        driverId = (result as any).insertId;
        console.log(`  ✅ Motorista "${driverData.name}" criado`);
      } else {
        driverId = (existingDrivers as any[])[0].id;
        console.log(`  ⏭️  Motorista "${driverData.name}" já existe`);
      }

      // Criar veículos
      for (const vehicleData of driverData.vehicles) {
        const [existingVehicles] = await connection.execute(
          "SELECT * FROM vehicles WHERE plate = ?",
          [vehicleData.licensePlate]
        );

        if ((existingVehicles as any[]).length === 0) {
          const year = 2018 + Math.floor(Math.random() * 6);
          await connection.execute(
            `INSERT INTO vehicles (driverId, type, model, color, plate, year, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [driverId, vehicleData.type, vehicleData.model, vehicleData.color, vehicleData.licensePlate, year]
          );
          console.log(`    ✅ Veículo ${vehicleData.model} (${vehicleData.licensePlate}) criado`);
        } else {
          console.log(`    ⏭️  Veículo ${vehicleData.licensePlate} já existe`);
        }
      }
    }

    console.log("\n✅ Seed de dados de demonstração concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`  - ${couponsData.length} cupons criados`);
    console.log(`  - ${driversData.length} motoristas criados`);
    console.log(`  - ${driversData.reduce((acc, d) => acc + d.vehicles.length, 0)} veículos criados`);
    console.log("\n🎉 O Fui! App está pronto para demonstrações!");
    console.log("\n💡 Dica: Use o cupom PRIMEIRA para ganhar 100% de desconto na primeira corrida!");

  } catch (error) {
    console.error("\n❌ Erro ao executar seed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
