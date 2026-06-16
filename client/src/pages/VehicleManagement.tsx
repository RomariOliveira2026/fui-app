import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Car, Bike, Truck, Package } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";

const vehicleIcons = {
  moto: Bike,
  carro: Car,
  van: Truck,
  utilitario: Package,
};

export default function VehicleManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [vehicleType, setVehicleType] = useState<"moto" | "carro" | "van" | "utilitario">("carro");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const utils = trpc.useUtils();

  const { data: driverProfile, isLoading: profileLoading } = trpc.driver.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: vehicles, isLoading: vehiclesLoading } = trpc.vehicle.list.useQuery(undefined, {
    enabled: !!driverProfile,
  });

  const createVehicle = trpc.vehicle.create.useMutation({
    onSuccess: () => {
      toast.success("Veículo cadastrado com sucesso!");
      utils.vehicle.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar veículo");
    },
  });

  const resetForm = () => {
    setVehicleType("carro");
    setBrand("");
    setModel("");
    setYear("");
    setPlate("");
    setColor("");
    setPhotoUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plate) {
      toast.error("A placa é obrigatória");
      return;
    }

    createVehicle.mutate({
      type: vehicleType,
      brand: brand || undefined,
      model: model || undefined,
      year: year ? parseInt(year) : undefined,
      plate,
      color: color || undefined,
      photoUrl: photoUrl || undefined,
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Perfil de Motorista Necessário</CardTitle>
            <CardDescription>
              Você precisa criar um perfil de motorista antes de cadastrar veículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/driver/register")} className="w-full">
              Criar Perfil de Motorista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Gerenciar Veículos" />
      <div className="p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Veículos</h1>
            <p className="text-muted-foreground">Gerencie seus veículos cadastrados</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
                <DialogDescription>
                  Adicione um veículo para começar a aceitar corridas
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Veículo *</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="utilitario">Utilitário de Frete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate">Placa *</Label>
                  <Input
                    id="plate"
                    placeholder="ABC-1234"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      placeholder="Ex: Toyota"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      placeholder="Ex: Corolla"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2020"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      placeholder="Ex: Prata"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foto do Veículo (URL)</Label>
                  <Input
                    id="photo"
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createVehicle.isPending}
                >
                  {createVehicle.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Veículo"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {vehiclesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const Icon = vehicleIcons[vehicle.type];
              return (
                <Card key={vehicle.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {vehicle.brand} {vehicle.model}
                        </CardTitle>
                        <CardDescription className="uppercase">
                          {vehicle.plate}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Tipo:</span> {vehicle.type}</p>
                      {vehicle.year && <p><span className="font-medium">Ano:</span> {vehicle.year}</p>}
                      {vehicle.color && <p><span className="font-medium">Cor:</span> {vehicle.color}</p>}
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        <span className={`capitalize ${
                          vehicle.status === "active" ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          {vehicle.status === "active" ? "Ativo" : vehicle.status}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre seu primeiro veículo para começar a aceitar corridas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
