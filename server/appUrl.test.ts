import { describe, expect, it } from "vitest";
import {
  buildCanonicalAppUrl,
  getCanonicalAppHostname,
  getConfiguredAppUrl,
  isVercelPreviewHostname,
} from "@shared/appUrl";

describe("appUrl", () => {
  it("usa fui-app.vercel.app como padrão", () => {
    expect(getConfiguredAppUrl()).toBe("https://fui-app.vercel.app");
    expect(getCanonicalAppHostname()).toBe("fui-app.vercel.app");
  });

  it("respeita VITE_APP_URL customizado", () => {
    expect(getConfiguredAppUrl("https://fuiapp.com.br/")).toBe("https://fuiapp.com.br");
  });

  it("detecta preview da Vercel", () => {
    expect(
      isVercelPreviewHostname("fui-68w9ubuk9-romario-oliveira-s-projects.vercel.app")
    ).toBe(true);
    expect(isVercelPreviewHostname("fui-app.vercel.app")).toBe(false);
    expect(isVercelPreviewHostname("localhost")).toBe(false);
    expect(isVercelPreviewHostname("fuiapp.com.br")).toBe(false);
  });

  it("monta URL canônica com path", () => {
    expect(buildCanonicalAppUrl("/request-ride", "?x=1")).toBe(
      "https://fui-app.vercel.app/request-ride?x=1"
    );
  });
});
