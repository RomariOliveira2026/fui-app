import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Star, Phone, User } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EmergencyContacts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const { data: contacts, refetch } = trpc.safety.getEmergencyContacts.useQuery();
  const addContact = trpc.safety.addEmergencyContact.useMutation();
  const deleteContact = trpc.safety.deleteEmergencyContact.useMutation();
  const updateContact = trpc.safety.updateEmergencyContact.useMutation();

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
        isPrimary: contacts?.length === 0, // First contact is primary
      });

      toast.success("Contato adicionado com sucesso!");
      setName("");
      setPhone("");
      setRelationship("");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao adicionar contato");
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await deleteContact.mutateAsync({ contactId });
      toast.success("Contato removido");
      refetch();
    } catch (error) {
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
    } catch (error) {
      toast.error("Erro ao atualizar contato");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-900/30 rounded-full">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contatos de Emergência</h1>
            <p className="text-muted-foreground">Pessoas que serão notificadas em caso de emergência</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-900/10 border-blue-800/30">
          <div className="flex gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-300 mb-2">Como funciona?</h3>
              <p className="text-sm text-blue-200/80">
                Em caso de emergência durante uma corrida, você pode acionar o botão SOS. Seus contatos de emergência
                receberão uma notificação imediata com sua localização em tempo real e detalhes da corrida.
              </p>
            </div>
          </div>
        </Card>

        {/* Add Contact Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-red-600 hover:bg-red-700">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Contato de Emergência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Contato de Emergência</DialogTitle>
              <DialogDescription>
                Adicione alguém de confiança que será notificado em caso de emergência
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (79) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Parentesco/Relação</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Ex: Mãe, Cônjuge, Amigo(a)"
                />
              </div>
              <Button onClick={handleAddContact} className="w-full bg-red-600 hover:bg-red-700">
                Adicionar Contato
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts?.length === 0 && (
            <Card className="p-8 text-center">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum contato cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione pelo menos um contato de emergência para sua segurança
              </p>
            </Card>
          )}

          {contacts?.map((contact) => (
            <Card key={contact.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-3 bg-red-900/30 rounded-full">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{contact.name}</h3>
                      {contact.isPrimary && (
                        <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-600" />
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.relationship && (
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePrimary(contact.id, contact.isPrimary || false)}
                  >
                    <Star className={`w-4 h-4 ${contact.isPrimary ? "fill-yellow-600" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {contacts && contacts.length > 0 && (
          <Card className="p-4 mt-6">
            <p className="text-sm text-muted-foreground text-center">
              ⭐ O contato marcado como <strong>Principal</strong> será notificado primeiro em caso de emergência
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
