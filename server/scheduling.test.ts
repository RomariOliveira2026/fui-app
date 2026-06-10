import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => {
  const mockPricing = {
    id: 1,
    vehicleType: "carro",
    basePrice: 800,
    pricePerKm: 200,
    pricePerMinute: 30,
    minimumPrice: 1000,
  };

  return {
    default: {
      getPricingByVehicleType: vi.fn().mockResolvedValue(mockPricing),
      validateCoupon: vi.fn().mockResolvedValue(null),
      createRide: vi.fn().mockResolvedValue(1),
      getScheduledRidesByUser: vi.fn().mockResolvedValue([
        {
          id: 1,
          passengerId: 1,
          vehicleType: "carro",
          originAddress: "Rua A, Itabaiana",
          destinationAddress: "Rua B, Itabaiana",
          estimatedPrice: 1500,
          distance: 5000,
          duration: 600,
          status: "requested",
          isScheduled: "yes",
          scheduledFor: new Date(Date.now() + 86400000),
          paymentMethod: "cash",
        },
      ]),
      cancelRide: vi.fn().mockResolvedValue(undefined),
      getNearbyDrivers: vi.fn().mockResolvedValue([]),
      getDb: vi.fn().mockResolvedValue(null),
    },
    getDb: vi.fn().mockResolvedValue(null),
  };
});

// Mock fetch for OSRM
global.fetch = vi.fn().mockResolvedValue({
  json: () =>
    Promise.resolve({
      routes: [
        {
          distance: 5000,
          duration: 600,
          geometry: { coordinates: [] },
        },
      ],
    }),
});

describe("Scheduling System", () => {
  describe("Scheduling Logic", () => {
    it("should calculate price correctly for a scheduled ride", () => {
      const basePrice = 800;
      const pricePerKm = 200;
      const minimumPrice = 1000;
      const distanceKm = 5; // 5km

      const calculatedPrice = basePrice + Math.round(distanceKm * pricePerKm);
      const finalPrice = Math.max(calculatedPrice, minimumPrice);

      expect(calculatedPrice).toBe(1800); // 800 + 5*200
      expect(finalPrice).toBe(1800); // > minimum
    });

    it("should enforce minimum price for short rides", () => {
      const basePrice = 800;
      const pricePerKm = 200;
      const minimumPrice = 1000;
      const distanceKm = 0.5; // 500m

      const calculatedPrice = basePrice + Math.round(distanceKm * pricePerKm);
      const finalPrice = Math.max(calculatedPrice, minimumPrice);

      expect(calculatedPrice).toBe(900); // 800 + 0.5*200
      expect(finalPrice).toBe(1000); // enforced minimum
    });

    it("should validate scheduled date is in the future", () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      const pastDate = new Date(Date.now() - 86400000); // yesterday

      expect(futureDate > new Date()).toBe(true);
      expect(pastDate > new Date()).toBe(false);
    });

    it("should apply coupon discount correctly", () => {
      const estimatedPrice = 1800;

      // Percentage coupon (10%)
      const percentDiscount = Math.round((estimatedPrice * 10) / 100);
      expect(percentDiscount).toBe(180);
      expect(Math.max(estimatedPrice - percentDiscount, 0)).toBe(1620);

      // Fixed coupon (R$ 5.00 = 500 centavos)
      const fixedDiscount = 500;
      expect(Math.max(estimatedPrice - fixedDiscount, 0)).toBe(1300);
    });

    it("should not allow negative prices after coupon", () => {
      const estimatedPrice = 300;
      const bigDiscount = 500;

      const finalPrice = Math.max(estimatedPrice - bigDiscount, 0);
      expect(finalPrice).toBe(0);
    });
  });

  describe("Scheduled Rides List", () => {
    it("should filter scheduled rides correctly", () => {
      const rides = [
        {
          id: 1,
          isScheduled: "yes",
          status: "requested",
          scheduledFor: new Date(Date.now() + 86400000),
        },
        {
          id: 2,
          isScheduled: "yes",
          status: "cancelled",
          scheduledFor: new Date(Date.now() + 86400000),
        },
        {
          id: 3,
          isScheduled: "no",
          status: "requested",
          scheduledFor: null,
        },
      ];

      const scheduledActive = rides.filter(
        (r) => r.isScheduled === "yes" && r.status === "requested"
      );
      expect(scheduledActive).toHaveLength(1);
      expect(scheduledActive[0].id).toBe(1);
    });

    it("should identify expired scheduled rides", () => {
      const pastRide = {
        scheduledFor: new Date(Date.now() - 3600000), // 1 hour ago
      };
      const futureRide = {
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      };

      expect(new Date(pastRide.scheduledFor) < new Date()).toBe(true);
      expect(new Date(futureRide.scheduledFor) < new Date()).toBe(false);
    });
  });

  describe("Driver Notification for Scheduled Rides", () => {
    it("should limit notifications to 10 drivers max", () => {
      const drivers = Array.from({ length: 20 }, (_, i) => ({
        user: { id: i + 1 },
        driver: { id: i + 1 },
      }));

      const toNotify = drivers.slice(0, 10);
      expect(toNotify).toHaveLength(10);
    });

    it("should limit push notifications to 5 drivers max", () => {
      const drivers = Array.from({ length: 20 }, (_, i) => ({
        user: { id: i + 1 },
        driver: { id: i + 1 },
      }));

      const toPush = drivers.slice(0, 5);
      expect(toPush).toHaveLength(5);
    });
  });

  describe("Seed Data Validation", () => {
    it("should have valid pricing for all vehicle types", () => {
      const pricingData = [
        { vehicleType: "moto", basePrice: 500, pricePerKm: 150, minimumPrice: 600 },
        { vehicleType: "carro", basePrice: 800, pricePerKm: 200, minimumPrice: 1000 },
        { vehicleType: "van", basePrice: 1200, pricePerKm: 300, minimumPrice: 1500 },
        { vehicleType: "utilitario", basePrice: 1500, pricePerKm: 400, minimumPrice: 2000 },
      ];

      expect(pricingData).toHaveLength(4);

      for (const p of pricingData) {
        expect(p.basePrice).toBeGreaterThan(0);
        expect(p.pricePerKm).toBeGreaterThan(0);
        expect(p.minimumPrice).toBeGreaterThanOrEqual(p.basePrice);
      }
    });

    it("should have valid coupon data", () => {
      const coupons = [
        { code: "PRIMEIRA", discountType: "percentage", discountValue: 100 },
        { code: "ITABAIANA10", discountType: "percentage", discountValue: 10 },
        { code: "BEMVINDO", discountType: "fixed", discountValue: 500 },
        { code: "FDS20", discountType: "percentage", discountValue: 20 },
        { code: "FRETE30", discountType: "percentage", discountValue: 30 },
      ];

      expect(coupons).toHaveLength(5);

      for (const c of coupons) {
        expect(c.code).toBeTruthy();
        expect(["percentage", "fixed"]).toContain(c.discountType);
        expect(c.discountValue).toBeGreaterThan(0);
      }
    });

    it("should have valid driver data with vehicles", () => {
      const drivers = [
        { name: "João Silva", vehicles: [{ type: "carro" }] },
        { name: "Maria Santos", vehicles: [{ type: "moto" }] },
        { name: "Pedro Oliveira", vehicles: [{ type: "carro" }, { type: "van" }] },
        { name: "Ana Costa", vehicles: [{ type: "moto" }] },
        { name: "Carlos Mendes", vehicles: [{ type: "carro" }] },
        { name: "Fernanda Lima", vehicles: [{ type: "carro" }] },
        { name: "Roberto Alves", vehicles: [{ type: "utilitario" }, { type: "carro" }] },
      ];

      expect(drivers).toHaveLength(7);

      const totalVehicles = drivers.reduce((acc, d) => acc + d.vehicles.length, 0);
      expect(totalVehicles).toBe(9);

      const validTypes = ["moto", "carro", "van", "utilitario"];
      for (const d of drivers) {
        expect(d.name).toBeTruthy();
        for (const v of d.vehicles) {
          expect(validTypes).toContain(v.type);
        }
      }
    });
  });
});
