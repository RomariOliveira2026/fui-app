import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Home, Briefcase, Star, Trash2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { useSavedAddresses } from "@/lib/useSavedAddresses";
import {
  deleteDemoSavedAddress,
  saveDemoSavedAddress,
} from "@/lib/demoSavedAddresses";

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
        address: `${address}, Itabaiana, SE, Brasil`,
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
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Endereços Salvos" />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Meus Endereços</CardTitle>
            <CardDescription>
              Salve seus endereços favoritos para agilizar futuros pedidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedAddresses && savedAddresses.length > 0 ? (
              <div className="space-y-3">
                {savedAddresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {addr.label === "home" && <Home className="w-5 h-5 text-blue-400" />}
                        {addr.label === "work" && <Briefcase className="w-5 h-5 text-green-400" />}
                        {addr.label === "other" && <Star className="w-5 h-5 text-[#F39200]" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {addr.label === "home"
                            ? "Casa"
                            : addr.label === "work"
                              ? "Trabalho"
                              : addr.customLabel || "Outro"}
                        </p>
                        <p className="text-sm text-muted-foreground">{addr.address}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(addr.id)}
                      disabled={!isDemo && deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum endereço salvo ainda
              </p>
            )}

            {showAddForm ? (
              <div className="space-y-4 p-4 border border-[#F39200]/30 rounded-lg bg-[#F39200]/5">
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

                {label === "other" && (
                  <div className="space-y-2">
                    <Label>Nome do Endereço</Label>
                    <Input
                      placeholder="Ex: Academia, Escola, etc."
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    placeholder="Digite o endereço completo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#F39200] hover:bg-[#D46A03] text-white"
                  >
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
              </div>
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full border-[#F39200]/30 text-[#F39200] hover:bg-[#F39200]/10"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Endereço
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
