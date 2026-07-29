import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { fuiBrand } from "@/lib/fuiTheme";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const utils = trpc.useUtils();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Por favor, informe um número de WhatsApp válido");
      return;
    }

    updateProfile.mutate({ phone: formatPhone(phone) });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <AppHeader title="Complete seu Perfil" />

      <div className="relative mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <Badge variant="outline" className={`mb-3 ${fuiBrand.border} ${fuiBrand.text}`}>
              Cadastro
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Complete seu Perfil</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Para usar o Fui!, precisamos do seu WhatsApp para comunicação durante as corridas e
              entregas.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className={fuiBrand.text}>1.</span>
                Informe um número com WhatsApp ativo
              </li>
              <li className="flex gap-2">
                <span className={fuiBrand.text}>2.</span>
                Motoristas podem entrar em contato durante a corrida
              </li>
              <li className="flex gap-2">
                <span className={fuiBrand.text}>3.</span>
                Você pode alterar depois em Meu Perfil
              </li>
            </ul>
          </div>

          <Card className="border-border/80 bg-card/50 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                WhatsApp
              </CardTitle>
              <CardDescription>
                Usaremos este número apenas para comunicação sobre suas corridas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(79) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className={`w-full ${fuiBrand.btn}`}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Continuar"
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
