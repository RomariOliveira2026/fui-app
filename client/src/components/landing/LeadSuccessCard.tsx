import { CheckCircle2, MessageCircle } from "lucide-react";
import type { CommercialLeadInput } from "@shared/commercialLead";
import WhatsAppCTAButton from "./WhatsAppCTAButton";
import { buildLeadWhatsAppMessage } from "./landingContact";
import { PremiumCard } from "./landingUi";

type LeadSuccessCardProps = {
  lead: CommercialLeadInput;
  leadId?: string;
};

export default function LeadSuccessCard({ lead, leadId }: LeadSuccessCardProps) {
  const whatsappMessage = buildLeadWhatsAppMessage(lead);

  return (
    <PremiumCard hover={false} className="p-8 sm:p-10 text-center border-primary/25 bg-gradient-to-b from-primary/[0.08] to-transparent">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 mb-5">
        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
        Interesse registrado com sucesso
      </h3>
      <p className="mt-3 text-sm sm:text-base text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
        Nossa equipe comercial analisará sua solicitação para{" "}
        <span className="text-foreground font-medium">
          {lead.city} — {lead.state}
        </span>
        . Você também pode falar agora pelo WhatsApp e acelerar o atendimento.
      </p>
      {leadId ? (
        <p className="mt-2 text-[11px] text-muted-foreground/60">Protocolo: {leadId}</p>
      ) : null}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        <WhatsAppCTAButton message={whatsappMessage} fallbackToLead={false}>
          Falar no WhatsApp agora
        </WhatsAppCTAButton>
      </div>
      <p className="mt-5 text-xs text-muted-foreground/70 inline-flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5" />
        Mensagem pré-preenchida com seus dados
      </p>
    </PremiumCard>
  );
}
