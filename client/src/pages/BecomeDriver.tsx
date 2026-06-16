import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Car, CheckCircle2, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoDriverProfile, saveDemoDriverProfile } from "@/lib/demoDriver";
import { fuiBrand, fuiIconRingClass } from "@/lib/fuiTheme";
import { WL } from "@/whitelabel";
import StatusPanel from "@/components/fui/StatusPanel";

export default function BecomeDriver() {
  const { user, isDemoUser } = useAuth();
  const [, setLocation] = useLocation();
  const [cpf, setCpf] = useState("");
  const [cnh, setCnh] = useState("");
  const [cnhImageUrl, setCnhImageUrl] = useState("");
  const [uploadingCnh, setUploadingCnh] = useState(false);

  const utils = trpc.useUtils();
  const uploadDocument = trpc.upload.uploadDocument.useMutation();

  const { data: driverProfile, isFetching: profileFetching } = trpc.driver.getMyProfile.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const restoreDemoProfile = trpc.driver.createProfile.useMutation({
    onSuccess: (data) => {
      const profile = "profile" in data ? data.profile : null;
      if (profile) {
        saveDemoDriverProfile(profile);
        utils.driver.getMyProfile.setData(undefined, profile);
      }
    },
  });

  useEffect(() => {
    if (!isLocalDemoDev() || !user) return;

    const stored = loadDemoDriverProfile();
    if (!stored) return;

    utils.driver.getMyProfile.setData(undefined, stored as never);

    if (!driverProfile && !restoreDemoProfile.isPending) {
      restoreDemoProfile.mutate({
        cpf: stored.cpf ?? undefined,
        cnh: stored.cnh ?? undefined,
        cnhImageUrl: stored.cnhImageUrl ?? undefined,
      });
    }
  }, [user, driverProfile, restoreDemoProfile.isPending, utils]);

  const createProfile = trpc.driver.createProfile.useMutation({
    onSuccess: (data) => {
      const profile = "profile" in data ? data.profile : null;
      if (profile && isLocalDemoDev()) {
        saveDemoDriverProfile(profile);
        utils.driver.getMyProfile.setData(undefined, profile);
      }
      utils.driver.getMyProfile.invalidate();
      toast.success("Perfil de motorista criado com sucesso!");
      setLocation("/driver-dashboard");
    },
    onError: (error) => {
      if (isLocalDemoDev()) {
        const fallbackProfile = {
          id: 800_001,
          userId: user?.id ?? 0,
          cpf,
          cnh,
          cnhImageUrl: cnhImageUrl || null,
          status: "approved" as const,
          rating: 480,
          totalRides: 0,
          isAvailable: true,
        };
        saveDemoDriverProfile(fallbackProfile);
        utils.driver.getMyProfile.setData(undefined, fallbackProfile as never);
        toast.success("Perfil de motorista criado (demo local)!");
        setLocation("/driver-dashboard");
        return;
      }
      toast.error(error.message || "Erro ao criar perfil");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    setUploadingCnh(true);

    try {
      if (isDemoUser || isLocalDemoDev()) {
        setUrl(URL.createObjectURL(file));
        toast.success("Foto anexada (modo demo local)");
        setUploadingCnh(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await uploadDocument.mutateAsync({
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
        });
        setUrl(result.url);
        toast.success("Foto enviada com sucesso!");
        setUploadingCnh(false);
      };
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
        setUploadingCnh(false);
      };
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar foto");
      setUploadingCnh(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpf || !cnh) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    createProfile.mutate({ cpf, cnh, cnhImageUrl });
  };

  if (user && profileFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (driverProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader title="Tornar-se Motorista" />
        <div className="container max-w-2xl mx-auto py-12 p-4">
          <Card>
            <CardHeader className="text-center">
              <div className={fuiIconRingClass("success", "mx-auto w-16 h-16 mb-4")}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Perfil de Motorista Criado</CardTitle>
              <CardDescription>
                Status: <span className="font-semibold capitalize">{driverProfile.status}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverProfile.status === "pending" && (
                <StatusPanel
                  variant="warning"
                  title="Perfil em análise"
                  description="Você receberá uma notificação assim que for aprovado."
                />
              )}
              {driverProfile.status === "approved" && (
                <StatusPanel
                  variant="success"
                  title="Perfil aprovado"
                  description="Você já pode receber corridas no painel."
                />
              )}
              <Button onClick={() => setLocation("/driver-dashboard")} className={`w-full ${fuiBrand.btn}`}>
                Ir para o Painel do Motorista
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Tornar-se Motorista" />
      <div className="p-4">
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className={fuiIconRingClass("brand", "mx-auto w-16 h-16 mb-4")}>
              <Car className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Torne-se um Motorista Fui!</CardTitle>
            <CardDescription>
              {WL.city
                ? `Ganhe dinheiro dirigindo com preços populares em ${WL.city}`
                : "Ganhe dinheiro dirigindo com preços populares no Brasil"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnh">CNH *</Label>
                <Input
                  id="cnh"
                  type="text"
                  placeholder="Número da CNH"
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnhImage">Foto da CNH</Label>
                {cnhImageUrl ? (
                  <div className="relative">
                    <img src={cnhImageUrl} alt="CNH" className="w-full h-48 object-cover rounded-lg border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setCnhImageUrl("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="cnhImage"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setCnhImageUrl)}
                      disabled={uploadingCnh}
                    />
                    <label htmlFor="cnhImage" className="cursor-pointer">
                      {uploadingCnh ? (
                        <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {uploadingCnh ? "Enviando..." : "Clique para enviar foto da CNH"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP (máx. 5MB)</p>
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Envie uma foto clara da sua CNH para agilizar a aprovação
                </p>
              </div>

              <Button
                type="submit"
                className={`w-full ${fuiBrand.btn}`}
                disabled={createProfile.isPending}
              >
                {createProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando perfil...
                  </>
                ) : (
                  "Criar Perfil de Motorista"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
