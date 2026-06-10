import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fuiBrand } from "@/lib/fuiTheme";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

type PassengerPrimaryActionCardProps = {
  onRequestRide: () => void;
  onScheduleRide: () => void;
};

export default function PassengerPrimaryActionCard({
  onRequestRide,
  onScheduleRide,
}: PassengerPrimaryActionCardProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Para onde vamos hoje?</h2>
          <p className="text-sm text-muted-foreground">
            Solicite uma corrida em segundos ou agende para depois.
          </p>
        </div>

        <Button className={`w-full py-6 text-base font-bold ${fuiBrand.btn}`} onClick={onRequestRide}>
          <MapPin className="mr-2 h-5 w-5" />
          Solicitar Corrida
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          className="w-full border-border"
          onClick={onScheduleRide}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Agendar Corrida
        </Button>
      </CardContent>
    </Card>
  );
}
