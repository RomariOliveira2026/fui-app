import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import InstallPrompt from "./components/InstallPrompt";
import ScrollToTopButton from "./components/ScrollToTopButton";
import NotificationPrompt from "./components/NotificationPrompt";
import PushNotificationSetup from "./components/PushNotificationSetup";
import Home from "./pages/Home";
import { Loader2 } from "lucide-react";
import RequestRide from "./pages/RequestRide";
import RideDetails from "./pages/RideDetails";
import RideHistory from "./pages/RideHistory";
import BecomeDriver from "./pages/BecomeDriver";
import VehicleManagement from "./pages/VehicleManagement";
import DriverDashboard from "./pages/DriverDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import SavedAddresses from "./pages/SavedAddresses";
import DriverProfile from "./pages/DriverProfile";
import EmergencyContacts from "./pages/EmergencyContacts";
import LiveTracking from "./pages/LiveTracking";
import ScheduledRides from "./pages/ScheduledRides";
import FavoriteDrivers from "./pages/FavoriteDrivers";
import Referrals from "./pages/Referrals";
import Delivery from "./pages/Delivery";
import DeliveryDetail from "./pages/DeliveryDetail";
import UtilitiesHub from "./pages/UtilitiesHub";
import UtilityRequest from "./pages/UtilityRequest";
import UtilityDetail from "./pages/UtilityDetail";
import UtilityHistory from "./pages/UtilityHistory";

/** Admin e checkout isolados em lazy load — não carregam na Home. */
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminManage = lazy(() => import("./pages/AdminManage"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const PaymentCheckout = lazy(() => import("./pages/PaymentCheckout"));
const LicenseLanding = lazy(() => import("./pages/LicenseLanding"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function LazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  );
}

/** Legado: /admin/coupons redireciona para a aba de cupons no Financeiro. */
function AdminCouponsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/admin/finance?tab=coupons");
  }, [setLocation]);
  return <RouteFallback />;
}

/** Legado: /admin/analytics redireciona para Inteligência na Central Operacional. */
function AdminAnalyticsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/admin?view=intelligence");
  }, [setLocation]);
  return <RouteFallback />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"}>{() => <LazyRoute component={AdminDashboard} />}</Route>
      <Route path={"/admin/manage"}>{() => <LazyRoute component={AdminManage} />}</Route>
      <Route path={"/admin/coupons"} component={AdminCouponsRedirect} />
      <Route path="/admin/analytics" component={AdminAnalyticsRedirect} />
      <Route path="/admin/notifications">{() => <LazyRoute component={AdminNotifications} />}</Route>
      <Route path="/admin/finance">{() => <LazyRoute component={AdminFinance} />}</Route>
      <Route path={"/request-ride"} component={RequestRide} />
      <Route path="/ride/:id" component={RideDetails} />
      <Route path="/ride-history" component={RideHistory} />
      <Route path="/rides" component={RideHistory} />
      <Route path="/become-driver" component={BecomeDriver} />
      <Route path="/driver/vehicles" component={VehicleManagement} />
      <Route path="/driver-dashboard" component={DriverDashboard} />
      <Route path="/driver/history" component={RideHistory} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/profile" component={Profile} />
      <Route path="/saved-addresses" component={SavedAddresses} />
      <Route path="/emergency-contacts" component={EmergencyContacts} />
      <Route path="/track/:shareToken" component={LiveTracking} />
      <Route path="/scheduled-rides" component={ScheduledRides} />
      <Route path="/driver/:id" component={DriverProfile} />
      <Route path="/favorite-drivers" component={FavoriteDrivers} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/delivery" component={Delivery} />
      <Route path="/delivery/:id" component={DeliveryDetail} />
      <Route path="/utilities" component={UtilitiesHub} />
      <Route path="/utilities/request" component={UtilityRequest} />
      <Route path="/utilities/history" component={UtilityHistory} />
      <Route path="/utilities/:id" component={UtilityDetail} />
      <Route path="/payment/:rideId">{() => <LazyRoute component={PaymentCheckout} />}</Route>
      <Route path="/para-sua-cidade">{() => <LazyRoute component={LicenseLanding} />}</Route>
      <Route path="/licenca">{() => <LazyRoute component={LicenseLanding} />}</Route>
      <Route path="/fui-licenciamento">{() => <LazyRoute component={LicenseLanding} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <NotificationPrompt />
          <PushNotificationSetup />
          <ScrollToTopButton />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
