import type { DriverProfile, Vehicle } from "../../drizzle/schema";
import {
  DEMO_SIMULATION_DRIVER_ID,
  DEMO_SIMULATION_DRIVER_USER_ID,
} from "@shared/demoSimulation";

let simulationVehicle: Vehicle | null = null;

/** Perfil fixo “Motorista Demo” — não exige login como motorista. */
export function ensureDemoSimulationDriver(): {
  profile: DriverProfile;
  vehicle: Vehicle;
} {
  const now = new Date();
  if (!simulationVehicle) {
    simulationVehicle = {
      id: 849_999,
      driverId: DEMO_SIMULATION_DRIVER_ID,
      type: "carro",
      brand: "Demo",
      model: "Sedan Simulação",
      year: 2024,
      plate: "SIM0A00",
      color: "Laranja",
      photoUrl: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    profile: {
      id: DEMO_SIMULATION_DRIVER_ID,
      userId: DEMO_SIMULATION_DRIVER_USER_ID,
      cpf: null,
      cnh: null,
      cnhImageUrl: null,
      status: "approved",
      rating: 490,
      totalRides: 128,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    vehicle: simulationVehicle,
  };
}

export function isDemoSimulationDriverId(driverId: number | null | undefined): boolean {
  return driverId === DEMO_SIMULATION_DRIVER_ID;
}

export function getDemoSimulationVehicle(): Vehicle {
  return ensureDemoSimulationDriver().vehicle;
}
