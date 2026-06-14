import { useCallback, useEffect, useState } from "react";

export type AdminView = "live" | "intelligence";

export function readAdminViewFromUrl(): AdminView {
  if (typeof window === "undefined") return "live";
  return new URLSearchParams(window.location.search).get("view") === "intelligence"
    ? "intelligence"
    : "live";
}

function writeAdminViewToUrl(view: AdminView) {
  const url = new URL(window.location.href);
  if (view === "live") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

/** View da Central — query string (?view=intelligence), sem wouter (evita perder search). */
export function useAdminView() {
  const [view, setView] = useState<AdminView>(readAdminViewFromUrl);

  useEffect(() => {
    const sync = () => setView(readAdminViewFromUrl());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const setAdminView = useCallback((next: AdminView) => {
    setView(next);
    writeAdminViewToUrl(next);
  }, []);

  return [view, setAdminView] as const;
}
