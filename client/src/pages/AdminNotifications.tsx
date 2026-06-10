import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { canAccessAdminPanel } from "@/lib/adminAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell, Send, Users, Megaphone, BarChart3,
  Car, CreditCard, Tag, AlertTriangle, User, Shield,
  Search, ChevronRight, Clock, CheckCircle2, Loader2, LayoutDashboard
} from "lucide-react";

const notificationIcons: Record<string, any> = {
  ride: Car,
  payment: CreditCard,
  promotion: Tag,
  system: AlertTriangle,
  driver: User,
  safety: Shield,
};

const segmentLabels: Record<string, string> = {
  all: "Todos os Usuários",
  passengers: "Apenas Passageiros",
  drivers: "Apenas Motoristas",
  active_last_30d: "Ativos nos Últimos 30 Dias",
};

const typeLabels: Record<string, string> = {
  promotion: "Promoção",
  system: "Sistema",
  ride: "Corrida",
  payment: "Pagamento",
  driver: "Motorista",
  safety: "Segurança",
};

export default function AdminNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const allowed = canAccessAdminPanel(user);
  const [activeTab, setActiveTab] = useState<"broadcast" | "individual" | "history" | "stats">("broadcast");

  useEffect(() => {
    if (!authLoading && !allowed) {
      setLocation("/");
    }
  }, [authLoading, allowed, setLocation]);

  // Broadcast form state
  const [broadcastType, setBroadcastType] = useState<string>("promotion");
  const [broadcastSegment, setBroadcastSegment] = useState<string>("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState("");
  const [broadcastActionLabel, setBroadcastActionLabel] = useState("");

  // Individual form state
  const [individualUserId, setIndividualUserId] = useState<number | null>(null);
  const [individualType, setIndividualType] = useState<string>("system");
  const [individualTitle, setIndividualTitle] = useState("");
  const [individualMessage, setIndividualMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<string>("all");

  // Queries
  const { data: stats } = trpc.notification.adminGetStats.useQuery(undefined, {
    enabled: allowed && (activeTab === "stats" || activeTab === "broadcast"),
  });

  const { data: broadcastHistory } = trpc.notification.adminGetBroadcastHistory.useQuery(
    { limit: 20 },
    { enabled: allowed && activeTab === "history" }
  );

  const searchInput = useMemo(() => userSearch, [userSearch]);
  const roleInput = useMemo(() => userRole as "all" | "passenger" | "driver" | "admin", [userRole]);

  const { data: usersList } = trpc.notification.adminListUsers.useQuery(
    { search: searchInput, role: roleInput, limit: 50 },
    { enabled: allowed && activeTab === "individual" }
  );

  // Mutations
  const utils = trpc.useUtils();

  const sendBroadcast = trpc.notification.adminSendBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Notificação enviada para ${data.sentCount} usuários!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastActionUrl("");
      setBroadcastActionLabel("");
      utils.notification.adminGetStats.invalidate();
      utils.notification.adminGetBroadcastHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const sendToUser = trpc.notification.adminSendToUser.useMutation({
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso!");
      setIndividualTitle("");
      setIndividualMessage("");
      setIndividualUserId(null);
      utils.notification.adminGetStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  if (authLoading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Preencha o título e a mensagem");
      return;
    }
    sendBroadcast.mutate({
      type: broadcastType as "promotion" | "system",
      segment: broadcastSegment as "all" | "passengers" | "drivers" | "active_last_30d",
      title: broadcastTitle,
      message: broadcastMessage,
      actionUrl: broadcastActionUrl || undefined,
      actionLabel: broadcastActionLabel || undefined,
    });
  };

  const handleSendToUser = () => {
    if (!individualUserId || !individualTitle.trim() || !individualMessage.trim()) {
      toast.error("Selecione um usuário e preencha o título e a mensagem");
      return;
    }
    sendToUser.mutate({
      userId: individualUserId,
      type: individualType as any,
      title: individualTitle,
      message: individualMessage,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Notificações · Admin" />

      <div className="container py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-sm text-muted-foreground">Envio em massa e mensagens individuais</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            <LayoutDashboard className="h-4 w-4 mr-1.5" />
            Central Operacional
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Enviadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.unread || 0}</p>
                  <p className="text-xs text-muted-foreground">Não Lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.today || 0}</p>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.byType?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Tipos Usados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "broadcast", label: "Envio em Massa", icon: Megaphone },
            { id: "individual", label: "Envio Individual", icon: User },
            { id: "history", label: "Histórico", icon: Clock },
            { id: "stats", label: "Estatísticas", icon: BarChart3 },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Broadcast Tab */}
        {activeTab === "broadcast" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Enviar Notificação em Massa
              </CardTitle>
              <CardDescription>
                Envie uma notificação para todos os usuários ou um segmento específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <Select value={broadcastType} onValueChange={setBroadcastType}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promoção</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Segmento</label>
                  <Select value={broadcastSegment} onValueChange={setBroadcastSegment}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Usuários</SelectItem>
                      <SelectItem value="passengers">Apenas Passageiros</SelectItem>
                      <SelectItem value="drivers">Apenas Motoristas</SelectItem>
                      <SelectItem value="active_last_30d">Ativos nos Últimos 30 Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Título *</label>
                <Input
                  placeholder="Ex: Promoção de Fim de Semana!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="bg-background border-border text-foreground"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mensagem *</label>
                <Textarea
                  placeholder="Ex: Use o cupom FUI50 e ganhe 50% de desconto na próxima corrida!"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="bg-background border-border text-foreground min-h-[100px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{broadcastMessage.length}/1000</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">URL de Ação (opcional)</label>
                  <Input
                    placeholder="Ex: /request-ride"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Texto do Botão (opcional)</label>
                  <Input
                    placeholder="Ex: Solicitar Corrida"
                    value={broadcastActionLabel}
                    onChange={(e) => setBroadcastActionLabel(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Preview */}
              {broadcastTitle && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="flex gap-3">
                    <Tag className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{broadcastTitle}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{broadcastMessage}</p>
                      {broadcastActionLabel && (
                        <Button variant="ghost" size="sm" className="text-primary mt-2 h-7 text-xs">
                          {broadcastActionLabel} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendBroadcast}
                disabled={sendBroadcast.isPending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {sendBroadcast.isPending ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para {segmentLabels[broadcastSegment]}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Individual Tab */}
        {activeTab === "individual" && (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Enviar Notificação Individual
                </CardTitle>
                <CardDescription>
                  Selecione um usuário e envie uma notificação personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Search */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Buscar Usuário</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground"
                      />
                    </div>
                    <Select value={userRole} onValueChange={setUserRole}>
                      <SelectTrigger className="w-[160px] bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="passenger">Passageiros</SelectItem>
                        <SelectItem value="driver">Motoristas</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User List */}
                  <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-lg border border-border">
                    {usersList?.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setIndividualUserId(u.id)}
                        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                          individualUserId === u.id
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {u.role === "admin" ? "Admin" : u.role === "driver" ? "Motorista" : "Passageiro"}
                        </Badge>
                      </button>
                    ))}
                    {usersList?.length === 0 && (
                      <p className="text-center py-4 text-muted-foreground text-sm">Nenhum usuário encontrado</p>
                    )}
                  </div>
                </div>

                {individualUserId && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Tipo</label>
                      <Select value={individualType} onValueChange={setIndividualType}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Sistema</SelectItem>
                          <SelectItem value="promotion">Promoção</SelectItem>
                          <SelectItem value="ride">Corrida</SelectItem>
                          <SelectItem value="payment">Pagamento</SelectItem>
                          <SelectItem value="driver">Motorista</SelectItem>
                          <SelectItem value="safety">Segurança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Título *</label>
                      <Input
                        placeholder="Ex: Bem-vindo ao Fui!"
                        value={individualTitle}
                        onChange={(e) => setIndividualTitle(e.target.value)}
                        className="bg-background border-border text-foreground"
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Mensagem *</label>
                      <Textarea
                        placeholder="Escreva sua mensagem personalizada..."
                        value={individualMessage}
                        onChange={(e) => setIndividualMessage(e.target.value)}
                        className="bg-background border-border text-foreground min-h-[80px]"
                        maxLength={1000}
                      />
                    </div>

                    <Button
                      onClick={handleSendToUser}
                      disabled={sendToUser.isPending || !individualTitle.trim() || !individualMessage.trim()}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {sendToUser.isPending ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Notificação
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Histórico de Envios em Massa
              </CardTitle>
              <CardDescription>
                Últimas notificações enviadas para grupos de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {broadcastHistory?.map((item, index) => {
                  const Icon = notificationIcons[item.type] || Bell;
                  return (
                    <div key={index} className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex gap-3">
                        <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {item.recipientCount} destinatários
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[item.type] || item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!broadcastHistory || broadcastHistory.length === 0) && (
                  <div className="text-center py-8">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum envio em massa realizado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Estatísticas de Notificações
              </CardTitle>
              <CardDescription>
                Visão geral das notificações enviadas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-3xl font-bold text-primary">{stats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-3xl font-bold text-yellow-500">{stats?.unread || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Não Lidas</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-3xl font-bold text-green-500">{stats?.today || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Hoje</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-foreground mt-6">Por Tipo</h3>
                <div className="space-y-2">
                  {stats?.byType?.map((item) => {
                    const Icon = notificationIcons[item.type] || Bell;
                    const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div key={item.type} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground w-24">{typeLabels[item.type] || item.type}</span>
                        <div className="flex-1 h-2 rounded-full bg-background border border-border overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                  {(!stats?.byType || stats.byType.length === 0) && (
                    <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma estatística disponível</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
