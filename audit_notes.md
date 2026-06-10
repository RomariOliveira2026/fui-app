# Auditoria Visual - Observações

## Home (logado)
- Tela principal OK: fundo escuro, texto legível, inputs com borda visível
- Mapa mostra "Erro ao carregar o mapa" (esperado no sandbox, funciona em produção)
- Bottom sheet: "Para onde, Romário?" visível, inputs OK
- Notificação prompt: visível e legível
- Botões hamburger e notificação: visíveis com bg-card

## Cores convertidas
- Todas as páginas convertidas de cores hardcoded (#0A0F14, #14222E, #1E2A35) para semânticas (bg-background, bg-card, border-border)
- text-gray-* convertidos para text-muted-foreground / text-foreground
- text-white convertido para text-foreground
- Componentes AddressAutocomplete, GoogleMap, Map, ChatBox, RideChat, RateDriverModal, RatingStars, InstallPrompt, NotificationPrompt corrigidos

## AppHeader adicionado
- DriverDashboard, AdminDashboard, Analytics, CouponManagement, RideDetails: AppHeader adicionado
- SavedAddresses, ScheduledRides, RequestRide: já tinham AppHeader

## Cores intencionalmente mantidas
- #F39200 (laranja principal da marca) - mantido como cor de destaque
- #D46A03 (hover do laranja) - mantido
- bg-[#F39200]/10, bg-[#F39200]/20 - transparências do laranja mantidas
- text-white no avatar (sobre fundo laranja) - mantido
- Cores de status (yellow, green, blue, red) em badges - mantidas
