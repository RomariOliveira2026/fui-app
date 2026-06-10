import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { isLocalDemoDev } from "@/lib/demoMode";
import { DEMO_SAMPLE_REFERRAL_CODE } from "@shared/demoReferrals";
import {
  persistDemoReferralsSnapshot,
  useDemoReferralsHydration,
} from "@/lib/useDemoReferralsHydration";
import {
  Gift,
  Copy,
  Share2,
  Users,
  CheckCircle2,
  DollarSign,
  Sparkles,
  UserPlus,
} from "lucide-react";

export default function Referrals() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [referralInput, setReferralInput] = useState("");
  const utils = trpc.useUtils();

  useDemoReferralsHydration(!!user);

  const { data: myCode, isLoading: codeLoading } = trpc.referrals.getMyCode.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: stats, isLoading: statsLoading } = trpc.referrals.getStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: referralList, isLoading: listLoading } = trpc.referrals.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    const snapshot = myCode?.demoSnapshot;
    if (snapshot) persistDemoReferralsSnapshot(snapshot);
  }, [myCode]);

  const applyMutation = trpc.referrals.redeemCode.useMutation({
    onSuccess: (data) => {
      if (data.demoSnapshot) persistDemoReferralsSnapshot(data.demoSnapshot);
      toast.success(data.message);
      setReferralInput("");
      void utils.referrals.getStats.invalidate();
      void utils.referrals.list.invalidate();
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

  const handleCopyCode = () => {
    if (myCode?.code) {
      navigator.clipboard.writeText(myCode.code);
      toast.success("Código copiado!");
    }
  };

  const handleShare = async () => {
    if (!myCode?.code) return;

    const shareText = `Use meu código ${myCode.code} no Fui! e ganhe R$ 5,00 em créditos na sua primeira corrida! Baixe agora: https://fuiapp.com.br`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Fui! - Indique e Ganhe",
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Link de indicação copiado!");
    }
  };

  const handleApplyCode = () => {
    if (!referralInput.trim()) {
      toast.error("Digite um código de indicação");
      return;
    }
    applyMutation.mutate({ code: referralInput.trim() });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
            Aguardando
          </span>
        );
      case "registered":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
            Cadastrado
          </span>
        );
      case "completed":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
            Completado
          </span>
        );
      case "expired":
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
            Expirado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Indique e Ganhe" />

      <div className="p-4 space-y-4">
        {/* Hero Card */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-2">Ganhe R$ 5,00 por indicação!</h2>
            <p className="text-sm opacity-90 mb-4">
              Indique um amigo e quando ele completar a primeira corrida,
              vocês dois ganham R$ 5,00 em créditos.
            </p>

            {/* Referral Code */}
            {codeLoading ? (
              <div className="h-12 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                <span className="flex-1 text-lg font-mono font-bold tracking-wider">
                  {myCode?.code || "---"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-white text-orange-600 hover:bg-white/90"
                onClick={handleCopyCode}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar código
              </Button>
              <Button
                className="flex-1 bg-white/20 text-white hover:bg-white/30"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Compartilhe seu código</p>
                <p className="text-xs text-muted-foreground">
                  Envie seu código para amigos e familiares
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Amigo se cadastra</p>
                <p className="text-xs text-muted-foreground">
                  Seu amigo baixa o Fui! e insere o código
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Vocês dois ganham!</p>
                <p className="text-xs text-muted-foreground">
                  Após a primeira corrida, cada um recebe R$ 5,00 em pontos de fidelidade
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xl font-bold">{stats.totalReferred}</p>
                <p className="text-xs text-muted-foreground">Indicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xl font-bold">{stats.totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                <p className="text-xl font-bold">
                  R$ {((stats.totalEarned || 0) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Ganhos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Apply a code */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-500" />
              Tem um código de indicação?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Digite o código aqui"
                className="font-mono"
                maxLength={20}
              />
              <Button
                className="bg-orange-500 hover:bg-orange-600 shrink-0"
                onClick={handleApplyCode}
                disabled={applyMutation.isPending || !referralInput.trim()}
              >
                {applyMutation.isPending ? "..." : "Aplicar"}
              </Button>
            </div>
            {isLocalDemoDev() ? (
              <p className="text-[11px] text-muted-foreground mt-2">
                Demo local: teste com o código{" "}
                <span className="font-mono text-primary">{DEMO_SAMPLE_REFERRAL_CODE}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suas indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : referralList && referralList.length > 0 ? (
              <div className="space-y-3">
                {referralList.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {ref.referredUser?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {ref.referredUser?.name || "Aguardando cadastro"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Código: {ref.referralCode}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(ref.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/70 bg-muted/20">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary/70" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhuma indicação ainda</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Compartilhe seu código com amigos. Quando eles completarem a primeira corrida,
                  vocês dois ganham créditos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
