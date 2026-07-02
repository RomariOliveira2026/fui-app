import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { setDriverSignupIntent } from "@/lib/postAuthRedirect";

/** Legado: redireciona para o fluxo completo de pré-cadastro. */
export default function BecomeDriver() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setDriverSignupIntent();
    setLocation("/driver/register");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
