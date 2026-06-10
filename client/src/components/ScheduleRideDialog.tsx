import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RecurrenceRule } from "@shared/passengerPremium";
import { formatRecurrenceLabel } from "@shared/passengerPremium";

export type ScheduleRideResult = {
  scheduledFor: Date;
  recurrenceRule?: RecurrenceRule;
};

interface ScheduleRideDialogProps {
  origin: string;
  destination: string;
  vehicleType: string;
  estimatedPrice?: number;
  onSchedule: (result: ScheduleRideResult) => void;
  trigger?: React.ReactNode;
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function ScheduleRideDialog({
  origin,
  destination,
  vehicleType,
  estimatedPrice,
  onSchedule,
  trigger,
}: ScheduleRideDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("08:00");
  const [recurrenceType, setRecurrenceType] = useState<"none" | RecurrenceRule["type"]>("none");
  const [weeklyDay, setWeeklyDay] = useState(1);
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);

  const buildRecurrenceRule = (): RecurrenceRule | undefined => {
    if (recurrenceType === "none") return undefined;
    if (recurrenceType === "daily") return { type: "daily" };
    if (recurrenceType === "weekly") return { type: "weekly", daysOfWeek: [weeklyDay] };
    return { type: "custom", daysOfWeek: customDays.length ? customDays : [1] };
  };

  const handleSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    if (scheduledDate <= new Date()) {
      alert("Por favor, escolha uma data e hora futura");
      return;
    }

    const recurrenceRule = buildRecurrenceRule();
    onSchedule({ scheduledFor: scheduledDate, recurrenceRule });
    setOpen(false);
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const recurrencePreview = buildRecurrenceRule();
  const isScheduleValid = date && time;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Agendar Corrida
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Agendar Corrida</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha quando você quer ser buscado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3 p-4 bg-primary/5 border border-primary/10 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Origem</p>
                <p className="font-medium text-foreground">{origin}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-medium text-foreground">{destination}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-primary/10">
              <span className="text-sm text-muted-foreground">Veículo: {vehicleType}</span>
              {estimatedPrice ? (
                <span className="font-bold text-primary">
                  R$ {(estimatedPrice / 100).toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-foreground">Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Recorrência (Premium)</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "none", label: "Única vez" },
                  { id: "daily", label: "Diária" },
                  { id: "weekly", label: "Semanal" },
                  { id: "custom", label: "Dias específicos" },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  size="sm"
                  variant={recurrenceType === opt.id ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setRecurrenceType(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {recurrenceType === "weekly" ? (
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    size="sm"
                    variant={weeklyDay === d.value ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setWeeklyDay(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            ) : null}

            {recurrenceType === "custom" ? (
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    size="sm"
                    variant={customDays.includes(d.value) ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleCustomDay(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            ) : null}

            {recurrencePreview ? (
              <p className="text-xs text-muted-foreground">
                {formatRecurrenceLabel(recurrencePreview)} — demo local registra a série; próximas
                ocorrências serão materializadas em evolução futura.
              </p>
            ) : null}
          </div>

          <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              O motorista será notificado e confirmará disponibilidade para o horário escolhido.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border">
            Cancelar
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!isScheduleValid}
            className="bg-primary hover:bg-primary/90"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Confirmar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
