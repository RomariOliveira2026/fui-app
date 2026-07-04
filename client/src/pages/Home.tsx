import { useAuth } from "@/_core/hooks/useAuth";
import { WL } from "@/whitelabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Car, 
  MapPin, 
  DollarSign, 
  Star, 
  Shield, 
  Clock, 
  ArrowRight, 
  Smartphone,
  Users,
  Zap,
  Heart,
  Bike,
  Package,
  ChevronRight,
  Search,
  Home as HomeIcon,
  Briefcase,
  Loader2,
  Menu,
  X,
  History,
  Calendar,
  User,
  Settings,
  LogOut,
  Truck,
  CreditCard,
  ChevronLeft,
  Navigation
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { isLocalDemoDev } from "@/lib/demoMode";
import AppLogoMark from "@/components/fui/AppLogoMark";
import PassengerActiveRideCard from "@/components/passenger/PassengerActiveRideCard";
import PassengerDashboardHeader from "@/components/passenger/PassengerDashboardHeader";
import PassengerGreeting from "@/components/passenger/PassengerGreeting";
import PassengerPrimaryActionCard from "@/components/passenger/PassengerPrimaryActionCard";
import PassengerQuickActions from "@/components/passenger/PassengerQuickActions";
import PassengerRecentRides from "@/components/passenger/PassengerRecentRides";
import { repeatRide, saveRidePrefill, clearRidePrefill, isCompleteRidePrefill } from "@/lib/ridePrefill";
import PassengerSavedAddressesPanel from "@/components/passenger/PassengerSavedAddressesPanel";
import PassengerSummaryCards from "@/components/passenger/PassengerSummaryCards";
import { cn } from "@/lib/utils";
import { usePassengerDashboardData } from "@/lib/usePassengerDashboardData";
import { resolveDriverLandingPath } from "@shared/driverLanding";
import { getDefaultOriginSelection } from "@/lib/defaultOriginAddress";
import {
  consumePostAuthRedirect,
  hasDriverSignupIntent,
  peekPostAuthRedirect,
  setDriverSignupIntent,
  startDriverRegistrationFlow,
} from "@/lib/postAuthRedirect";

// ============================================
// LOGGED-IN HOME: Passenger dashboard
// ============================================

function LoggedInHome() {
  const { user, logout, canUsePrivateUserApi } = useAuth();
  const showAdminPanel = isLocalDemoDev() || user?.role === "admin";
  const [location, setLocation] = useLocation();
  const dashboard = usePassengerDashboardData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: myDriverProfile } = trpc.driver.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isSidebarPathActive = (path: string) =>
    location === path || location.startsWith(`${path}/`);

  const sidebarNavClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-lg text-sm transition-all",
      active
        ? "bg-primary/12 text-foreground font-medium border-l-2 border-primary pl-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        : "text-muted-foreground hover:bg-accent/80 hover:text-foreground border-l-2 border-transparent"
    );

  const sidebarIconClass = (active: boolean) =>
    cn("w-[18px] h-[18px] shrink-0", active ? "text-primary" : "text-primary/80");

  const openRequestFlow = (prefill?: { origin?: string; destination?: string }) => {
    const defaults = getDefaultOriginSelection();
    const originAddress = prefill?.origin?.trim() ?? defaults.address;
    const destinationAddress = prefill?.destination?.trim() ?? "";
    const draft = {
      originAddress,
      destinationAddress,
      vehicleType: "carro" as const,
    };

    if (isCompleteRidePrefill(draft)) {
      saveRidePrefill(draft);
    } else {
      clearRidePrefill();
    }
    setLocation("/request-ride");
  };

  return (
    <div className="min-h-screen bg-background">
      <>
        <PassengerDashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
            onProfileClick={() => setLocation(showAdminPanel ? "/admin" : "/profile")}
            isAdmin={showAdminPanel}
            canUsePrivateUserApi={canUsePrivateUserApi}
          />

          <main className="mx-auto max-w-screen-xl space-y-6 px-4 pb-10 pt-2">
            <PassengerGreeting name={dashboard.displayUser?.name} />

            {dashboard.activeRide ? (
              <PassengerActiveRideCard
                ride={dashboard.activeRide}
                onViewDetails={() => setLocation(`/ride/${dashboard.activeRide!.id}`)}
              />
            ) : (
              <PassengerPrimaryActionCard
                onRequestRide={() => openRequestFlow()}
                onScheduleRide={() => setLocation("/request-ride")}
              />
            )}

            <PassengerQuickActions
              hasHome={!!dashboard.homeAddress}
              hasWork={!!dashboard.workAddress}
              hasLastRide={!!dashboard.lastRide}
              onHome={() =>
                dashboard.homeAddress &&
                openRequestFlow({ destination: dashboard.homeAddress.address })
              }
              onWork={() =>
                dashboard.workAddress &&
                openRequestFlow({ destination: dashboard.workAddress.address })
              }
              onLastRide={() =>
                dashboard.lastRide &&
                openRequestFlow({
                  origin: dashboard.lastRide.originAddress,
                  destination: dashboard.lastRide.destinationAddress,
                })
              }
              onSavedAddresses={() => setLocation("/saved-addresses")}
              onHistory={() => setLocation("/ride-history")}
              onFavorites={() => setLocation("/favorite-drivers")}
            />

            <PassengerSummaryCards summary={dashboard.summary} />

            <PassengerRecentRides
              rides={dashboard.recentRides}
              onViewAll={() => setLocation("/ride-history")}
              onRequestFirst={() => openRequestFlow()}
              onRepeat={(ride) => repeatRide(ride, setLocation)}
            />

            <PassengerSavedAddressesPanel
              addresses={dashboard.savedAddresses}
              onUseAddress={(address) => openRequestFlow({ destination: address })}
              onManage={() => setLocation("/saved-addresses")}
            />
          </main>
      </>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[min(20rem,88vw)] bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="px-4 pt-3.5 pb-3 border-b border-border/80 shrink-0 bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent">
              <div className="flex items-center justify-between mb-2.5">
                <AppLogoMark />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground rounded-md"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/85 ring-2 ring-primary/25 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                  {dashboard.displayUser?.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate leading-tight">
                    {dashboard.displayUser?.name || "Usuário"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5">
                    {dashboard.displayUser?.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-0.5">
              {[
                { icon: Car, label: "Solicitar Corrida", action: () => openRequestFlow() },
                { icon: History, label: "Histórico de Corridas", path: "/ride-history" },
                { icon: Calendar, label: "Corridas Agendadas", path: "/scheduled-rides" },
                { icon: MapPin, label: "Endereços Salvos", path: "/saved-addresses" },
                { icon: User, label: "Meu Perfil", path: "/profile" },
                { icon: Shield, label: "Contatos de Emergência", path: "/emergency-contacts" },
              ].map((item) => {
                const active = "path" in item && item.path ? isSidebarPathActive(item.path) : false;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSidebarOpen(false);
                      if ("action" in item && item.action) item.action();
                      else if ("path" in item && item.path) setLocation(item.path);
                    }}
                    className={sidebarNavClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={sidebarIconClass(active)} strokeWidth={2} />
                    <span className="text-left leading-tight">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-border my-2" />

              {[
                { icon: Heart, label: "Motoristas Favoritos", path: "/favorite-drivers" },
                { icon: Package, label: "Fui! Entregas", path: "/delivery" },
                { icon: Truck, label: "Fui Utilitários", path: "/utilities" },
                { icon: Users, label: "Indique e Ganhe", path: "/referrals" },
              ].map((item) => {
                const active = isSidebarPathActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { setSidebarOpen(false); setLocation(item.path); }}
                    className={sidebarNavClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={sidebarIconClass(active)} strokeWidth={2} />
                    <span className="text-left leading-tight">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-border my-2" />

              <button
                onClick={() => { setSidebarOpen(false); startDriverRegistrationFlow(setLocation); }}
                className={sidebarNavClass(isSidebarPathActive("/driver/register"))}
                aria-current={isSidebarPathActive("/driver/register") ? "page" : undefined}
              >
                <Briefcase className={sidebarIconClass(isSidebarPathActive("/driver/register"))} strokeWidth={2} />
                <span className="text-left leading-tight">Cadastrar como Motorista</span>
              </button>

              {showAdminPanel && (
                <button
                  onClick={() => { setSidebarOpen(false); setLocation("/admin"); }}
                  className={sidebarNavClass(location.startsWith("/admin"))}
                  aria-current={location.startsWith("/admin") ? "page" : undefined}
                >
                  <Settings className={sidebarIconClass(location.startsWith("/admin"))} strokeWidth={2} />
                  <span className="text-left leading-tight">Central Operacional</span>
                </button>
              )}

              {(user?.role === "driver" || user?.role === "admin" || myDriverProfile) && (
                <button
                  onClick={() => { setSidebarOpen(false); setLocation("/driver-dashboard"); }}
                  className={sidebarNavClass(isSidebarPathActive("/driver-dashboard"))}
                  aria-current={isSidebarPathActive("/driver-dashboard") ? "page" : undefined}
                >
                  <Car className={sidebarIconClass(isSidebarPathActive("/driver-dashboard"))} strokeWidth={2} />
                  <span className="text-left leading-tight">Dashboard Motorista</span>
                </button>
              )}

              <div className="border-t border-border my-2" />

              <button
                onClick={async () => { await logout(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors border-l-2 border-transparent"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span className="text-left leading-tight">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// VISITOR HOME: Landing Page
// ============================================

function VisitorHome() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/request-ride");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-card/95 backdrop-blur-md border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {WL.logoUrl ? (
                <img src={WL.logoUrl} alt={`${WL.appName} - Mobilidade Urbana em ${WL.city}`} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-primary">{WL.appName}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/request-ride")} className="hidden md:flex">
  Entrar
</Button>
              <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-semibold text-primary">
                <Zap className="w-4 h-4" />
                Mobilidade urbana em {WL.city}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Transporte e mobilidade urbana em{" "}
                <span className="text-primary">{WL.city}</span> com{" "}
                <span className="text-primary">preços populares</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                O {WL.appName} é o aplicativo de transporte urbano que conecta você aos melhores motoristas de {WL.city}. 
                Solicite corridas de moto, carro, van ou utilitário com segurança, rapidez e preços justos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group"
                  onClick={handleGetStarted}
                >
                  Solicitar Corrida
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10"
                  onClick={() => startDriverRegistrationFlow(setLocation)}
                >
                  Quero Ser Motorista
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Corridas realizadas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-sm text-muted-foreground">Avaliação média</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Motoristas ativos</div>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[600px] rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center animate-float">
                      <Car className="w-16 h-16 text-primary-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">Seu motorista a caminho!</p>
                  </div>
                </div>
                <div className="absolute top-20 left-10 p-4 bg-card border border-border rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">2 min</div>
                      <div className="text-xs text-muted-foreground">Tempo de espera</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-20 right-10 p-4 bg-card border border-border rounded-xl shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">R$ 8,50</div>
                      <div className="text-xs text-muted-foreground">Preço justo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que escolher o <span className="text-primary">{WL.appName}</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia, segurança e economia em uma única plataforma de mobilidade urbana
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Segurança Garantida", description: "Motoristas verificados e corridas rastreadas em tempo real via GPS" },
              { icon: DollarSign, title: "Preços Justos", description: "Tarifas transparentes e preços populares, sem surpresas" },
              { icon: Clock, title: "Rapidez", description: "Encontre um motorista próximo em segundos" },
              { icon: Star, title: "Motoristas 5 Estrelas", description: "Profissionais avaliados e comprometidos" },
              { icon: Smartphone, title: "Fácil de Usar", description: "Interface intuitiva para solicitar corridas em poucos toques" },
              { icon: Heart, title: "Suporte Local", description: "Atendimento dedicado para passageiros e motoristas" }
            ].map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Escolha o veículo ideal
            </h2>
            <p className="text-xl text-muted-foreground">
              Diferentes opções de transporte para cada necessidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bike, name: "Moto", desc: "Rápido e econômico", color: "from-orange-500 to-red-500" },
              { icon: Car, name: "Carro", desc: "Confortável e seguro", color: "from-primary to-orange-600" },
              { icon: Users, name: "Van", desc: "Espaçoso para grupos", color: "from-orange-600 to-yellow-600" },
              { icon: Package, name: "Utilitário", desc: "Frete e mudanças", color: "from-yellow-600 to-orange-500" }
            ].map((vehicle, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-2 group cursor-pointer">
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${vehicle.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <vehicle.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{vehicle.name}</h3>
                  <p className="text-muted-foreground">{vehicle.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-card to-primary/5">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-2xl shadow-primary/20">
            <CardContent className="p-12 md:p-16 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
                Pronto para sua corrida?
              </h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Faça sua primeira corrida agora no {WL.appName}!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg group"
                  onClick={handleGetStarted}
                >
                  Solicitar Corrida Agora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10"
                  onClick={() => startDriverRegistrationFlow(setLocation)}
                >
                  Seja um Motorista
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              {WL.logoUrl ? (
                <img src={WL.logoUrl} alt={WL.appName} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-primary">{WL.appName}</span>
              )}
              <p className="text-muted-foreground">
                Transporte e mobilidade urbana em {WL.city}.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Passageiros</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/request-ride" className="hover:text-primary transition-colors">Solicitar Corrida</a></li>
                <li><a href="/scheduled-rides" className="hover:text-primary transition-colors">Corridas Agendadas</a></li>
                <li><a href="/ride-history" className="hover:text-primary transition-colors">Histórico</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Motoristas</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/driver/register" onClick={() => setDriverSignupIntent()} className="hover:text-primary transition-colors">Seja Motorista</a></li>
                <li><a href="/driver-dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/emergency-contacts" className="hover:text-primary transition-colors">Emergência</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {WL.appName} Mobilidade Urbana - {WL.city}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// AUTHENTICATED HOME ROUTER
// ============================================

function AuthenticatedHomeRouter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: driverProfile, isLoading: profileLoading } = trpc.driver.getMyProfile.useQuery(
    undefined,
    { enabled: !!user, retry: false, refetchOnWindowFocus: false }
  );
  const { data: application, isLoading: applicationLoading } =
    trpc.driverRegistration.getMyApplication.useQuery(undefined, {
      enabled: !!user,
      retry: false,
      refetchOnWindowFocus: false,
    });

  const redirectPath = useMemo(
    () =>
      resolveDriverLandingPath({
        role: user?.role,
        driverProfile: driverProfile ?? null,
        application: application ?? null,
        hasDriverSignupIntent: hasDriverSignupIntent(),
        postAuthRedirect: peekPostAuthRedirect(),
      }),
    [user?.role, driverProfile, application]
  );

  useEffect(() => {
    if (!redirectPath) return;
    consumePostAuthRedirect();
    setLocation(redirectPath);
  }, [redirectPath, setLocation]);

  if (profileLoading || applicationLoading || redirectPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <LoggedInHome />;
}

// ============================================
// MAIN HOME COMPONENT
// ============================================

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomeRouter />;
  }

  return <VisitorHome />;
}
