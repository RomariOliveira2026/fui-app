import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import DeliveryStatusStepper from "@/components/delivery/DeliveryStatusStepper";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  persistDemoDeliveryFromServer,
  useDemoDeliveryHydration,
} from "@/lib/useDemoDeliveryHydration";
import { DELIVERY_STATUS_LABELS, type DeliveryStatus } from "@shared/deliveryPremium";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  PenLine,
  Truck,
} from "lucide-react";

const PACKAGE_LABELS: Record<string, string> = {
  documento: "Documento",
  pacote_pequeno: "Pacote Pequeno",
  pacote_medio: "Pacote Médio",
  pacote_grande: "Pacote Grande",
  alimento: "Alimento",
  outro: "Outro",
};

export default function DeliveryDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/delivery/:id");
  const orderId = Number(params?.id);

  useDemoDeliveryHydration();

  const [confirmationInput, setConfirmationInput] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const {
    data: order,
    isLoading,
    refetch,
  } = trpc.delivery.getTrackingDetails.useQuery(
    { id: orderId },
    { enabled: !!user && Number.isFinite(orderId) && orderId > 0 }
  );

  const advanceMutation = trpc.delivery.advanceDemoStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status atualizado (demo)");
      await refetch();
      if (isLocalDemoDev()) {
        try {
          const updated = await utils.delivery.getById.fetch({ id: orderId });
          persistDemoDeliveryFromServer(updated);
        } catch {
          // ignore
        }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const completeMutation = trpc.delivery.completeDelivery.useMutation({
    onSuccess: async () => {
      toast.success("Entrega concluída com sucesso!");
      await refetch();
      if (isLocalDemoDev()) {
        try {
          const updated = await utils.delivery.getById.fetch({ id: orderId });
          persistDemoDeliveryFromServer(updated);
        } catch {
          // ignore
        }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.delivery.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Entrega cancelada");
      await refetch();
      if (isLocalDemoDev()) {
        try {
          const updated = await utils.delivery.getById.fetch({ id: orderId });
          persistDemoDeliveryFromServer(updated);
        } catch {
          // ignore
        }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Entrega" />
        <div className="p-4 text-center text-muted-foreground">Pedido não encontrado.</div>
      </div>
    );
  }

  const status = order.status as DeliveryStatus;
  const canCancel = ["requested", "accepted"].includes(status);
  const canAdvanceDemo =
    isLocalDemoDev() && !["delivered", "cancelled"].includes(status) && status !== "in_transit";
  const canComplete = !["delivered", "cancelled", "requested"].includes(status);

  const handleProofFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = () => {
    completeMutation.mutate({
      id: orderId,
      confirmationCode: confirmationInput.trim(),
      proofOfDeliveryUrl: proofPreview ?? undefined,
      useDemoProofPlaceholder: !proofPreview,
      signatureConfirmed: order.requiresSignature ? signatureConfirmed : signatureConfirmed,
      signatureName: signatureName.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader title={`Entrega #${order.id}`} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/delivery")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                {DELIVERY_STATUS_LABELS[status] ?? status}
              </span>
              {order.trackingCode ? (
                <span className="font-mono text-xs text-muted-foreground">{order.trackingCode}</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryStatusStepper
              status={status}
              statusHistory={order.statusHistory}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Coleta</p>
                <p>{order.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Entrega</p>
                <p>{order.deliveryAddress}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.recipientName} · {order.recipientPhone}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {PACKAGE_LABELS[order.packageType] ?? order.packageType}
              </span>
              <span className="font-bold text-orange-500">
                R$ {((order.estimatedPrice ?? 0) / 100).toFixed(2)}
              </span>
            </div>
            {order.distance ? (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{(order.distance / 1000).toFixed(1)} km</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.ceil((order.duration ?? 0) / 60)} min
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {order.confirmationCode && status !== "delivered" ? (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Código de confirmação</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-orange-500 mt-1">
                    {order.confirmationCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Informe ao entregador na conclusão da entrega.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {status === "delivered" ? (
          <Card className="border-emerald-500/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Entrega concluída</span>
              </div>
              {order.proofOfDeliveryUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    Prova de entrega
                  </p>
                  <img
                    src={order.proofOfDeliveryUrl}
                    alt="Prova de entrega"
                    className="rounded-lg border border-border w-full max-h-48 object-cover"
                  />
                </div>
              ) : null}
              {order.signatureConfirmed ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <PenLine className="h-3.5 w-3.5" />
                  Assinatura confirmada
                  {order.signatureName ? ` — ${order.signatureName}` : ""}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {canAdvanceDemo ? (
          <Button
            variant="outline"
            className="w-full border-orange-500/40"
            onClick={() => advanceMutation.mutate({ id: orderId })}
            disabled={advanceMutation.isPending}
          >
            Simular próximo status (demo)
          </Button>
        ) : null}

        {canComplete && isLocalDemoDev() ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Concluir entrega (demo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Código de confirmação *</Label>
                <Input
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="6 dígitos"
                  className="font-mono"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" />
                  Foto da entrega (opcional)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProofFile(e.target.files?.[0])}
                />
                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="Preview"
                    className="rounded-lg border border-border max-h-32 object-cover"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sem foto, usamos placeholder demo automaticamente.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <PenLine className="h-3.5 w-3.5" />
                    Confirmar assinatura
                    {order.requiresSignature ? " *" : ""}
                  </Label>
                  {order.requiresSignature ? (
                    <p className="text-xs text-muted-foreground">Obrigatório neste pedido</p>
                  ) : null}
                </div>
                <Switch checked={signatureConfirmed} onCheckedChange={setSignatureConfirmed} />
              </div>

              {signatureConfirmed ? (
                <Input
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Nome de quem recebeu (opcional)"
                />
              ) : null}

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleComplete}
                disabled={completeMutation.isPending || confirmationInput.trim().length < 4}
              >
                {completeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Registrar entrega
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canCancel ? (
          <Button
            variant="outline"
            className="w-full text-red-400 border-red-500/30"
            onClick={() => cancelMutation.mutate({ id: orderId })}
            disabled={cancelMutation.isPending}
          >
            Cancelar entrega
          </Button>
        ) : null}
      </div>
    </div>
  );
}
