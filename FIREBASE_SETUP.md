# Guia de Configuração do Firebase Cloud Messaging (FCM)

O Fui! App já possui toda a infraestrutura de notificações push implementada. Você só precisa configurar as credenciais do Firebase para ativá-las.

---

## Passo 1: Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: **Fui App**
4. Desabilite Google Analytics (não é necessário)
5. Clique em **"Criar projeto"**

---

## Passo 2: Adicionar App Web

1. No painel do projeto, clique no ícone **</>** (Web)
2. Nome do app: **Fui Web App**
3. **NÃO** marque "Firebase Hosting"
4. Clique em **"Registrar app"**
5. Copie os valores do objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "fui-app-xxxxx.firebaseapp.com",
  projectId: "fui-app-xxxxx",
  storageBucket: "fui-app-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxx"
};
```

---

## Passo 3: Gerar VAPID Key (Web Push Certificate)

1. No Firebase Console, vá em **Configurações do projeto** (engrenagem)
2. Aba **"Cloud Messaging"**
3. Role até **"Certificados de push da Web"**
4. Clique em **"Gerar par de chaves"**
5. Copie a chave gerada (começa com "B...")

---

## Passo 4: Gerar Service Account Key (para backend)

1. No Firebase Console, vá em **Configurações do projeto** (engrenagem)
2. Aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Salve o arquivo JSON gerado
5. Do arquivo JSON, você vai precisar de:
   - `client_email` (ex: firebase-adminsdk-xxxxx@fui-app.iam.gserviceaccount.com)
   - `private_key` (começa com "-----BEGIN PRIVATE KEY-----")

---

## Passo 5: Adicionar Credenciais no Manus

Vá em **Settings > Secrets** no painel do Manus e adicione:

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `VITE_FIREBASE_API_KEY` | apiKey do firebaseConfig | Chave de API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain do firebaseConfig | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | projectId do firebaseConfig | ID do projeto |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket do firebaseConfig | Bucket de storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId do firebaseConfig | ID do remetente |
| `VITE_FIREBASE_APP_ID` | appId do firebaseConfig | ID do app |
| `VITE_FIREBASE_VAPID_KEY` | VAPID Key gerada no Passo 3 | Chave VAPID para push |
| `FIREBASE_CLIENT_EMAIL` | client_email do Service Account | Email da conta de serviço |
| `FIREBASE_PRIVATE_KEY` | private_key do Service Account | Chave privada (com \\n) |

---

## Passo 6: Testar

1. Acesse o app em fuiapp.com.br
2. Faça login
3. O prompt de notificações deve aparecer automaticamente
4. Clique em **"Ativar"**
5. Permita as notificações no navegador
6. Pronto! Você receberá notificações push quando:
   - Um motorista aceitar sua corrida
   - Uma corrida agendada estiver próxima
   - Houver atualizações sobre suas corridas

---

## Checklist

- [ ] Projeto criado no Firebase Console
- [ ] App Web registrado
- [ ] VAPID Key gerada
- [ ] Service Account Key gerada
- [ ] Todas as 9 secrets adicionadas no Manus
- [ ] Testado em produção
