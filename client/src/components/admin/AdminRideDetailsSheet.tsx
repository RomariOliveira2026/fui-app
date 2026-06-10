import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RideStatusBadge } from "@/components/fui/StatusBadge";
import type { AdminOperationalRide } from "@shared/adminOperational";
import {
  canAdminCancelRide,
  canAdminRedispatchRide,
  formatAdminDate,
  formatAdminPrice,
} from "@/lib/adminOperationalUi";
import { useLocation } from "wouter";
import { Loader2, MapPin, RefreshCw, XCircle } from "lucide-react";

type AdminRideDetailsSheetProps = {
  ride: AdminOperationalRide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (ride: AdminOperationalRide) => void;
  onRedispatch?: (ride: AdminOperationalRide) => void;
  isCancelPending?: boolean;
  isRedispatchPending?: boolean;
};

export default function AdminRideDetailsSheet({
  ride,
  open,
  onOpenChange,
  onCancel,
  onRedispatch,
  isCancelPending = false,
  isRedispatchPending = false,
}: AdminRideDetailsSheetProps) {
  const [, setLocation] = useLocation();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRedispatch, setConfirmRedispatch] = useState(false);

  if (!ride) return null;

  const showCancel = canAdminCancelRide(ride.status) && Boolean(onCancel);
  const showRedispatch = canAdminRedispatchRide(ride.status, ride.driverId) && Boolean(onRedispatch);
  const actionPending = isCancelPending || isRedispatchPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md bg-card border-border">
          <SheetHeader>
            <SheetTitle>Corrida #{ride.id}</SheetTitle>
            <SheetDescription>Detalhes operacionais · rota no mapa</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <RideStatusBadge status={ride.status} />
              <span className="text-sm capitalize text-muted-foreground">{ride.vehicleType}</span>
            </div>

            <DetailRow
              icon={<MapPin className="h-4 w-4 text-emerald-400" />}
              label="Origem"
              value={ride.originAddress}
            />
            <DetailRow
              icon={<MapPin className="h-4 w-4 text-rose-400" />}
              label="Destino"
              value={ride.destinationAddress}
            />
            <DetailRow label="Valor" value={formatAdminPrice(ride.finalPrice ?? ride.estimatedPrice)} />
            <DetailRow label="Passageiro" value={ride.passengerName ?? "—"} />
            <DetailRow label="Motorista" value={ride.driverName ?? "Aguardando aceite"} />
            <DetailRow label="Região" value={ride.areaLabel} />
            <DetailRow label="Solicitada" value={formatAdminDate(ride.createdAt)} />
            {ride.completedAt ? (
              <DetailRow label="Concluída" value={formatAdminDate(ride.completedAt)} />
            ) : null}

            {(showCancel || showRedispatch) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                {showRedispatch ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={actionPending}
                    onClick={() => setConfirmRedispatch(true)}
                  >
                    {isRedispatchPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reenfileirar corrida
                  </Button>
                ) : null}
                {showCancel ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={actionPending}
                    onClick={() => setConfirmCancel(true)}
                  >
                    {isCancelPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Cancelar corrida
                  </Button>
                ) : null}
              </div>
            )}

            <Button className="w-full" variant="secondary" onClick={() => setLocation(`/ride/${ride.id}`)}>
              Abrir corrida
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar corrida #{ride.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              A corrida será encerrada e removida da fila operacional. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onCancel?.(ride);
                setConfirmCancel(false);
              }}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRedispatch} onOpenChange={setConfirmRedispatch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reenfileirar corrida #{ride.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ofertas pendentes serão expiradas e novos motoristas próximos receberão a corrida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedispatchPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRedispatchPending}
              onClick={() => {
                onRedispatch?.(ride);
                setConfirmRedispatch(false);
              }}
            >
              Reenfileirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm flex items-start gap-2">
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}
