import { describe, it, expect } from "vitest";
import { buildDomainReadinessReport, isOwnDomainHostname } from "@shared/domainConfig";

describe("domainConfig", () => {
  it("detects own domain hostname", () => {
    expect(isOwnDomainHostname("fuiapp.com.br")).toBe(true);
    expect(isOwnDomainHostname("www.fuiapp.com.br")).toBe(true);
    expect(isOwnDomainHostname("fui-app.vercel.app")).toBe(false);
  });

  it("builds readiness report with checklist", () => {
    const report = buildDomainReadinessReport({
      envUrl: "https://fuiapp.com.br",
      hasDatabase: true,
      hasOAuth: true,
      hasStripe: true,
    });
    expect(report.isOwnDomainActive).toBe(true);
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.readyForOwnDomain).toBe(true);
  });

  it("flags missing config for vercel default url", () => {
    const report = buildDomainReadinessReport({
      envUrl: "https://fui-app.vercel.app",
      hasDatabase: false,
      hasOAuth: false,
    });
    expect(report.isOwnDomainActive).toBe(false);
    expect(report.readyForOwnDomain).toBe(false);
  });
});
