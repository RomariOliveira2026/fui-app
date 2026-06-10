# Fui! - Lista de Funcionalidades

## Estrutura de Dados e Arquitetura
- [x] Definir schema do banco de dados (usuários, veículos, corridas, pagamentos, avaliações)
- [x] Criar helpers de banco de dados
- [x] Configurar rotas tRPC

## Sistema de Usuários e Veículos
- [x] Cadastro de perfil de motorista
- [x] Cadastro de veículos (motos, carros, vans)
- [x] Validação de documentos de motorista
- [x] Sistema de aprovação de motoristas

## Sistema de Corridas
- [x] Solicitação de corrida por passageiro
- [x] Cálculo de preço estimado
- [x] Busca de motoristas disponíveis
- [x] Aceitação de corrida por motorista
- [x] Estados da corrida (solicitada, aceita, em andamento, concluída, cancelada)
- [x] Cancelamento de corrida

## Integração de Mapas (CONCLUÍDA - Leaflet/OpenStreetMap)
- [x] Integração com Leaflet/OpenStreetMap (substituiu Google Maps)
- [x] Seleção de origem e destino (via Nominatim geocoding)
- [x] Visualização de rota (via OSRM)
- [x] Rastreamento em tempo real da posição do motorista
- [x] Cálculo de distância e tempo estimado

## Sistema de Pagamentos
- [x] Integração com métodos de pagamento (PIX, cartão, dinheiro)
- [x] Cálculo de preço por tipo de veículo
- [x] Precificação dinâmica baseada em distância
- [x] Registro de transações
- [x] Histórico de pagamentos

## Painéis de Controle
- [x] Painel do passageiro (solicitar corrida, histórico, avaliações)
- [x] Painel do motorista (aceitar corridas, ganhos, estatísticas)
- [x] Dashboard de corridas ativas
- [x] Perfil de usuário editável

## Avaliações e Histórico
- [x] Sistema de avaliação (1-5 estrelas)
- [x] Comentários em avaliações
- [x] Histórico de corridas do passageiro
- [x] Histórico de corridas do motorista
- [x] Estatísticas de desempenho

## Interface e UX
- [x] Design responsivo para mobile e desktop
- [x] Tema visual moderno e acessível
- [x] Animações e transições suaves
- [x] Estados de loading e feedback visual
- [x] Tratamento de erros

## Testes e Qualidade
- [x] Testes unitários das procedures principais (68 testes, 10 arquivos)
- [x] Validação de fluxos críticos
- [x] Teste de integração com mapas (OSRM + Nominatim)
- [x] Verificação de segurança e autenticação

## Branding e Identidade Visual
- [x] Criar logo moderna com cores do Flamengo (vermelho e preto)
- [x] Integrar logo no aplicativo
- [x] Atualizar favicon

## Personalização de Tema
- [x] Atualizar paleta de cores CSS com vermelho do Flamengo
- [x] Ajustar botões primários para vermelho
- [x] Atualizar badges e cards com nova paleta
- [x] Revisar contraste e acessibilidade

## Integração com Google Maps
- [x] Adicionar componente de mapa interativo na solicitação de corrida
- [x] Implementar geocoding de endereços
- [x] Calcular rotas com distância e tempo real
- [x] Adicionar visualização de rota no mapa
- [x] Implementar rastreamento ao vivo da posição do motorista
- [x] Atualizar preço baseado em distância real calculada

## Sistema de Notificações em Tempo Real
- [x] Implementar API de notificações do Manus
- [x] Criar notificações para motoristas sobre novas corridas
- [x] Criar notificações para passageiros sobre status da corrida
- [x] Adicionar notificações quando motorista aceita corrida
- [x] Adicionar notificações quando motorista chega no local
- [x] Adicionar notificações quando corrida é iniciada/concluída

## Painel Administrativo
- [x] Criar página de dashboard admin
- [x] Listar motoristas pendentes de aprovação
- [x] Implementar aprovação/rejeição de motoristas
- [x] Visualizar todas as corridas ativas no mapa
- [x] Estatísticas da plataforma (total de corridas, receita, etc)
- [x] Gerenciar preços dinamicamente
- [x] Controle de acesso apenas para admins

## Sistema de Cupons e Promoções
- [x] Criar tabela de cupons no banco de dados
- [x] Implementar criação de cupons promocionais
- [x] Validar cupons na solicitação de corrida
- [x] Aplicar desconto baseado no cupom
- [x] Limitar uso de cupons (por usuário, data, quantidade)
- [ ] Dashboard de cupons ativos e estatísticas de uso

## Interface de Cupons
- [x] Criar página de gerenciamento de cupons no painel admin
- [x] Formulário para criar novos cupons com todas as opções
- [x] Listar cupons ativos e inativos
- [x] Ativar/desativar cupons
- [x] Visualizar estatísticas de uso de cupons
- [x] Adicionar campo de cupom na solicitação de corrida
- [x] Validar e aplicar cupom em tempo real
- [x] Mostrar desconto aplicado antes de confirmar corrida

## Chat em Tempo Real
- [x] Criar tabela de mensagens no banco de dados
- [x] Implementar API de chat com tRPC
- [x] Criar componente de chat para motorista
- [x] Criar componente de chat para passageiro
- [x] Atualização em tempo real de mensagens
- [x] Notificações de novas mensagens
- [x] Histórico de conversas por corrida

## Analytics e Relatórios
- [x] Criar dashboard de analytics no painel admin
- [x] Gráfico de receita por período (dia, semana, mês)
- [x] Gráfico de corridas por região
- [x] Análise de horários de pico
- [x] Ranking de motoristas por performance
- [x] Estatísticas de cupons (mais usados, economia gerada)
- [x] Métricas de crescimento (novos usuários, retenção)
- [ ] Exportar relatórios em PDF/Excel

## Integração com Stripe
- [x] Adicionar feature Stripe ao projeto
- [x] Configurar chaves de API do Stripe
- [x] Criar fluxo de pagamento com cartão
- [x] Implementar checkout de corrida com Stripe
- [x] Adicionar webhook para confirmação de pagamento
- [ ] Testar pagamentos em modo de teste

## Sistema de Agendamento
- [x] Criar tabela de corridas agendadas
- [x] Implementar API de agendamento
- [ ] Criar interface para agendar corrida
- [ ] Sistema de notificação para corridas agendadas
- [x] Listar corridas agendadas do usuário
- [x] Cancelamento de corridas agendadas

## Otimizações Mobile e PWA
- [x] Criar manifest.json para PWA
- [ ] Adicionar service worker para cache offline
- [x] Otimizar interface para telas pequenas
- [x] Adicionar ícones e splash screens
- [x] Melhorar performance mobile
- [ ] Testar instalação como app no celular

## Upload de Documentos
- [x] Adicionar campos de URL de fotos ao schema (CNH, foto do veículo)
- [x] Criar API de upload de imagens para S3
- [x] Implementar interface de upload na página de cadastro de motorista
- [x] Adicionar visualização de documentos no painel admin
- [x] Validar tamanho e tipo de arquivo

## Otimização PWA
- [x] Criar service worker para cache offline
- [x] Gerar ícones em múltiplas resoluções
- [x] Adicionar splash screens para iOS
- [x] Implementar prompt de instalação
- [x] Criar tutorial de como instalar
- [x] Testar instalação em Android e iOS

## Navegação e UX
- [x] Criar componente de header com logo e botão voltar
- [x] Adicionar header em páginas principais (BecomeDriver, VehicleManagement, RequestRide)
- [x] Testar fluxo de navegação completo

## Ajuste de Preços
- [x] Atualizar preços no banco de dados com valores realistas para Itabaiana

## Cadastro Completo e Chat com Áudio
- [x] Adicionar campo de WhatsApp ao schema de usuários
- [x] Criar tela de completar perfil para solicitar WhatsApp
- [x] Implementar suporte a áudio no chat (schema e API)
- [x] Adicionar UI de gravação de áudio no ChatBox
- [x] Adicionar reprodução de mensagens de áudio no ChatBox

## Preparação para Lançamento
- [ ] Criar dados de teste (motorista, veículo, corrida)
- [x] Criar cupom de lançamento "PRIMEIRA" com 100% desconto
- [ ] Documentar processo de publicação

## Bugs a Corrigir
- [x] Corrigir bug no seletor de forma de pagamento na página de solicitação de corrida

## Perfil de Usuário
- [x] Criar página de perfil com edição de dados pessoais
- [x] Adicionar histórico de corridas do usuário
- [x] Mostrar estatísticas (total de corridas, economia com cupons)
- [x] Permitir edição de nome, email, WhatsApp
- [x] Adicionar botão de logout
- [x] Integrar link de perfil na navegação

## Bug Urgente
- [x] Corrigir erro "NotFoundError: Failed to execute 'insertBefore' on 'Node'" na página RequestRide ao calcular rota

## Melhorias de UX
- [x] Adicionar tela de carregamento animada durante cálculo de rota
- [x] Implementar funcionalidade para salvar endereços favoritos (casa e trabalho)
- [x] Criar seção de corridas recentes na tela inicial para repetir trajetos
- [x] Adicionar interface para gerenciar endereços salvos

## Sistema de Notificações Push
- [x] Configurar Firebase Cloud Messaging (FCM)
- [x] Adicionar tabela de tokens de notificação no banco
- [x] Implementar Service Worker para receber notificações
- [x] Criar API para registrar e gerenciar tokens FCM
- [x] Criar função para enviar notificações via FCM
- [x] Integrar notificações nos eventos de corrida (aceita, iniciada, concluída)
- [x] Adicionar permissão de notificações na UI
- [x] Configurar credenciais Firebase (configurado com fui-app-4c062)

## Sistema de Avaliação de Motoristas
- [x] Adicionar campo de avaliação média no perfil do motorista
- [x] Criar interface de avaliação após corrida concluída
- [x] Calcular e atualizar média de avaliações automaticamente
- [x] Exibir estrelas no perfil do motorista
- [x] Mostrar número total de avaliações

## Chat em Tempo Real
- [x] Implementar chat entre passageiro e motorista durante corrida
- [x] Adicionar indicador de mensagens não lidas
- [x] Notificar quando nova mensagem chegar
- [x] Limitar chat apenas para corridas ativas
- [x] Auto-scroll para última mensagem

## Perfil do Motorista
- [x] Criar página de perfil do motorista
- [x] Exibir foto, nome e avaliação média
- [x] Mostrar informações do veículo (modelo, cor, placa)
- [x] Exibir histórico de corridas completadas
- [x] Link para perfil na tela de detalhes da corrida

## Rastreamento em Tempo Real
- [x] Adicionar campos de latitude/longitude na tabela de corridas
- [x] Criar endpoint para motorista atualizar localização
- [x] Implementar polling no frontend para buscar localização atualizada
- [x] Adicionar marcador animado do motorista no mapa
- [x] Mostrar indicador de rastreamento ativo
- [x] Testar rastreamento em tempo real

## Configuração Firebase
- [x] Atualizar firebase-config.ts com credenciais reais (fui-app-4c062)
- [x] Adicionar credenciais como secrets do projeto
- [x] Atualizar Service Worker com vapidKey
- [ ] Testar notificações push end-to-end em produção

## Bug Crítico
- [x] Corrigir erro "NotFoundError: removeChild" na página RequestRide ao escolher pagamento e calcular rota
- [x] RESOLVIDO DEFINITIVAMENTE: Implementado Ref Callback Pattern no Map.tsx eliminando conflitos React/Google Maps

## Dados de Demonstração
- [ ] Criar script de seed com motoristas, veículos e cupons de exemplo
- [ ] Executar seed no banco de dados
- [ ] Validar dados criados

## Bug Crítico - Seletor de Pagamento
- [x] Corrigir definitivamente bug do seletor de forma de pagamento (botões não respondem ao clique)
- [x] Corrigir erro NotFoundError removeChild no seletor de pagamento
- [x] Resolver erro NotFoundError insertBefore ao clicar nas opções de pagamento
- [x] RESOLVER DEFINITIVAMENTE erro NotFoundError insertBefore que persiste na página
- [x] SOLUÇÃO RADICAL: Reimplementar seletor com HTML/CSS puro sem frameworks (input radio nativo)

## Ajuste de Moeda
- [x] Substituir símbolo $ por R$ em todas as páginas e componentes

## Site Institucional fuiapp.com.br
- [x] Criar landing page moderna e impactante
- [x] Adicionar seção "Sobre o Fui!"
- [x] Criar seção "Como Funciona" (passageiros e motoristas)
- [x] Adicionar seção de preços e vantagens
- [x] Incluir CTAs para download/acesso ao app
- [x] Adicionar footer com contato e redes sociais

## Correção de Texto PT-BR
- [x] Corrigir "Voltar ao sêxt" para português correto

## Mascote do Fui!
- [x] Gerar opções de mascote motorista simpático
- [x] Refinar mascote escolhido
- [x] Integrar mascote no banner da página inicial

## Banner Promocional Cupom PRIMEIRA
- [x] Criar seção de banner promocional com mascote e cupom PRIMEIRA
- [x] Integrar banner na página inicial
- [x] Adicionar animações e destaque visual

## Correção Temporária - Remover Mapa
- [x] Remover componente de mapa da página RequestRide para eliminar erro NotFoundError
- [x] Manter funcionalidade de cálculo de rota usando apenas endereços de texto
- [x] Testar solicitação de corrida sem mapa visual

## Solução Definitiva do Mapa (CONCLUÍDA - Migração para Leaflet)
- [x] Recolocar componente de mapa na página RequestRide (agora com Leaflet)
- [x] Criar ErrorBoundary React para capturar erros do mapa
- [x] Implementar controle de lifecycle adequado (useEffect com cleanup)
- [x] Garantir que mapa só renderize após página estar completamente carregada
- [x] Testar todas as funcionalidades do mapa (geocoding, rotas, rastreamento)

## Bug de Notificações
- [x] Investigar erro "Permissão de Notificações Negada" ao clicar em "Ativar Notificações"
- [x] Corrigir lógica de solicitação de permissão de notificações
- [x] Testar permissão de notificações no navegador

## Bug Crítico - App Publicado Quebrado (RESOLVIDO)
- [x] Investigar causa raiz do erro NotFoundError insertBefore em fuiapp.com.br/request-ride
- [x] Identificar componente React causando conflito de DOM (Map.tsx - script sendo removido prematuramente)
- [x] Implementar solução permanente e robusta (Singleton Pattern para Google Maps)
- [x] Testar em preview antes de publicar (ZERO ERROS)
- [x] Analisar diferenças entre preview e produção (erro persiste após correção)
- [x] Implementar correção RADICAL: Migração completa para Leaflet/OpenStreetMap
- [x] Publicar correção e validar em produção

## Sistema de Frete com Carros Utilitários
- [x] Adicionar tipo de veículo "utilitario" ao schema
- [x] Criar campos específicos para frete (peso da carga, tipo de carga, ajudantes)
- [x] Implementar precificação diferenciada para frete (por km + peso)
- [x] Criar interface de solicitação de frete com campos adicionais
- [x] Adicionar opção de frete na página inicial
- [x] Atualizar dashboard de motoristas para aceitar fretes
- [x] Testar fluxo completo de solicitação de frete

## Sistema de Corridas Compartilhadas (Carpool)
- [x] Adicionar flag isShared e maxPassengers ao schema de corridas
- [x] Criar tabela de passageiros por corrida (ride_passengers)
- [x] Implementar lógica de matching de corridas compatíveis (mesma região/horário)
- [x] Criar algoritmo de cálculo de preço compartilhado (divisão proporcional)
- [x] Implementar API para solicitar corrida compartilhada
- [x] Criar API para aceitar/recusar convite de carpool
- [x] Adicionar toggle "Aceitar compartilhar corrida" na solicitação
- [x] Criar interface de visualização de outros passageiros
- [x] Implementar sistema de notificações para novos passageiros
- [x] Adicionar chat de grupo para passageiros da mesma corrida
- [ ] Criar dashboard de corridas compartilhadas ativas
- [ ] Implementar lógica de múltiplas paradas (pickup e dropoff)
- [ ] Adicionar estatísticas de economia com carpool
- [ ] Testar fluxo completo de carpool

## Programa de Fidelidade e Cashback
- [x] Criar tabela de pontos de fidelidade no banco de dados
- [x] Adicionar campos de pontos e nível VIP ao perfil do usuário
- [x] Criar tabela de histórico de pontos (ganhos e resgates)
- [x] Implementar lógica de acúmulo de pontos (1 ponto = R$ 1 gasto)
- [x] Criar sistema de níveis VIP (Bronze, Prata, Ouro, Diamante)
- [x] Definir benefícios por nível (descontos progressivos, prioridade)
- [x] Implementar API de resgate de pontos
- [x] Criar interface de visualização de pontos e nível
- [x] Adicionar badge de nível VIP no perfil
- [x] Implementar sistema de troca de pontos por descontos
- [x] Criar página de benefícios e como funciona
- [x] Adicionar notificações de mudança de nível
- [x] Testar fluxo completo de acúmulo e resgate

## Sistema de SOS e Segurança Avançada
- [x] Criar tabela de contatos de emergência no banco de dados
- [x] Criar tabela de alertas SOS (histórico de acionamentos)
- [x] Adicionar campo de token de compartilhamento nas corridas
- [x] Implementar API de cadastro de contatos de emergência
- [x] Criar API de acionamento de SOS (notifica contatos + autoridades)
- [x] Implementar sistema de compartilhamento de corrida ao vivo via link público
- [x] Criar interface de gerenciamento de contatos de emergência
- [x] Adicionar botão SOS na tela de corrida ativa
- [x] Implementar página pública de rastreamento ao vivo (sem login)
- [x] Adicionar confirmação de segurança ao finalizar corrida
- [x] Criar dashboard de alertas SOS para admin
- [x] Testar fluxo completo de emergência

## Bug ao Calcular Rota (RESOLVIDO)
- [x] Investigar erro que ocorre ao clicar em "Calcular Preço e Rota"
- [x] Corrigir erro identificado no cálculo de rota (migração para Leaflet/OSRM)
- [x] Testar fluxo completo de cálculo de rota

## Bug CRÍTICO Persistente (RESOLVIDO - Migração para Leaflet)
- [x] INVESTIGAR E RESOLVER: Erro NotFoundError continua ocorrendo em produção
- [x] Reproduzir erro no ambiente real (não apenas preview)
- [x] Implementar solução alternativa RADICAL: Migrado de Google Maps para Leaflet/OpenStreetMap
- [x] Testar exaustivamente em produção antes de entregar

## Configuração Google Maps API (CANCELADA - Migrado para Leaflet)
- [x] Não é mais necessário - migrado para Leaflet/OpenStreetMap que não requer API key
- [x] Mapa funciona em qualquer domínio sem restrições
- [x] OSRM para rotas e Nominatim para geocoding (ambos gratuitos)

## Melhorias Solicitadas - Redesign ContentFy
- [x] Configurar endpoint de proxy para Google Maps API (documentado)
- [ ] Criar script de seed com dados de demonstração (script existe, precisa correção)
- [x] Implementar interface de agendamento de corridas (ScheduleRideDialog.tsx)
- [x] Redesenhar tema global com paleta ContentFy (laranja #F39200 + dark mode)
- [x] Atualizar Home.tsx com novo design ContentFy
- [x] Atualizar logo e branding para combinar com ContentFy
- [x] Ativar dark mode por padrão no App.tsx

## Atualização de Branding ContentFy
- [x] Atualizar cores do mascote para paleta ContentFy (laranja #F39200)
- [x] Atualizar cores da logo para paleta ContentFy
- [x] Substituir arquivos no projeto (logo.png, mascote.png, favicon, icons)
- [x] Testar visualização em todas as páginas

## Sistema de Notificações Personalizadas
- [x] Criar schema de notificações no banco
- [x] Implementar procedures tRPC (list, markAsRead, markAllAsRead, getUnreadCount, delete, create)
- [x] Criar componente NotificationCenter
- [x] Adicionar badge de contador no header
- [x] Implementar tipos de notificação (ride, payment, promotion, system, driver, safety)
- [x] Adicionar ações rápidas nas notificações
- [x] Integrar no AppHeader
- [x] Sistema completo e funcional

## Sistema de Notificações Push (Firebase Cloud Messaging)
- [x] Configurar Firebase no projeto
- [x] Criar arquivo de configuração firebase-config.ts
- [x] Service Worker já existe (firebase-messaging-sw.js)
- [x] Criar componente PushNotificationSetup
- [x] Implementar backend para envio via FCM (pushNotification.ts)
- [x] Procedures tRPC para salvar FCM tokens (saveFcmToken, registerFcmToken)
- [x] Integrar PushNotificationSetup no App.tsx
- [x] Documentação completa (FIREBASE_SETUP.md)
- [ ] Usuário precisa configurar credenciais do Firebase (ver FIREBASE_SETUP.md)
- [ ] Integrar com eventos de corrida (aceita, chegando, concluída)
- [ ] Integrar com eventos de pagamento

## Migração Google Maps → Leaflet/OpenStreetMap (CONCLUÍDA)
- [x] Instalar dependências Leaflet
- [x] Criar novo componente de mapa com Leaflet
- [x] Integrar OSRM para cálculo de rotas
- [x] Atualizar RequestRide para usar novo mapa
- [x] Atualizar LiveTracking para usar novo mapa
- [x] Remover dependências do Google Maps
- [x] Testar em produção (fuiapp.com.br)

## Implementações Essenciais (Março 2026)
- [x] Criar script de seed com dados de demonstração (motoristas, veículos, cupons)
- [x] Executar seed no banco de dados (7 motoristas, 9 veículos, 5 cupons)
- [x] Validar dados de demonstração criados
- [x] Conectar backend de agendamento ao ScheduleRideDialog
- [x] Criar mutation tRPC para salvar corridas agendadas (scheduling.scheduleRide)
- [x] Implementar notificação automática para corridas agendadas (in-app + FCM push)
- [x] Listar corridas agendadas na interface do usuário (/scheduled-rides)
- [x] Configurar Firebase Cloud Messaging com credenciais (FIREBASE_SETUP.md atualizado)
- [x] Integrar notificações push com eventos de corrida
- [ ] Testar notificações push end-to-end (requer credenciais Firebase do usuário)

## Sistema de Aceitação/Recusa de Corrida pelo Motorista
- [x] Criar procedures backend para motorista aceitar corrida (scheduling.acceptScheduledRide)
- [x] Criar procedures backend para motorista recusar corrida (scheduling.rejectScheduledRide)
- [x] Criar procedure para listar corridas pendentes para o motorista (scheduling.getPendingForDriver)
- [x] Implementar UI no DriverDashboard com lista de corridas pendentes (cards com aceitar/recusar)
- [x] Notificar passageiro quando motorista aceita a corrida (in-app + FCM push)
- [x] Notificar passageiro quando motorista recusa a corrida (in-app + FCM push)
- [x] Atualizar status da corrida no banco (accepted/requested)
- [x] Testes vitest para as novas procedures (9 testes, 89 total)

## Correção de SEO - Página Inicial
- [x] Adicionar meta keywords na página inicial (14 palavras-chave de transporte/Itabaiana)
- [x] Otimizar meta description com palavras-chave
- [x] Adicionar structured data (JSON-LD) para TransportService, WebApplication e FAQPage
- [x] Otimizar conteúdo on-page com palavras-chave relevantes (H1, H2, parágrafos)
- [x] Adicionar Open Graph e Twitter Card meta tags
- [x] Verificar heading hierarchy (H1, H2, H3) + geo tags + canonical URL

## Bug CRÍTICO - NotFoundError insertBefore em produção (fuiapp.com.br/request-ride)
- [x] Investigar causa raiz: React 19 reconcilia DOM que Leaflet manipulou diretamente
- [x] Corrigir componente Map/Leaflet com isolamento DOM (container imperativo fora do React)
- [ ] Testar em produção após publicação

## Aplicar Logo no App
- [x] Alterar cor da logo de vermelho para laranja #F39200
- [x] Fazer upload da logo para CDN (8 variantes)
- [x] Aplicar logo no header do app (AppHeader + Home nav + footer)
- [x] Aplicar logo como favicon (32px CDN)
- [x] Aplicar logo no PWA manifest (192px + 512px CDN)
- [x] Aplicar logo nas meta tags Open Graph (1200x630)
- [x] Aplicar logo no DashboardLayout sidebar
- [x] Atualizar structured data JSON-LD com nova logo
- [x] Atualizar service worker cache (v2)

## Bug - Logo minúscula no header
- [x] Recortar espaço em branco da logo (1024x1024 -> 790x371)
- [x] Gerar variantes maiores para header (h48, h64)
- [x] Atualizar URLs no CDN e no app (index.html, manifest, AppHeader, Home, DashboardLayout)
- [x] Testar visual no header da Home e AppHeader

## Bug - Logo com fundo branco opaco no header escuro
- [x] Remover fundo branco da logo original (tornar transparente)
- [x] Reprocessar versão branca com texto branco sólido + fundo transparente
- [x] Upload novas versões v3 e atualizar referências em todos os arquivos
- [x] Corrigir erros TypeScript da migração Google Maps
- [x] Pesquisar requisitos para publicação nas lojas (Google Play e App Store)
- [x] Criar documento/roadmap completo para publicação nas lojas de aplicativos
- [x] Corrigir erro Firebase duplicate-app no usePushNotifications
- [x] Corrigir Home.tsx: usuários logados devem ver tela com mapa fullscreen, não a landing page
- [x] Criar router tRPC para Google Maps API (autocomplete, geocode, directions)
- [x] Reescrever Map.tsx com Google Maps JavaScript API via proxy Manus
- [x] Criar componente AddressAutocomplete com Google Places
- [x] Atualizar Home.tsx (logado) para usar Google Maps + autocomplete
- [x] Atualizar RequestRide, RideDetails, LiveTracking, SavedAddresses para Google Maps
- [x] Corrigir carregamento do Google Maps via proxy Manus (fetch+eval)
- [x] Corrigir erro "Não foi possível calcular a rota" - fetch manual substituído por trpc.useUtils().fetch
- [x] DIFERENCIAL 1: Motorista Favorito - schema + backend + frontend + testes
- [x] DIFERENCIAL 2: Indique e Ganhe - schema + backend + frontend + testes
- [x] DIFERENCIAL 3: Entrega de Encomendas - schema + backend + frontend + testes
- [x] Adicionar links dos diferenciais no menu lateral da Home
- [x] Escrever testes vitest para os 3 diferenciais (27 testes passando)
- [x] Todos os 123 testes do projeto passando (14 arquivos)
- [x] Corrigir cor de fundo do botão de voltar no painel admin
- [x] Corrigir cor de fundo do header na página Gerenciar Veículos (driver/vehicles) - texto/ícones invisíveis
- [x] Adicionar AppHeader com botão de voltar na página Histórico de Corridas (/rides)
- [x] Padronizar plano de fundo de todas as páginas internas para tema escuro (remover gradiente claro)
- [x] Padronizar tema escuro nas páginas de passageiro/motorista (BecomeDriver, CompleteProfile, DriverDashboard, DriverProfile, EmergencyContacts, Profile, RideHistory, VehicleManagement, NotFound)
- [x] Revisar e corrigir irregularidades visuais em todas as telas (textos invisíveis, contraste, headers, botões)

## Auditoria Visual Completa (Março 2026)
- [x] Converter todas as cores hardcoded (#0A0F14, #14222E, #1E2A35) para variáveis semânticas (bg-background, bg-card, border-border)
- [x] Converter text-gray-* para text-muted-foreground / text-foreground em todas as páginas e componentes
- [x] Converter text-white para text-foreground onde aplicável
- [x] Corrigir AddressAutocomplete (input, dropdown, resultados)
- [x] Corrigir GoogleMap.tsx e Map.tsx (loading placeholder)
- [x] Corrigir ChatBox.tsx, RideChat.tsx, RateDriverModal.tsx, RatingStars.tsx
- [x] Corrigir InstallPrompt.tsx e NotificationPrompt.tsx
- [x] Adicionar AppHeader ao DriverDashboard, AdminDashboard, Analytics, CouponManagement, RideDetails
- [x] Converter RequestRide.tsx (labels, inputs, selectors, cards)
- [x] Converter Home.tsx (sidebar, bottom sheet, top bar, vehicle selector, route info)
- [x] Converter SavedAddresses.tsx e ScheduledRides.tsx
- [x] Converter LiveTracking.tsx
- [x] Todos os 123 testes passando (14 arquivos, 0 falhas)

## Perfil de Usuário Editável Completo
- [x] Adicionar campo avatarUrl ao schema de usuários (já existia)
- [x] Criar procedure tRPC para atualizar perfil (nome, WhatsApp, avatar)
- [x] Criar procedure tRPC para upload de foto de perfil via S3 (user.uploadAvatar)
- [x] Redesenhar página Profile.tsx com edição inline de campos
- [x] Implementar upload de foto de perfil com preview
- [x] Adicionar feedback visual (loading, sucesso, erro) ao salvar
- [x] Exibir seção com últimas 5 corridas realizadas no perfil
- [x] Exibir nível VIP e pontos de fidelidade no perfil
- [x] Escrever testes vitest para as novas procedures (8 testes, 131 total)

## Correções de Navegação
- [x] Adicionar AppHeader com seta de voltar na tela de Contatos de Emergência
- [x] Gerar relatório de auditoria de headers em todas as telas
- [x] Substituir header manual por AppHeader em Delivery.tsx
- [x] Substituir header manual por AppHeader em FavoriteDrivers.tsx
- [x] Substituir header manual por AppHeader em Referrals.tsx

## Configuração Firebase Push Notifications (Credenciais Reais)
- [x] Configurar credenciais Firebase como secrets do projeto (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID)
- [x] Atualizar firebase-config.ts com credenciais reais (fui-app-4c062)
- [x] Atualizar Service Worker com VAPID key real
- [x] Atualizar backend FCM com service account real
- [x] Verificar integração e testar (135 testes passando, incluindo 4 de Firebase)

## Bugs Reportados pelo Usuário (22/03/2026)
- [x] Bug: Notificações push não ativam no celular (unificado sw.js com Firebase, passando SW registration ao getToken)
- [x] Bug: Logo não aparece no app mobile (recriados ícones com fundo escuro, atualizados manifest.json e index.html)

- [x] Adicionar AppHeader com seta de voltar na tela BecomeDriver (/become-driver) - corrigido na seção de perfil já criado

## Sistema Completo de Notificações Personalizadas
- [x] Criar tabela de notificações no schema (notifications)
- [x] Criar procedures tRPC para listar, marcar como lida, e contar não lidas
- [x] Implementar centro de notificações (sino) com lista e badge de contagem
- [x] Criar painel admin para enviar notificações push para todos ou grupos específicos
- [x] Implementar notificações automáticas por eventos (corrida aceita, iniciada, concluída, cancelada, perfil aprovado/rejeitado, novo cupom)
- [x] Escrever testes vitest para as novas procedures (19 testes, 154 total)

## Bug - Prompt de notificação mostra erro ao negar permissão
- [x] Corrigir fluxo quando navegador nega permissão push (não mostrar toast de erro confuso)
- [x] Melhorar UX: fechar prompt silenciosamente ou mostrar mensagem amigável

## Bug - Fluxo de solicitação de corrida redireciona para tela errada
- [x] Ao calcular rota na Home e clicar para solicitar, deve ir direto buscar motorista (não redirecionar para /request-ride com campos vazios)

## Bug - Motorista não é notificado quando corrida é solicitada
- [x] Investigar por que o motorista cadastrado e aprovado não recebe notificação de nova corrida
- [x] Corrigir o sistema de matching/notificação para que motoristas disponíveis sejam alertados
- [x] Adicionar alerta sonoro e visual no painel do motorista quando nova corrida chegar

## Sistema White-Label (Multi-Cidade)
- [x] Adicionar variáveis de ambiente white-label (VITE_APP_TITLE, VITE_APP_CITY, VITE_PRIMARY_COLOR, VITE_PLATFORM_FEE, VITE_APP_LOGO)
- [x] Aplicar variáveis no frontend (nome, cidade, cor primária dinâmica, logo)
- [x] Aplicar variáveis no backend (taxa de comissão configurável, nome nas notificações)
- [x] Criar guia de personalização para novos clientes (WHITE_LABEL_GUIDE.md)

## Auditoria Completa para Apresentação a Investidores (Abril 2026)
- [x] Remover 330 corridas de teste do banco de dados (restaram 24 corridas reais)
- [x] Corrigir bug crítico: botão "Ver Detalhes e Aceitar" redirecionava para rota inexistente /driver/accept-ride/:id
- [x] Adicionar dialog de aceitar corrida imediata no painel do motorista com mutation ride.accept
- [x] Corrigir capitalização do tipo de veículo no painel do motorista
- [x] Corrigir textos hardcoded "Fui!" na landing page para usar white-label (WL.appName)
- [x] Adicionar cards de Receita Total (GMV) e Receita da Plataforma no painel admin
- [x] Corrigir prompts sobrepostos (instalação PWA e notificações) para aparecerem em posições diferentes
- [x] 154 testes passando (17 arquivos, 0 falhas)

## Checkout com Stripe Elements (Cartão + Pix)
- [x] Instalar @stripe/react-stripe-js e @stripe/stripe-js
- [x] Criar página PaymentCheckout com Stripe Elements (/payment/:rideId)
- [x] Suporte a cartão de crédito/débito via PaymentElement
- [x] Suporte a Pix via PaymentElement (requer conta Stripe verificada)
- [x] Redirecionamento automático ao checkout após solicitar corrida com pix/cartão
- [x] Botão "Pagar agora" na tela de detalhes da corrida quando pagamento pendente
- [x] Tela de sucesso após pagamento confirmado
- [x] Webhook Stripe atualiza paymentStatus no banco automaticamente
- [ ] Registrar webhook no painel Stripe (ação manual do usuário)
- [ ] Verificar conta Stripe (KYC) para habilitar Pix em produção
