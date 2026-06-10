import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Tag, TrendingUp, Users, DollarSign } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useLocation } from "wouter";

export default function CouponManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check if user is admin
  if (!authLoading && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: coupons, isLoading } = trpc.coupon.getAll.useQuery();
  const utils = trpc.useUtils();

  const createCoupon = trpc.coupon.create.useMutation({
    onSuccess: () => {
      toast.success("Cupom criado com sucesso!");
      utils.coupon.getAll.invalidate();
      setIsCreateDialogOpen(false);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        maxUses: undefined,
        maxUsesPerUser: 1,
        validFrom: "",
        validUntil: "",
        minRideValue: undefined,
        vehicleTypes: [],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cupom");
    },
  });

  const toggleCoupon = trpc.coupon.toggle.useMutation({
    onSuccess: () => {
      toast.success("Status do cupom atualizado!");
      utils.coupon.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar cupom");
    },
  });

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    maxUses: undefined as number | undefined,
    maxUsesPerUser: 1,
    validFrom: "",
    validUntil: "",
    minRideValue: undefined as number | undefined,
    vehicleTypes: [] as ("moto" | "carro" | "van")[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.validFrom || !formData.validUntil) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createCoupon.mutate({
      code: formData.code,
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue: formData.discountType === "percentage" 
        ? formData.discountValue 
        : formData.discountValue * 100, // Convert to cents for fixed
      maxUses: formData.maxUses,
      maxUsesPerUser: formData.maxUsesPerUser,
      validFrom: new Date(formData.validFrom),
      validUntil: new Date(formData.validUntil),
      minRideValue: formData.minRideValue ? formData.minRideValue * 100 : undefined,
      vehicleTypes: formData.vehicleTypes.length > 0 ? formData.vehicleTypes : undefined,
    });
  };

  const handleVehicleTypeToggle = (type: "moto" | "carro" | "van") => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type]
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCoupons = coupons?.filter(c => c.isActive === 1) || [];
  const totalUsage = coupons?.reduce((sum, c) => sum + c.usedCount, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Gerenciar Cupons" />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gerenciar Cupons</h1>
            <p className="text-muted-foreground">Crie e gerencie cupons promocionais</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cupom promocional
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Código do Cupom *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="PRIMEIRAVIAGEM"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountType">Tipo de Desconto *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: "percentage" | "fixed") => 
                        setFormData({ ...formData, discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Desconto especial para novos usuários"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountValue">
                      Valor do Desconto * {formData.discountType === "percentage" ? "(%)" : "(R$)"}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      min="0"
                      max={formData.discountType === "percentage" ? "100" : undefined}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minRideValue">Valor Mínimo da Corrida (R$)</Label>
                    <Input
                      id="minRideValue"
                      type="number"
                      value={formData.minRideValue || ""}
                      onChange={(e) => setFormData({ ...formData, minRideValue: e.target.value ? Number(e.target.value) : undefined })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validFrom">Válido De *</Label>
                    <Input
                      id="validFrom"
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Válido Até *</Label>
                    <Input
                      id="validUntil"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUses">Usos Máximos (total)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={formData.maxUses || ""}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                      min="1"
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxUsesPerUser">Usos por Usuário</Label>
                    <Input
                      id="maxUsesPerUser"
                      type="number"
                      value={formData.maxUsesPerUser}
                      onChange={(e) => setFormData({ ...formData, maxUsesPerUser: Number(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Tipos de Veículo Permitidos</Label>
                  <div className="flex gap-4 mt-2">
                    {(["moto", "carro", "van"] as const).map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.vehicleTypes.includes(type)}
                          onChange={() => handleVehicleTypeToggle(type)}
                          className="w-4 h-4"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deixe vazio para permitir todos os tipos
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCoupon.isPending}>
                    {createCoupon.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar Cupom
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCoupons.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coupons?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Cupons</CardTitle>
            <CardDescription>Gerencie e visualize todos os cupons criados</CardDescription>
          </CardHeader>
          <CardContent>
            {coupons && coupons.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {coupon.description || "-"}
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : `R$ ${(coupon.discountValue / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : " / ∞"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(coupon.validFrom).toLocaleDateString("pt-BR")}</div>
                          <div className="text-muted-foreground">
                            até {new Date(coupon.validUntil).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.isActive === 1 ? (
                          <Badge className="bg-green-900/30 text-green-300">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.isActive === 1}
                          onCheckedChange={(checked) =>
                            toggleCoupon.mutate({ id: coupon.id, isActive: checked ? 1 : 0 })
                          }
                          disabled={toggleCoupon.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cupom criado ainda. Clique em "Novo Cupom" para começar!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
