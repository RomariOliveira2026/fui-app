import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, DollarSign, Users, Car, MapPin, Tag, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#E4002B", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user is admin
  if (!authLoading && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data for demonstration - in real app, this would come from the API
  const revenueData = [
    { name: "Seg", value: 1200 },
    { name: "Ter", value: 1900 },
    { name: "Qua", value: 1500 },
    { name: "Qui", value: 2100 },
    { name: "Sex", value: 2800 },
    { name: "Sáb", value: 3200 },
    { name: "Dom", value: 2400 },
  ];

  const ridesByVehicle = [
    { name: "Moto", value: stats?.totalRides ? Math.round(stats.totalRides * 0.4) : 40 },
    { name: "Carro", value: stats?.totalRides ? Math.round(stats.totalRides * 0.45) : 45 },
    { name: "Van", value: stats?.totalRides ? Math.round(stats.totalRides * 0.15) : 15 },
  ];

  const ridesByHour = [
    { hour: "6h", rides: 5 },
    { hour: "8h", rides: 25 },
    { hour: "10h", rides: 15 },
    { hour: "12h", rides: 30 },
    { hour: "14h", rides: 20 },
    { hour: "16h", rides: 18 },
    { hour: "18h", rides: 40 },
    { hour: "20h", rides: 35 },
    { hour: "22h", rides: 12 },
  ];

  const topDrivers = [
    { id: 1, name: "Motorista #1", rides: 45, rating: 4.9, revenue: 2500 },
    { id: 2, name: "Motorista #2", rides: 38, rating: 4.8, revenue: 2100 },
    { id: 3, name: "Motorista #3", rides: 32, rating: 4.7, revenue: 1800 },
    { id: 4, name: "Motorista #4", rides: 28, rating: 4.6, revenue: 1500 },
    { id: 5, name: "Motorista #5", rides: 25, rating: 4.5, revenue: 1400 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Analytics & Relatórios" />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics & Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada da plataforma</p>
          </div>
          <Button variant="outline" className="bg-card text-card-foreground border-border" onClick={() => setLocation("/admin")}>
            Voltar ao Painel
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats?.totalRevenue ? (stats.totalRevenue / 100).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                +20% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Corridas</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRides || 0}</div>
              <p className="text-xs text-muted-foreground">
                +15% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motoristas Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDrivers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingDrivers || 0} aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ 
                {stats?.totalRides && stats?.totalRevenue
                  ? ((stats.totalRevenue / stats.totalRides) / 100).toFixed(2)
                  : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Por corrida
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Receita</TabsTrigger>
            <TabsTrigger value="rides">Corridas</TabsTrigger>
            <TabsTrigger value="drivers">Motoristas</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Dia (Última Semana)</CardTitle>
                <CardDescription>Evolução da receita diária em R$</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Receita" stroke="#E4002B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Tipo de Veículo</CardTitle>
                  <CardDescription>Distribuição da receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={ridesByVehicle}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ridesByVehicle.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                  <CardDescription>Métricas financeiras principais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita Bruta</span>
                    <span className="font-bold">
                      R$ {stats?.totalRevenue ? (stats.totalRevenue / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão Plataforma (20%)</span>
                    <span className="font-bold text-green-600">
                      R$ {stats?.totalRevenue ? ((stats.totalRevenue * 0.2) / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Repasse Motoristas (80%)</span>
                    <span className="font-bold">
                      R$ {stats?.totalRevenue ? ((stats.totalRevenue * 0.8) / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <span className="text-muted-foreground">Descontos (Cupons)</span>
                    <span className="font-bold text-red-600">-R$ 0.00</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rides Tab */}
          <TabsContent value="rides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Corridas por Horário</CardTitle>
                <CardDescription>Horários de pico da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ridesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rides" name="Corridas" fill="#E4002B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Corridas Concluídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.completedRides || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats?.totalRides
                      ? ((stats.completedRides / stats.totalRides) * 100).toFixed(1)
                      : 0}
                    % do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Corridas Canceladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {stats?.cancelledRides || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats?.totalRides
                      ? ((stats.cancelledRides / stats.totalRides) * 100).toFixed(1)
                      : 0}
                    % do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Corridas Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.activeRides || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Em andamento agora</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Motoristas</CardTitle>
                <CardDescription>Motoristas com melhor desempenho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDrivers.map((driver, index) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 bg-card rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {driver.rides} corridas • ⭐ {driver.rating}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">R$ {driver.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Receita gerada</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Cupons</CardTitle>
                <CardDescription>Desempenho das campanhas promocionais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Cupons Ativos</span>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                  </div>

                  <div className="p-4 bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Total de Usos</span>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                  </div>

                  <div className="p-4 bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Desconto Total</span>
                    </div>
                    <p className="text-3xl font-bold">R$ 0,00</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-muted-foreground text-center">
                    Crie cupons promocionais para atrair e reter clientes
                  </p>
                  <Button onClick={() => setLocation("/admin/finance?tab=coupons")} className="w-full mt-4">
                    Gerenciar Cupons
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
