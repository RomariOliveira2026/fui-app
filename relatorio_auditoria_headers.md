# Relatório de Auditoria de Headers -- Fui! App

**Data:** 21 de março de 2026  
**Escopo:** Todas as 22 páginas do aplicativo Fui!  
**Objetivo:** Identificar telas sem o componente padronizado `AppHeader` e avaliar quais precisam de correção.

---

## Resumo Executivo

O aplicativo Fui! possui **22 páginas** no diretório `client/src/pages/`. Destas, **15 já utilizam o componente padronizado `AppHeader`**, que inclui o logo "Fui!", seta de voltar para a Home, e o centro de notificações. As **7 páginas restantes** foram analisadas individualmente para determinar se a ausência do `AppHeader` é intencional (por contexto de uso) ou se representa uma inconsistência que precisa ser corrigida.

---

## Páginas com AppHeader (15 de 22) -- OK

Estas páginas já estão padronizadas e não precisam de ajuste:

| Página | Título no Header |
|---|---|
| AdminDashboard.tsx | Painel Administrativo |
| Analytics.tsx | Analytics & Relatórios |
| BecomeDriver.tsx | Tornar-se Motorista |
| CompleteProfile.tsx | *(sem título, apenas logo)* |
| CouponManagement.tsx | Gerenciar Cupons |
| DriverDashboard.tsx | Painel do Motorista |
| DriverProfile.tsx | Perfil do Motorista |
| EmergencyContacts.tsx | *(sem título, apenas logo)* |
| Profile.tsx | *(sem título, apenas logo)* |
| RequestRide.tsx | Solicitar Corrida |
| RideDetails.tsx | Detalhes da Corrida |
| RideHistory.tsx | Histórico de Corridas |
| SavedAddresses.tsx | Endereços Salvos |
| ScheduledRides.tsx | Corridas Agendadas |
| VehicleManagement.tsx | Gerenciar Veículos |

---

## Páginas sem AppHeader (7 de 22) -- Análise Detalhada

| Página | Navegação Atual | Precisa de Ajuste? | Justificativa |
|---|---|---|---|
| **Home.tsx** | Sidebar com menu lateral | Não | Página principal do app. A navegação é feita pelo menu hamburger na sidebar. Não faz sentido ter seta de "voltar". |
| **NotFound.tsx** | Botão "Voltar ao Início" | Não | Página de erro 404, fora do fluxo principal. O botão de retorno existente é suficiente. |
| **ComponentShowcase.tsx** | Nenhuma | Não | Página de desenvolvimento/debug para testar componentes. Não é acessível ao usuário final. |
| **LiveTracking.tsx** | Header customizado com título | Não | Página de acesso público via link compartilhável. Usuários externos não precisam de navegação interna do app. |
| **Delivery.tsx** | Header customizado (ArrowLeft + título) | **Sim** | Usa header manual com `ArrowLeft` em vez do `AppHeader` padronizado. Funciona, mas é visualmente inconsistente com as demais telas. |
| **FavoriteDrivers.tsx** | Header customizado (ArrowLeft + título) | **Sim** | Mesmo caso: header manual com estilo diferente do padrão. Deve ser substituído pelo `AppHeader` para manter consistência visual. |
| **Referrals.tsx** | Header customizado (ArrowLeft + título) | **Sim** | Mesmo caso: header manual com layout próprio. Falta o logo "Fui!" e o centro de notificações presentes no `AppHeader`. |

---

## Telas que Precisam de Correção

As **3 telas** abaixo utilizam um header customizado com botão de voltar manual (`ArrowLeft`) em vez do componente padronizado `AppHeader`. Embora funcionem, elas apresentam inconsistências visuais em relação às demais páginas do app:

**1. Delivery.tsx (Entregas)**  
O header atual usa `sticky top-0 bg-background/95 backdrop-blur` com um botão `ArrowLeft` manual. Falta o logo "Fui!" e o centro de notificações. O estilo do header (cor de fundo, altura, espaçamento) difere do `AppHeader` que usa `bg-card` com `h-16`.

**2. FavoriteDrivers.tsx (Motoristas Favoritos)**  
Mesmo padrão do Delivery: header manual com `ArrowLeft`, sem logo e sem notificações. O layout é visualmente diferente das páginas que usam `AppHeader`.

**3. Referrals.tsx (Indique e Ganhe)**  
Header manual idêntico aos anteriores. Quando o usuário navega entre "Indique e Ganhe" e "Perfil", por exemplo, percebe a diferença visual entre os headers.

---

## Impacto da Inconsistência

A diferença entre os dois tipos de header é sutil mas perceptível:

| Aspecto | AppHeader (padrão) | Header customizado |
|---|---|---|
| Logo "Fui!" | Presente | Ausente |
| Centro de notificações | Presente | Ausente |
| Cor de fundo | `bg-card` | `bg-background/95` |
| Altura | `h-16` fixa | Variável (`py-3`) |
| Estilo visual | Consistente em 15 telas | Diferente em 3 telas |

---

## Recomendação

Substituir o header customizado das 3 telas identificadas pelo componente `AppHeader`, passando o título correspondente via prop. A correção é simples e rápida, envolvendo apenas a remoção do bloco de header manual e a adição de `<AppHeader title="..." />` no lugar.

| Página | Prop `title` sugerida |
|---|---|
| Delivery.tsx | `"Entregas"` |
| FavoriteDrivers.tsx | `"Motoristas Favoritos"` |
| Referrals.tsx | `"Indique e Ganhe"` |
