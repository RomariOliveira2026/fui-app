import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import { adminPageBg, adminPanelCard, adminSectionSubtitle } from "@/lib/adminShell";
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
  PARTNER_STATUSES,
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
    trpc.adminCampaigns.listPartners.useQuery(undefined, { enabled: allowed });
  const { data: campaigns = [], isLoading: campaignsLoading } =
    trpc.adminCampaigns.listCampaigns.useQuery(undefined, { enabled: allowed });
  const { data: analytics } = trpc.adminCampaigns.getAnalytics.useQuery(undefined, {
    enabled: allowed && activeTab === "analytics",
  });
  const { data: domainReadiness } = trpc.adminCampaigns.getDomainReadiness.useQuery(undefined, {
    enabled: allowed && activeTab === "domain",
  });
  const { data: leads = [] } = trpc.adminCampaigns.listCommercialLeads.useQuery(undefined, {
    enabled: allowed && activeTab === "partners",
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
    <div className={cn("min-h-screen", adminPageBg)}>
      <AppHeader title="Mídia & Parceiros" showBack />
      <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" />
              Anunciantes & Campanhas
            </h1>
            <p className={adminSectionSubtitle}>
              Espaços premium de mídia · BuilderTudo Technologies
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Central Operacional
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="partners">Parceiros</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="domain">Domínio</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Parceiros ativos
                  </CardTitle>
                  <CardDescription>Anunciantes locais por cidade e categoria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.brandLabel ?? p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.city}/{p.state} · {CAMPAIGN_CATEGORY_LABELS[p.category]}
                        </p>
                      </div>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-base">Novo parceiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Nome</Label>
                    <Input
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Cidade</Label>
                      <Input
                        value={partnerForm.city}
                        onChange={(e) => setPartnerForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
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
                  <div className="space-y-1">
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
                  <Button onClick={handleCreatePartner} disabled={createPartner.isPending}>
                    <Plus className="w-4 h-4 mr-1" />
                    Cadastrar parceiro
                  </Button>
                </CardContent>
              </Card>
            </div>

            {leads.length > 0 ? (
              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-base">Leads comerciais (landing)</CardTitle>
                  <CardDescription>Prospects de /para-sua-cidade para converter em parceiros</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="text-sm border-b border-border/40 pb-2 last:border-0">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {lead.city}/{lead.state} · {lead.profileType}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Campanhas por cidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaignsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    campaigns.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border/60 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.targetCities.length
                                ? c.targetCities.join(", ")
                                : "Todas as cidades"}
                            </p>
                          </div>
                          <Badge>{c.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {c.creatives.map((cr) => (
                            <Badge key={cr.id} variant="outline" className="text-[10px]">
                              {MEDIA_PLACEMENT_LABELS[cr.placement]}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {CAMPAIGN_STATUSES.filter((s) => s !== c.status).slice(0, 2).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() =>
                                setCampaignStatus.mutate({ id: c.id, status: status as CampaignStatus })
                              }
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className={adminPanelCard}>
                <CardHeader>
                  <CardTitle className="text-base">Nova campanha</CardTitle>
                  <CardDescription>Espaço premium na home do passageiro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <Label>Nome da campanha</Label>
                    <Input
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Cidades (vírgula)</Label>
                    <Input
                      placeholder="Aracaju, Itabaiana"
                      value={campaignForm.targetCities}
                      onChange={(e) =>
                        setCampaignForm((f) => ({ ...f, targetCities: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <Label>Headline</Label>
                    <Input
                      value={campaignForm.headline}
                      onChange={(e) =>
                        setCampaignForm((f) => ({ ...f, headline: e.target.value }))
                      }
                    />
                  </div>
                  <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
                    <Plus className="w-4 h-4 mr-1" />
                    Publicar campanha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FuiMetricCard
                label="Impressões"
                value={String(analytics?.totalImpressions ?? 0)}
                icon={BarChart3}
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
            </div>
            <Card className={adminPanelCard}>
              <CardHeader>
                <CardTitle className="text-base">Por campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(analytics?.byCampaign ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem eventos ainda — abra a home para gerar impressões.
                  </p>
                ) : (
                  analytics?.byCampaign.map((row) => (
                    <div
                      key={`${row.campaignId}-${row.placement}`}
                      className="flex justify-between text-sm border-b border-border/40 py-2"
                    >
                      <span>
                        {row.campaignName} · {row.partnerName}
                        <span className="text-muted-foreground ml-1">
                          ({MEDIA_PLACEMENT_LABELS[row.placement]})
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {row.impressions} imp · {row.clicks} cliques · CTR {formatPct(row.ctr)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-4 mt-4">
            <Card className={adminPanelCard}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Preparação para domínio próprio
                </CardTitle>
                <CardDescription>
                  Checklist antes de apontar {domainReadiness?.targetOwnDomain ?? "fuiapp.com.br"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
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
                <ul className="space-y-2">
                  {domainReadiness?.checks.map((check) => (
                    <li
                      key={check.id}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                        check.ready
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-amber-500/30 bg-amber-500/5"
                      )}
                    >
                      <span className={check.ready ? "text-emerald-500" : "text-amber-500"}>
                        {check.ready ? "✓" : "○"}
                      </span>
                      <div>
                        <p className="font-medium">{check.label}</p>
                        {check.hint && !check.ready ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{check.hint}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <Badge variant={domainReadiness?.readyForOwnDomain ? "default" : "secondary"}>
                  {domainReadiness?.readyForOwnDomain
                    ? "Pronto para domínio próprio"
                    : "Ainda requer configuração"}
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
