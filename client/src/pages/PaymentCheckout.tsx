import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, XCircle, MapPin, ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// ─── Inner checkout form ────────────────────────────────────────────────────
function CheckoutForm({
  rideId,
  amount,
  paymentMethod,
  onSuccess,
  onError,
}: {
  rideId: number;
  amount: number;
  paymentMethod: "pix" | "card";
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/ride/${rideId}?payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Erro ao processar pagamento");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // Pix - waiting for user to scan QR code
        // The PaymentElement will show the QR code automatically
      }
    } catch (err: any) {
      onError(err.message || "Erro inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                address: {
                  country: "BR",
                },
              },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-[#F39200] hover:bg-[#D46A03] text-white font-semibold h-12 text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {paymentMethod === "pix"
              ? `Gerar QR Code Pix · R$ ${(amount / 100).toFixed(2)}`
              : `Pagar R$ ${(amount / 100).toFixed(2)}`}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento processado com segurança via{" "}
        <span className="font-semibold text-foreground">Stripe</span> · Seus dados estão protegidos
      </p>
    </form>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────
function PaymentSuccess({ rideId }: { rideId: number }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h2>
      <p className="text-muted-foreground max-w-xs">
        Seu pagamento foi processado com sucesso. Obrigado por usar o Fui!
      </p>
      <Button
        onClick={() => setLocation(`/ride/${rideId}`)}
        className="bg-[#F39200] hover:bg-[#D46A03] mt-4"
      >
        Ver detalhes da corrida
      </Button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PaymentCheckout() {
  const [, params] = useRoute("/payment/:rideId");
  const [, setLocation] = useLocation();
  const rideId = params?.rideId ? parseInt(params.rideId) : 0;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const { data: ride, isLoading: rideLoading } = trpc.ride.getById.useQuery(
    { rideId },
    { enabled: !!rideId }
  );

  const createCheckout = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setInitError("Não foi possível inicializar o pagamento. Tente novamente.");
      }
    },
    onError: (err) => {
      setInitError(err.message || "Erro ao criar sessão de pagamento");
    },
  });

  useEffect(() => {
    if (!ride) return;
    // Only init payment for pix/card rides that are still pending payment
    if (ride.paymentMethod === "cash") {
      setLocation(`/ride/${rideId}`);
      return;
    }
    if (ride.paymentStatus === "paid") {
      setPaymentSuccess(true);
      return;
    }
    // If we already have a clientSecret from a previous attempt, don't recreate
    if (clientSecret) return;

    const amount = ride.finalPrice || ride.estimatedPrice || 0;
    if (amount <= 0) {
      setInitError("Valor da corrida inválido para pagamento.");
      return;
    }

    createCheckout.mutate({
      rideId: ride.id,
      amount,
      origin: ride.originAddress,
      destination: ride.destinationAddress,
      vehicleType: ride.vehicleType,
    });
  }, [ride]);

  // Check URL for payment success redirect from Stripe
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
    }
  }, []);

  const amount = ride?.finalPrice || ride?.estimatedPrice || 0;
  const paymentMethod = (ride?.paymentMethod as "pix" | "card") || "card";

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "night" as const,
          variables: {
            colorPrimary: "#F39200",
            colorBackground: "#1c1c1c",
            colorText: "#ffffff",
            colorDanger: "#ef4444",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }
    : null;

  if (rideLoading || (!clientSecret && !initError && !paymentSuccess)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title="Pagamento" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#F39200] mx-auto" />
            <p className="text-muted-foreground">Preparando pagamento seguro...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Pagamento" />
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Ride summary card */}
        {ride && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Resumo da corrida</CardTitle>
                <Badge
                  variant="outline"
                  className="capitalize border-[#F39200]/50 text-[#F39200]"
                >
                  {ride.vehicleType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{ride.originAddress}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[#F39200] mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{ride.destinationAddress}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total a pagar</span>
                <span className="text-xl font-bold text-[#F39200]">
                  R$ {(amount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Método</span>
                <span className="font-medium text-foreground uppercase">
                  {paymentMethod === "pix" ? "Pix" : "Cartão"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment form or states */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#F39200]" />
              {paymentMethod === "pix" ? "Pagar com Pix" : "Dados do cartão"}
            </CardTitle>
            {paymentMethod === "pix" && (
              <CardDescription>
                Escaneie o QR Code com o app do seu banco para pagar instantaneamente.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {paymentSuccess ? (
              <PaymentSuccess rideId={rideId} />
            ) : initError ? (
              <div className="flex flex-col items-center py-8 text-center space-y-4">
                <XCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-400 font-medium">{initError}</p>
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/ride/${rideId}`)}
                  className="border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para a corrida
                </Button>
              </div>
            ) : clientSecret && stripeOptions ? (
              <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm
                  rideId={rideId}
                  amount={amount}
                  paymentMethod={paymentMethod}
                  onSuccess={() => setPaymentSuccess(true)}
                  onError={(msg) => toast.error(msg)}
                />
              </Elements>
            ) : null}
          </CardContent>
        </Card>

        {/* Back link */}
        {!paymentSuccess && (
          <button
            onClick={() => setLocation(`/ride/${rideId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar para detalhes da corrida
          </button>
        )}
      </div>
    </div>
  );
}
