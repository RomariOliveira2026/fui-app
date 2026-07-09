import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Star, Phone, User, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FuiMetricCard from "@/components/fui/FuiMetricCard";
import { fuiBrand } from "@/lib/fuiTheme";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function EmergencyContacts() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const { data: contacts, refetch, isLoading } = trpc.safety.getEmergencyContacts.useQuery(undefined, {
    enabled: !!user,
    throwOnError: false,
    retry: 1,
  });
  const addContact = trpc.safety.addEmergencyContact.useMutation();
  const deleteContact = trpc.safety.deleteEmergencyContact.useMutation();
  const updateContact = trpc.safety.updateEmergencyContact.useMutation();

  const contactStats = useMemo(() => {
    const list = contacts ?? [];
    return {
      total: list.length,
      primary: list.filter((c) => c.isPrimary).length,
      withRelationship: list.filter((c) => c.relationship).length,
    };
  }, [contacts]);

  const handleAddContact = async () => {
    if (!name || !phone) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }

    try {
      await addContact.mutateAsync({
        name,
        phone,
        relationship,
        isPrimary: contacts?.length === 0,
      });

      toast.success("Contato adicionado com sucesso!");
      setName("");
      setPhone("");
      setRelationship("");
      setIsAddDialogOpen(false);
      refetch();
    } catch {
      toast.error("Erro ao adicionar contato");
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await deleteContact.mutateAsync({ contactId });
      toast.success("Contato removido");
      refetch();
    } catch {
      toast.error("Erro ao remover contato");
    }
  };

  const handleTogglePrimary = async (contactId: number, isPrimary: boolean) => {
    try {
      await updateContact.mutateAsync({
        contactId,
        isPrimary: !isPrimary,
      });
      toast.success(isPrimary ? "Contato desmarcado como principal" : "Contato marcado como principal");
      refetch();
    } catch {
      toast.error("Erro ao atualizar contato");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Contatos de Emergência" />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos de Emergência</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Pessoas que serão notificadas em caso de emergência durante uma corrida
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Contato
          </Button>
        </div>

        {contactStats.total > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            <FuiMetricCard label="Total cadastrados" value={String(contactStats.total)} icon={Shield} highlight />
            <FuiMetricCard label="Contato principal" value={String(contactStats.primary)} icon={Star} />
            <FuiMetricCard
              label="Com parentesco"
              value={String(contactStats.withRelationship)}
              icon={User}
              className="col-span-2 xl:col-span-1"
            />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-blue-800/30 bg-blue-900/10 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-300">
                <Shield className="w-5 h-5 text-blue-500" />
                Como funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-200/80">
              <p>
                Em caso de emergência durante uma corrida, você pode acionar o botão SOS. Seus contatos de emergência
                receberão uma notificação imediata com sua localização em tempo real e detalhes da corrida.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>1.</span>
                  Cadastre pessoas de confiança com WhatsApp ativo
                </li>
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>2.</span>
                  Defina um contato principal para ser avisado primeiro
                </li>
                <li className="flex gap-2">
                  <span className={fuiBrand.text}>3.</span>
                  Use o botão SOS durante corridas em andamento
                </li>
              </ul>
              {contactStats.total > 0 ? (
                <p className="text-xs text-muted-foreground pt-2 border-t border-blue-800/30">
                  O contato marcado como <strong className="text-foreground">Principal</strong> será notificado primeiro.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {contacts && contacts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="border-border bg-card hover:border-red-500/25 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div className="p-2.5 bg-red-900/30 rounded-full shrink-0 h-fit">
                            <User className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
                              {contact.isPrimary ? (
                                <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-300 text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-500" />
                                  Principal
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{contact.phone}</span>
                            </div>
                            {contact.relationship ? (
                              <p className="text-xs text-muted-foreground mt-1">{contact.relationship}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTogglePrimary(contact.id, contact.isPrimary || false)}
                            aria-label={contact.isPrimary ? "Desmarcar como principal" : "Marcar como principal"}
                          >
                            <Star className={`w-4 h-4 ${contact.isPrimary ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:bg-red-900/20"
                            onClick={() => handleDeleteContact(contact.id)}
                            aria-label="Remover contato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-[1fr_1.2fr] lg:items-center">
                    <div className="flex flex-col items-center justify-center px-6 py-12 lg:py-16 lg:border-r border-border">
                      <Shield className="w-20 h-20 text-muted-foreground/40 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                        Nenhum contato cadastrado
                      </h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        Adicione pelo menos um contato de emergência para sua segurança durante as corridas.
                      </p>
                    </div>
                    <div className="px-6 py-10 lg:py-16 space-y-4 bg-muted/20">
                      <p className="text-sm font-medium text-foreground">Por que cadastrar?</p>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>1.</span>
                          Notificação imediata com localização em tempo real
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>2.</span>
                          Compartilhamento automático dos dados da corrida
                        </li>
                        <li className="flex gap-2">
                          <span className={fuiBrand.text}>3.</span>
                          Mais tranquilidade para você e sua família
                        </li>
                      </ul>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Contato
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Contato de Emergência</DialogTitle>
            <DialogDescription>
              Adicione alguém de confiança que será notificado em caso de emergência
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="Ex: (79) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Parentesco/Relação</Label>
              <Input
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Ex: Mãe, Cônjuge, Amigo(a)"
              />
            </div>
            <Button
              onClick={handleAddContact}
              disabled={addContact.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {addContact.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Adicionar Contato"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
