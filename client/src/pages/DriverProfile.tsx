import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Car, Star, MapPin, ArrowLeft } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import AppHeader from "@/components/AppHeader";

export default function DriverProfile() {
  const [, params] = useRoute("/driver/:id");
  const [, setLocation] = useLocation();
  const driverId = params?.id ? parseInt(params.id) : 0;

  const { data: driver, isLoading } = trpc.driver.getProfile.useQuery(
    { driverId },
    { enabled: !!driverId }
  );

  const { data: ratings } = trpc.rating.getByUser.useQuery(
    { userId: driver?.userId || 0 },
    { enabled: !!driver?.userId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader title="Motorista" />
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Motorista não encontrado</p>
              <Button onClick={() => setLocation("/")} className="mt-4">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const avgRating = driver.rating ? driver.rating / 100 : 0;
  const totalRatings = ratings?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Perfil do Motorista" />
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Driver Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Motorista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {driver.user?.avatarUrl ? (
                  <img
                    src={driver.user.avatarUrl}
                    alt={driver.user.name || "Motorista"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {driver.user?.name || "Motorista"}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <RatingStars rating={avgRating} size="md" />
                  <span className="text-sm text-muted-foreground">
                    ({totalRatings} {totalRatings === 1 ? "avaliação" : "avaliações"})
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{driver.totalRides || 0} corridas</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    driver.isAvailable
                      ? "bg-green-900/30 text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {driver.isAvailable ? "Disponível" : "Indisponível"}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            {driver.vehicles && driver.vehicles.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Veículos
                </h3>
                <div className="space-y-3">
                  {driver.vehicles.map((vehicle: any) => (
                    <div
                      key={vehicle.id}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.color} • {vehicle.year}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {vehicle.plate}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                          {vehicle.type === "moto" ? "Moto" : vehicle.type === "carro" ? "Carro" : "Van"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ratings Card */}
        {ratings && ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratings.map((rating: any) => (
                <div key={rating.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <RatingStars rating={rating.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground">{rating.comment}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
