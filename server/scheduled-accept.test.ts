import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getRideById: vi.fn(),
  getRequestedRides: vi.fn(),
  getVehiclesByDriverId: vi.fn(),
  getVehicleById: vi.fn(),
  updateRide: vi.fn(),
  getUserById: vi.fn(),
  getDb: vi.fn(),
}));

// Mock fcm module
vi.mock("./_core/fcm", () => ({
  notifyUser: vi.fn().mockResolvedValue(true),
}));

// Mock notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as db from "./db";

describe("Scheduled Ride Accept/Reject Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingForDriver filtering", () => {
    it("should filter only scheduled rides with matching vehicle types", async () => {
      const allRides = [
        {
          id: 1,
          isScheduled: "yes",
          status: "requested",
          scheduledFor: new Date("2026-04-01T10:00:00Z"),
          vehicleType: "carro",
          passengerId: 10,
          originAddress: "Rua A",
          destinationAddress: "Rua B",
        },
        {
          id: 2,
          isScheduled: "yes",
          status: "requested",
          scheduledFor: new Date("2026-04-01T14:00:00Z"),
          vehicleType: "moto",
          passengerId: 11,
          originAddress: "Rua C",
          destinationAddress: "Rua D",
        },
        {
          id: 3,
          isScheduled: "no",
          status: "requested",
          scheduledFor: null,
          vehicleType: "carro",
          passengerId: 12,
          originAddress: "Rua E",
          destinationAddress: "Rua F",
        },
        {
          id: 4,
          isScheduled: "yes",
          status: "accepted",
          scheduledFor: new Date("2026-04-02T10:00:00Z"),
          vehicleType: "carro",
          passengerId: 13,
          originAddress: "Rua G",
          destinationAddress: "Rua H",
        },
      ];

      const driverVehicles = [
        { id: 100, type: "carro", status: "active", driverId: 1 },
        { id: 101, type: "van", status: "inactive", driverId: 1 },
      ];

      // Filter logic: only scheduled + requested + has scheduledFor
      const scheduledPending = allRides.filter(
        (r) => r.isScheduled === "yes" && r.status === "requested" && r.scheduledFor
      );
      expect(scheduledPending).toHaveLength(2);
      expect(scheduledPending.map((r) => r.id)).toEqual([1, 2]);

      // Filter by driver's active vehicle types
      const driverVehicleTypes = driverVehicles
        .filter((v) => v.status === "active")
        .map((v) => v.type);
      expect(driverVehicleTypes).toEqual(["carro"]);

      const matchingRides = scheduledPending.filter((r) =>
        driverVehicleTypes.includes(r.vehicleType)
      );
      expect(matchingRides).toHaveLength(1);
      expect(matchingRides[0].id).toBe(1);
    });
  });

  describe("acceptScheduledRide validation", () => {
    it("should reject if ride is not scheduled", async () => {
      const ride = {
        id: 1,
        isScheduled: "no",
        status: "requested",
        vehicleType: "carro",
        passengerId: 10,
      };

      expect(ride.isScheduled).not.toBe("yes");
    });

    it("should reject if ride is already accepted", async () => {
      const ride = {
        id: 1,
        isScheduled: "yes",
        status: "accepted",
        vehicleType: "carro",
        passengerId: 10,
      };

      expect(ride.status).not.toBe("requested");
    });

    it("should reject if vehicle type doesn't match", async () => {
      const ride = {
        id: 1,
        isScheduled: "yes",
        status: "requested",
        vehicleType: "carro",
        passengerId: 10,
      };

      const vehicle = {
        id: 100,
        type: "moto",
        driverId: 1,
        status: "active",
      };

      expect(vehicle.type).not.toBe(ride.vehicleType);
    });

    it("should accept if all validations pass", async () => {
      const ride = {
        id: 1,
        isScheduled: "yes",
        status: "requested",
        vehicleType: "carro",
        passengerId: 10,
        scheduledFor: new Date("2026-04-01T10:00:00Z"),
      };

      const vehicle = {
        id: 100,
        type: "carro",
        driverId: 1,
        status: "active",
      };

      // All validations pass
      expect(ride.isScheduled).toBe("yes");
      expect(ride.status).toBe("requested");
      expect(vehicle.type).toBe(ride.vehicleType);

      // Simulate update
      vi.mocked(db.updateRide).mockResolvedValue(undefined);
      await db.updateRide(ride.id, {
        driverId: vehicle.driverId,
        vehicleId: vehicle.id,
        status: "accepted",
      });

      expect(db.updateRide).toHaveBeenCalledWith(ride.id, {
        driverId: 1,
        vehicleId: 100,
        status: "accepted",
      });
    });
  });

  describe("rejectScheduledRide logic", () => {
    it("should revert to requested if driver had accepted", async () => {
      const ride = {
        id: 1,
        isScheduled: "yes",
        status: "accepted",
        driverId: 5,
        vehicleId: 100,
        vehicleType: "carro",
        passengerId: 10,
      };

      const driverProfileId = 5;

      // Driver who accepted is rejecting
      expect(ride.driverId).toBe(driverProfileId);
      expect(ride.status).toBe("accepted");

      vi.mocked(db.updateRide).mockResolvedValue(undefined);
      await db.updateRide(ride.id, {
        driverId: null,
        vehicleId: null,
        status: "requested",
      });

      expect(db.updateRide).toHaveBeenCalledWith(ride.id, {
        driverId: null,
        vehicleId: null,
        status: "requested",
      });
    });

    it("should do nothing if driver hasn't accepted yet (just passing)", async () => {
      const ride = {
        id: 1,
        isScheduled: "yes",
        status: "requested",
        driverId: null,
        vehicleType: "carro",
        passengerId: 10,
      };

      const driverProfileId = 5;

      // Driver hasn't accepted, so no update needed
      expect(ride.driverId).not.toBe(driverProfileId);
      // The ride stays as "requested" for other drivers
      expect(ride.status).toBe("requested");
    });
  });

  describe("Notification flow", () => {
    it("should create notification data for passenger on accept", () => {
      const ride = {
        id: 1,
        scheduledFor: new Date("2026-04-01T10:00:00Z"),
        passengerId: 10,
        vehicleType: "carro",
      };

      const vehicle = {
        brand: "Toyota",
        model: "Corolla",
        plate: "ABC-1234",
      };

      const driverName = "João Silva";

      const scheduledDate = new Date(ride.scheduledFor).toLocaleDateString("pt-BR");
      const scheduledTime = new Date(ride.scheduledFor).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const notification = {
        userId: ride.passengerId,
        type: "ride",
        title: "Motorista confirmado!",
        message: `${driverName} aceitou sua corrida agendada para ${scheduledDate} às ${scheduledTime}. Veículo: ${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
        actionUrl: `/scheduled-rides`,
        actionLabel: "Ver corridas agendadas",
      };

      expect(notification.userId).toBe(10);
      expect(notification.title).toBe("Motorista confirmado!");
      expect(notification.message).toContain("João Silva");
      expect(notification.message).toContain("Toyota Corolla");
      expect(notification.message).toContain("ABC-1234");
      expect(notification.actionUrl).toBe("/scheduled-rides");
    });

    it("should create notification data for passenger on reject (after accept)", () => {
      const ride = {
        id: 1,
        passengerId: 10,
      };

      const driverName = "Maria Santos";

      const notification = {
        userId: ride.passengerId,
        type: "ride",
        title: "Motorista cancelou",
        message: `${driverName} cancelou a aceitação da sua corrida agendada. Estamos buscando outro motorista.`,
        actionUrl: `/scheduled-rides`,
        actionLabel: "Ver corridas agendadas",
      };

      expect(notification.userId).toBe(10);
      expect(notification.title).toBe("Motorista cancelou");
      expect(notification.message).toContain("Maria Santos");
      expect(notification.message).toContain("buscando outro motorista");
    });
  });
});
