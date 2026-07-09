import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, User, Phone, Mail, LogOut, TrendingUp, DollarSign,
  MapPin, Bookmark, Star, Award, Gift, Shield, Camera, Check,
  Calendar, Clock, Car, ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { buildLoginUrl, rememberLoginReturnTo } from "@/const";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { fuiBrand } from "@/lib/fuiTheme";
import { isDemoAppClient, isDemoLocalUser } from "@/lib/demoMode";
import { useBetaDemoRuntime } from "@/lib/useBetaDemoRuntime";
import { mergeDemoUserProfile, saveDemoUserProfile } from "@/lib/demoUserProfile";
import { compressImageFile } from "@/lib/compressImage";

export default function Profile() {
  const { user, loading: authLoading, logout, canUsePrivateUserApi } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  useBetaDemoRuntime(false);
  const useLocalAvatar = isDemoAppClient() || isDemoLocalUser(user);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const initialFormRef = useRef({ name: "", phone: "" });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!user) return;
    const merged = mergeDemoUserProfile(user);
    const nextName = merged.name || "";
    const nextPhone = merged.phone || "";
    setName(nextName);
    setPhone(nextPhone);
    initialFormRef.current = { name: nextName, phone: nextPhone };
  }, [user]);

  const { data: recentRides, isLoading: ridesLoading } = trpc.user.getRecentRides.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false, throwOnError: false }
  );

  const { data: userStats, isLoading: statsLoading } = trpc.user.getStats.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false, throwOnError: false }
  );

  const { data: loyaltyStats } = trpc.loyalty.getStats.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false, throwOnError: false }
  );

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      utils.auth.me.invalidate();
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (error: any) => {
      setSaveState("idle");
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const uploadAvatarMutation = trpc.user.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success("Foto de perfil atualizada!");
      setAvatarPreview(null);
      utils.auth.me.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar foto");
      setAvatarPreview(null);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (useLocalAvatar) {
      setSaveState("saving");
      saveDemoUserProfile({
        name: name.trim(),
        phone: phone.trim() || null,
      });
      const updated = mergeDemoUserProfile({
        ...user!,
        name: name.trim(),
        phone: phone.trim() || null,
      });
      utils.auth.me.setData(undefined, updated as never);
      initialFormRef.current = { name: name.trim(), phone: phone.trim() };
      setSaveState("saved");
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(initialFormRef.current.name);
    setPhone(initialFormRef.current.phone);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    let previewUrl: string | null = null;
    try {
      const { dataUrl, mimeType, base64 } = await compressImageFile(file);
      previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      if (useLocalAvatar) {
        saveDemoUserProfile({ avatarUrl: dataUrl });
        const updated = mergeDemoUserProfile({ ...user!, avatarUrl: dataUrl });
        utils.auth.me.setData(undefined, updated as never);
        toast.success("Foto de perfil atualizada!");
        setAvatarPreview(null);
        return;
      }

      await uploadAvatarMutation.mutateAsync({ base64, mimeType });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar foto");
      setAvatarPreview(null);
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado para ver seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a
                href={buildLoginUrl()}
                onClick={() => rememberLoginReturnTo()}
              >
                Fazer Login
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayUser = mergeDemoUserProfile(user);
  const currentAvatar = avatarPreview || displayUser.avatarUrl;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Meu Perfil" />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Gerencie seus dados pessoais, foto e atalhos da sua conta
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/emergency-contacts")}
              className="text-red-400 hover:bg-red-900/20"
            >
              <Shield className="w-4 h-4 mr-1.5" />
              SOS
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>

        {canUsePrivateUserApi ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <FuiMetricCard
              label="Corridas"
              value={statsLoading ? "..." : String(userStats?.totalRides ?? 0)}
              icon={MapPin}
              highlight
            />
            <FuiMetricCard
              label="Total gasto"
              value={statsLoading ? "..." : `R$ ${((userStats?.totalSpent ?? 0) / 100).toFixed(0)}`}
              icon={DollarSign}
            />
            <FuiMetricCard
              label="Economia"
              value={statsLoading ? "..." : `R$ ${((userStats?.totalSaved ?? 0) / 100).toFixed(0)}`}
              icon={TrendingUp}
            />
            <FuiMetricCard
              label="Fidelidade"
              value={loyaltyStats ? `${loyaltyStats.currentPoints} pts` : "—"}
              sub={loyaltyStats?.currentLevel?.toUpperCase() ?? "BRONZE"}
              icon={Star}
            />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-border">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-20 sm:h-24" />
              <CardContent className="relative -mt-10 sm:-mt-12 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  <div className="relative group shrink-0 mx-auto sm:mx-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background bg-card overflow-hidden shadow-lg">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <User className="w-10 h-10 text-primary" />
                        </div>
                      )}
                      {!useLocalAvatar && uploadAvatarMutation.isPending && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                      disabled={!useLocalAvatar && uploadAvatarMutation.isPending}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h2 className="text-2xl font-bold truncate">{displayUser.name || "Usuário"}</h2>
                    <p className="text-sm text-muted-foreground truncate">{displayUser.email}</p>
                    {loyaltyStats ? (
                      <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-primary/15 text-primary rounded-full text-xs font-semibold">
                        <Star className="w-3 h-3" />
                        {loyaltyStats.currentLevel?.toUpperCase() ?? "BRONZE"}
                        <span className="text-muted-foreground font-normal ml-1">
                          • {loyaltyStats.currentPoints} pts
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary">
                      Editar
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Seu nome completo"
                      className={isEditing ? "border-primary/50 focus:border-primary" : ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        id="email"
                        value={displayUser.email || "Não informado"}
                        disabled
                        className="flex-1 opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wide">
                      WhatsApp
                    </Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={!isEditing}
                        placeholder="(79) 99999-0000"
                        className={`flex-1 ${isEditing ? "border-primary/50 focus:border-primary" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={saveState === "saving"}
                      className={`${fuiBrand.btn} sm:min-w-[180px]`}
                    >
                      {saveState === "saving" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {saveState === "saved" ? <Check className="w-4 h-4 mr-2 text-green-300" /> : null}
                      {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo!" : "Salvar Alterações"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Atalhos rápidos</CardTitle>
                <CardDescription>Acesse as áreas mais usadas da sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation("/saved-addresses")}
                  >
                    <Bookmark className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Endereços Salvos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation("/ride-history")}
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Histórico Completo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation("/scheduled-rides")}
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Corridas Agendadas</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation("/emergency-contacts")}
                  >
                    <Shield className="w-5 h-5 text-red-400" />
                    <span className="text-xs font-medium">Contatos SOS</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {canUsePrivateUserApi && loyaltyStats ? (
              <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Programa de Fidelidade
                    </CardTitle>
                    <span className="text-xs text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full shrink-0">
                      {loyaltyStats.currentDiscount}% OFF
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loyaltyStats.nextLevel ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Próximo: {loyaltyStats.nextLevel?.toUpperCase()}</span>
                        <span className="font-medium">{loyaltyStats.pointsToNextLevel} pts</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (loyaltyStats.currentPoints / (loyaltyStats.currentPoints + loyaltyStats.pointsToNextLevel)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium">{loyaltyStats.totalEarned}</div>
                        <div className="text-[10px] text-muted-foreground">Ganhos</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="font-medium">{loyaltyStats.totalRedeemed}</div>
                        <div className="text-[10px] text-muted-foreground">Resgatados</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {canUsePrivateUserApi ? (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Últimas Corridas
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/ride-history")} className="text-primary text-xs">
                      Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ridesLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !recentRides || recentRides.length === 0 ? (
                    <div className="text-center py-10">
                      <Car className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma corrida realizada ainda</p>
                      <Button variant="link" size="sm" onClick={() => setLocation("/")} className="mt-1 text-primary">
                        Solicitar primeira corrida
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentRides.map((ride: any) => (
                        <div
                          key={ride.id}
                          onClick={() => setLocation(`/ride/${ride.id}`)}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ride.destinationAddress}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ride.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              })}
                              <span className="mx-0.5">•</span>
                              {ride.vehicleType}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm text-primary">
                              R$ {((ride.finalPrice || 0) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-[1fr_1.1fr] sm:items-center">
                    <div className="flex flex-col items-center justify-center px-6 py-10 sm:border-r border-border">
                      <User className="w-16 h-16 text-muted-foreground/40 mb-3" />
                      <h3 className="text-lg font-semibold text-center">Conta em modo demo</h3>
                      <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
                        Nome, WhatsApp e foto ficam salvos neste navegador para testes locais.
                      </p>
                    </div>
                    <div className="px-6 py-8 space-y-3 bg-muted/20">
                      <p className="text-sm font-medium">O que você pode fazer aqui</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>1.</span>
                          Atualizar foto e dados pessoais
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>2.</span>
                          Acessar endereços salvos e histórico
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>3.</span>
                          Configurar contatos de emergência
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {canUsePrivateUserApi && userStats?.memberSince ? (
          <p className="text-center text-xs text-muted-foreground">
            Membro desde{" "}
            {new Date(userStats.memberSince).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        ) : null}

        {useLocalAvatar ? (
          <p className="text-center text-xs text-muted-foreground">
            Modo demo local — nome e WhatsApp salvos neste navegador.
          </p>
        ) : null}
      </div>
    </div>
  );
}
