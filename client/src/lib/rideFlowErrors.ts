import { TRPCClientError } from "@trpc/client";

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
    if (error.message?.trim()) return error.message;
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return "Falha de conexão. Verifique sua internet e tente novamente.";
    }
    return error.message || "Algo deu errado. Tente novamente.";
  }

  return "Algo deu errado. Tente novamente.";
}
