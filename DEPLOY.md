# Guia de Deploy - Pequenos Grupos Manager

Este guia fornece instruções detalhadas para deploy em produção.

## 🎯 Overview da Arquitetura de Deploy

```
┌─────────────────┐
│   Vercel        │  ← Frontend (Next.js)
│   (Frontend)    │  ← Cron Job (diário às 8h)
└────────┬────────┘
         │
         │ API Calls
         ↓
┌─────────────────┐
│   Supabase      │  ← Backend (PostgreSQL)
│   (Backend)     │  ← Auth (Magic Link)
│                 │  ← Edge Functions
│                 │  ← Row Level Security
└─────────────────┘
```

## ✅ Checklist Pré-Deploy

- [ ] Código testado localmente
- [ ] Variáveis de ambiente configuradas
- [ ] Database migrations executadas
- [ ] Edge Functions deployadas
- [ ] Ícones PWA criados (192x192 e 512x512)
- [ ] Domínio customizado configurado (opcional)

## 🚀 Deploy do Backend (Supabase)

### Passo 1: Criar Projeto de Produção

Se ainda não tem um projeto de produção separado:

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Configure:
   - **Name**: `pequenos-grupos-prod`
   - **Database Password**: Use uma senha forte (anote!)
   - **Region**: Escolha o mais próximo dos usuários
   - **Pricing Plan**: Free Tier (suficiente para MVP)

### Passo 2: Executar Migrations

```bash
# Via SQL Editor no Dashboard
# Cole o conteúdo de: supabase/migrations/20240101_initial_schema.sql
```

Ou via CLI:

```bash
supabase db push --linked
```

### Passo 3: Deploy Edge Functions

```bash
# Link ao projeto de produção
supabase link --project-ref seu-project-ref-prod

# Deploy functions
supabase functions deploy check-absences
supabase functions deploy check-birthdays

# Verificar
supabase functions list
```

### Passo 4: Configurar Autenticação

1. **Authentication** → **Providers** → **Email**
   - ✅ Enable Email provider
   - ❌ Confirm email (ou marque se quiser confirmação)
   - Configure rate limits se necessário

2. **Authentication** → **Email Templates**
   - Customize o template de Magic Link (opcional)
   - Adicione logo da sua organização

3. **Authentication** → **URL Configuration**
   - Deixe em branco por ora (configuraremos após o deploy do Vercel)

### Passo 5: Obter Credenciais de Produção

Em **Settings** → **API**, anote:

```
Project URL: https://xxxprod.supabase.co
anon public: eyJhbG...
service_role: eyJhbG... (⚠️ NUNCA commitar!)
```

## 🌐 Deploy do Frontend (Vercel)

### Passo 1: Preparar Repositório Git

```bash
cd pequenos-grupos

# Inicializar git (se ainda não fez)
git init

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial commit - MVP v1.0"

# Criar repositório no GitHub/GitLab
# https://github.com/new

# Adicionar remote
git remote add origin git@github.com:seu-usuario/pequenos-grupos.git

# Push
git push -u origin main
```

### Passo 2: Importar no Vercel

**Via Dashboard:**

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "Add New..." → "Project"
3. Selecione o repositório GitHub
4. Configure:
   - **Project Name**: `pequenos-grupos`
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)

**Via CLI:**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Passo 3: Configurar Variáveis de Ambiente

No Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**:

Adicione cada variável para **Production**, **Preview** e **Development**:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxprod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
SUPABASE_SERVICE_ROLE_KEY = eyJhbG... (⚠️)
CRON_SECRET = gere-uma-nova-senha-aleatoria-aqui
```

**Gerar CRON_SECRET seguro:**

```bash
openssl rand -base64 32
```

### Passo 4: Redeploy com Variáveis

Após adicionar as variáveis:

```bash
# Via CLI
vercel --prod

# Ou via Dashboard
# Deployments → ⋯ (menu) → Redeploy
```

### Passo 5: Configurar Domínio Customizado (Opcional)

1. No Vercel Dashboard → **Settings** → **Domains**
2. Adicione seu domínio: `grupos.suaigreja.com`
3. Configure DNS (siga as instruções da Vercel)
4. Aguarde propagação (~15min)

## 🔗 Conectar Vercel ↔ Supabase

### Atualizar URLs no Supabase

Agora que o Vercel está no ar, atualize o Supabase:

1. Acesse Supabase Dashboard → **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `https://seu-app.vercel.app` (ou domínio customizado)
   - **Redirect URLs**: Adicione:
     - `https://seu-app.vercel.app/**`
     - `https://*.vercel.app/**` (para preview deploys)

## ⏰ Configurar Cron Job

O arquivo `vercel.json` já está configurado para executar diariamente às 8h AM:

```json
{
  "crons": [{
    "path": "/api/webhooks/cron",
    "schedule": "0 8 * * *"
  }]
}
```

### Testar Cron Manualmente

```bash
curl https://seu-app.vercel.app/api/webhooks/cron \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

Resposta esperada:
```json
{
  "success": true,
  "absences": { "success": true, "alerts_created": 0 },
  "birthdays": { "success": true, "birthdays_found": 0 }
}
```

### Verificar Logs do Cron

No Vercel Dashboard → **Logs**, filtre por `/api/webhooks/cron`

## 📱 Configurar PWA

### Adicionar Ícones

Certifique-se de que existem:
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

### Testar Instalação

1. Acesse o app no Chrome/Edge (mobile ou desktop)
2. Você deve ver um ícone de instalação (+) na barra de endereço
3. Clique para instalar
4. O app deve abrir em janela standalone

### Testar em iOS

1. Abra no Safari (iOS 16.4+)
2. Toque em "Compartilhar" → "Adicionar à Tela Inicial"
3. O app deve aparecer como ícone na Home Screen

## 🔐 Segurança em Produção

### Checklist de Segurança

- [ ] ✅ HTTPS habilitado (automático no Vercel)
- [ ] ✅ Row Level Security (RLS) ativo em todas as tabelas
- [ ] ✅ service_role key NUNCA exposta ao cliente
- [ ] ✅ CRON_SECRET diferente em cada ambiente
- [ ] ✅ Rate limiting configurado no Supabase Auth
- [ ] ✅ CORS configurado corretamente
- [ ] ⚠️ Email confirmation ATIVADO (recomendado para produção)

### Habilitar Confirmação de Email (Recomendado)

1. Supabase → **Authentication** → **Providers** → **Email**
2. ✅ Marque "Confirm email"
3. Atualize o template de confirmação se necessário

## 📊 Monitoramento

### Vercel

- **Analytics**: Habilite em Settings → Analytics (grátis no Hobby plan)
- **Logs**: Vercel Dashboard → Logs
- **Monitoring**: Vercel Dashboard → Monitoring

### Supabase

- **Logs**: Supabase Dashboard → Logs & Reports
- **Database Health**: Database → Database Health
- **API Usage**: Settings → Usage

### Alerts

Configure alertas em:
- Vercel: Settings → Notifications
- Supabase: Settings → Notifications

## 🚨 Troubleshooting

### Deploy falha com erro de build

**Erro comum:** `Module not found: Can't resolve '@/...'`

**Solução:**
```bash
# Verifique tsconfig.json
# Deve ter:
"paths": {
  "@/*": ["./*"]
}
```

### Cron Job não executa

1. Verifique se está no Hobby plan ou superior (Free não tem crons)
2. Confirme que `vercel.json` está na raiz
3. Teste manualmente o endpoint
4. Verifique logs no Vercel Dashboard

### Usuários não conseguem fazer login

1. Verifique URLs de redirect no Supabase
2. Confirme que variáveis de ambiente estão corretas
3. Teste em modo incógnito (pode ser cache)
4. Verifique spam no email

### PWA não instala

1. HTTPS é obrigatório (Vercel tem por padrão)
2. Verifique se `manifest.json` está acessível
3. Confirme que ícones existem e são PNG
4. Use Chrome DevTools → Application → Manifest para debug

## 📈 Limites do Free Tier

### Vercel (Hobby Plan - Gratuito)

- ✅ 100GB bandwidth/mês
- ✅ Deploy ilimitados
- ✅ HTTPS gratuito
- ✅ Preview deploys
- ⚠️ 1 cron job máximo
- ⚠️ 12s timeout serverless

### Supabase (Free Tier)

- ✅ 500MB database
- ✅ 2GB bandwidth/mês
- ✅ 2GB file storage
- ✅ 50.000 monthly active users
- ⚠️ Pausa após 1 semana de inatividade (auto-retoma)
- ⚠️ Rate limiting: 3 emails/hora

### Quando Fazer Upgrade

**Vercel Pro ($20/mês):**
- +1TB bandwidth
- +100 cron jobs
- +60s timeout

**Supabase Pro ($25/mês):**
- +8GB database
- +250GB bandwidth
- Sem pausa por inatividade
- Rate limiting removido

## 🎉 Pós-Deploy

### Tarefas Finais

1. [ ] Testar todas as funcionalidades em produção
2. [ ] Criar o primeiro usuário (líder)
3. [ ] Cadastrar organização e grupo via SQL
4. [ ] Fazer backup do database (Supabase → Database → Backups)
5. [ ] Documentar credenciais em local seguro (1Password, etc.)
6. [ ] Compartilhar URL com líderes
7. [ ] Criar guia de uso para líderes

### Monitorar Primeiros Dias

- Verifique logs diariamente
- Monitore uso de database
- Confirme que cron jobs estão executando
- Colete feedback dos usuários

## 🔄 CI/CD Automático

O Vercel já configura CI/CD automaticamente:

- ✅ Push para `main` → Deploy de produção
- ✅ Push para outras branches → Preview deploy
- ✅ Pull Requests → Deploy de preview automático

Para desabilitar preview deploys:
- Vercel → Settings → Git → Configure Production Branch

---

**Pronto para Produção! 🚀**

Para suporte, consulte:
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
