import { describe, expect, it } from "vitest";
import {
  DRIVER_DASHBOARD_PATH,
  DRIVER_REGISTER_PATH,
  resolveDriverLandingPath,
  sanitizePostAuthRedirect,
} from "../shared/driverLanding";

describe("resolveDriverLandingPath", () => {
  it("keeps pure passengers on the home dashboard", () => {
    expect(
      resolveDriverLandingPath({
        role: "passenger",
      })
    ).toBeNull();
  });

  it("honors post-auth redirect before role checks", () => {
    expect(
      resolveDriverLandingPath({
        role: "passenger",
        postAuthRedirect: "/driver/register",
      })
    ).toBe("/driver/register");
  });

  it("routes explicit driver intent to registration", () => {
    expect(
      resolveDriverLandingPath({
        role: "passenger",
        hasDriverSignupIntent: true,
      })
    ).toBe(DRIVER_REGISTER_PATH);
  });

  it("routes driver role without approved profile to registration", () => {
    expect(
      resolveDriverLandingPath({
        role: "driver",
        driverProfile: { status: "pending" },
        application: { status: "enviado" },
      })
    ).toBe(DRIVER_REGISTER_PATH);
  });

  it("routes approved drivers to the driver dashboard", () => {
    expect(
      resolveDriverLandingPath({
        role: "driver",
        driverProfile: { status: "approved" },
        application: { status: "aprovado" },
      })
    ).toBe(DRIVER_DASHBOARD_PATH);
  });

  it("routes draft applications to registration", () => {
    expect(
      resolveDriverLandingPath({
        role: "passenger",
        application: { status: "rascunho" },
      })
    ).toBe(DRIVER_REGISTER_PATH);
  });

  it("does not redirect admins without driver signals", () => {
    expect(
      resolveDriverLandingPath({
        role: "admin",
      })
    ).toBeNull();
  });
});

describe("sanitizePostAuthRedirect", () => {
  it("rejects unsafe paths", () => {
    expect(sanitizePostAuthRedirect("//evil.com")).toBeNull();
    expect(sanitizePostAuthRedirect("https://evil.com")).toBeNull();
    expect(sanitizePostAuthRedirect("/")).toBeNull();
  });

  it("accepts internal app paths", () => {
    expect(sanitizePostAuthRedirect("/driver/register")).toBe("/driver/register");
  });
});
