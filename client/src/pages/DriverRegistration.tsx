import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { redirectToLogin } from "@/const";
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
import { fuiBrand, fuiIconRingClass, fuiSurface } from "@/lib/fuiTheme";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  clearDriverSignupIntent,
  setDriverSignupIntent,
} from "@/lib/postAuthRedirect";
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
  FileText,
  Loader2,
  Shield,
  Sparkles,
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

const STEP_ICONS = [User, Shield, Car, Shield, FileText] as const;

const STEP_GUIDES = [
  {
    title: "Dados pessoais",
    description: "Nome, CPF, contato e região onde você pretende atuar como motorista.",
  },
  {
    title: "CNH",
    description: "Número, categoria, validade, EAR e fotos frente/verso do documento.",
  },
  {
    title: "Veículo",
    description: "Tipo, placa, CRLV e fotos do veículo que será usado nas corridas.",
  },
  {
    title: "Segurança",
    description: "Selfie, antecedentes, PIX e contato de emergência para validação.",
  },
  {
    title: "Termos",
    description: "Aceite as políticas para enviar o cadastro à Central Operacional.",
  },
] as const;

function RegistrationShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <AppHeader title="Cadastrar como Motorista" />
      <div className="relative mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Badge variant="outline" className={cn("mb-3", fuiBrand.border, fuiBrand.text)}>
            Central Operacional
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

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
  const utils = trpc.useUtils();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DriverApplicationFormState>(EMPTY_DRIVER_REGISTRATION);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setDriverSignupIntent();
  }, []);

  useEffect(() => {
    if (user) {
      clearDriverSignupIntent();
    }
  }, [user]);

  const { data: existing, isLoading } = trpc.driverRegistration.getMyApplication.useQuery(
    undefined,
    { enabled: !!user, retry: false }
  );

  const saveDraft = trpc.driverRegistration.saveDraft.useMutation();
  const submitMutation = trpc.driverRegistration.submit.useMutation({
    onSuccess: async () => {
      setSubmitted(true);
      await utils.auth.me.invalidate();
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
      <RegistrationShell
        title="Quero Ser Motorista"
        subtitle="Faça login para iniciar seu cadastro e enviar sua documentação à Central Operacional."
      >
        <Card className={cn(fuiSurface.card, "max-w-lg border-primary/20")}>
          <CardContent className="p-8 text-center space-y-4">
            <div className={fuiIconRingClass("brand", "h-14 w-14 mx-auto")}>
              <User className="h-6 w-6" />
            </div>
            <p className="text-muted-foreground">
              Você precisa estar autenticado para salvar rascunho e enviar o cadastro.
            </p>
            <Button className={fuiBrand.btn} onClick={() => redirectToLogin("/driver/register")}>
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </RegistrationShell>
    );
  }

  if (statusView && !submitMutation.isPending) {
    const isApproved = statusView === "aprovado";
    const isRejected = statusView === "reprovado";
    return (
      <RegistrationShell
        title={
          isApproved
            ? "Cadastro aprovado!"
            : isRejected
              ? "Cadastro não aprovado"
              : "Cadastro enviado"
        }
        subtitle={`Status atual: ${DRIVER_APPLICATION_STATUS_LABELS[statusView]}`}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className={cn(fuiSurface.card, "border-primary/20 h-fit")}>
            <CardContent className="p-8 text-center">
              <div
                className={cn(
                  "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1",
                  isApproved
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : isRejected
                      ? "bg-red-500/10 text-red-400 ring-red-500/20"
                      : "bg-primary/10 text-primary ring-primary/25"
                )}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <Clock className="h-8 w-8" />
                )}
              </div>
              <CardTitle className="text-xl">
                {DRIVER_APPLICATION_STATUS_LABELS[statusView]}
              </CardTitle>
              <CardDescription className="mt-2">
                {isApproved
                  ? "Você já pode acessar o painel do motorista."
                  : "Acompanhe o retorno da Central Operacional."}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(fuiSurface.card, "border-border/80")}>
            <CardHeader>
              <CardTitle className="text-lg">Próximos passos</CardTitle>
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
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Quero Ser Motorista"
      subtitle="Complete as etapas para enviar seu cadastro à Central Operacional do Fui."
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <FuiMetricCard label="Etapa atual" value={`${step}/5`} icon={Sparkles} highlight />
        <FuiMetricCard
          label="Progresso"
          value={`${Math.round((step / 5) * 100)}%`}
          icon={CheckCircle2}
        />
        <FuiMetricCard
          label="Veículo"
          value={form.vehicle?.type ? String(form.vehicle.type) : "Pendente"}
          icon={Car}
        />
        <FuiMetricCard
          label="Rascunho"
          value={saveDraft.isPending ? "Salvando" : "Ativo"}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card h-fit">
          <CardContent className="p-0">
            <div className="border-b border-border/60 px-6 py-5">
              <h2 className="text-lg font-semibold">Etapas do cadastro</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {STEP_GUIDES[step - 1]?.description}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {REGISTRATION_STEPS.map((s, index) => {
                const Icon = STEP_ICONS[index] ?? User;
                const done = s.id < step;
                const active = s.id === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.id > step}
                    onClick={() => s.id < step && setStep(s.id)}
                    className={cn(
                      "flex w-full gap-4 text-left rounded-xl border p-4 transition-colors",
                      active && "border-primary/40 bg-primary/[0.06]",
                      done && "border-emerald-500/25 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]",
                      !done && !active && "border-border/60 opacity-70",
                      s.id < step && "cursor-pointer"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          fuiIconRingClass(active ? "brand" : done ? "success" : "default", "h-10 w-10")
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {index < REGISTRATION_STEPS.length - 1 ? (
                        <div className="mt-2 h-full min-h-6 w-px bg-border/80" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                        Etapa {s.id}
                      </p>
                      <p className="font-medium mt-0.5">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {STEP_GUIDES[index]?.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/10 space-y-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {(() => {
                  const Icon = STEP_ICONS[step - 1] ?? User;
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
                {REGISTRATION_STEPS[step - 1]?.title}
              </CardTitle>
              <CardDescription>Etapa {step} de 5 — preencha os campos abaixo</CardDescription>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {REGISTRATION_STEPS.map((s) => {
                const done = s.id < step;
                const active = s.id === step;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                      active && "border-primary bg-primary/10 text-primary",
                      done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                      !done && !active && "border-border text-muted-foreground"
                    )}
                  >
                    {s.id}. {s.title}
                  </div>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
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
            <div className="flex gap-3 pt-2 border-t border-border/60">
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
          </CardContent>
        </Card>
      </div>
    </RegistrationShell>
  );
}
