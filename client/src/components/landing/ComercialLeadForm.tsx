import { useEffect, useState } from "react";
import {
  COMMERCIAL_PROFILE_TYPES,
  commercialLeadSchema,
  type CommercialLeadInput,
} from "@shared/commercialLead";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import LeadSuccessCard from "./LeadSuccessCard";
import { LANDING_HIGHLIGHT_LEAD_EVENT } from "./scrollToLeadSection";
import { PremiumCard, SectionLabel, SectionLead, SectionTitle } from "./landingUi";

const LEAD_STORAGE_KEY = "fui-commercial-leads-local";

const TRUST_BADGES = [
  "Apresentação comercial",
  "Sem compromisso",
  "Atendimento direto",
] as const;

const VALUE_PROOFS = [
  "Ideal para cidades estratégicas",
  "Mobilidade + entregas + utilitários",
  "Operação local com múltiplas receitas",
  "Implantação orientada",
] as const;

type ComercialLeadFormProps = {
  highlighted?: boolean;
  onHighlightEnd?: () => void;
};

function saveLeadLocally(lead: CommercialLeadInput, id: string) {
  try {
    const raw = localStorage.getItem(LEAD_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = [{ ...lead, id, savedAt: new Date().toISOString() }, ...existing].slice(0, 20);
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage opcional
  }
}

export default function ComercialLeadForm({
  highlighted: highlightedProp,
  onHighlightEnd,
}: ComercialLeadFormProps) {
  const [highlighted, setHighlighted] = useState(highlightedProp ?? false);
  const [errors, setErrors] = useState<Partial<Record<keyof CommercialLeadInput, string>>>({});
  const [submittedLead, setSubmittedLead] = useState<CommercialLeadInput | null>(null);
  const [submittedId, setSubmittedId] = useState<string | undefined>();

  const [form, setForm] = useState<CommercialLeadInput>({
    name: "",
    city: "",
    state: "",
    whatsapp: "",
    email: "",
    profileType: "Empresário local",
    message: "",
  });

  const completeSubmission = (variables: CommercialLeadInput, id: string) => {
    saveLeadLocally(variables, id);
    setSubmittedLead(variables);
    setSubmittedId(id);
    toast.success("Interesse registrado com sucesso!");
  };

  const submitMutation = trpc.landing.submitCommercialLead.useMutation({
    onSuccess: (data, variables) => {
      completeSubmission(variables, data.id);
    },
    onError: (_err, variables) => {
      if (!variables) {
        toast.error("Não foi possível enviar. Tente novamente.");
        return;
      }
      const fallbackId = `local-${Date.now()}`;
      completeSubmission(variables, fallbackId);
      toast.message("Registramos seu interesse localmente. Fale conosco pelo WhatsApp para agilizar.");
    },
  });

  useEffect(() => {
    setHighlighted(highlightedProp ?? false);
  }, [highlightedProp]);

  useEffect(() => {
    const handler = () => {
      setHighlighted(true);
      window.setTimeout(() => {
        setHighlighted(false);
        onHighlightEnd?.();
      }, 2600);
    };
    window.addEventListener(LANDING_HIGHLIGHT_LEAD_EVENT, handler);
    return () => window.removeEventListener(LANDING_HIGHLIGHT_LEAD_EVENT, handler);
  }, [onHighlightEnd]);

  const updateField = <K extends keyof CommercialLeadInput>(key: K, value: CommercialLeadInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = commercialLeadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CommercialLeadInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CommercialLeadInput;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Revise os campos destacados.");
      const firstKey = Object.keys(fieldErrors)[0] as keyof CommercialLeadInput;
      if (firstKey) {
        const focusId = firstKey === "profileType" ? "lead-profile" : `lead-${firstKey}`;
        document.getElementById(focusId)?.focus();
      }
      return;
    }
    submitMutation.mutate(parsed.data);
  };

  if (submittedLead) {
    return <LeadSuccessCard lead={submittedLead} leadId={submittedId} />;
  }

  return (
    <div>
      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-start">
        <div>
          <SectionLabel>Captação comercial</SectionLabel>
          <SectionTitle className="mt-4">Leve o Fui para sua cidade</SectionTitle>
          <SectionLead>
            Preencha os dados abaixo e receba uma apresentação comercial da plataforma.
          </SectionLead>

          <div className="mt-7 flex flex-wrap gap-2">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-[11px] sm:text-xs font-medium text-primary/90"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-7 grid sm:grid-cols-2 gap-2.5">
            {VALUE_PROOFS.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[13px] sm:text-sm text-muted-foreground/85 leading-snug"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <PremiumCard
          hover={false}
          id="lead-form"
          className={cn(
            "p-5 sm:p-7 transition-all duration-500 scroll-mt-24",
            highlighted &&
              "ring-2 ring-primary/40 shadow-[0_0_0_6px_rgba(249,146,0,0.10)] border-primary/30"
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="lead-name">Nome *</Label>
                <Input
                  id="lead-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Seu nome completo"
                  aria-invalid={!!errors.name}
                  autoComplete="name"
                />
                {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-city">Cidade *</Label>
                <Input
                  id="lead-city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Ex.: Aracaju"
                  aria-invalid={!!errors.city}
                />
                {errors.city ? <p className="text-xs text-destructive">{errors.city}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-state">Estado *</Label>
                <Input
                  id="lead-state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value.toUpperCase())}
                  placeholder="Ex.: SE"
                  maxLength={2}
                  aria-invalid={!!errors.state}
                />
                {errors.state ? <p className="text-xs text-destructive">{errors.state}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-whatsapp">WhatsApp *</Label>
                <Input
                  id="lead-whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="(79) 99999-9999"
                  aria-invalid={!!errors.whatsapp}
                  autoComplete="tel"
                />
                {errors.whatsapp ? (
                  <p className="text-xs text-destructive">{errors.whatsapp}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-email">E-mail *</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="seu@email.com"
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="lead-profile">Tipo de operação / perfil *</Label>
                <Select
                  value={form.profileType}
                  onValueChange={(v) =>
                    updateField("profileType", v as CommercialLeadInput["profileType"])
                  }
                >
                  <SelectTrigger id="lead-profile" className="w-full" aria-invalid={!!errors.profileType}>
                    <SelectValue placeholder="Selecione seu perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMERCIAL_PROFILE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.profileType ? (
                  <p className="text-xs text-destructive">{errors.profileType}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="lead-message">Mensagem / observação</Label>
                <Textarea
                  id="lead-message"
                  value={form.message ?? ""}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Conte brevemente sobre sua operação, frota, cidade ou objetivo (opcional)"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitMutation.isPending}
              className="w-full h-11 rounded-full font-semibold shadow-md shadow-primary/15"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero apresentar o Fui na minha cidade"
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground/70 leading-relaxed">
              Seus dados serão usados apenas para contato comercial sobre licenciamento e implantação
              do Fui.
            </p>
          </form>
        </PremiumCard>
      </div>
    </div>
  );
}
