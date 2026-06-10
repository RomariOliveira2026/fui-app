import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, UserCheck, UserX, MapPin, DollarSign, Car, TrendingUp, Users, Tag, Bell, BarChart3, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import { ADMIN_NAV_ROUTES } from "@/lib/adminNav";

/** Gestão administrativa legada — aprovações, preços e cupons. */
export default function AdminManage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  if (!authLoading && !canAccessAdminPanel(user)) {
    setLocation("/");
    return null;
  }

  const { data: pendingDrivers, isLoading: loadingDrivers } = trpc.admin.getPendingDrivers.useQuery(
    undefined,
    { enabled: canAccessAdminPanel(user) }
  );
  const { data: allRides } = trpc.admin.getAllRides.useQuery(undefined, {
    enabled: canAccessAdminPanel(user),
  });
  const { data: pricing } = trpc.pricing.getAll.useQuery(undefined, {
    enabled: canAccessAdminPanel(user),
  });

  const approveDriver = trpc.admin.approveDriver.useMutation({
    onSuccess: () => {
      toast.success("Motorista aprovado!");
      utils.admin.getPendingDrivers.invalidate();
    },
    onError: (error) => toast.error(error.message || "Erro ao aprovar motorista"),
  });

  const rejectDriver = trpc.admin.rejectDriver.useMutation({
    onSuccess: () => {
      toast.success("Motorista rejeitado");
      utils.admin.getPendingDrivers.invalidate();
    },
    onError: (error) => toast.error(error.message || "Erro ao rejeitar motorista"),
  });

  if (authLoading || loadingDrivers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeRides = allRides?.filter(
    (r) => r.status === "in_progress" || r.status === "accepted" || r.status === "requested"
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Gestão Administrativa" />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão Administrativa</h1>
            <p className="text-muted-foreground">Aprovações, preços e configurações</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Central Operacional
            </Button>
            <Button variant="outline" onClick={() => setLocation(ADMIN_NAV_ROUTES.finance)}>
              <DollarSign className="h-4 w-4 mr-1.5" />
              Financeiro
            </Button>
            <Button variant="outline" onClick={() => setLocation(ADMIN_NAV_ROUTES.notifications)}>
              <Bell className="h-4 w-4 mr-1.5" />
              Notificações
            </Button>
            <Button variant="outline" onClick={() => setLocation(ADMIN_NAV_ROUTES.analytics)}>
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => setLocation(ADMIN_NAV_ROUTES.coupons)}>
              <Tag className="h-4 w-4 mr-1.5" />
              Cupons
            </Button>
          </div>
        </div>

        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="drivers">Motoristas Pendentes</TabsTrigger>
            <TabsTrigger value="rides">Corridas Ativas</TabsTrigger>
            <TabsTrigger value="pricing">Gerenciar Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle>Motoristas Aguardando Aprovação</CardTitle>
                <CardDescription>Revise solicitações de motoristas</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDrivers && pendingDrivers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDrivers.map((item) => (
                        <TableRow key={item.profile.id}>
                          <TableCell>{item.user.name || "—"}</TableCell>
                          <TableCell>{item.user.email || "—"}</TableCell>
                          <TableCell>{item.profile.cpf || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveDriver.mutate({ driverId: item.profile.id })}
                                disabled={approveDriver.isPending}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectDriver.mutate({ driverId: item.profile.id })}
                                disabled={rejectDriver.isPending}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum motorista pendente (demo local usa perfis pré-aprovados)
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>Corridas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                {activeRides && activeRides.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeRides.map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell>#{ride.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ride.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{ride.originAddress}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ride.destinationAddress}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Use a Central Operacional para monitorar corridas demo
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricing?.map((config) => (
                <Card key={config.vehicleType}>
                  <CardHeader>
                    <CardTitle className="capitalize">{config.vehicleType}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Base: R$ {(config.basePrice / 100).toFixed(2)}</p>
                    <p>Por km: R$ {(config.pricePerKm / 100).toFixed(2)}</p>
                    <Button variant="outline" className="w-full mt-2" disabled>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Edição em breve
                    </Button>
                  </CardContent>
                </Card>
              )) ?? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Preços demo carregados via fallback local
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" /> Corridas
              </CardTitle>
            </CardHeader>
            <CardContent>{allRides?.length ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>{activeRides?.length ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>{pendingDrivers?.length ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> GMV
              </CardTitle>
            </CardHeader>
            <CardContent>
              R${" "}
              {(
                (allRides?.filter((r) => r.status === "completed").reduce(
                  (s, r) => s + (r.finalPrice || 0),
                  0
                ) ?? 0) / 100
              ).toFixed(2)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
