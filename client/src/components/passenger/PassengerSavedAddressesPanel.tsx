import type { DemoSavedAddress } from "@/lib/demoSavedAddresses";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmptyStateCard from "@/components/passenger/EmptyStateCard";
import { fuiBrand } from "@/lib/fuiTheme";
import { Bookmark, Briefcase, Home, Star } from "lucide-react";

type SavedAddressLike = Pick<
  DemoSavedAddress,
  "id" | "label" | "customLabel" | "address"
>;

type PassengerSavedAddressesPanelProps = {
  addresses: SavedAddressLike[];
  onUseAddress: (address: string) => void;
  onManage: () => void;
};

function labelFor(addr: SavedAddressLike) {
  if (addr.label === "home") return "Casa";
  if (addr.label === "work") return "Trabalho";
  return addr.customLabel || "Outro";
}

function iconFor(label: SavedAddressLike["label"]) {
  if (label === "home") return Home;
  if (label === "work") return Briefcase;
  return Star;
}

export default function PassengerSavedAddressesPanel({
  addresses,
  onUseAddress,
  onManage,
}: PassengerSavedAddressesPanelProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Endereços salvos</h2>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-8" onClick={onManage}>
          <Bookmark className="mr-1 h-3.5 w-3.5" />
          Gerenciar
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyStateCard
          title="Nenhum endereço salvo"
          description="Salve Casa, Trabalho e outros favoritos para ir mais rápido."
          actionLabel="Salvar endereço"
          onAction={onManage}
        />
      ) : (
        <div className="space-y-2">
          {addresses.slice(0, 4).map((addr) => {
            const Icon = iconFor(addr.label);
            return (
              <Card key={addr.id} className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{labelFor(addr)}</p>
                    <p className="truncate text-xs text-muted-foreground">{addr.address}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`shrink-0 ${fuiBrand.btnOutline}`}
                    onClick={() => onUseAddress(addr.address)}
                  >
                    Usar agora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
