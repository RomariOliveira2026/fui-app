import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import { adminContainer, adminPanelCard, adminViewTabTrigger, adminViewTabsList } from "@/lib/adminShell";
import { fuiBrand, fuiIconRingClass } from "@/lib/fuiTheme";
import {
  persistDemoAdminCampaignsSnapshot,
  useDemoAdminCampaignsHydration,
} from "@/lib/useDemoAdminCampaignsHydration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import {
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_CATEGORY_LABELS,
  CAMPAIGN_STATUSES,
  MEDIA_PLACEMENTS,
  MEDIA_PLACEMENT_LABELS,
  type CampaignCategory,
  type CampaignStatus,
  type MediaPlacement,
} from "@shared/adminCampaigns";
import {
  BarChart3,
  Globe,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminCampaigns() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const allowed = canAccessAdminPanel(user);
  const [activeTab, setActiveTab] = useState<"partners" | "campaigns" | "analytics" | "domain">(
    "partners"
  );
  const utils = trpc.useUtils();

  useDemoAdminCampaignsHydration(allowed);

  useEffect(() => {
    if (!authLoading && !allowed) setLocation("/");
  }, [authLoading, allowed, setLocation]);

  const { data: partners = [], isLoading: partnersLoading } =
    trpc.adminCampaigns.listPartners.useQuery(undefined, {
      enabled: allowed,
      throwOnError: false,
      retry: 1,
    });
  const { data: campaigns = [], isLoading: campaignsLoading } =
    trpc.adminCampaigns.listCampaigns.useQuery(undefined, {
      enabled: allowed,
      throwOnError: false,
      retry: 1,
    });
  const { data: analytics } = trpc.adminCampaigns.getAnalytics.useQuery(undefined, {
    enabled: allowed,
    throwOnError: false,
    retry: 1,
  });
  const { data: domainReadiness } = trpc.adminCampaigns.getDomainReadiness.useQuery(undefined, {
    enabled: allowed && activeTab === "domain",
    throwOnError: false,
    retry: 1,
  });
  const { data: leads = [] } = trpc.adminCampaigns.listCommercialLeads.useQuery(undefined, {
    enabled: allowed && activeTab === "partners",
    throwOnError: false,
    retry: 1,
  });

  const createPartner = trpc.adminCampaigns.createPartner.useMutation({
    onSuccess: (data) => {
      persistDemoAdminCampaignsSnapshot({ partners: [data] });
      utils.adminCampaigns.listPartners.invalidate();
      toast.success("Parceiro cadastrado");
    },
  });

  const createCampaign = trpc.adminCampaigns.createCampaign.useMutation({
    onSuccess: (data) => {
      persistDemoAdminCampaignsSnapshot({ campaigns: [data] });
      utils.adminCampaigns.listCampaigns.invalidate();
      utils.adminCampaigns.getAnalytics.invalidate();
      toast.success("Campanha criada");
    },
  });

  const setCampaignStatus = trpc.adminCampaigns.setCampaignStatus.useMutation({
    onSuccess: () => {
      utils.adminCampaigns.listCampaigns.invalidate();
      utils.adminCampaigns.getAnalytics.invalidate();
      toast.success("Status atualizado");
    },
  });

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    city: "",
    state: "SE",
    category: "local_business" as CampaignCategory,
  });

  const [campaignForm, setCampaignForm] = useState({
    partnerId: 0,
    name: "",
    category: "local_business" as CampaignCategory,
    targetCities: "",
    placement: "home_hero" as MediaPlacement,
    headline: "",
    ctaLabel: "Ver oferta",
    actionUrl: "/request-ride",
  });

  useEffect(() => {
    if (partners.length > 0 && campaignForm.partnerId === 0) {
      setCampaignForm((f) => ({ ...f, partnerId: partners[0]!.id }));
    }
  }, [partners, campaignForm.partnerId]);

  useEffect(() => {
    if (partners.length) persistDemoAdminCampaignsSnapshot({ partners });
  }, [partners]);

  useEffect(() => {
    if (campaigns.length) persistDemoAdminCampaignsSnapshot({ campaigns });
  }, [campaigns]);

  const hubStats = useMemo(() => {
    const activePartners = partners.filter((p) => p.status === "active").length;
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    return {
      activePartners,
      totalPartners: partners.length,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      leads: leads.length,
      ctr: analytics?.overallCtr ?? 0,
    };
  }, [partners, campaigns, leads, analytics]);

  if (!authLoading && !allowed) return null;

  if (authLoading || partnersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreatePartner = () => {
    if (!partnerForm.name.trim() || !partnerForm.city.trim()) {
      toast.error("Preencha nome e cidade");
      return;
    }
    createPartner.mutate({
      ...partnerForm,
      status: "active",
    });
    setPartnerForm({ name: "", city: "", state: "SE", category: "local_business" });
  };

  const handleCreateCampaign = () => {
    if (!campaignForm.partnerId || !campaignForm.name.trim() || !campaignForm.headline.trim()) {
      toast.error("Preencha parceiro, nome e headline");
      return;
    }
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    createCampaign.mutate({
      partnerId: campaignForm.partnerId,
      name: campaignForm.name,
      category: campaignForm.category,
      status: "active",
      targetCities: campaignForm.targetCities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      creatives: [
        {
          placement: campaignForm.placement,
          headline: campaignForm.headline,
          ctaLabel: campaignForm.ctaLabel,
          actionUrl: campaignForm.actionUrl,
          accentColor: "#F39200",
          sortOrder: 0,
        },
      ],
    });
    setCampaignForm((f) => ({ ...f, name: "", headline: "" }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <AppHeader title="Mídia & Parceiros" showBack />
      <div className={cn("relative", adminContainer)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className={cn("mb-3", fuiBrand.border, fuiBrand.text)}>
              BuilderTudo Technologies
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary shrink-0" />
              Anunciantes & Campanhas
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">
              Espaços premium de mídia, parceiros locais e campanhas segmentadas por cidade e categoria.
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Central Operacional
          </Button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <FuiMetricCard
            label="Parceiros ativos"
            value={String(hubStats.activePartners)}
            sub={`${hubStats.totalPartners} cadastrados`}
            icon={Users}
            highlight
          />
          <FuiMetricCard
            label="Campanhas ativas"
            value={String(hubStats.activeCampaigns)}
            sub={`${hubStats.totalCampaigns} no total`}
            icon={Sparkles}
          />
          <FuiMetricCard
            label="CTR geral"
            value={hubStats.ctr > 0 ? formatPct(hubStats.ctr) : "—"}
            icon={BarChart3}
          />
          <FuiMetricCard label="Leads comerciais" value={String(hubStats.leads)} icon={Megaphone} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList className={cn("grid w-full grid-cols-2 sm:grid-cols-4 h-auto", adminViewTabsList)}>
            <TabsTrigger value="partners" className={adminViewTabTrigger}>
              Parceiros
            </TabsTrigger>
            <TabsTrigger value="campaigns" className={adminViewTabTrigger}>
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="analytics" className={adminViewTabTrigger}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="domain" className={adminViewTabTrigger}>
              Domínio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="mt-0 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Parceiros ativos
                  </CardTitle>
                  <CardDescription>Anunciantes locais por cidade e categoria</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  {partners.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {partners.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border/70 bg-background/40 p-4 hover:border-primary/25 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{p.brandLabel ?? p.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {p.city}/{p.state}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {CAMPAIGN_CATEGORY_LABELS[p.category]}
                              </p>
                            </div>
                            <Badge variant={p.status === "active" ? "default" : "secondary"}>
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center bg-muted/10">
                      <div className={fuiIconRingClass("brand", "h-12 w-12 mx-auto mb-3")}>
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="font-medium">Nenhum parceiro cadastrado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use o formulário ao lado para cadastrar o primeiro anunciante local.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className={cn(adminPanelCard, "overflow-hidden")}>
                  <CardHeader className="border-b border-border/60 bg-muted/10">
                    <CardTitle className="text-lg">Novo parceiro</CardTitle>
                    <CardDescription>Cadastre um anunciante para vincular campanhas premium</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_5rem] gap-3">
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input
                          value={partnerForm.city}
                          onChange={(e) => setPartnerForm((f) => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>UF</Label>
                        <Input
                          value={partnerForm.state}
                          maxLength={2}
                          onChange={(e) =>
                            setPartnerForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={partnerForm.category}
                        onValueChange={(v) =>
                          setPartnerForm((f) => ({ ...f, category: v as CampaignCategory }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CAMPAIGN_CATEGORY_LABELS[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className={fuiBrand.btn}
                      onClick={handleCreatePartner}
                      disabled={createPartner.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Cadastrar parceiro
                    </Button>
                  </CardContent>
                </Card>

                <Card className={adminPanelCard}>
                  <CardHeader>
                    <CardTitle className="text-base">Como monetizar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex gap-2">
                      <span className={fuiBrand.text}>1.</span>
                      Cadastre parceiros por cidade e categoria
                    </p>
                    <p className="flex gap-2">
                      <span className={fuiBrand.text}>2.</span>
                      Publique campanhas nos espaços premium da home
                    </p>
                    <p className="flex gap-2">
                      <span className={fuiBrand.text}>3.</span>
                      Acompanhe impressões, cliques e CTR em Analytics
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {leads.length > 0 ? (
              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-lg">Leads comerciais (landing)</CardTitle>
                  <CardDescription>Prospects de /para-sua-cidade para converter em parceiros</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {leads.slice(0, 6).map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm"
                    >
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-muted-foreground mt-1">
                        {lead.city}/{lead.state} · {lead.profileType}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="campaigns" className="mt-0 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Campanhas por cidade
                  </CardTitle>
                  <CardDescription>Status, placements e segmentação geográfica</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-3">
                  {campaignsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : campaigns.length > 0 ? (
                    campaigns.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border/70 bg-background/40 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {c.targetCities.length ? c.targetCities.join(", ") : "Todas as cidades"}
                            </p>
                          </div>
                          <Badge>{c.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.creatives.map((cr) => (
                            <Badge key={cr.id} variant="outline" className="text-[10px]">
                              {MEDIA_PLACEMENT_LABELS[cr.placement]}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {CAMPAIGN_STATUSES.filter((s) => s !== c.status)
                            .slice(0, 2)
                            .map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() =>
                                  setCampaignStatus.mutate({
                                    id: c.id,
                                    status: status as CampaignStatus,
                                  })
                                }
                              >
                                {status}
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center bg-muted/10">
                      <div className={fuiIconRingClass("brand", "h-12 w-12 mx-auto mb-3")}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="font-medium">Nenhuma campanha publicada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie a primeira campanha no formulário ao lado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={cn(adminPanelCard, "overflow-hidden h-fit")}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg">Nova campanha</CardTitle>
                  <CardDescription>Espaço premium na home do passageiro</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Parceiro</Label>
                    <Select
                      value={String(campaignForm.partnerId || "")}
                      onValueChange={(v) =>
                        setCampaignForm((f) => ({ ...f, partnerId: Number(v) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.brandLabel ?? p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da campanha</Label>
                    <Input
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidades (vírgula)</Label>
                    <Input
                      placeholder="Aracaju, Itabaiana"
                      value={campaignForm.targetCities}
                      onChange={(e) =>
                        setCampaignForm((f) => ({ ...f, targetCities: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placement</Label>
                    <Select
                      value={campaignForm.placement}
                      onValueChange={(v) =>
                        setCampaignForm((f) => ({ ...f, placement: v as MediaPlacement }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_PLACEMENTS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {MEDIA_PLACEMENT_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={campaignForm.headline}
                      onChange={(e) =>
                        setCampaignForm((f) => ({ ...f, headline: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    className={fuiBrand.btn}
                    onClick={handleCreateCampaign}
                    disabled={createCampaign.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Publicar campanha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Resumo de performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 grid gap-3 sm:grid-cols-2">
                  <FuiMetricCard
                    label="Impressões"
                    value={String(analytics?.totalImpressions ?? 0)}
                    icon={BarChart3}
                    highlight
                  />
                  <FuiMetricCard
                    label="Cliques"
                    value={String(analytics?.totalClicks ?? 0)}
                    icon={Megaphone}
                  />
                  <FuiMetricCard
                    label="CTR geral"
                    value={formatPct(analytics?.overallCtr ?? 0)}
                    icon={Sparkles}
                  />
                  <FuiMetricCard
                    label="Campanhas ativas"
                    value={String(analytics?.activeCampaigns ?? 0)}
                    icon={Users}
                  />
                </CardContent>
              </Card>

              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg">Por campanha</CardTitle>
                  <CardDescription>Impressões, cliques e CTR por placement</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-2">
                  {(analytics?.byCampaign ?? []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 px-6 py-10 text-center bg-muted/10">
                      <p className="text-sm text-muted-foreground">
                        Sem eventos ainda — abra a home para gerar impressões.
                      </p>
                    </div>
                  ) : (
                    analytics?.byCampaign.map((row) => (
                      <div
                        key={`${row.campaignId}-${row.placement}`}
                        className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm"
                      >
                        <p className="font-medium">
                          {row.campaignName} · {row.partnerName}
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {MEDIA_PLACEMENT_LABELS[row.placement]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {row.impressions} imp · {row.clicks} cliques · CTR {formatPct(row.ctr)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="domain" className="mt-0">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Preparação para domínio próprio
                  </CardTitle>
                  <CardDescription>
                    Checklist antes de apontar {domainReadiness?.targetOwnDomain ?? "fuiapp.com.br"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm space-y-1">
                    <p>
                      URL configurada:{" "}
                      <span className="font-mono text-primary">
                        {domainReadiness?.configuredUrl ?? "—"}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Host canônico: {domainReadiness?.canonicalHostname ?? "—"}
                    </p>
                  </div>
                  <Badge variant={domainReadiness?.readyForOwnDomain ? "default" : "secondary"}>
                    {domainReadiness?.readyForOwnDomain
                      ? "Pronto para domínio próprio"
                      : "Ainda requer configuração"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={adminPanelCard}>
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-lg">Checklist técnico</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-3">
                    {domainReadiness?.checks.map((check) => (
                      <li
                        key={check.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                          check.ready
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-amber-500/30 bg-amber-500/5"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            check.ready
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          )}
                        >
                          {check.ready ? "✓" : "○"}
                        </span>
                        <div>
                          <p className="font-medium">{check.label}</p>
                          {check.hint && !check.ready ? (
                            <p className="text-xs text-muted-foreground mt-1">{check.hint}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
