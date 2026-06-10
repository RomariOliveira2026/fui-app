# Guia de Personalização White-Label

Este guia explica como configurar uma nova instância do app para uma nova cidade ou cliente, sem precisar alterar nenhum código-fonte.

---

## O que pode ser personalizado

Toda a personalização é feita por **variáveis de ambiente** (Secrets), acessíveis em **Settings → Secrets** no painel do Manus. Basta alterar os valores abaixo para cada novo cliente.

| Variável | O que faz | Exemplo |
|---|---|---|
| `VITE_APP_TITLE` | Nome do app exibido aos usuários | `VaiAí`, `MotoJá`, `CorridaFácil` |
| `VITE_APP_CITY` | Cidade de operação | `Lagarto`, `Estância`, `Aracaju` |
| `VITE_PRIMARY_COLOR` | Cor principal do app (hex) | `#2563EB` (azul), `#16A34A` (verde) |
| `VITE_APP_LOGO` | URL da logo do app (imagem PNG/SVG) | `https://cdn.exemplo.com/logo.png` |
| `VITE_PLATFORM_FEE_PERCENT` | Taxa da plataforma por corrida (%) | `15` (15%), `20` (20%) |
| `VITE_SUPPORT_WHATSAPP` | Número do WhatsApp de suporte local | `79999999999` |

---

## Passo a passo para configurar um novo cliente

### 1. Criar uma nova instância do projeto

No Manus, duplique o projeto atual ou crie um novo projeto a partir do código-fonte exportado (disponível em **Code → Download all files**).

### 2. Alterar as variáveis de ambiente

Acesse **Settings → Secrets** e atualize os valores:

```
VITE_APP_TITLE    = NomeDoApp
VITE_APP_CITY     = NomeDaCidade
VITE_PRIMARY_COLOR = #HEXCOR
VITE_APP_LOGO     = https://url-da-logo.png
VITE_PLATFORM_FEE_PERCENT = 15
VITE_SUPPORT_WHATSAPP = DDD+Número
```

### 3. Configurar o domínio

Em **Settings → Domains**, configure o domínio do cliente (ex: `lagarto.fuimobility.com.br` ou um domínio próprio do cliente).

### 4. Publicar

Clique em **Publish** no painel. O app estará no ar com a identidade visual do novo cliente em poucos minutos.

---

## Exemplos de personalização por cor

| Cidade | Nome sugerido | Cor primária |
|---|---|---|
| Lagarto | VaiLagarto | `#2563EB` (azul) |
| Estância | CorridaEstância | `#16A34A` (verde) |
| Aracaju | MotoAju | `#DC2626` (vermelho) |
| Nossa Senhora do Socorro | SocorroMob | `#7C3AED` (roxo) |
| Itabaiana | Fui! | `#D97706` (laranja) |

---

## Como criar a logo

A logo deve ser uma imagem PNG ou SVG com fundo transparente, preferencialmente com largura de 200px e altura de 60px. Faça o upload em qualquer serviço de hospedagem de imagens (ex: Imgur, Cloudinary, ou o próprio S3 do Manus) e cole a URL na variável `VITE_APP_LOGO`.

Se não houver logo configurada, o app exibe automaticamente o nome do app em texto com a cor primária.

---

## Taxa da plataforma

A variável `VITE_PLATFORM_FEE_PERCENT` define quanto a plataforma retém de cada corrida. Por exemplo:

- `15` → o motorista recebe 85% do valor da corrida
- `20` → o motorista recebe 80% do valor da corrida

Este valor é exibido no painel do motorista e utilizado nos cálculos de ganhos.

---

## Checklist de entrega para o cliente

Antes de entregar o app ao empresário, verifique:

- [ ] Nome do app configurado (`VITE_APP_TITLE`)
- [ ] Cidade configurada (`VITE_APP_CITY`)
- [ ] Cor primária definida (`VITE_PRIMARY_COLOR`)
- [ ] Logo enviada e URL configurada (`VITE_APP_LOGO`)
- [ ] Taxa da plataforma definida (`VITE_PLATFORM_FEE_PERCENT`)
- [ ] WhatsApp de suporte configurado (`VITE_SUPPORT_WHATSAPP`)
- [ ] Domínio configurado e publicado
- [ ] Conta admin criada para o cliente (alterar `role` para `admin` no banco de dados)
- [ ] Tarifas de corrida ajustadas para a cidade (painel admin → Configurações de Tarifas)
- [ ] Stripe configurado com as chaves do cliente (Settings → Payment)

---

## Suporte técnico

Para dúvidas sobre personalização ou instalação, entre em contato com o desenvolvedor responsável.
