import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BrainCircuit } from "lucide-react";
import { adminViewTabTrigger, adminViewTabsList } from "@/lib/adminShell";

type AdminViewSwitcherProps = {
  value: "live" | "intelligence";
  onChange: (value: "live" | "intelligence") => void;
};

export default function AdminViewSwitcher({ value, onChange }: AdminViewSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as "live" | "intelligence")}>
      <TabsList className={adminViewTabsList}>
        <TabsTrigger value="live" className={adminViewTabTrigger}>
          <Activity className="h-4 w-4 mr-2 opacity-80" />
          Operação ao vivo
        </TabsTrigger>
        <TabsTrigger value="intelligence" className={adminViewTabTrigger}>
          <BrainCircuit className="h-4 w-4 mr-2 opacity-80" />
          Inteligência 7.1
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
