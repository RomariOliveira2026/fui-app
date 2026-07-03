import { TRPCClientError } from "@trpc/client";

const ADDRESS_FIELD_LABELS: Record<string, string> = {
  destinationAddress: "destino",
  originAddress: "origem",
};

/** Erro de validação Zod (endereço curto / campo vazio) — não deve virar toast. */
export function isRideInputValidationError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    if (error.data?.code !== "BAD_REQUEST") return false;
    return Boolean(error.message && formatValidationErrorMessage(error.message));
  }
  if (error instanceof Error) {
    return Boolean(formatValidationErrorMessage(error.message));
  }
  return false;
}

/** Converte mensagens JSON de validação Zod (tRPC) em texto legível. */
function formatValidationErrorMessage(message: string): string | null {
  const trimmed = message.trim();
  const jsonStart = trimmed.indexOf("[");
  if (jsonStart === -1) return null;

  try {
    const issues = JSON.parse(trimmed.slice(jsonStart)) as Array<{
      path?: (string | number)[];
      message?: string;
      code?: string;
    }>;
    if (!Array.isArray(issues) || issues.length === 0) return null;

    for (const issue of issues) {
      const field = issue.path?.[0];
      if (typeof field !== "string") continue;

      const label = ADDRESS_FIELD_LABELS[field];
      if (!label) continue;

      if (issue.code === "too_small") {
        return `Digite o endereço de ${label} (mínimo 2 caracteres).`;
      }
      return `Verifique o endereço de ${label}.`;
    }

    return "Preencha origem e destino corretamente.";
  } catch {
    return null;
  }
}

/** Mensagem amigável para falhas no fluxo de corrida (request, tracking, pagamento). */
export function getRideFlowErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    if (error.data == null) {
      return "Não conseguimos falar com o servidor agora. Verifique sua conexão e tente de novo.";
    }
    const code = error.data?.code;
    if (code === "UNAUTHORIZED") {
      return "Sua sessão expirou. Faça login novamente para continuar.";
    }
    if (code === "FORBIDDEN") {
      return "Você não tem permissão para esta ação.";
    }
    if (code === "NOT_FOUND") {
      return "Corrida não encontrada. Ela pode ter sido cancelada ou já finalizada.";
    }
    const validationMessage = error.message ? formatValidationErrorMessage(error.message) : null;
    if (validationMessage) return validationMessage;
    if (error.message?.trim()) return error.message;
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (error instanceof Error) {
    const validationMessage = formatValidationErrorMessage(error.message);
    if (validationMessage) return validationMessage;

    const msg = error.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return "Falha de conexão. Verifique sua internet e tente novamente.";
    }
    return error.message || "Algo deu errado. Tente novamente.";
  }

  return "Algo deu errado. Tente novamente.";
}
