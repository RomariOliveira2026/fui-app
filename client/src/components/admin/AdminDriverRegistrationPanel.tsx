import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DRIVER_APPLICATION_STATUS_LABELS,
  type DriverApplication,
  type DriverApplicationStatus,
} from "@shared/driverRegistration";
import { cn } from "@/lib/utils";
import { fuiBrand } from "@/lib/fuiTheme";
import { CheckCircle2, Clock, FileText, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_VARIANT: Record<DriverApplicationStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  em_analise: "bg-primary/10 text-primary border-primary/30",
  pendente: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  aprovado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  reprovado: "bg-red-500/10 text-red-400 border-red-500/30",
};

function DocThumb({ label, url }: { label: string; url?: string }) {
  if (!url) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <a href={url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border overflow-hidden">
        <img src={url} alt="" className="h-24 w-full object-cover bg-muted/30" />
      </a>
    </div>
  );
}

export default function AdminDriverRegistrationPanel() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<DriverApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  const { data: applications, isLoading } = trpc.driverRegistration.listForAdmin.useQuery(
    undefined,
    { throwOnError: false, retry: 1 }
  );

  const setStatus = trpc.driverRegistration.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.driverRegistration.listForAdmin.invalidate();
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = applications?.filter((a) =>
    ["enviado", "em_analise", "pendente"].includes(a.status)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Pré-cadastros de motoristas
          </CardTitle>
          <CardDescription>
            Revise documentação, aprove ou solicite pendências na Central Operacional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando cadastros...</p>
          ) : !pending?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum cadastro aguardando análise.</p>
          ) : (
            pending.map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {app.personal?.fullName ?? app.applicantName ?? `Cadastro #${app.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.personal?.city ?? "—"} · {app.vehicle?.type ?? "—"} ·{" "}
                    {app.personal?.phone ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enviado:{" "}
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(STATUS_VARIANT[app.status])}>
                    {DRIVER_APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setSelected(app)}>
                    Revisar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.personal?.fullName ?? "Cadastro"}</SheetTitle>
                <SheetDescription>
                  {DRIVER_APPLICATION_STATUS_LABELS[selected.status]} · ID #{selected.id}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 text-sm">
                <section className="space-y-2">
                  <h4 className="font-semibold text-foreground">Dados pessoais</h4>
                  <p>CPF: {selected.personal?.cpf}</p>
                  <p>E-mail: {selected.personal?.email}</p>
                  <p>Telefone: {selected.personal?.phone}</p>
                  <p>
                    {selected.personal?.address}, {selected.personal?.neighborhood} —{" "}
                    {selected.personal?.city}
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-foreground">CNH</h4>
                  <p>
                    {selected.cnh?.number} · Cat. {selected.cnh?.category} · Validade{" "}
                    {selected.cnh?.expiry} · EAR: {selected.cnh?.ear ? "Sim" : "Não"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <DocThumb label="Frente CNH" url={selected.cnh?.frontImageUrl} />
                    <DocThumb label="Verso CNH" url={selected.cnh?.backImageUrl} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-foreground">Veículo</h4>
                  <p className="capitalize">
                    {selected.vehicle?.brand} {selected.vehicle?.model} ({selected.vehicle?.year}) —{" "}
                    {selected.vehicle?.color} · {selected.vehicle?.plate}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <DocThumb label="CRLV" url={selected.vehicle?.crlvImageUrl} />
                    <DocThumb label="Placa" url={selected.vehicle?.platePhotoUrl} />
                    <DocThumb label="Veículo" url={selected.vehicle?.vehiclePhotoUrls?.[0]} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="font-semibold text-foreground">Segurança & pagamento</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DocThumb label="Selfie" url={selected.security?.selfieUrl} />
                    <DocThumb label="Antecedentes" url={selected.security?.criminalRecordUrl} />
                  </div>
                  <p>
                    Emergência: {selected.security?.emergencyContactName} —{" "}
                    {selected.security?.emergencyContactPhone}
                  </p>
                  <p>PIX: {selected.security?.pixKey}</p>
                </section>

                <Textarea
                  placeholder="Observações para o motorista (pendência ou reprovação)"
                  value={reviewNotes[selected.id] ?? selected.reviewNotes ?? ""}
                  onChange={(e) =>
                    setReviewNotes((r) => ({ ...r, [selected.id]: e.target.value }))
                  }
                  className="min-h-[80px]"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({
                        applicationId: selected.id,
                        action: "em_analise",
                        reviewNotes: reviewNotes[selected.id],
                      })
                    }
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Em análise
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({
                        applicationId: selected.id,
                        action: "pendente",
                        reviewNotes: reviewNotes[selected.id],
                      })
                    }
                  >
                    Pendência
                  </Button>
                  <Button
                    size="sm"
                    className={fuiBrand.btn}
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({
                        applicationId: selected.id,
                        action: "aprovado",
                        reviewNotes: reviewNotes[selected.id],
                      })
                    }
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({
                        applicationId: selected.id,
                        action: "reprovado",
                        reviewNotes: reviewNotes[selected.id],
                      })
                    }
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reprovar
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
