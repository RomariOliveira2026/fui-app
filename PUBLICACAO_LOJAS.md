# Fui! - Guia Completo para Publicação nas Lojas de Aplicativos

**Documento preparado para:** Equipe Fui! - Plataforma de Mobilidade Urbana  
**Data:** Março de 2026  
**Autor:** Manus AI

---

## 1. Visão Geral

O Fui! é uma plataforma de mobilidade urbana que atualmente funciona como uma **Progressive Web App (PWA)** acessível pelo navegador em [fuiapp.com.br](https://fuiapp.com.br). Para ampliar o alcance e a credibilidade do serviço, a publicação nas lojas **Google Play Store** (Android) e **Apple App Store** (iOS) é um passo estratégico fundamental. Este documento apresenta todas as etapas, custos, requisitos técnicos e legais necessários para levar o Fui! às mãos dos usuários através das lojas oficiais.

A boa notícia é que o Fui! já possui uma base sólida como PWA, incluindo service worker, manifest.json, ícones em múltiplas resoluções e funcionalidades offline. Isso significa que a maior parte do trabalho de desenvolvimento já está feita, e o processo de empacotamento para as lojas pode ser realizado de forma relativamente rápida utilizando ferramentas como o **Capacitor.js** [1].

---

## 2. Custos Envolvidos

Antes de iniciar o processo, é importante compreender os custos fixos e variáveis associados à publicação em cada loja. A tabela abaixo resume os valores principais:

| Item | Google Play Store | Apple App Store |
|------|-------------------|-----------------|
| **Taxa de registro** | US$ 25 (pagamento único) | US$ 99/ano (renovação anual) |
| **Comissão sobre vendas** | 15% (até US$ 1M/ano), 30% após | 15% (até US$ 1M/ano), 30% após |
| **Tempo de revisão** | Horas a 7 dias | 24-72 horas (90% em 24h) |
| **Formato do binário** | Android App Bundle (.aab) | .ipa via App Store Connect |
| **Conta necessária** | Google Play Console | Apple Developer Program |

> **Nota importante:** Para apps que oferecem serviços financeiros ou de transporte, o Google Play pode exigir uma conta de **Organização** ao invés de conta pessoal [2]. Recomenda-se criar a conta como pessoa jurídica (CNPJ) desde o início para evitar problemas futuros.

Além das taxas das lojas, considere os seguintes custos adicionais:

O **Apple Developer Program** exige um computador com macOS e Xcode para compilar o app iOS. Caso a equipe não possua um Mac, serviços de build na nuvem como **Ionic Appflow** ou **Codemagic** podem ser utilizados, com custos a partir de US$ 25/mês. Para o Android, o **Android Studio** é gratuito e funciona em Windows, macOS e Linux.

---

## 3. Estratégia Técnica Recomendada: Capacitor.js

Dentre as opções disponíveis para converter o Fui! em aplicativos nativos, o **Capacitor.js** é a escolha mais adequada por diversos motivos. Ele permite manter praticamente todo o código React existente, adiciona acesso a APIs nativas do dispositivo e gera binários compatíveis com ambas as lojas [1] [3].

| Critério | Capacitor.js | TWA (Bubblewrap) | PWABuilder |
|----------|-------------|-------------------|------------|
| **Suporte iOS** | Sim | Nao | Experimental |
| **Suporte Android** | Sim | Sim | Sim |
| **APIs nativas** | Completo | Limitado | Limitado |
| **Manutenção do código** | Mantém 95%+ | Mantém 100% | Mantém 100% |
| **Push Notifications nativas** | Sim | Limitado | Limitado |
| **Geolocalização em background** | Sim | Nao | Nao |
| **Aceito pela Apple** | Sim | N/A | Risco de rejeição |
| **Complexidade** | Média | Baixa | Baixa |

A **TWA (Trusted Web Activity)** seria uma alternativa mais simples para o Google Play, mas não funciona para iOS e não oferece acesso a APIs nativas como geolocalização em background, essencial para um app de transporte. O **PWABuilder** tem suporte experimental para iOS e apresenta alto risco de rejeição pela Apple, que não aceita apps que sejam meros wrappers de websites [4].

### 3.1 Passos para Integrar o Capacitor

O processo de integração do Capacitor ao projeto Fui! segue estas etapas principais:

**Passo 1 — Instalar dependências do Capacitor** no projeto existente, adicionando `@capacitor/core` e `@capacitor/cli` como dependências. Em seguida, inicializar o Capacitor apontando para o diretório de build do Vite (`dist/client`).

**Passo 2 — Adicionar plataformas nativas** executando `npx cap add ios` e `npx cap add android`. Isso cria as pastas `ios/` e `android/` no projeto com os projetos nativos configurados.

**Passo 3 — Adaptar comportamentos web-only** usando a verificação `Capacitor.isNativePlatform()` para desabilitar prompts de instalação PWA e ajustar a lógica de notificações push para usar o plugin nativo ao invés do Firebase Web SDK.

**Passo 4 — Adicionar plugins nativos** essenciais para o Fui!, como `@capacitor/push-notifications` para notificações, `@capacitor/geolocation` para rastreamento de localização e `@capacitor/preferences` para armazenamento local seguro.

**Passo 5 — Compilar e testar** executando `npx cap sync` para sincronizar os assets web com os projetos nativos, e então abrir no Xcode (iOS) ou Android Studio (Android) para compilar e testar em dispositivos reais.

---

## 4. Requisitos da Google Play Store

### 4.1 Requisitos Técnicos

O Google Play exige que novos apps tenham como target mínimo o **Android 14 (API level 34)** e sejam enviados no formato **Android App Bundle (.aab)** [2]. O Capacitor já gera projetos compatíveis com esses requisitos por padrão.

O app deve ser assinado digitalmente com uma chave de upload. Recomenda-se utilizar o **Google Play App Signing**, que gerencia a chave de assinatura de forma segura na nuvem, enquanto o desenvolvedor mantém apenas a chave de upload.

### 4.2 Assets Necessários para a Listagem

| Asset | Especificação |
|-------|---------------|
| **Ícone do app** | 512 x 512 px, PNG, 32-bit, sem transparência |
| **Feature Graphic** | 1024 x 500 px, JPG ou PNG |
| **Screenshots (celular)** | Mínimo 2, entre 320px e 3840px, proporção 16:9 ou 9:16 |
| **Screenshots (tablet)** | Recomendado, mesmas proporções |
| **Título** | Máximo 30 caracteres |
| **Descrição curta** | Máximo 80 caracteres |
| **Descrição completa** | Máximo 4000 caracteres |
| **Política de privacidade** | URL pública obrigatória |
| **Classificação de conteúdo** | Questionário IARC obrigatório |

### 4.3 Políticas Específicas para Apps de Transporte

Apps de transporte devem declarar o uso de **localização em background** e justificar a necessidade. O Google Play exige que o app demonstre claramente por que precisa acessar a localização quando não está em primeiro plano, o que no caso do Fui! é justificado pelo rastreamento de corridas em andamento.

Além disso, a partir de janeiro de 2026, o Google Play implementou requisitos mais rigorosos de **segurança infantil (CSAE)**, exigindo políticas explícitas de conteúdo e mecanismos de denúncia dentro do app [2].

---

## 5. Requisitos da Apple App Store

### 5.1 Requisitos Técnicos

A Apple possui o processo de revisão mais rigoroso entre as duas lojas. A partir de **abril de 2026**, todos os apps devem ser compilados com o **iOS/iPadOS 26 SDK** ou posterior [5]. O app deve ser completamente funcional, sem funcionalidades de placeholder ou em estado beta.

Um ponto crítico é que a Apple **não aceita apps que sejam meros wrappers de websites** [4]. O Fui! empacotado com Capacitor adiciona funcionalidades nativas suficientes (push notifications, geolocalização, armazenamento seguro) para se diferenciar de um simples wrapper, mas é fundamental garantir que a experiência nativa seja perceptível.

### 5.2 Requisitos de Privacidade

A Apple exige uma **política de privacidade** acessível tanto na App Store Connect quanto dentro do próprio app. Os **App Privacy Labels** devem declarar com precisão todos os dados coletados pelo app, incluindo dados de localização, informações de conta e dados de uso. Desde 2025, apps que utilizam serviços de IA externos devem divulgar isso e obter consentimento do usuário [5].

O Fui! coleta dados sensíveis como localização em tempo real, dados pessoais e informações de pagamento, portanto a política de privacidade deve ser especialmente detalhada e transparente.

### 5.3 Requisito de Exclusão de Conta

Desde 2022, a Apple exige que todo app que permita criação de conta também ofereça a opção de **deletar a conta** e todos os dados associados [5]. O Fui! já possui sistema de autenticação, portanto será necessário implementar uma funcionalidade de exclusão de conta que remova dados pessoais, histórico de corridas e informações de pagamento.

### 5.4 Conta Demo para Revisores

Se o app requer login para funcionar (como é o caso do Fui!), é obrigatório fornecer **credenciais de uma conta demo** para que os revisores da Apple possam testar todas as funcionalidades. Essa conta deve ter acesso a todas as features do app, incluindo histórico de corridas simulado e funcionalidades de motorista/passageiro.

### 5.5 Assets Necessários

| Asset | Especificação |
|-------|---------------|
| **Ícone do app** | 1024 x 1024 px, PNG, sem transparência, sem cantos arredondados |
| **Screenshots iPhone 6.7"** | 1290 x 2796 px (obrigatório) |
| **Screenshots iPhone 6.5"** | 1242 x 2688 px (obrigatório) |
| **Screenshots iPad 12.9"** | 2048 x 2732 px (se suportar iPad) |
| **Descrição** | Máximo 4000 caracteres |
| **Palavras-chave** | Máximo 100 caracteres, separadas por vírgula |
| **URL de suporte** | Obrigatório |
| **Política de privacidade** | URL pública obrigatória |
| **Categoria** | Travel / Navigation |

---

## 6. Regulamentação Legal no Brasil

Para operar legalmente como plataforma de transporte no Brasil, o Fui! deve estar em conformidade com a legislação vigente. Este é um aspecto que vai além da publicação nas lojas, mas que pode impactar a aprovação do app e a operação do serviço.

### 6.1 Marco Legal

A **Lei 13.640/2018** é o principal marco regulatório para apps de transporte no Brasil [6]. Ela estabelece que os municípios têm a responsabilidade de regulamentar e fiscalizar os serviços de transporte privado por aplicativo dentro de suas fronteiras. Isso significa que o Fui!, ao operar em Itabaiana/SE, deve verificar se o município possui regulamentação específica e, caso positivo, cumprir com as exigências locais.

A lei determina que os motoristas cadastrados na plataforma devem possuir habilitação adequada (categoria B ou superior), manter o veículo em boas condições com documentação em dia, e contribuir para o INSS como contribuinte individual. A plataforma, por sua vez, deve garantir que apenas motoristas que atendam a esses requisitos possam operar.

### 6.2 LGPD (Lei Geral de Proteção de Dados)

A **LGPD (Lei 13.709/2018)** é especialmente relevante para o Fui!, que coleta e processa dados pessoais sensíveis como localização em tempo real, dados de pagamento e informações de identificação. O app deve implementar mecanismos de consentimento explícito para coleta de dados, permitir que usuários acessem e solicitem exclusão de seus dados, e manter registros de tratamento de dados pessoais.

### 6.3 Recomendações Legais

Antes de publicar nas lojas, recomenda-se fortemente a consulta com um **advogado especializado em direito digital e regulação de transportes** para garantir conformidade com todas as exigências municipais, estaduais e federais. Isso inclui verificar a necessidade de registro como empresa de tecnologia de transporte junto à prefeitura de Itabaiana e demais municípios onde o serviço será oferecido.

---

## 7. Checklist Pré-Publicação

A tabela abaixo consolida todas as ações necessárias antes de submeter o Fui! às lojas, organizadas por prioridade:

| Prioridade | Ação | Status |
|------------|------|--------|
| **Alta** | Criar conta Google Play Console (US$ 25) | Pendente |
| **Alta** | Criar conta Apple Developer Program (US$ 99/ano) | Pendente |
| **Alta** | Integrar Capacitor.js ao projeto | Pendente |
| **Alta** | Implementar funcionalidade de exclusão de conta | Pendente |
| **Alta** | Criar política de privacidade completa (LGPD + lojas) | Pendente |
| **Alta** | Criar termos de uso do serviço | Pendente |
| **Alta** | Consultar advogado sobre regulamentação municipal | Pendente |
| **Média** | Gerar ícones em todas as resoluções necessárias | Parcial (PWA icons existem) |
| **Média** | Criar screenshots profissionais para as lojas | Pendente |
| **Média** | Criar Feature Graphic para Google Play | Pendente |
| **Média** | Redigir descrições otimizadas para ASO | Pendente |
| **Média** | Configurar push notifications nativas (Capacitor plugin) | Pendente |
| **Média** | Implementar geolocalização em background | Pendente |
| **Média** | Criar conta demo para revisores da Apple | Pendente |
| **Baixa** | Configurar deep links para ambas as plataformas | Pendente |
| **Baixa** | Implementar In-App Review (solicitar avaliação) | Pendente |
| **Baixa** | Configurar analytics nativos (Firebase Analytics) | Pendente |

---

## 8. Cronograma Estimado

Com base na complexidade do projeto e nos requisitos identificados, o cronograma estimado para publicação nas lojas é:

| Fase | Duração Estimada | Descrição |
|------|------------------|-----------|
| **Fase 1: Preparação Legal** | 2-4 semanas | Consulta jurídica, política de privacidade, termos de uso |
| **Fase 2: Integração Capacitor** | 1-2 semanas | Instalação, configuração, plugins nativos, testes |
| **Fase 3: Ajustes Nativos** | 1-2 semanas | Push nativo, geolocalização background, exclusão de conta |
| **Fase 4: Assets e Marketing** | 1 semana | Screenshots, ícones, descrições, feature graphic |
| **Fase 5: Testes** | 1-2 semanas | Testes em dispositivos reais (Android e iOS) |
| **Fase 6: Submissão Google Play** | 1-7 dias | Upload, revisão e publicação |
| **Fase 7: Submissão App Store** | 1-3 dias | Upload, revisão e publicação |

O tempo total estimado é de **6 a 12 semanas**, considerando que a fase legal pode ser a mais demorada dependendo da complexidade regulatória municipal.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Rejeição pela Apple por "website wrapper" | Média | Alto | Adicionar funcionalidades nativas significativas com Capacitor |
| Rejeição por política de privacidade inadequada | Média | Alto | Criar política detalhada com advogado especializado |
| Problemas com regulamentação municipal | Média | Alto | Consulta jurídica prévia e registro junto à prefeitura |
| Bugs em dispositivos específicos | Alta | Médio | Testes extensivos em múltiplos dispositivos |
| Demora na revisão (primeira submissão) | Média | Baixo | Planejar buffer de 2 semanas no cronograma |

---

## 10. Próximos Passos Imediatos

Para iniciar o processo de publicação, as seguintes ações devem ser tomadas imediatamente:

**Primeiro**, criar as contas de desenvolvedor no Google Play Console e no Apple Developer Program. O processo de verificação pode levar alguns dias, especialmente para contas de organização.

**Segundo**, consultar um advogado especializado em direito digital para preparar a política de privacidade, os termos de uso e verificar a conformidade com a regulamentação municipal de Itabaiana para serviços de transporte por aplicativo.

**Terceiro**, iniciar a integração do Capacitor.js ao projeto. Essa etapa pode ser feita em paralelo com a preparação legal e é o passo técnico mais importante para viabilizar a publicação nas lojas.

---

## Referências

[1]: https://capacitorjs.com/solution/react "Using Capacitor with React - Capacitor.js"
[2]: https://natively.dev/articles/app-store-requirements "App Store Requirements: iOS & Android Guide 2026 - Natively"
[3]: https://capgo.app/blog/transform-pwa-to-native-app-with-capacitor/ "Transform Your PWA to a Native App with Capacitor - Capgo"
[4]: https://www.mobiloud.com/blog/publishing-pwa-app-store "Can You Publish a PWA to the App Store and Google Play? - MobiLoud"
[5]: https://developer.apple.com/help/account/membership/program-enrollment/ "Apple Developer Program Enrollment"
[6]: https://blog.mobapps.com.br/2025/12/10/o-que-voce-precisa-saber-sobre-leis-e-regulamentacoes-para-apps-de-transporte-no-brasil/ "Leis e regulamentações para apps de transporte no Brasil - MobApps"
