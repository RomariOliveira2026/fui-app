import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

type DriverDailyGoalCardProps = {
  earnedTodayCents: number;
  goalCents: number;
  onGoalChange: (cents: number) => void;
};

export default function DriverDailyGoalCard({
  earnedTodayCents,
  goalCents,
  onGoalChange,
}: DriverDailyGoalCardProps) {
  const [goalInput, setGoalInput] = useState(String(Math.round(goalCents / 100)));
  const progress = goalCents > 0 ? Math.min(100, Math.round((earnedTodayCents / goalCents) * 100)) : 0;
  const remaining = Math.max(0, goalCents - earnedTodayCents);

  useEffect(() => {
    setGoalInput(String(Math.round(goalCents / 100)));
  }, [goalCents]);

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Meta diária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-primary">
              R$ {(earnedTodayCents / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              de R$ {(goalCents / 100).toFixed(2)} ({progress}%)
            </p>
          </div>
          {remaining > 0 ? (
            <p className="text-xs text-muted-foreground text-right">
              Faltam
              <br />
              <span className="font-semibold text-foreground">
                R$ {(remaining / 100).toFixed(2)}
              </span>
            </p>
          ) : (
            <p className="text-xs font-semibold text-emerald-400">Meta atingida!</p>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="daily-goal" className="text-xs text-muted-foreground">
            Ajustar meta (R$)
          </Label>
          <Input
            id="daily-goal"
            type="number"
            min={10}
            step={10}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={() => {
              const reais = Number(goalInput);
              if (reais >= 10) onGoalChange(Math.round(reais * 100));
              else setGoalInput(String(Math.round(goalCents / 100)));
            }}
            className="h-8 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
