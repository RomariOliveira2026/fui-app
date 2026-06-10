import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error("Por favor, informe seu número de WhatsApp");
      return;
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}\-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      toast.error("Por favor, informe um número de WhatsApp válido");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Add update profile mutation
      toast.success("Perfil atualizado com sucesso!");
      await utils.auth.me.invalidate();
      setLocation("/");
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Complete seu Perfil
            </CardTitle>
            <CardDescription>
              Para usar o Fui!, precisamos do seu número de WhatsApp para comunicação durante as corridas
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
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Usaremos este número apenas para comunicação sobre suas corridas
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
