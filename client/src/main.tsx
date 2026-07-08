import { ensureCanonicalHost } from "@/lib/ensureCanonicalHost";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { isLandingRoutePathname } from "./components/landing/landingRoutes";
import { redirectToLogin } from "./const";
import "./index.css";

ensureCanonicalHost();

function registerPwaServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.info("[PWA] Service worker registered", reg.scope))
      .catch((err) => console.warn("[PWA] Service worker registration failed", err));
  });
}

function loadOptionalAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
  if (!endpoint?.trim() || !websiteId?.trim()) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = websiteId;
  document.body.appendChild(script);
}

registerPwaServiceWorker();
loadOptionalAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      throwOnError: (error) => {
        if (isLandingRoutePathname()) return false;
        if (!import.meta.env.PROD) return false;
        // Painéis admin tratam falhas de API localmente (toast / retry / fallback).
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
          return false;
        }
        // Falha de transporte (HTML/404 da Vercel) não deve derrubar a home.
        if (error instanceof TRPCClientError && error.data == null) return false;
        return true;
      },
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (isLandingRoutePathname()) return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;
  // Demo local: OAuth desativado — nunca redirecionar para /app-auth em dev.
  if (import.meta.env.DEV) return;

  redirectToLogin();
};

function shouldSuppressDevQueryLog(queryKey: unknown): boolean {
  if (!import.meta.env.DEV) return false;
  const key = JSON.stringify(queryKey);
  return (
    key.includes("getSavedAddresses") ||
    key.includes("getUnreadCount") ||
    key.includes("notification.list") ||
    key.includes("getMyProfile") ||
    key.includes("saveFcmToken") ||
    key.includes("auth.me") ||
    key.includes("registerFcmToken") ||
    key.includes("user.")
  );
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    if (!shouldSuppressDevQueryLog(event.query.queryKey)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (!shouldSuppressDevQueryLog(event.mutation.options.mutationKey)) {
      console.error("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      maxURLLength: 2048,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
