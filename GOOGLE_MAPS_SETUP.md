# 🗺️ Configuração do Google Maps API - Fui App

## Problema Identificado

O erro "NotFoundError: removeChild/insertBefore" que ocorre em **produção** (fuiapp.com.br) ao clicar em "Calcular Preço e Rota" é causado por **restrições de CORS** do proxy do Manus.

O proxy do Manus (`forge.manus.ai/v1/maps/proxy`) funciona apenas em ambientes de desenvolvimento (preview), mas **não funciona em produção** com domínios personalizados devido a políticas de segurança.

## Solução: Chave Própria do Google Maps

Você precisa obter uma **chave de API do Google Maps própria** (gratuita) e configurá-la no projeto.

---

## Passo 1: Obter Chave do Google Maps (GRÁTIS)

### 1.1. Acesse o Google Cloud Console
- URL: https://console.cloud.google.com/
- Faça login com sua conta Google

### 1.2. Crie um Projeto
- Clique em "Select a project" no topo da página
- Clique em "NEW PROJECT"
- Nome do projeto: **Fui App**
- Clique em "CREATE"
- Aguarde alguns segundos até o projeto ser criado

### 1.3. Ative as APIs Necessárias
Você precisa ativar 3 APIs:

**a) Maps JavaScript API:**
- Menu lateral → "APIs & Services" → "Library"
- Procure: "Maps JavaScript API"
- Clique nela e depois em "ENABLE"

**b) Geocoding API:**
- Volte para "Library"
- Procure: "Geocoding API"
- Clique e "ENABLE"

**c) Directions API:**
- Volte para "Library"
- Procure: "Directions API"
- Clique e "ENABLE"

### 1.4. Crie a Chave de API
- Menu lateral → "APIs & Services" → "Credentials"
- Clique em "+ CREATE CREDENTIALS" (botão azul no topo)
- Selecione "API key"
- **COPIE A CHAVE** que aparece (algo como: `AIzaSyB...`)

### 1.5. Restrinja a Chave (IMPORTANTE!)
Isso protege sua chave contra uso não autorizado:

- Na tela de credenciais, clique no ícone de lápis ao lado da chave criada
- Em "Application restrictions":
  - Selecione "HTTP referrers (web sites)"
  - Clique em "+ ADD AN ITEM"
  - Adicione: `fuiapp.com.br/*`
  - Clique em "+ ADD AN ITEM" novamente
  - Adicione: `*.manus.space/*`
  - Clique em "+ ADD AN ITEM" novamente
  - Adicione: `localhost:*` (para testes locais)

- Em "API restrictions":
  - Selecione "Restrict key"
  - Marque as 3 APIs:
    - ✅ Maps JavaScript API
    - ✅ Geocoding API
    - ✅ Directions API

- Clique em "SAVE"

---

## Passo 2: Configurar a Chave no Projeto Manus

### 2.1. Adicionar como Secret
1. Abra o projeto no Manus
2. Vá em **Management UI** → **Settings** → **Secrets**
3. Clique em "Add Secret"
4. Nome: `GOOGLE_MAPS_API_KEY`
5. Valor: Cole a chave que você copiou (ex: `AIzaSyB...`)
6. Clique em "Save"

### 2.2. Atualizar o Código
O código já está preparado para usar a chave. Você só precisa:

1. Abrir o arquivo `client/src/components/Map.tsx`
2. Localizar a linha que define `const API_KEY = ...`
3. Alterar para:
```typescript
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
```

### 2.3. Adicionar Variável de Ambiente no Vite
1. O Manus vai automaticamente expor `GOOGLE_MAPS_API_KEY` como `VITE_GOOGLE_MAPS_API_KEY` no frontend
2. Não precisa fazer nada manualmente

---

## Passo 3: Testar

### 3.1. Publicar o Site
1. Salve um checkpoint
2. Clique em "Publish" no Management UI
3. Aguarde o deploy

### 3.2. Testar em Produção
1. Acesse: https://fuiapp.com.br/request-ride
2. Faça login
3. Preencha origem e destino
4. Clique em "Calcular Preço e Rota"
5. **O mapa deve carregar perfeitamente!** ✅

---

## Custos (Tranquilize-se!)

O Google Maps oferece:
- **$200 de crédito GRÁTIS por mês**
- Isso equivale a aproximadamente:
  - 28.000 carregamentos de mapa
  - 40.000 geocodificações
  - 40.000 cálculos de rota

Para o Fui App em fase inicial, isso é **MAIS do que suficiente** e você não vai pagar nada!

---

## Troubleshooting

### Erro: "This page can't load Google Maps correctly"
- Verifique se a chave está correta
- Verifique se as 3 APIs estão ativadas
- Verifique se o domínio está nas restrições

### Erro: "RefererNotAllowedMapError"
- Adicione `fuiapp.com.br/*` nas restrições HTTP referrers
- Aguarde 5 minutos para as mudanças propagarem

### Mapa não carrega
- Abra o console do navegador (F12)
- Veja se há erros relacionados a API key
- Verifique se a variável `VITE_GOOGLE_MAPS_API_KEY` está definida

---

## Resumo Rápido

1. ✅ Criar projeto no Google Cloud Console
2. ✅ Ativar 3 APIs (Maps JavaScript, Geocoding, Directions)
3. ✅ Criar chave de API
4. ✅ Restringir chave (domínios + APIs)
5. ✅ Adicionar chave como secret no Manus
6. ✅ Atualizar Map.tsx (1 linha)
7. ✅ Publicar e testar

**Tempo estimado:** 10-15 minutos

---

## Contato

Se tiver qualquer dúvida durante o processo, me avise que eu te ajudo!
