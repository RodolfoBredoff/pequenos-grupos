# Guia de Setup - Pequenos Grupos Manager

Este guia detalha o processo completo de setup do sistema, desde a criação das contas até o primeiro login.

## 📋 Checklist de Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] Conta criada no Supabase (gratuita)
- [ ] Conta criada no Vercel (gratuita)
- [ ] Editor de código (VS Code recomendado)

## 🔧 Passo 1: Setup do Projeto Local

### 1.1 Clone e Instale

```bash
cd pequenos-grupos
npm install
```

### 1.2 Verifique a Instalação

```bash
npm run build
```

Se houver erros, verifique se todas as dependências foram instaladas corretamente.

## 🗄️ Passo 2: Configurar Supabase

### 2.1 Criar Projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - **Name**: pequenos-grupos-prod
   - **Database Password**: Anote esta senha! (ex: SuaSenhaSegura123!)
   - **Region**: Escolha o mais próximo (ex: South America - São Paulo)
4. Aguarde 2-3 minutos para o projeto ser provisionado

### 2.2 Executar Migrations (Schema SQL)

1. No Dashboard do Supabase, vá em **SQL Editor** (ícone de raio na sidebar)
2. Clique em "New Query"
3. Abra o arquivo `supabase/migrations/20240101_initial_schema.sql` no seu editor
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em "RUN" (Ctrl/Cmd + Enter)
7. Você deve ver: `Success. No rows returned`

**Verificação**: Vá em **Table Editor** e confirme que as seguintes tabelas foram criadas:
- organizations
- groups
- leaders
- members
- meetings
- attendance
- notifications

### 2.3 Configurar Autenticação

1. Vá em **Authentication** → **Providers**
2. Clique em **Email**
3. Configurações:
   - ✅ **Enable Email provider**
   - ❌ **Confirm email** (desmarque para facilitar testes)
4. Clique em **Save**

### 2.4 Configurar URLs (Local)

1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Adicione `http://localhost:3000/**`
3. Salve

### 2.5 Obter as Chaves da API

1. Vá em **Settings** → **API**
2. Anote os seguintes valores:

```
Project URL: https://xxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (⚠️ NUNCA exponha!)
```

### 2.6 Configurar Edge Functions

**Instalar Supabase CLI:**

```bash
npm install -g supabase
```

**Login:**

```bash
supabase login
```

Isso abrirá o navegador para autenticação.

**Link ao Projeto:**

```bash
# No diretório do projeto
cd pequenos-grupos
supabase link --project-ref seu-project-ref
```

O `project-ref` está na URL do dashboard: `https://supabase.com/dashboard/project/SEU-PROJECT-REF`

**Deploy das Functions:**

```bash
supabase functions deploy check-absences
supabase functions deploy check-birthdays
```

Você deve ver:
```
Deployed Function check-absences ✓
Deployed Function check-birthdays ✓
```

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar Arquivo .env.local

Na raiz do projeto (`pequenos-grupos/`), crie o arquivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Secret (gere um aleatório)
CRON_SECRET=minha-senha-super-secreta-12345

# Web Push (opcional, pode deixar vazio por ora)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

**Gerar CRON_SECRET:**

```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use qualquer string longa e aleatória
```

### 3.2 Verificar Variáveis

Certifique-se de que o arquivo `.env.local`:
- ✅ Está na raiz do projeto
- ✅ Tem o nome exato `.env.local` (não `.env`)
- ✅ Não tem espaços extras
- ✅ Está no `.gitignore` (já está por padrão)

## 🚀 Passo 4: Executar Localmente

### 4.1 Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Você deve ver:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in Xms
```

### 4.2 Acessar o Sistema

Abra: http://localhost:3000

Você será redirecionado automaticamente para `/login`.

## 👤 Passo 5: Criar Primeiro Usuário

### 5.1 Fazer Login pela Interface

1. Na tela de login, digite seu e-mail: `seu@email.com`
2. Clique em "Enviar Link de Acesso"
3. Verifique seu e-mail
4. Clique no link (⚠️ Se não receber, verifique spam ou veja troubleshooting abaixo)

### 5.2 Obter o User ID (auth.uid)

Após fazer login, você será redirecionado para o dashboard, mas verá um erro porque ainda não existe um líder vinculado.

Para obter o User ID:

**Opção 1: Via Supabase Dashboard**
1. Vá em **Authentication** → **Users**
2. Você verá seu e-mail listado
3. Copie o **UUID** (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Opção 2: Via SQL**
```sql
SELECT id, email FROM auth.users;
```

### 5.3 Criar Organização, Grupo e Líder

No **SQL Editor** do Supabase, execute:

```sql
-- 1. Criar Organização
INSERT INTO organizations (name)
VALUES ('Minha Igreja')
RETURNING id;

-- ⚠️ ANOTE O UUID RETORNADO (organization_id)
-- Exemplo: f1e2d3c4-b5a6-7890-abcd-1234567890ef
```

```sql
-- 2. Criar Grupo (substitua organization_id)
INSERT INTO groups (
  organization_id,
  name,
  default_meeting_day,
  default_meeting_time
)
VALUES (
  'f1e2d3c4-b5a6-7890-abcd-1234567890ef', -- ← Cole o ID da organização aqui
  'Pequeno Grupo Central',
  3, -- 3 = Quarta-feira (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
  '19:00:00'
)
RETURNING id;

-- ⚠️ ANOTE O UUID RETORNADO (group_id)
-- Exemplo: a9b8c7d6-e5f4-3210-abcd-9876543210fe
```

```sql
-- 3. Criar Líder (substitua os IDs)
INSERT INTO leaders (
  id, -- ID do auth.users
  organization_id,
  group_id,
  full_name,
  email
)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- ← ID do auth.users (Passo 5.2)
  'f1e2d3c4-b5a6-7890-abcd-1234567890ef', -- ← ID da organization
  'a9b8c7d6-e5f4-3210-abcd-9876543210fe', -- ← ID do grupo
  'João Silva', -- ← Seu nome
  'seu@email.com' -- ← Seu e-mail (mesmo do login)
);
```

### 5.4 Verificar Sucesso

1. Atualize a página do dashboard (F5)
2. Você deve ver:
   - Título: "Dashboard - Pequeno Grupo Central"
   - Cards de estatísticas (zerados)
   - Painel de alertas (vazio)

🎉 **Sucesso!** O sistema está funcionando!

## 📱 Passo 6: Testar Funcionalidades

### 6.1 Cadastrar Primeira Pessoa

1. Clique em **Pessoas** (sidebar ou menu inferior)
2. Clique em **+ Nova Pessoa**
3. Preencha:
   - Nome: Maria Silva
   - Telefone: (11) 98765-4321
   - Data de Nascimento: 15/03/1990
   - Tipo: Participante
4. Clique em **Cadastrar**

### 6.2 Fazer Primeira Chamada

1. Clique em **Chamada**
2. Você verá Maria Silva listada
3. Marque como presente (checkbox)
4. Clique em **Salvar Presença**

### 6.3 Ver Agenda

1. Clique em **Agenda**
2. Você verá:
   - Configuração do grupo (Quarta, 19h)
   - Histórico com a reunião de hoje

## 🚢 Passo 7: Deploy em Produção (Vercel)

### 7.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

### 7.2 Deploy

```bash
# No diretório do projeto
vercel --prod
```

Siga as instruções:
- **Set up and deploy**: Yes
- **Which scope**: Sua conta
- **Link to existing project**: No
- **Project name**: pequenos-grupos
- **Directory**: ./
- **Override settings**: No

### 7.3 Configurar Variáveis no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
5. Salve

### 7.4 Redeploy

```bash
vercel --prod
```

### 7.5 Atualizar URLs no Supabase

1. No Supabase Dashboard → **Authentication** → **URL Configuration**
2. Atualize:
   - **Site URL**: `https://seu-projeto.vercel.app`
   - **Redirect URLs**: Adicione `https://seu-projeto.vercel.app/**`
3. Salve

### 7.6 Testar Produção

Acesse: `https://seu-projeto.vercel.app`

## 🔍 Troubleshooting

### ❌ Não recebo o e-mail de login

**Causas possíveis:**
1. **Spam**: Verifique a pasta de spam
2. **Rate Limit**: Supabase limita 3 e-mails/hora no free tier
3. **SMTP não configurado**: No free tier, e-mails podem demorar

**Solução rápida (DEV ONLY):**
```sql
-- Criar um token manualmente (NUNCA EM PRODUÇÃO!)
-- No SQL Editor, execute:
SELECT auth.sign_in_with_email('seu@email.com', 'senha-temporaria-123');
```

### ❌ Erro: "Row Level Security policy violation"

**Causa**: O líder não foi inserido corretamente na tabela `leaders`.

**Verificação:**
```sql
SELECT * FROM leaders WHERE email = 'seu@email.com';
```

Se estiver vazio, execute novamente o Passo 5.3.

### ❌ Dashboard mostra "Você ainda não está vinculado a um grupo"

**Causa**: O `group_id` no `leaders` está NULL.

**Solução:**
```sql
UPDATE leaders
SET group_id = 'uuid-do-seu-grupo'
WHERE email = 'seu@email.com';
```

### ❌ Cron Job não executa

**Verificação local:**
```bash
curl http://localhost:3000/api/webhooks/cron \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

**Verificação produção:**
```bash
curl https://seu-app.vercel.app/api/webhooks/cron \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

### ❌ Edge Functions falham

**Verificar logs:**
```bash
supabase functions logs check-absences
supabase functions logs check-birthdays
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12 → Console)
2. Verifique os logs do Vercel (Dashboard → Logs)
3. Verifique os logs do Supabase (Logs & Reports)

---

**Próximo Passo**: Convide mais líderes e comece a cadastrar membros! 🎉
