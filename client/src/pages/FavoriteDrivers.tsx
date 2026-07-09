import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { fuiBrand } from "@/lib/fuiTheme";
import {
  Heart,
  HeartOff,
  Star,
  Car,
  Bike,
  Pencil,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";

export default function FavoriteDrivers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [editingDriver, setEditingDriver] = useState<number | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editNote, setEditNote] = useState("");

  const { data: favorites, isLoading, refetch } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
    throwOnError: false,
    retry: 1,
  });

  const removeMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Motorista removido dos seus favoritos");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.favorites.update.useMutation({
    onSuccess: () => {
      toast.success("Informações do motorista atualizadas!");
      setEditingDriver(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const favoriteStats = useMemo(() => {
    const list = favorites ?? [];
    const totalRides = list.reduce((sum, fav) => sum + (fav.ridesCompleted ?? 0), 0);
    const withNickname = list.filter((fav) => fav.nickname).length;
    const avgRating =
      list.length > 0
        ? list.reduce((sum, fav) => sum + Number(fav.driver?.rating ?? 0), 0) / list.length
        : 0;
    return {
      total: list.length,
      totalRides,
      withNickname,
      avgRating,
    };
  }, [favorites]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleEdit = (driver: NonNullable<typeof favorites>[number]) => {
    setEditingDriver(driver.driverId);
    setEditNickname(driver.nickname || "");
    setEditNote(driver.note || "");
  };

  const handleSaveEdit = () => {
    if (editingDriver === null) return;
    updateMutation.mutate({
      driverId: editingDriver,
      nickname: editNickname || undefined,
      note: editNote || undefined,
    });
  };

  const handleRemove = (driverId: number, driverName: string) => {
    if (confirm(`Remover ${driverName} dos favoritos?`)) {
      removeMutation.mutate({ driverId });
    }
  };

  const getVehicleIcon = (vehicleType?: string) => {
    if (vehicleType === "moto") return <Bike className="h-3.5 w-3.5" />;
    return <Car className="h-3.5 w-3.5" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Motoristas Favoritos" />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Motoristas Favoritos</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Salve motoristas de confiança e solicite corridas diretamente com eles
            </p>
          </div>
          <Button className={fuiBrand.btn} onClick={() => navigate("/")}>
            Solicitar corrida
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {favoriteStats.total > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <FuiMetricCard label="Favoritos" value={String(favoriteStats.total)} icon={Heart} highlight />
            <FuiMetricCard label="Corridas juntos" value={String(favoriteStats.totalRides)} icon={MapPin} />
            <FuiMetricCard
              label="Avaliação média"
              value={favoriteStats.avgRating > 0 ? favoriteStats.avgRating.toFixed(1) : "—"}
              icon={Star}
            />
            <FuiMetricCard label="Com apelido" value={String(favoriteStats.withNickname)} icon={Users} />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-primary/20" />
                Como funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Após uma corrida, você pode adicionar o motorista aos favoritos. Assim, fica mais fácil
                solicitar novas viagens com quem você já conhece e confia.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>1.</span>
                  Conclua uma corrida e toque em favoritar o motorista
                </li>
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>2.</span>
                  Defina um apelido e observações para lembrar depois
                </li>
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>3.</span>
                  Solicite corridas diretamente com seus favoritos
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {favorites && favorites.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {favorites.map((fav) => {
                  const displayName = fav.nickname || fav.user?.name || "Motorista";
                  const firstName = displayName.split(" ")[0];

                  return (
                    <Card
                      key={fav.id}
                      className="border-border bg-card hover:border-primary/30 transition-colors overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-5 pt-5 pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 ring-2 ring-primary/20">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-semibold truncate">{displayName}</h3>
                                  <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 shrink-0" />
                                </div>
                                {fav.nickname && fav.user?.name ? (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {fav.user.name}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(fav)}
                                aria-label="Editar motorista"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:bg-red-900/20"
                                onClick={() => handleRemove(fav.driverId, displayName)}
                                aria-label="Remover dos favoritos"
                              >
                                <HeartOff className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 pb-5 space-y-3">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {fav.driver?.rating ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                                <Star className="h-3 w-3 fill-yellow-500" />
                                {Number(fav.driver.rating).toFixed(1)}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {fav.ridesCompleted} corrida{fav.ridesCompleted !== 1 ? "s" : ""}
                            </span>
                            {fav.vehicles && fav.vehicles.length > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                {getVehicleIcon(fav.vehicles[0]?.type)}
                                {fav.vehicles[0]?.model}
                              </span>
                            ) : null}
                          </div>

                          {fav.note ? (
                            <p className="text-xs text-muted-foreground italic line-clamp-2 border-l-2 border-primary/30 pl-2">
                              "{fav.note}"
                            </p>
                          ) : null}

                          {fav.lastRideAt ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Última corrida: {new Date(fav.lastRideAt).toLocaleDateString("pt-BR")}
                            </p>
                          ) : null}

                          <Button
                            variant="outline"
                            className={`w-full ${fuiBrand.btnOutline}`}
                            onClick={() => {
                              toast.info(
                                "A funcionalidade de solicitar corrida com motorista favorito será implementada em breve."
                              );
                            }}
                          >
                            Corrida com {firstName}
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border bg-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-[1fr_1.2fr] lg:items-center">
                    <div className="flex flex-col items-center justify-center px-6 py-12 lg:py-16 lg:border-r border-border">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Heart className="w-10 h-10 text-primary/50" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                        Nenhum motorista favorito
                      </h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        Após uma corrida, você pode adicionar o motorista aos favoritos para solicitar
                        viagens diretamente com ele no futuro.
                      </p>
                    </div>
                    <div className="px-6 py-10 lg:py-16 space-y-4 bg-muted/20">
                      <p className="text-sm font-medium text-foreground">Por que favoritar?</p>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>1.</span>
                          Priorize motoristas que você já conhece
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>2.</span>
                          Salve apelidos e observações personalizadas
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>3.</span>
                          Agilize pedidos recorrentes com quem você confia
                        </li>
                      </ul>
                      <Button className={`${fuiBrand.btn} w-full sm:w-auto`} onClick={() => navigate("/")}>
                        Solicitar uma corrida
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editingDriver !== null} onOpenChange={() => setEditingDriver(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar motorista favorito</DialogTitle>
            <DialogDescription>Personalize como você identifica este motorista</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Apelido (opcional)</label>
              <Input
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="Ex: João da moto preta"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Um nome personalizado para identificar o motorista
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação (opcional)</label>
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ex: Sempre pontual, carro limpo"
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDriver(null)}>
              Cancelar
            </Button>
            <Button className={fuiBrand.btn} onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
