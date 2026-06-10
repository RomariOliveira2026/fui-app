import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLocalDemoDev } from "@/lib/demoMode";
import {
  persistUtilityProviderDemoSnapshot,
  useDemoUtilityProviderHydration,
} from "@/lib/useDemoUtilityProviderHydration";
import { useDemoUtilityChatHydration } from "@/lib/useDemoUtilityChatHydration";
import { persistDemoUtilityFromServer } from "@/lib/useDemoUtilitiesHydration";
import UtilityProviderEarningsCards from "./UtilityProviderEarningsCards";
import UtilityProviderStatementList from "./UtilityProviderStatementList";
import UtilityProviderProfileForm from "./UtilityProviderProfileForm";
import UtilityProviderOrderCard from "./UtilityProviderOrderCard";
import UtilityProviderOrderSheet from "./UtilityProviderOrderSheet";
import type { UtilityOrder } from "@shared/utilities";
import { Truck, Inbox, Loader2 } from "lucide-react";

type UtilityProviderPanelProps = {
  driverProfileId: number;
};

export default function UtilityProviderPanel({ driverProfileId }: UtilityProviderPanelProps) {
  useDemoUtilityProviderHydration(!!driverProfileId);
  useDemoUtilityChatHydration(!!driverProfileId);
  const utils = trpc.useUtils();

  const [selectedOrder, setSelectedOrder] = useState<UtilityOrder | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = trpc.utilityProvider.getProfile.useQuery();
  const { data: available, isLoading: availableLoading, refetch: refetchAvailable } =
    trpc.utilityProvider.getAvailableOrders.useQuery(undefined, {
      refetchInterval: 12_000,
    });
  const { data: active, isLoading: activeLoading, refetch: refetchActive } =
    trpc.utilityProvider.getActiveOrders.useQuery(undefined, {
      refetchInterval: 10_000,
    });
  const { data: earnings, isLoading: earningsLoading } =
    trpc.utilityProvider.getEarningsSummary.useQuery(undefined, {
      refetchInterval: 30_000,
    });
  const { data: statement, isLoading: statementLoading } =
    trpc.utilityProvider.getStatement.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  const persistSnapshot = useCallback(
    (snapshot?: { orders?: unknown[]; profiles?: unknown[] }) => {
      if (!isLocalDemoDev() || !snapshot) return;
      persistUtilityProviderDemoSnapshot(snapshot);
    },
    []
  );

  const updateProfile = trpc.utilityProvider.updateProfile.useMutation({
    onSuccess: (data) => {
      persistSnapshot(data.demoSnapshot);
      void utils.utilityProvider.getProfile.invalidate();
      void utils.utilityProvider.getAvailableOrders.invalidate();
      toast.success("Perfil atualizado");
    },
    onError: (e) => toast.error(e.message),
  });

  const acceptOrder = trpc.utilityProvider.acceptOrder.useMutation({
    onSuccess: (data) => {
      persistSnapshot(data.demoSnapshot);
      toast.success("Pedido aceito!");
      void refetchAvailable();
      void refetchActive();
      void utils.utilityProvider.getEarningsSummary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const declineOrder = trpc.utilityProvider.declineOrder.useMutation({
    onSuccess: (data) => {
      persistSnapshot(data.demoSnapshot);
      toast.info("Pedido recusado");
      void refetchAvailable();
    },
  });

  const advanceStatus = trpc.utilityProvider.advanceOrderStatus.useMutation({
    onSuccess: (data) => {
      persistSnapshot(data.demoSnapshot);
      toast.success("Status atualizado");
      setSelectedOrder(data.order);
      void refetchActive();
      void utils.utilityProvider.getEarningsSummary.invalidate();
      void utils.utilityProvider.getStatement.invalidate();
      if (isLocalDemoDev()) {
        persistDemoUtilityFromServer(data.order);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: liveOrder } = trpc.utilityProvider.getOrderById.useQuery(
    { id: selectedOrder?.id ?? 0 },
    {
      enabled: sheetOpen && !!selectedOrder?.id,
      refetchInterval: 3000,
    }
  );

  const sheetOrder = liveOrder ?? selectedOrder;

  const openOrder = (order: UtilityOrder) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Fui Utilitários · Prestador</h2>
            <p className="text-xs text-muted-foreground">
              Fretes, mudanças e cargas urbanas
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="earnings">Ganhos</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 mt-0">
          {active && active.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Em andamento</h3>
              {active.map((order) => (
                <UtilityProviderOrderCard
                  key={order.id}
                  order={order}
                  mode="active"
                  onOpen={() => openOrder(order)}
                />
              ))}
            </div>
          ) : activeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Disponíveis</h3>
            {availableLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : available && available.length > 0 ? (
              available.map((order) => (
                <UtilityProviderOrderCard
                  key={order.id}
                  order={order}
                  mode="available"
                  onOpen={() => openOrder(order)}
                  onAccept={() => acceptOrder.mutate({ orderId: order.id })}
                  onDecline={() => declineOrder.mutate({ orderId: order.id })}
                  acceptPending={acceptOrder.isPending}
                />
              ))
            ) : (
              <div className="text-center py-12 rounded-xl border border-dashed border-border/70 bg-muted/10">
                <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido disponível no momento.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ative seu perfil e aguarde novas solicitações de passageiros.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          <UtilityProviderProfileForm
            profile={profile}
            isUpdating={updateProfile.isPending}
            onChange={(patch) => updateProfile.mutate(patch)}
          />
        </TabsContent>

        <TabsContent value="earnings" className="mt-0">
          <UtilityProviderEarningsCards summary={earnings} isLoading={earningsLoading} />
          <UtilityProviderStatementList items={statement} isLoading={statementLoading} />
        </TabsContent>
      </Tabs>

      <UtilityProviderOrderSheet
        order={sheetOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canAdvance={!!sheetOrder?.driverId}
        onAdvance={() =>
          sheetOrder && advanceStatus.mutate({ orderId: sheetOrder.id })
        }
        advancePending={advanceStatus.isPending}
      />
    </div>
  );
}
