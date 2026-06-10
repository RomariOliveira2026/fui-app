import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  persistDemoUtilityDispatcherSnapshot,
  persistDemoUtilityFromServer,
  useDemoUtilitiesHydration,
} from "@/lib/useDemoUtilitiesHydration";
import {
  UTILITY_SERVICE_LABELS,
  UTILITY_SERVICE_TYPES,
  UTILITY_VEHICLE_LABELS,
  UTILITY_VEHICLE_TYPES,
  type UtilityFragility,
  type UtilityPaymentMethod,
  type UtilityServiceType,
  type UtilityVehicleType,
} from "@shared/utilities";
import { Calculator, Calendar, Loader2, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

function readServiceFromUrl(): UtilityServiceType {
  const raw = new URLSearchParams(window.location.search).get("service");
  if (raw && (UTILITY_SERVICE_TYPES as string[]).includes(raw)) {
    return raw as UtilityServiceType;
  }
  return "freight_fast";
}

export default function UtilityRequest() {
  const { user, loading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  useDemoUtilitiesHydration();

  const [serviceType, setServiceType] = useState<UtilityServiceType>(readServiceFromUrl);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [intermediateStop, setIntermediateStop] = useState("");

  const [itemType, setItemType] = useState("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [volumeM3, setVolumeM3] = useState("");
  const [packageCount, setPackageCount] = useState("1");
  const [fragility, setFragility] = useState<UtilityFragility>("normal");
  const [roomCount, setRoomCount] = useState("");
  const [itemSummary, setItemSummary] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [timeWindow, setTimeWindow] = useState("");

  const [needsHelper, setNeedsHelper] = useState(false);
  const [helperCount, setHelperCount] = useState("1");
  const [needsDisassembly, setNeedsDisassembly] = useState(false);
  const [needsAssembly, setNeedsAssembly] = useState(false);
  const [hasStairs, setHasStairs] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");

  const [vehicleType, setVehicleType] = useState<UtilityVehicleType>("light_utility");
  const [vehicleAuto, setVehicleAuto] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<UtilityPaymentMethod>("pix");

  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    setServiceType(readServiceFromUrl());
  }, [location]);

  const suggestInput = useMemo(
    () => ({
      serviceType,
      estimatedWeightKg: weightKg ? Number(weightKg) : undefined,
      estimatedVolumeM3: volumeM3 ? Number(volumeM3) : undefined,
      packageCount: packageCount ? Number(packageCount) : undefined,
      needsHelper,
    }),
    [serviceType, weightKg, volumeM3, packageCount, needsHelper]
  );

  const { data: vehicleSuggestion } = trpc.utilities.suggestVehicle.useQuery(suggestInput);

  useEffect(() => {
    if (vehicleAuto && vehicleSuggestion?.vehicle) {
      setVehicleType(vehicleSuggestion.vehicle);
    }
  }, [vehicleAuto, vehicleSuggestion?.vehicle]);

  const quoteInput = useMemo(() => {
    if (!routeInfo) return null;
    return {
      serviceType,
      vehicleType,
      distanceMeters: routeInfo.distance,
      durationSeconds: routeInfo.duration,
      cargo: {
        estimatedWeightKg: weightKg ? Number(weightKg) : undefined,
        fragility,
      },
      extras: {
        needsHelper,
        helperCount: needsHelper ? Number(helperCount) || 1 : 0,
        needsDisassembly,
        needsAssembly,
        hasStairs,
        hasElevator,
        isUrgent,
        isScheduled,
      },
    };
  }, [
    routeInfo,
    serviceType,
    vehicleType,
    weightKg,
    fragility,
    needsHelper,
    helperCount,
    needsDisassembly,
    needsAssembly,
    hasStairs,
    hasElevator,
    isUrgent,
    isScheduled,
  ]);

  const { data: quote, isFetching: quoteLoading, refetch: refetchQuote } =
    trpc.utilities.calculateQuote.useQuery(quoteInput!, { enabled: !!quoteInput });

  const createMutation = trpc.utilities.create.useMutation({
    onSuccess: async (data) => {
      toast.success(`Utilitário solicitado! Código ${data.trackingCode}`);
      if (isLocalDemoDev()) {
        if (data.demoSnapshot) {
          persistDemoUtilityDispatcherSnapshot(data.demoSnapshot);
        } else if (data.orderId) {
          try {
            const order = await utils.utilities.getById.fetch({ id: data.orderId });
            persistDemoUtilityFromServer(order);
          } catch {
            // ignore
          }
        }
      }
      navigate(`/utilities/${data.orderId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleCalculateRoute = async () => {
    if (!originAddress.trim() || !destinationAddress.trim()) {
      toast.error("Preencha origem e destino");
      return;
    }
    setCalculatingRoute(true);
    try {
      const result = await utils.maps.directions.fetch({
        origin: originAddress,
        destination: destinationAddress,
      });
      if (result?.distance?.value && result?.duration?.value) {
        setRouteInfo({
          distance: result.distance.value,
          duration: result.duration.value,
        });
        if (result.startLocation) {
          setOriginLat(String(result.startLocation.lat));
          setOriginLng(String(result.startLocation.lng));
        }
        if (result.endLocation) {
          setDestLat(String(result.endLocation.lat));
          setDestLng(String(result.endLocation.lng));
        }
        toast.success("Rota calculada");
        void refetchQuote();
      } else {
        toast.error("Não foi possível calcular a rota");
      }
    } catch {
      toast.error("Erro ao calcular rota");
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buildPayload = (scheduled: boolean) => {
    if (!routeInfo || !quote) {
      toast.error("Calcule a rota e o preço antes de continuar");
      return null;
    }
    return {
      serviceType,
      originAddress,
      originLat: originLat || "-10.685",
      originLng: originLng || "-37.436",
      destinationAddress,
      destinationLat: destLat || "-10.69",
      destinationLng: destLng || "-37.44",
      intermediateStops: intermediateStop.trim() ? [intermediateStop.trim()] : undefined,
      cargo: {
        itemType: itemType || undefined,
        description: description || undefined,
        estimatedWeightKg: weightKg ? Number(weightKg) : undefined,
        estimatedVolumeM3: volumeM3 ? Number(volumeM3) : undefined,
        packageCount: packageCount ? Number(packageCount) : undefined,
        fragility,
        photoUrls: photoPreview ? [photoPreview] : undefined,
        roomCount: roomCount ? Number(roomCount) : undefined,
        itemSummary: itemSummary || undefined,
        storeName: storeName || undefined,
        storePhone: storePhone || undefined,
        companyName: companyName || undefined,
        frequency: frequency || undefined,
        timeWindow: timeWindow || undefined,
      },
      extras: {
        needsHelper,
        helperCount: needsHelper ? Number(helperCount) || 1 : 0,
        needsDisassembly,
        needsAssembly,
        hasStairs,
        hasElevator,
        isUrgent,
        isScheduled: scheduled,
        scheduledFor: scheduled && scheduledFor ? scheduledFor : undefined,
        notes: notes || undefined,
      },
      vehicleType,
      vehicleAutoSuggested: vehicleAuto,
      paymentMethod,
      distance: routeInfo.distance,
      duration: routeInfo.duration,
      quote,
    };
  };

  const submit = (scheduled: boolean) => {
    const payload = buildPayload(scheduled);
    if (!payload) return;
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Solicitar Utilitário" />

      <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Tipo de serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={serviceType} onValueChange={(v) => setServiceType(v as UtilityServiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UTILITY_SERVICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {UTILITY_SERVICE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Endereços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Origem</Label>
              <Input value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="De onde retirar" />
            </div>
            <div>
              <Label>Destino</Label>
              <Input value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="Para onde levar" />
            </div>
            <div>
              <Label className="text-muted-foreground">Parada intermediária (opcional)</Label>
              <Input value={intermediateStop} onChange={(e) => setIntermediateStop(e.target.value)} placeholder="Endereço extra" />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCalculateRoute}
              disabled={calculatingRoute}
            >
              {calculatingRoute ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
              Calcular rota e preço
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informações da carga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(serviceType === "freight_fast" || serviceType === "bulky_cargo") && (
              <div>
                <Label>Item principal</Label>
                <Input value={itemType} onChange={(e) => setItemType(e.target.value)} placeholder="Ex: Sofá, geladeira" />
              </div>
            )}
            {serviceType === "small_move" && (
              <>
                <div>
                  <Label>Quantidade de cômodos</Label>
                  <Input type="number" min={1} value={roomCount} onChange={(e) => setRoomCount(e.target.value)} />
                </div>
                <div>
                  <Label>Lista resumida de itens</Label>
                  <Textarea value={itemSummary} onChange={(e) => setItemSummary(e.target.value)} rows={2} />
                </div>
              </>
            )}
            {serviceType === "store_pickup" && (
              <>
                <div>
                  <Label>Nome da loja</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div>
                  <Label>Telefone da loja</Label>
                  <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
                </div>
              </>
            )}
            {serviceType === "commercial_transport" && (
              <>
                <div>
                  <Label>Empresa / cliente</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Frequência</Label>
                    <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Semanal" />
                  </div>
                  <div>
                    <Label>Janela de horário</Label>
                    <Input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} placeholder="08h–12h" />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
              <div>
                <Label>Volume (m³)</Label>
                <Input type="number" step="0.1" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)} />
              </div>
              <div>
                <Label>Volumes</Label>
                <Input type="number" min={1} value={packageCount} onChange={(e) => setPackageCount(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Fragilidade</Label>
              <Select value={fragility} onValueChange={(v) => setFragility(v as UtilityFragility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fragile">Frágil</SelectItem>
                  <SelectItem value="very_fragile">Muito frágil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Foto da carga (opcional)</Label>
              <Input type="file" accept="image/*" onChange={handlePhoto} className="text-xs" />
              {photoPreview ? (
                <img src={photoPreview} alt="Carga" className="mt-2 h-24 rounded-lg object-cover border border-border" />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Apoio operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "helper", label: "Precisa de ajudante?", checked: needsHelper, set: setNeedsHelper },
              { id: "dis", label: "Desmontagem?", checked: needsDisassembly, set: setNeedsDisassembly },
              { id: "asm", label: "Montagem?", checked: needsAssembly, set: setNeedsAssembly },
              { id: "stairs", label: "Tem escada?", checked: hasStairs, set: setHasStairs },
              { id: "elev", label: "Tem elevador?", checked: hasElevator, set: setHasElevator },
              { id: "urgent", label: "Urgente?", checked: isUrgent, set: setIsUrgent },
              { id: "sched", label: "Agendado?", checked: isScheduled, set: setIsScheduled },
            ].map((row) => (
              <div key={row.id} className="flex items-center justify-between">
                <Label>{row.label}</Label>
                <Switch checked={row.checked} onCheckedChange={row.set} />
              </div>
            ))}
            {needsHelper ? (
              <div>
                <Label>Ajudantes</Label>
                <Input type="number" min={1} max={4} value={helperCount} onChange={(e) => setHelperCount(e.target.value)} />
              </div>
            ) : null}
            {isScheduled ? (
              <div>
                <Label>Data/hora agendada</Label>
                <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
              </div>
            ) : null}
            <div>
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sugestão automática</Label>
              <Switch checked={vehicleAuto} onCheckedChange={setVehicleAuto} />
            </div>
            <Select
              value={vehicleType}
              onValueChange={(v) => {
                setVehicleAuto(false);
                setVehicleType(v as UtilityVehicleType);
              }}
              disabled={vehicleAuto}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UTILITY_VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>{UTILITY_VEHICLE_LABELS[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as UtilityPaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {quote ? (
          <Card className="border-primary/25 bg-primary/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">Cotação estimada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distância</span>
                <span>{(quote.distanceMeters / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração</span>
                <span>{Math.round(quote.durationSeconds / 60)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa base</span>
                <span>R$ {(quote.baseFeeCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distância + veículo + extras</span>
                <span>
                  R${" "}
                  {(
                    (quote.distanceCents +
                      quote.vehicleCents +
                      quote.helpersCents +
                      quote.urgencyCents +
                      quote.fragilityCents +
                      quote.stairsCents +
                      quote.disassemblyCents +
                      quote.assemblyCents +
                      quote.schedulingCents +
                      quote.weightCents) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total estimado</span>
                <span className="text-primary">R$ {(quote.totalCents / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ) : quoteLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sticky bottom-4">
          <Button
            className={cn("w-full bg-primary hover:bg-primary/90")}
            onClick={() => submit(false)}
            disabled={createMutation.isPending || !quote}
          >
            Solicitar utilitário
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => submit(true)}
            disabled={createMutation.isPending || !quote || !isScheduled}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar
          </Button>
        </div>
      </div>
    </div>
  );
}
