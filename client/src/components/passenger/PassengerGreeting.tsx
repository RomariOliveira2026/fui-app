type PassengerGreetingProps = {
  name?: string | null;
};

export default function PassengerGreeting({ name }: PassengerGreetingProps) {
  const firstName = name?.trim().split(/\s+/)[0] || "passageiro";

  return (
    <div className="space-y-1 pt-2">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Olá, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground">
        Pronto para sua próxima corrida?
      </p>
    </div>
  );
}
