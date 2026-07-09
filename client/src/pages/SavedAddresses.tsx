import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Home, Briefcase, Star, Trash2, Plus, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { fuiBrand } from "@/lib/fuiTheme";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import { appendCountryToAddress } from "@shared/mapDefaults";
import { WL } from "@/whitelabel";
import {
  deleteDemoSavedAddress,
  saveDemoSavedAddress,
} from "@/lib/demoSavedAddresses";

function getAddressLabel(addr: { label: string; customLabel?: string | null }): string {
  if (addr.label === "home") return "Casa";
  if (addr.label === "work") return "Trabalho";
  return addr.customLabel || "Outro";
}

function AddressTypeIcon({ label }: { label: string }) {
  if (label === "home") return <Home className="w-5 h-5 text-sky-400" />;
  if (label === "work") return <Briefcase className="w-5 h-5 text-emerald-400" />;
  return <Star className={`w-5 h-5 ${fuiBrand.text}`} />;
}

export default function SavedAddresses() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState<"home" | "work" | "other">("home");
  const [customLabel, setCustomLabel] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const { savedAddresses, isLoading, isDemo, setLocalAddresses } = useSavedAddresses();

  const addressStats = useMemo(() => {
    const list = savedAddresses ?? [];
    return {
      total: list.length,
      home: list.filter((a) => a.label === "home").length,
      work: list.filter((a) => a.label === "work").length,
      other: list.filter((a) => a.label === "other").length,
    };
  }, [savedAddresses]);

  const saveMutation = trpc.user.saveFavoriteAddress.useMutation({
    onSuccess: () => {
      toast.success("Endereço salvo com sucesso!");
      utils.user.getSavedAddresses.invalidate();
      setShowAddForm(false);
      setAddress("");
      setCustomLabel("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar endereço");
    },
  });

  const deleteMutation = trpc.user.deleteSavedAddress.useMutation({
    onSuccess: () => {
      toast.success("Endereço removido!");
      utils.user.getSavedAddresses.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover endereço");
    },
  });

  const handleSave = async () => {
    if (!address) {
      toast.error("Digite um endereço");
      return;
    }

    if (label === "other" && !customLabel) {
      toast.error("Digite um nome para este endereço");
      return;
    }

    setSaving(true);
    try {
      const result = await utils.maps.geocode.fetch({
        address: appendCountryToAddress(
          WL.city ? `${address}, ${WL.city}` : address
        ),
      });

      if (!result) {
        throw new Error("Endereço não encontrado");
      }

      const lat = result.lat.toString();
      const lng = result.lng.toString();

      if (isDemo) {
        const next = saveDemoSavedAddress({
          label,
          customLabel: label === "other" ? customLabel : undefined,
          address,
          lat,
          lng,
          userId: user?.id ?? 0,
        });
        setLocalAddresses(next);
        toast.success("Endereço salvo com sucesso!");
        setShowAddForm(false);
        setAddress("");
        setCustomLabel("");
        return;
      }

      await saveMutation.mutateAsync({
        label,
        customLabel: label === "other" ? customLabel : undefined,
        address,
        lat,
        lng,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar endereço");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    if (isDemo) {
      const next = deleteDemoSavedAddress(id);
      setLocalAddresses(next);
      toast.success("Endereço removido!");
      return;
    }
    deleteMutation.mutate({ id });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Endereços Salvos" />
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Endereços Salvos</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Salve seus endereços favoritos para agilizar futuros pedidos
            </p>
          </div>
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className={fuiBrand.btn}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          ) : null}
        </div>

        {addressStats.total > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <FuiMetricCard label="Total salvos" value={String(addressStats.total)} icon={MapPin} highlight />
            <FuiMetricCard label="Casa" value={String(addressStats.home)} icon={Home} />
            <FuiMetricCard label="Trabalho" value={String(addressStats.work)} icon={Briefcase} />
            <FuiMetricCard label="Outros" value={String(addressStats.other)} icon={Star} />
          </div>
        ) : null}

        {showAddForm ? (
          <Card className="border-primary/25 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Novo endereço</CardTitle>
              <CardDescription>Preencha os dados abaixo para salvar um atalho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Endereço</Label>
                  <Select value={label} onValueChange={(v) => setLabel(v as "home" | "work" | "other")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Casa</SelectItem>
                      <SelectItem value="work">Trabalho</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {label === "other" ? (
                  <div className="space-y-2">
                    <Label>Nome do Endereço</Label>
                    <Input
                      placeholder="Ex: Academia, Escola, etc."
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  placeholder="Digite o endereço completo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} className={`${fuiBrand.btn} sm:min-w-[140px]`}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddress("");
                    setCustomLabel("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {savedAddresses && savedAddresses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedAddresses.map((addr: any) => (
              <Card key={addr.id} className="border-border bg-card hover:border-primary/25 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        <AddressTypeIcon label={addr.label} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{getAddressLabel(addr)}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{addr.address}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(addr.id)}
                      disabled={!isDemo && deleteMutation.isPending}
                      aria-label="Remover endereço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-[1fr_1.2fr] lg:items-center">
                <div className="flex flex-col items-center justify-center px-6 py-12 lg:py-16 lg:border-r border-border">
                  <MapPin className="w-20 h-20 text-muted-foreground/40 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                    Nenhum endereço salvo ainda
                  </h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Cadastre Casa, Trabalho ou locais que você usa com frequência.
                  </p>
                </div>
                <div className="px-6 py-10 lg:py-16 space-y-4 bg-muted/20">
                  <p className="text-sm font-medium text-foreground">Por que salvar?</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>1.</span>
                      Preencha origem ou destino com um toque
                    </li>
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>2.</span>
                      Agilize corridas e entregas recorrentes
                    </li>
                    <li className="flex gap-2">
                      <span className={fuiBrand.text}>3.</span>
                      Organize Casa, Trabalho e favoritos personalizados
                    </li>
                  </ul>
                  <Button onClick={() => setShowAddForm(true)} className={`${fuiBrand.btn} w-full sm:w-auto`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Novo Endereço
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
