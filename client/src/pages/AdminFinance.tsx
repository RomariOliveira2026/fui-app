import { useEffect, useState } from "react";
import { isLocalDemoDev } from "@/lib/demoMode";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  DollarSign,
  Percent,
  Tag,
  UserCheck,
  UserX,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Ban,
} from "lucide-react";
import { useLocation } from "wouter";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import {
  persistDemoAdminFinanceSnapshot,
  useDemoAdminFinanceHydration,
} from "@/lib/useDemoAdminFinanceHydration";
import type { FinanceServiceKey, PlatformFinanceConfig } from "@shared/adminFinance";
import { FINANCE_SERVICE_KEYS } from "@shared/adminFinance";
import FuiMetricCard from "@/components/fui/FuiMetricCard";

const SERVICE_LABELS: Record<FinanceServiceKey, string> = {
  ride: "Corrida",
  delivery: "Entrega",
  moto: "Moto",
  carro: "Carro",
  van: "Van",
  utilitario: "Utilitário",
};

function formatBrl(cents: number) {
  return `R$ ${(cents / 100).toFixed(2)}`;
}

const FINANCE_TAB_VALUES = ["rules", "coupons", "drivers", "cancellations"] as const;
type FinanceTabValue = (typeof FINANCE_TAB_VALUES)[number];

function readFinanceTabFromUrl(): FinanceTabValue {
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab && (FINANCE_TAB_VALUES as readonly string[]).includes(tab)) {
    return tab as FinanceTabValue;
  }
  return "rules";
}

export default function AdminFinance() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<FinanceTabValue>(readFinanceTabFromUrl);
  const utils = trpc.useUtils();

  useDemoAdminFinanceHydration(canAccessAdminPanel(user));

  const { data: summary, isLoading: summaryLoading } = trpc.adminFinance.getFinancialSummary.useQuery(
    undefined,
    { enabled: canAccessAdminPanel(user), refetchInterval: 30_000 }
  );
  const { data: config, isLoading: configLoading } = trpc.adminFinance.getConfig.useQuery(undefined, {
    enabled: canAccessAdminPanel(user),
  });
  const { data: coupons, isLoading: couponsLoading } = trpc.adminFinance.getCoupons.useQuery(
    undefined,
    { enabled: canAccessAdminPanel(user) }
  );
  const { data: pendingDrivers } = trpc.adminFinance.getPendingDriverReviews.useQuery(undefined, {
    enabled: canAccessAdminPanel(user),
  });
  const { data: cancellations } = trpc.adminFinance.getCancellationAudit.useQuery(
    { limit: 40 },
    { enabled: canAccessAdminPanel(user) }
  );

  const updateConfig = trpc.adminFinance.updateConfig.useMutation({
    onSuccess: (data) => {
      persistDemoAdminFinanceSnapshot({ config: data as PlatformFinanceConfig });
      utils.adminFinance.getConfig.invalidate();
      utils.adminFinance.getFinancialSummary.invalidate();
      toast.success("Regras financeiras atualizadas");
    },
  });

  const createCoupon = trpc.adminFinance.createCoupon.useMutation({
    onSuccess: () => {
      utils.adminFinance.getCoupons.invalidate();
      toast.success("Cupom criado");
      setCouponForm({ code: "", description: "", discountType: "percentage", discountValue: 10 });
    },
  });

  const toggleCoupon = trpc.adminFinance.toggleCoupon.useMutation({
    onSuccess: () => utils.adminFinance.getCoupons.invalidate(),
  });

  const approveDriver = trpc.adminFinance.approveDriverReview.useMutation({
    onSuccess: () => {
      toast.success("Motorista aprovado");
      utils.adminFinance.getPendingDriverReviews.invalidate();
    },
  });

  const rejectDriver = trpc.adminFinance.rejectDriverReview.useMutation({
    onSuccess: () => {
      toast.success("Motorista reprovado");
      utils.adminFinance.getPendingDriverReviews.invalidate();
    },
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
  });

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  useEffect(() => {
    setActiveTab(readFinanceTabFromUrl());
  }, [location]);

  const onFinanceTabChange = (value: string) => {
    const tab = value as FinanceTabValue;
    setActiveTab(tab);
    setLocation(tab === "rules" ? "/admin/finance" : `/admin/finance?tab=${tab}`);
  };

  useEffect(() => {
    if (!isLocalDemoDev()) return;
    if (config) persistDemoAdminFinanceSnapshot({ config });
  }, [config]);

  useEffect(() => {
    if (!isLocalDemoDev() || !cancellations) return;
    persistDemoAdminFinanceSnapshot({ cancellationAudit: cancellations });
  }, [cancellations]);

  if (!authLoading && !canAccessAdminPanel(user)) {
    setLocation("/");
    return null;
  }

  if (authLoading || summaryLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const updateCommission = (key: FinanceServiceKey, value: number) => {
    if (!config) return;
    updateConfig.mutate({
      commission: { byService: { [key]: value } },
    } as never);
  };

  const updateMinPrice = (key: FinanceServiceKey, cents: number) => {
    updateConfig.mutate({
      minimumPrices: { byService: { [key]: cents } },
    } as never);
  };

  const handleCreateCoupon = () => {
    const now = new Date();
    const until = new Date(now);
    until.setMonth(until.getMonth() + 1);
    createCoupon.mutate({
      code: couponForm.code,
      description: couponForm.description || undefined,
      discountType: couponForm.discountType,
      discountValue:
        couponForm.discountType === "fixed"
          ? Math.round(couponForm.discountValue * 100)
          : couponForm.discountValue,
      validFrom: now.toISOString(),
      validUntil: until.toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Financeiro & Gestão" />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financeiro & Gestão</h1>
            <p className="text-muted-foreground">
              Comissões, regras comerciais, cupons e aprovações
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Central Operacional
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/manage")}>
              Gestão legada
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <FuiMetricCard
            label="Faturamento bruto"
            value={formatBrl(summary?.grossRevenueCents ?? 0)}
            sub={summary?.periodLabel}
            icon={TrendingUp}
          />
          <FuiMetricCard
            label="Comissão plataforma"
            value={formatBrl(summary?.platformCommissionCents ?? 0)}
            icon={Percent}
          />
          <FuiMetricCard
            label="Repasse motoristas"
            value={formatBrl(summary?.estimatedDriverPayoutCents ?? 0)}
            sub="Valor líquido estimado"
            icon={Wallet}
            highlight
          />
          <FuiMetricCard
            label="Serviços concluídos"
            value={`${summary?.completedRides ?? 0} corr.`}
            sub={`${summary?.completedDeliveries ?? 0} entregas`}
            icon={DollarSign}
          />
        </div>

        <Tabs value={activeTab} onValueChange={onFinanceTabChange} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="rules">Comissões & preços mínimos</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="drivers">Aprovação documental</TabsTrigger>
            <TabsTrigger value="cancellations">Cancelamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comissão por modalidade (%)</CardTitle>
                  <CardDescription>
                    Padrão: {config?.commission.defaultPercent ?? 15}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Comissão padrão</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={config?.commission.defaultPercent}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v >= 0 && v <= 100) {
                          updateConfig.mutate({ commission: { defaultPercent: v } });
                        }
                      }}
                    />
                  </div>
                  {FINANCE_SERVICE_KEYS.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <Label className="text-sm">{SERVICE_LABELS[key]}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-24 h-8"
                        defaultValue={config?.commission.byService[key]}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 0 && v <= 100) updateCommission(key, v);
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preço mínimo (demo)</CardTitle>
                  <CardDescription>
                    Região: {config?.minimumPrices.regionLabel ?? "Centro"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Região demo</Label>
                    <Input
                      defaultValue={config?.minimumPrices.regionLabel}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          updateConfig.mutate({
                            minimumPrices: { regionLabel: e.target.value.trim() },
                          });
                        }
                      }}
                    />
                  </div>
                  {FINANCE_SERVICE_KEYS.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <Label className="text-sm">{SERVICE_LABELS[key]}</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className="w-28 h-8"
                        defaultValue={
                          config?.minimumPrices.byService[key]
                            ? (config.minimumPrices.byService[key]! / 100).toFixed(0)
                            : ""
                        }
                        onBlur={(e) => {
                          const reais = Number(e.target.value);
                          if (reais >= 0) updateMinPrice(key, Math.round(reais * 100));
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coupons">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Campanhas ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {couponsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : coupons && coupons.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Desconto</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono">{c.code}</TableCell>
                            <TableCell>
                              {c.discountType === "percentage"
                                ? `${c.discountValue}%`
                                : formatBrl(c.discountValue)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={c.isActive}
                                onCheckedChange={(checked) =>
                                  toggleCoupon.mutate({ id: c.id, isActive: checked })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novo cupom</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Código</Label>
                    <Input
                      value={couponForm.code}
                      onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Input
                      value={couponForm.description}
                      onChange={(e) =>
                        setCouponForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={couponForm.discountType}
                        onChange={(e) =>
                          setCouponForm((f) => ({
                            ...f,
                            discountType: e.target.value as "percentage" | "fixed",
                          }))
                        }
                      >
                        <option value="percentage">Percentual</option>
                        <option value="fixed">Valor fixo (R$)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        value={couponForm.discountValue}
                        onChange={(e) =>
                          setCouponForm((f) => ({
                            ...f,
                            discountValue: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateCoupon}
                    disabled={!couponForm.code || createCoupon.isPending}
                  >
                    Criar cupom
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Aprovação documental
                </CardTitle>
                <CardDescription>Revise CNH e dados antes de liberar o motorista</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingDrivers && pendingDrivers.length > 0 ? (
                  pendingDrivers.map((driver) => (
                    <div
                      key={driver.driverId}
                      className="rounded-lg border border-border p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.email} · CPF {driver.cpf ?? "—"} · CNH {driver.cnh ?? "—"}
                          </p>
                        </div>
                        <Badge variant="outline">Pendente</Badge>
                      </div>
                      {driver.cnhImageUrl ? (
                        <p className="text-xs text-muted-foreground">
                          Documento: {driver.cnhImageUrl}
                        </p>
                      ) : null}
                      <Textarea
                        placeholder="Motivo da reprovação (opcional)"
                        value={rejectReason[driver.driverId] ?? ""}
                        onChange={(e) =>
                          setRejectReason((r) => ({ ...r, [driver.driverId]: e.target.value }))
                        }
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveDriver.mutate({ driverId: driver.driverId })}
                          disabled={approveDriver.isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            rejectDriver.mutate({
                              driverId: driver.driverId,
                              reason: rejectReason[driver.driverId],
                            })
                          }
                          disabled={rejectDriver.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reprovar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum motorista pendente no momento
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancellations">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ban className="h-4 w-4 text-primary" />
                  Histórico de cancelamentos
                </CardTitle>
                <CardDescription>Motivo e origem auditáveis</CardDescription>
              </CardHeader>
              <CardContent>
                {cancellations && cancellations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quando</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cancellations.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(entry.cancelledAt).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="capitalize text-xs">{entry.entityType}</TableCell>
                          <TableCell>#{entry.entityId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {entry.origin}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {entry.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cancelamento registrado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
