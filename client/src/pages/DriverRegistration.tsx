import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import DocumentUploadField from "@/components/driverRegistration/DocumentUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { fuiBrand, fuiSurface } from "@/lib/fuiTheme";
import { cn } from "@/lib/utils";
import {
  DRIVER_APPLICATION_STATUS_LABELS,
  DRIVER_VEHICLE_TYPES,
  EMPTY_DRIVER_REGISTRATION,
  REGISTRATION_STEPS,
  type DriverApplicationFormState,
  driverCnhSchema,
  driverPersonalSchema,
  driverSecuritySchema,
  driverTermsSchema,
  driverVehicleSchema,
} from "@shared/driverRegistration";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";

const VEHICLE_ICONS = {
  moto: Bike,
  carro: Car,
  van: Truck,
  utilitario: Truck,
} as const;

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

export default function DriverRegistration() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DriverApplicationFormState>(EMPTY_DRIVER_REGISTRATION);
  const [submitted, setSubmitted] = useState(false);

  const { data: existing, isLoading } = trpc.driverRegistration.getMyApplication.useQuery(
    undefined,
    { enabled: !!user, retry: false }
  );

  const saveDraft = trpc.driverRegistration.saveDraft.useMutation();
  const submitMutation = trpc.driverRegistration.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Cadastro enviado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!user) return;
    if (existing?.personal) {
      setForm({
        personal: existing.personal ?? EMPTY_DRIVER_REGISTRATION.personal,
        cnh: existing.cnh ?? EMPTY_DRIVER_REGISTRATION.cnh,
        vehicle: existing.vehicle ?? EMPTY_DRIVER_REGISTRATION.vehicle,
        security: existing.security ?? EMPTY_DRIVER_REGISTRATION.security,
        terms: existing.terms ?? EMPTY_DRIVER_REGISTRATION.terms,
      });
    } else if (user.email || user.name || user.phone) {
      setForm((prev) => ({
        ...prev,
        personal: {
          ...prev.personal!,
          fullName: prev.personal?.fullName || user.name || "",
          email: prev.personal?.email || user.email || "",
          phone: prev.personal?.phone || user.phone || "",
        },
      }));
    }
  }, [existing, user]);

  const statusView = useMemo(() => {
    if (!existing || existing.status === "rascunho") return null;
    if (submitted || ["enviado", "em_analise", "pendente", "aprovado", "reprovado"].includes(existing.status)) {
      return existing.status;
    }
    return null;
  }, [existing, submitted]);

  const updatePersonal = (patch: Partial<DriverApplicationFormState["personal"]>) => {
    setForm((f) => ({ ...f, personal: { ...f.personal, ...patch } }));
  };
  const updateCnh = (patch: Partial<DriverApplicationFormState["cnh"]>) => {
    setForm((f) => ({ ...f, cnh: { ...f.cnh, ...patch } }));
  };
  const updateVehicle = (patch: Partial<DriverApplicationFormState["vehicle"]>) => {
    setForm((f) => ({ ...f, vehicle: { ...f.vehicle, ...patch } }));
  };
  const updateSecurity = (patch: Partial<DriverApplicationFormState["security"]>) => {
    setForm((f) => ({ ...f, security: { ...f.security, ...patch } }));
  };
  const updateTerms = (patch: Partial<DriverApplicationFormState["terms"]>) => {
    setForm((f) => ({ ...f, terms: { ...f.terms, ...patch } }));
  };

  const validateStep = (current: number): boolean => {
    const schemas = [
      driverPersonalSchema,
      driverCnhSchema,
      driverVehicleSchema,
      driverSecuritySchema,
      driverTermsSchema,
    ] as const;
    const payloads = [
      form.personal,
      form.cnh,
      form.vehicle,
      form.security,
      form.terms,
    ];
    const result = schemas[current - 1].safeParse(payloads[current - 1]);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Preencha todos os campos obrigatórios");
      return false;
    }
    return true;
  };

  const persistDraft = async () => {
    if (!user) return;
    try {
      await saveDraft.mutateAsync(form);
    } catch {
      /* rascunho opcional */
    }
  };

  const goNext = async () => {
    if (!validateStep(step)) return;
    await persistDraft();
    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    submitMutation.mutate({
      personal: form.personal,
      cnh: form.cnh,
      vehicle: form.vehicle,
      security: form.security,
      terms: {
        termsAccepted: true,
        conductAccepted: true,
        privacyAccepted: true,
        documentReviewAck: true,
      },
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Cadastro de Motorista" />
        <div className="container max-w-lg mx-auto py-12 px-4 text-center space-y-4">
          <p className="text-muted-foreground">Faça login para iniciar seu cadastro como motorista.</p>
          <Button className={fuiBrand.btn} onClick={() => setLocation("/")}>
            Ir para o início
          </Button>
        </div>
      </div>
    );
  }

  if (statusView && !submitMutation.isPending) {
    const isApproved = statusView === "aprovado";
    const isRejected = statusView === "reprovado";
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Cadastro de Motorista" />
        <div className="container max-w-lg mx-auto py-8 px-4">
          <Card className={cn(fuiSurface.card, "border-primary/20")}>
            <CardHeader className="text-center">
              <div
                className={cn(
                  "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                  isApproved ? "bg-emerald-500/15" : isRejected ? "bg-red-500/15" : "bg-primary/10"
                )}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                ) : (
                  <Clock className={cn("h-7 w-7", isRejected ? "text-red-400" : "text-primary")} />
                )}
              </div>
              <CardTitle>
                {isApproved
                  ? "Cadastro aprovado!"
                  : isRejected
                    ? "Cadastro não aprovado"
                    : "Cadastro enviado"}
              </CardTitle>
              <CardDescription>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {DRIVER_APPLICATION_STATUS_LABELS[statusView]}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {statusView === "enviado" && (
                <p>
                  Recebemos sua documentação. Nossa Central Operacional irá analisar em breve. Você
                  será notificado quando houver atualização.
                </p>
              )}
              {statusView === "em_analise" && (
                <p>Seu cadastro está sendo analisado pela equipe do Fui. Aguarde nosso retorno.</p>
              )}
              {statusView === "pendente" && (
                <p>
                  Identificamos pendências no seu cadastro. Verifique seu e-mail ou entre em contato
                  com o suporte.
                  {existing?.reviewNotes ? (
                    <span className="mt-2 block rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-foreground">
                      {existing.reviewNotes}
                    </span>
                  ) : null}
                </p>
              )}
              {isApproved && (
                <p>Parabéns! Você já pode acessar o painel do motorista e começar a receber corridas.</p>
              )}
              {isRejected && (
                <p>
                  Infelizmente seu cadastro não foi aprovado neste momento.
                  {existing?.reviewNotes ? (
                    <span className="mt-2 block rounded-lg border border-border bg-muted/30 p-3 text-foreground">
                      {existing.reviewNotes}
                    </span>
                  ) : null}
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {isApproved ? (
                  <Button className={fuiBrand.btn} onClick={() => setLocation("/driver-dashboard")}>
                    Ir para o Painel
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setLocation("/")}>
                    Voltar ao início
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Cadastrar como Motorista" />

      <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Quero Ser Motorista</h1>
          <p className="text-sm text-muted-foreground">
            Complete as etapas para enviar seu cadastro à Central Operacional
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {REGISTRATION_STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex-1 min-w-[4.5rem] rounded-lg border px-2 py-2 text-center text-[10px] font-medium",
                  active && "border-primary bg-primary/10 text-primary",
                  done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                <span className="block text-xs font-bold">{s.id}</span>
                {s.title}
              </div>
            );
          })}
        </div>

        <Card className={fuiSurface.card}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {step === 1 && <User className="h-5 w-5 text-primary" />}
              {step === 2 && <Shield className="h-5 w-5 text-primary" />}
              {step >= 3 && <Car className="h-5 w-5 text-primary" />}
              {REGISTRATION_STEPS[step - 1]?.title}
            </CardTitle>
            <CardDescription>Etapa {step} de 5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Nome completo</Label>
                    <Input
                      value={form.personal?.fullName ?? ""}
                      onChange={(e) => updatePersonal({ fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={form.personal?.cpf ?? ""}
                      onChange={(e) => updatePersonal({ cpf: formatCpf(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de nascimento</Label>
                    <Input
                      type="date"
                      value={form.personal?.birthDate ?? ""}
                      onChange={(e) => updatePersonal({ birthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input
                      value={form.personal?.phone ?? ""}
                      onChange={(e) => updatePersonal({ phone: formatPhone(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={form.personal?.email ?? ""}
                      onChange={(e) => updatePersonal({ email: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={form.personal?.address ?? ""}
                      onChange={(e) => updatePersonal({ address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade de atuação</Label>
                    <Input
                      value={form.personal?.city ?? ""}
                      onChange={(e) => updatePersonal({ city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro de atuação</Label>
                    <Input
                      value={form.personal?.neighborhood ?? ""}
                      onChange={(e) => updatePersonal({ neighborhood: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Número da CNH</Label>
                    <Input
                      value={form.cnh?.number ?? ""}
                      onChange={(e) => updateCnh({ number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      placeholder="Ex: B"
                      value={form.cnh?.category ?? ""}
                      onChange={(e) => updateCnh({ category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade</Label>
                    <Input
                      type="date"
                      value={form.cnh?.expiry ?? ""}
                      onChange={(e) => updateCnh({ expiry: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label>EAR (Exerce Atividade Remunerada)</Label>
                    <Switch
                      checked={form.cnh?.ear ?? false}
                      onCheckedChange={(v) => updateCnh({ ear: v })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocumentUploadField
                    label="Frente da CNH"
                    value={form.cnh?.frontImageUrl ?? ""}
                    onChange={(url) => updateCnh({ frontImageUrl: url })}
                  />
                  <DocumentUploadField
                    label="Verso da CNH"
                    value={form.cnh?.backImageUrl ?? ""}
                    onChange={(url) => updateCnh({ backImageUrl: url })}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DRIVER_VEHICLE_TYPES.map((type) => {
                    const Icon = VEHICLE_ICONS[type];
                    const selected = form.vehicle?.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateVehicle({ type })}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs capitalize transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {type}
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input
                      value={form.vehicle?.brand ?? ""}
                      onChange={(e) => updateVehicle({ brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={form.vehicle?.model ?? ""}
                      onChange={(e) => updateVehicle({ model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                      type="number"
                      value={form.vehicle?.year ?? ""}
                      onChange={(e) => updateVehicle({ year: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input
                      value={form.vehicle?.color ?? ""}
                      onChange={(e) => updateVehicle({ color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input
                      className="uppercase"
                      value={form.vehicle?.plate ?? ""}
                      onChange={(e) => updateVehicle({ plate: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número do CRLV</Label>
                    <Input
                      value={form.vehicle?.crlvNumber ?? ""}
                      onChange={(e) => updateVehicle({ crlvNumber: e.target.value })}
                    />
                  </div>
                </div>
                <DocumentUploadField
                  label="Upload do CRLV"
                  value={form.vehicle?.crlvImageUrl ?? ""}
                  onChange={(url) => updateVehicle({ crlvImageUrl: url })}
                />
                <DocumentUploadField
                  label="Foto do veículo"
                  value={form.vehicle?.vehiclePhotoUrls?.[0] ?? ""}
                  onChange={(url) => updateVehicle({ vehiclePhotoUrls: url ? [url] : [] })}
                  hint="Foto lateral ou frontal do veículo"
                />
                <DocumentUploadField
                  label="Foto da placa"
                  value={form.vehicle?.platePhotoUrl ?? ""}
                  onChange={(url) => updateVehicle({ platePhotoUrl: url })}
                />
              </>
            )}

            {step === 4 && (
              <>
                <DocumentUploadField
                  label="Selfie do motorista"
                  value={form.security?.selfieUrl ?? ""}
                  onChange={(url) => updateSecurity({ selfieUrl: url })}
                  hint="Rosto visível, sem óculos escuros ou boné"
                />
                <DocumentUploadField
                  label="Antecedentes criminais"
                  value={form.security?.criminalRecordUrl ?? ""}
                  onChange={(url) => updateSecurity({ criminalRecordUrl: url })}
                  accept="image/*,application/pdf"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Contato de emergência</Label>
                    <Input
                      value={form.security?.emergencyContactName ?? ""}
                      onChange={(e) => updateSecurity({ emergencyContactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone do contato</Label>
                    <Input
                      value={form.security?.emergencyContactPhone ?? ""}
                      onChange={(e) =>
                        updateSecurity({ emergencyContactPhone: formatPhone(e.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      value={form.security?.pixKey ?? ""}
                      onChange={(e) => updateSecurity({ pixKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banco (opcional)</Label>
                    <Input
                      value={form.security?.bankName ?? ""}
                      onChange={(e) => updateSecurity({ bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência (opcional)</Label>
                    <Input
                      value={form.security?.bankAgency ?? ""}
                      onChange={(e) => updateSecurity({ bankAgency: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Conta (opcional)</Label>
                    <Input
                      value={form.security?.bankAccount ?? ""}
                      onChange={(e) => updateSecurity({ bankAccount: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {[
                  {
                    key: "termsAccepted" as const,
                    label: "Li e aceito os Termos de Uso do Fui",
                  },
                  {
                    key: "conductAccepted" as const,
                    label: "Li e aceito a Política de Conduta para motoristas",
                  },
                  {
                    key: "privacyAccepted" as const,
                    label: "Li e aceito a Política de Privacidade",
                  },
                  {
                    key: "documentReviewAck" as const,
                    label: "Estou ciente de que meus documentos passarão por análise documental",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/20"
                  >
                    <Checkbox
                      checked={!!form.terms?.[item.key]}
                      onCheckedChange={(v) => updateTerms({ [item.key]: v === true })}
                    />
                    <span className="text-sm text-foreground leading-snug">{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          ) : null}
          {step < 5 ? (
            <Button type="button" className={cn("flex-1", fuiBrand.btn)} onClick={() => void goNext()}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className={cn("flex-1", fuiBrand.btn)}
              disabled={submitMutation.isPending}
              onClick={() => void handleSubmit()}
            >
              {submitMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Enviar cadastro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
