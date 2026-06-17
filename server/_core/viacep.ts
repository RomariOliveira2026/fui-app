const VIACEP_BASE = "https://viacep.com.br/ws";
const TIMEOUT_MS = 8_000;

export type ViaCepResult = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

/** Consulta endereço canônico pelo CEP (API pública ViaCEP). */
export async function lookupViaCep(cep: string): Promise<ViaCepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${VIACEP_BASE}/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ViaCepResult & { erro?: boolean };
    if (data.erro || !data.localidade) return null;

    return data;
  } catch (error) {
    console.warn("[viacep] lookup failed:", digits, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
