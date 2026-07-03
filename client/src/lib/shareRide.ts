import { getAppOrigin, isVercelPreviewHostname } from "@shared/appUrl";
import { toast } from "sonner";

export function buildRideShareUrl(shareToken: string): string {
  const configuredOrigin = getAppOrigin(import.meta.env.VITE_APP_URL);
  const origin =
    typeof window !== "undefined" &&
    !isVercelPreviewHostname(window.location.hostname, import.meta.env.VITE_APP_URL)
      ? window.location.origin
      : configuredOrigin;
  return `${origin}/track/${shareToken}`;
}

export async function shareRideTrip(shareToken: string): Promise<boolean> {
  const url = buildRideShareUrl(shareToken);
  const text = "Acompanhe minha corrida em tempo real pelo Fui.";

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: "Minha corrida — Fui",
        text,
        url,
      });
      return true;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      toast.success("Link de acompanhamento copiado!");
      return true;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    toast.error("Não foi possível compartilhar a viagem");
    return false;
  }

  toast.error("Compartilhamento não disponível neste dispositivo");
  return false;
}
