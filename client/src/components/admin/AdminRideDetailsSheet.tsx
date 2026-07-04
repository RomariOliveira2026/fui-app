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
import type { AdminOperationalDriver, AdminOperationalRide } from "@shared/adminOperational";
import {
  canAdminAssignRide,
  canAdminCancelRide,
  canAdminRedispatchRide,
  formatAdminDate,
  formatAdminDuration,
  formatAdminPrice,
} from "@/lib/adminOperationalUi";
import AdminRideTimeline from "@/components/admin/AdminRideTimeline";
import { useLocation } from "wouter";
import { Loader2, MapPin, RefreshCw, UserPlus, XCircle } from "lucide-react";

type AdminRideDetailsSheetProps = {
  ride: AdminOperationalRide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (ride: AdminOperationalRide) => void;
  onRedispatch?: (ride: AdminOperationalRide) => void;
  onAssign?: (ride: AdminOperationalRide, driverId: number) => void;
  availableDrivers?: AdminOperationalDriver[];
  isCancelPending?: boolean;
  isRedispatchPending?: boolean;
  isAssignPending?: boolean;
};

export default function AdminRideDetailsSheet({
  ride,
  open,
  onOpenChange,
  onCancel,
  onRedispatch,
  onAssign,
  availableDrivers = [],
  isCancelPending = false,
  isRedispatchPending = false,
  isAssignPending = false,
}: AdminRideDetailsSheetProps) {
  const [, setLocation] = useLocation();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRedispatch, setConfirmRedispatch] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (!ride) return null;

  const showCancel = canAdminCancelRide(ride.status) && Boolean(onCancel);
  const showRedispatch = canAdminRedispatchRide(ride.status, ride.driverId) && Boolean(onRedispatch);
  const showAssign = canAdminAssignRide(ride.status, ride.driverId) && Boolean(onAssign);
  const actionPending = isCancelPending || isRedispatchPending || isAssignPending;
  const assignCandidates = availableDrivers.filter(
    (d) => d.operationalStatus === "available" && d.vehicleType === ride.vehicleType
  );

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
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {ride.categoryLabel}
              </span>
              {ride.status === "in_progress" && ride.etaSeconds != null ? (
                <span className="text-xs text-emerald-500">ETA {formatAdminDuration(ride.etaSeconds)}</span>
              ) : null}
            </div>

            {ride.priorityReason ? (
              <div
                className={
                  ride.priority === "sos"
                    ? "rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-500"
                    : "rounded-md border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm text-amber-600"
                }
              >
                {ride.priorityReason}
              </div>
            ) : null}

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

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3">Timeline operacional</p>
              <AdminRideTimeline ride={ride} />
            </div>

            {(showCancel || showRedispatch || showAssign) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                {showAssign ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={actionPending}
                      onClick={() => setAssignOpen((v) => !v)}
                    >
                      {isAssignPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Designar motorista
                    </Button>
                    {assignOpen ? (
                      assignCandidates.length > 0 ? (
                        <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border/60 p-1">
                          {assignCandidates.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              disabled={actionPending}
                              onClick={() => {
                                onAssign?.(ride, d.id);
                                setAssignOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                            >
                              <span className="truncate">{d.name}</span>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {d.vehiclePlate} · ★{d.rating.toFixed(1)}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-md border border-dashed border-border/60 px-2 py-2 text-center text-[11px] text-muted-foreground">
                          Nenhum motorista {ride.categoryLabel.toLowerCase()} disponível no momento
                        </p>
                      )
                    ) : null}
                  </div>
                ) : null}
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
