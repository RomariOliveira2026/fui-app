import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  useDemoDeliveryHydration,
  persistDemoDeliveryFromServer,
} from "@/lib/useDemoDeliveryHydration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import DeliveryStatusStepper from "@/components/delivery/DeliveryStatusStepper";
import {
  Package,
  MapPin,
  Phone,
  User,
  FileText,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ChevronRight,
  Bike,
} from "lucide-react";
import { DELIVERY_STATUS_LABELS, type DeliveryStatus, type DeliveryStatusEvent } from "@shared/deliveryPremium";

const PACKAGE_TYPES = [
  { value: "documento", label: "Documento", icon: FileText },
  { value: "pacote_pequeno", label: "Pacote Pequeno", icon: Package },
  { value: "pacote_medio", label: "Pacote Médio", icon: Package },
  { value: "pacote_grande", label: "Pacote Grande", icon: Package },
  { value: "alimento", label: "Alimento", icon: Package },
  { value: "outro", label: "Outro", icon: Package },
] as const;

const STATUS_ICONS: Record<string, { color: string; icon: typeof Clock }> = {
  requested: { color: "text-yellow-500", icon: Clock },
  accepted: { color: "text-blue-500", icon: CheckCircle2 },
  picked_up: { color: "text-purple-500", icon: Package },
  in_transit: { color: "text-orange-500", icon: Truck },
  delivered: { color: "text-green-500", icon: CheckCircle2 },
  cancelled: { color: "text-red-500", icon: XCircle },
};

function getStatusDisplay(status: string) {
  const label = DELIVERY_STATUS_LABELS[status as DeliveryStatus] ?? status;
  const meta = STATUS_ICONS[status] ?? STATUS_ICONS.requested;
  return { label, ...meta! };
}

type PackageType = "documento" | "pacote_pequeno" | "pacote_medio" | "pacote_grande" | "alimento" | "outro";
type PaymentMethod = "pix" | "card" | "cash";

export default function Delivery() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("new");
  const [trackingInput, setTrackingInput] = useState("");

  // Form state
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState("");
  const [deliveryLng, setDeliveryLng] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageType, setPackageType] = useState<PackageType>("pacote_pequeno");
  const [packageDescription, setPackageDescription] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [step, setStep] = useState(1); // 1: addresses, 2: package, 3: confirm

  const utils = trpc.useUtils();
  useDemoDeliveryHydration();

  const [trackResult, setTrackResult] = useState<{
    id: number;
    status: string;
    packageType: string;
    pickupAddress: string;
    deliveryAddress: string;
    trackingCode: string | null;
    createdAt: Date;
    pickedUpAt: Date | null;
    deliveredAt: Date | null;
    statusHistory: DeliveryStatusEvent[];
  } | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const { data: myOrders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.delivery.myOrders.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Calculate distance using maps directions
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Price calculation
  const priceInput = useMemo(() => {
    if (!routeInfo) return null;
    return {
      distance: routeInfo.distance,
      packageType,
      isFragile,
      requiresSignature,
    };
  }, [routeInfo, packageType, isFragile, requiresSignature]);

  const { data: priceData, isFetching: priceFetching } = trpc.delivery.calculatePrice.useQuery(
    priceInput!,
    { enabled: !!priceInput }
  );

  const submitReadiness = useMemo(() => {
    const blockers: string[] = [];

    if (!pickupAddress.trim()) blockers.push("endereço de coleta");
    if (!deliveryAddress.trim()) blockers.push("endereço de entrega");
    if (!routeInfo) blockers.push("rota calculada");
    if (priceFetching) blockers.push("preço em cálculo");
    else if (!priceData?.estimatedPrice) blockers.push("preço estimado");
    if (!recipientName.trim()) blockers.push("nome do destinatário");
    if (!recipientPhone.trim()) blockers.push("telefone do destinatário");

    return { blockers, canSubmit: blockers.length === 0 };
  }, [
    pickupAddress,
    deliveryAddress,
    routeInfo,
    priceData,
    priceFetching,
    recipientName,
    recipientPhone,
  ]);

  const createMutation = trpc.delivery.create.useMutation({
    onSuccess: async (data) => {
      toast.success(`Entrega solicitada! Código: ${data.trackingCode}`);
      if (isLocalDemoDev() && data.orderId) {
        try {
          const order = await utils.delivery.getById.fetch({ id: data.orderId });
          persistDemoDeliveryFromServer(order);
        } catch {
          // ignore
        }
      }
      resetForm();
      navigate(`/delivery/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = trpc.delivery.cancel.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Entrega cancelada");
      if (isLocalDemoDev()) {
        try {
          const order = await utils.delivery.getById.fetch({ id: variables.id });
          persistDemoDeliveryFromServer(order);
        } catch {
          // ignore
        }
      }
      refetchOrders();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const resetForm = () => {
    setPickupAddress("");
    setPickupLat("");
    setPickupLng("");
    setPickupContactName("");
    setPickupContactPhone("");
    setDeliveryAddress("");
    setDeliveryLat("");
    setDeliveryLng("");
    setRecipientName("");
    setRecipientPhone("");
    setPackageType("pacote_pequeno");
    setPackageDescription("");
    setIsFragile(false);
    setRequiresSignature(false);
    setPaymentMethod("pix");
    setRouteInfo(null);
    setStep(1);
  };

  const handleCalculateRoute = async () => {
    if (!pickupAddress || !deliveryAddress) {
      toast.error("Preencha os endereços de coleta e entrega");
      return;
    }

    setCalculatingRoute(true);
    try {
      const result = await utils.maps.directions.fetch({
        origin: pickupAddress,
        destination: deliveryAddress,
      });

      if (result && result.distance && result.duration) {
        setRouteInfo({
          distance: result.distance.value,
          duration: result.duration.value,
        });
        // Use geocoded coordinates from directions
        if (result.startLocation) {
          setPickupLat(result.startLocation.lat.toString());
          setPickupLng(result.startLocation.lng.toString());
        }
        if (result.endLocation) {
          setDeliveryLat(result.endLocation.lat.toString());
          setDeliveryLng(result.endLocation.lng.toString());
        }
        setStep(2);
      } else {
        toast.error("Não foi possível calcular a rota. Verifique os endereços.");
      }
    } catch {
      toast.error("Erro ao calcular rota. Tente novamente.");
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleSubmit = () => {
    if (!submitReadiness.canSubmit) {
      toast.error(
        submitReadiness.blockers.length > 0
          ? `Preencha: ${submitReadiness.blockers.join(", ")}`
          : "Complete os dados obrigatórios"
      );
      return;
    }

    const route = routeInfo!;
    const price = priceData!;

    createMutation.mutate({
      pickupAddress,
      pickupLat: pickupLat || "-10.6847",
      pickupLng: pickupLng || "-37.4281",
      pickupContactName: pickupContactName || undefined,
      pickupContactPhone: pickupContactPhone || undefined,
      deliveryAddress,
      deliveryLat: deliveryLat || "-10.6847",
      deliveryLng: deliveryLng || "-37.4281",
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      packageType,
      packageDescription: packageDescription || undefined,
      isFragile,
      requiresSignature,
      distance: route.distance,
      duration: route.duration,
      estimatedPrice: price.estimatedPrice,
      paymentMethod,
    });
  };

  const handleTrack = async () => {
    if (!trackingInput.trim()) {
      toast.error("Digite o código de rastreio");
      return;
    }

    setTrackingLoading(true);
    setTrackResult(null);
    try {
      const result = await utils.delivery.track.fetch({
        trackingCode: trackingInput.trim(),
      });
      setTrackResult({
        ...result,
        createdAt: new Date(result.createdAt),
        pickedUpAt: result.pickedUpAt ? new Date(result.pickedUpAt) : null,
        deliveredAt: result.deliveredAt ? new Date(result.deliveredAt) : null,
        statusHistory: result.statusHistory ?? [],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Código de rastreio não encontrado"
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Entregas" />

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="new">Nova Entrega</TabsTrigger>
            <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
            <TabsTrigger value="track">Rastrear</TabsTrigger>
          </TabsList>

          {/* New Delivery */}
          <TabsContent value="new" className="space-y-4 mt-4">
            {/* Step 1: Addresses */}
            {step === 1 && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Endereço de coleta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Nome do contato</Label>
                        <Input
                          value={pickupContactName}
                          onChange={(e) => setPickupContactName(e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Telefone</Label>
                        <Input
                          value={pickupContactPhone}
                          onChange={(e) => setPickupContactPhone(e.target.value)}
                          placeholder="(79) 99999-9999"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      Endereço de entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Nome do destinatário *</Label>
                        <Input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Telefone *</Label>
                        <Input
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="(79) 99999-9999"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleCalculateRoute}
                  disabled={calculatingRoute || !pickupAddress || !deliveryAddress}
                >
                  {calculatingRoute ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Calcular Rota e Preço
                </Button>
              </>
            )}

            {/* Step 2: Package Details */}
            {step === 2 && (
              <>
                {routeInfo && (
                  <Card className="bg-orange-500/10 border-orange-500/30">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span>{(routeInfo.distance / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{Math.ceil(routeInfo.duration / 60)} min</span>
                      </div>
                      {priceData && (
                        <div className="text-lg font-bold text-orange-500">
                          R$ {(priceData.estimatedPrice / 100).toFixed(2)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      Destinatário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Nome do destinatário *</Label>
                        <Input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Nome completo"
                          className={
                            step === 2 && !recipientName.trim()
                              ? "border-amber-500/60 focus-visible:ring-amber-500/40"
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Telefone *</Label>
                        <Input
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="(79) 99999-9999"
                          className={
                            step === 2 && !recipientPhone.trim()
                              ? "border-amber-500/60 focus-visible:ring-amber-500/40"
                              : ""
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obrigatório para solicitar a entrega.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      Detalhes do pacote
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">Tipo de pacote *</Label>
                      <Select value={packageType} onValueChange={(v) => setPackageType(v as PackageType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKAGE_TYPES.map((pt) => (
                            <SelectItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Descrição (opcional)</Label>
                      <Textarea
                        value={packageDescription}
                        onChange={(e) => setPackageDescription(e.target.value)}
                        placeholder="Ex: Caixa de sapato, envelope A4..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Frágil</Label>
                        <p className="text-xs text-muted-foreground">+15% no valor</p>
                      </div>
                      <Switch checked={isFragile} onCheckedChange={setIsFragile} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Exigir assinatura</Label>
                        <p className="text-xs text-muted-foreground">+R$ 2,00</p>
                      </div>
                      <Switch checked={requiresSignature} onCheckedChange={setRequiresSignature} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Forma de pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "pix" as const, label: "PIX" },
                        { value: "card" as const, label: "Cartão" },
                        { value: "cash" as const, label: "Dinheiro" },
                      ].map((pm) => (
                        <Button
                          key={pm.value}
                          variant={paymentMethod === pm.value ? "default" : "outline"}
                          className={paymentMethod === pm.value ? "bg-orange-500 hover:bg-orange-600" : ""}
                          onClick={() => setPaymentMethod(pm.value)}
                        >
                          {pm.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {submitReadiness.blockers.length > 0 ? (
                  <p className="text-xs text-amber-500/90 flex items-start gap-1.5 px-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Para solicitar: {submitReadiness.blockers.join(" · ")}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !submitReadiness.canSubmit}
                  >
                    {createMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Solicitar Entrega
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* My Orders */}
          <TabsContent value="orders" className="space-y-3 mt-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myOrders && myOrders.length > 0 ? (
              myOrders.map((order) => {
                const statusInfo = getStatusDisplay(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={order.id}
                    className="overflow-hidden cursor-pointer hover:border-orange-500/40 transition-colors"
                    onClick={() => navigate(`/delivery/${order.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span className="text-xs line-clamp-1">{order.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-orange-500 mt-1 shrink-0" />
                          <span className="text-xs line-clamp-1">{order.deliveryAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {PACKAGE_TYPES.find(p => p.value === order.packageType)?.label || order.packageType}
                          </span>
                          {order.trackingCode && (
                            <span className="font-mono">{order.trackingCode}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-orange-500">
                          R$ {((order.estimatedPrice || 0) / 100).toFixed(2)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {["requested", "accepted"].includes(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-red-500 border-red-500/30 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelMutation.mutate({ id: order.id });
                          }}
                          disabled={cancelMutation.isPending}
                        >
                          Cancelar entrega
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma entrega</h3>
                <p className="text-sm text-muted-foreground">
                  Você ainda não fez nenhuma entrega. Comece agora!
                </p>
                <Button
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setActiveTab("new")}
                >
                  Nova Entrega
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Track */}
          <TabsContent value="track" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-500" />
                  Rastrear entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                    placeholder="Código de rastreio (ex: FUIABC123)"
                    className="font-mono"
                  />
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 shrink-0"
                    onClick={handleTrack}
                    disabled={trackingLoading}
                  >
                    {trackingLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      "Rastrear"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O código de rastreio é enviado ao solicitar a entrega.
                </p>
              </CardContent>
            </Card>

            {trackResult ? (
              <Card className="border-orange-500/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">
                      {trackResult.trackingCode}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        STATUS_ICONS[trackResult.status]?.color ?? "text-foreground"
                      }`}
                    >
                      {DELIVERY_STATUS_LABELS[trackResult.status as DeliveryStatus] ??
                        trackResult.status}
                    </span>
                  </div>
                  <DeliveryStatusStepper
                    status={trackResult.status as DeliveryStatus}
                    statusHistory={trackResult.statusHistory}
                  />
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                      <span className="text-xs line-clamp-2">{trackResult.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-orange-500 mt-1 shrink-0" />
                      <span className="text-xs line-clamp-2">{trackResult.deliveryAddress}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solicitado em {trackResult.createdAt.toLocaleString("pt-BR")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/delivery/${trackResult.id}`)}
                  >
                    Ver detalhes completos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
