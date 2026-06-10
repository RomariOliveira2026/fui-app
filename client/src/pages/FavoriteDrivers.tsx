import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import {
  Heart,
  HeartOff,
  Star,
  Car,
  Bike,
  Pencil,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function FavoriteDrivers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [editingDriver, setEditingDriver] = useState<number | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editNote, setEditNote] = useState("");

  const { data: favorites, isLoading, refetch } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: !!user }
  );

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

  const handleEdit = (driver: any) => {
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
    if (vehicleType === "moto") return <Bike className="h-4 w-4" />;
    return <Car className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Motoristas Favoritos" />

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          favorites.map((fav) => (
            <Card
              key={fav.id}
              className="overflow-hidden hover:border-orange-500/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg shrink-0">
                    {(fav.nickname || fav.user?.name || "M").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {fav.nickname || fav.user?.name || "Motorista"}
                      </h3>
                      <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
                    </div>

                    {fav.nickname && fav.user?.name && (
                      <p className="text-xs text-muted-foreground">
                        Nome real: {fav.user.name}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {fav.driver?.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {Number(fav.driver.rating).toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fav.ridesCompleted} corrida{fav.ridesCompleted !== 1 ? "s" : ""}
                      </span>
                      {fav.vehicles && fav.vehicles.length > 0 && (
                        <span className="flex items-center gap-1">
                          {getVehicleIcon(fav.vehicles[0]?.type)}
                          {fav.vehicles[0]?.model}
                        </span>
                      )}
                    </div>

                    {fav.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        "{fav.note}"
                      </p>
                    )}

                    {fav.lastRideAt && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última corrida: {new Date(fav.lastRideAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(fav)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() =>
                        handleRemove(fav.driverId, fav.nickname || fav.user?.name || "Motorista")
                      }
                    >
                      <HeartOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Request ride with this driver */}
                <Button
                  variant="outline"
                  className="w-full mt-3 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                  onClick={() => {
                    toast.info("A funcionalidade de solicitar corrida com motorista favorito será implementada em breve.");
                  }}
                >
                  Solicitar corrida com {fav.nickname || fav.user?.name?.split(" ")[0] || "este motorista"}
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum motorista favorito</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Após uma corrida, você pode adicionar o motorista aos favoritos para
              solicitar corridas diretamente com ele no futuro.
            </p>
            <Button
              className="mt-6 bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate("/")}
            >
              Solicitar uma corrida
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingDriver !== null} onOpenChange={() => setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar motorista favorito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Apelido (opcional)
              </label>
              <Input
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="Ex: João da moto preta"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Um nome personalizado para identificar o motorista
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Observação (opcional)
              </label>
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
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
