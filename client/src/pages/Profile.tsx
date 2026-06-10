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
import { getLoginUrl } from "@/const";
import AppHeader from "@/components/AppHeader";
import { isLocalDemoDev } from "@/lib/demoMode";
import { mergeDemoUserProfile, saveDemoUserProfile } from "@/lib/demoUserProfile";

export default function Profile() {
  const { user, loading: authLoading, logout, canUsePrivateUserApi, isDemoUser } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemo = isLocalDemoDev() || isDemoUser;

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
    { enabled: !!user && canUsePrivateUserApi, retry: false }
  );

  const { data: userStats, isLoading: statsLoading } = trpc.user.getStats.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false }
  );

  const { data: loyaltyStats } = trpc.loyalty.getStats.useQuery(
    undefined,
    { enabled: !!user && canUsePrivateUserApi, retry: false }
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

    if (isDemo) {
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

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      if (isDemo) {
        saveDemoUserProfile({ avatarUrl: dataUrl });
        const updated = mergeDemoUserProfile({ ...user!, avatarUrl: dataUrl });
        utils.auth.me.setData(undefined, updated as never);
        toast.success("Foto de perfil atualizada!");
        setAvatarPreview(null);
        return;
      }

      const base64 = dataUrl.split(",")[1];
      uploadAvatarMutation.mutate({
        base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
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
              <a href={getLoginUrl()}>Fazer Login</a>
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
      <AppHeader />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="grid gap-5">

          {/* ===== HERO: Avatar + Name + Level ===== */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-24" />
            <CardContent className="relative -mt-12 pb-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-4 border-background bg-card overflow-hidden shadow-lg">
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
                    {!isDemo && uploadAvatarMutation.isPending && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    disabled={!isDemo && uploadAvatarMutation.isPending}
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

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold">{displayUser.name || "Usuário"}</h2>
                  <p className="text-sm text-muted-foreground">{displayUser.email}</p>
                  {loyaltyStats && (
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 bg-primary/15 text-primary rounded-full text-xs font-semibold">
                      <Star className="w-3 h-3" />
                      {loyaltyStats.currentLevel.toUpperCase()}
                      <span className="text-muted-foreground font-normal ml-1">
                        • {loyaltyStats.currentPoints} pts
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/emergency-contacts")}
                    className="text-red-400 hover:bg-red-900/20"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    SOS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Informações Pessoais
                </CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary">
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wide">Nome Completo</Label>
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
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
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
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wide">WhatsApp</Label>
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

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={saveState === "saving"}
                    className="flex-1 relative"
                  >
                    {saveState === "saving" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {saveState === "saved" && <Check className="w-4 h-4 mr-2 text-green-300" />}
                    {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo!" : "Salvar Alterações"}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => setLocation("/saved-addresses")}
            >
              <Bookmark className="w-5 h-5 text-primary" />
              <span className="text-xs">Endereços Salvos</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => setLocation("/ride-history")}
            >
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-xs">Histórico Completo</span>
            </Button>
          </div>

          {!isDemo && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xl font-bold">{statsLoading ? "..." : userStats?.totalRides ?? 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Corridas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <div className="text-xl font-bold">
                      {statsLoading ? "..." : `R$ ${((userStats?.totalSpent ?? 0) / 100).toFixed(0)}`}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Total Gasto</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <TrendingUp className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-orange-500">
                      {statsLoading ? "..." : `R$ ${((userStats?.totalSaved ?? 0) / 100).toFixed(0)}`}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Economia</p>
                  </CardContent>
                </Card>
              </div>

              {loyaltyStats && (
                <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        Programa de Fidelidade
                      </CardTitle>
                      <span className="text-xs text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                        {loyaltyStats.currentDiscount}% OFF
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loyaltyStats.nextLevel && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Próximo: {loyaltyStats.nextLevel.toUpperCase()}</span>
                          <span className="font-medium">{loyaltyStats.pointsToNextLevel} pts</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (loyaltyStats.currentPoints / (loyaltyStats.currentPoints + loyaltyStats.pointsToNextLevel)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
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
              )}

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
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
                    <div className="text-center py-8">
                      <Car className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
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
                            <p className="font-medium text-sm truncate">
                              {ride.destinationAddress}
                            </p>
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

              {userStats?.memberSince && (
                <p className="text-center text-xs text-muted-foreground pb-4">
                  Membro desde {new Date(userStats.memberSince).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </>
          )}

          {isDemo && (
            <p className="text-center text-xs text-muted-foreground pb-4">
              Modo demo local — nome e WhatsApp salvos neste navegador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
