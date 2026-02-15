# Quick Start - Pequenos Grupos Manager

## 🚀 Começar em 15 Minutos

Este guia é para você que quer testar rapidamente o sistema localmente.

## ✅ Pré-requisito: Instalar Node.js

Se você ainda não tem Node.js instalado:

**MacOS (Homebrew):**
```bash
brew install node
```

**Ou baixe:** https://nodejs.org (versão LTS)

**Verificar instalação:**
```bash
node --version
npm --version
```

## 📦 Passo 1: Instalar Dependências (2min)

```bash
cd pequenos-grupos
npm install
```

## 🗄️ Passo 2: Criar Conta Supabase (3min)

1. Acesse: https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - Name: `pg-test`
   - Database Password: Anote!
   - Region: Mais próximo de você
4. Aguarde ~2min

## 🔧 Passo 3: Configurar Database (2min)

1. No Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie TODO o conteúdo de: `supabase/migrations/20240101_initial_schema.sql`
4. Cole e clique em "RUN"

## 🔐 Passo 4: Configurar Auth (1min)

1. No Supabase → **Authentication** → **Providers** → **Email**
2. Marque: ✅ Enable Email provider
3. Desmarque: ❌ Confirm email (para facilitar testes)
4. Salve

## 🔑 Passo 5: Obter Chaves (1min)

1. No Supabase → **Settings** → **API**
2. Copie:
   - Project URL
   - anon public key

## 🌍 Passo 6: Configurar Variáveis (2min)

Crie `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=cole-aqui-o-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole-aqui-o-anon-key
SUPABASE_SERVICE_ROLE_KEY=cole-aqui-o-service-role-key
CRON_SECRET=qualquer-string-aleatoria-123
```

**Importante:** Pegue também o `service_role` key (em Settings → API)

## 🚀 Passo 7: Executar (1min)

```bash
npm run dev
```

Acesse: http://localhost:3000

## 👤 Passo 8: Criar Primeiro Usuário (3min)

### 8.1 Fazer Login

1. Digite seu e-mail
2. Verifique seu e-mail e clique no link

### 8.2 Obter User ID

No Supabase → **Authentication** → **Users**
- Copie o UUID do seu usuário

### 8.3 Criar Organização e Grupo

No Supabase → **SQL Editor**, execute:

```sql
-- Criar Organização
INSERT INTO organizations (name) VALUES ('Minha Igreja') RETURNING id;
-- Anote o ID retornado!

-- Criar Grupo (substitua o UUID da organização)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES (
  'UUID-DA-ORGANIZACAO-AQUI',
  'Meu Grupo de Teste',
  3, -- Quarta-feira
  '19:00:00'
) RETURNING id;
-- Anote o ID retornado!

-- Criar Líder (substitua os UUIDs)
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES (
  'UUID-DO-SEU-USUARIO-AUTH',
  'UUID-DA-ORGANIZACAO',
  'UUID-DO-GRUPO',
  'Seu Nome',
  'seu@email.com'
);
```

### 8.4 Atualizar Dashboard

Recarregue: http://localhost:3000/dashboard

🎉 Pronto! Agora você pode:
- Cadastrar pessoas
- Fazer chamada
- Ver agenda

## 📱 Testar Funcionalidades Básicas

### Cadastrar Primeira Pessoa

1. Clique em **Pessoas** → **+ Nova Pessoa**
2. Preencha:
   - Nome: João Silva
   - Telefone: (11) 98765-4321
   - Data: 01/01/1990
   - Tipo: Participante
3. Salve

### Fazer Primeira Chamada

1. Clique em **Chamada**
2. Marque João como presente
3. Salve

### Testar WhatsApp

- No card do João, clique em "WhatsApp"
- Deve abrir WhatsApp Web com mensagem pré-preenchida

## 🐛 Problemas Comuns

### "Module not found"

```bash
# Limpar e reinstalar
rm -rf node_modules
npm install
```

### "Cannot find Supabase URL"

- Verifique se `.env.local` está na raiz
- Certifique-se que as variáveis começam com `NEXT_PUBLIC_`
- Reinicie o servidor (`npm run dev`)

### "Row Level Security violation"

- Certifique-se que executou o INSERT do líder
- Confirme que o `id` do líder é o mesmo do `auth.users`

## 📚 Próximos Passos

Depois de testar localmente:

1. **Leia a documentação completa**: [`README.md`](./README.md)
2. **Configure para produção**: [`DEPLOY.md`](./DEPLOY.md)
3. **Veja o resumo do projeto**: [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)

## 🎁 Funcionalidades para Explorar

- ✅ Dashboard com estatísticas
- ✅ Alertas de faltas e aniversários
- ✅ Integração WhatsApp
- ✅ Agenda automática
- ✅ Mobile responsive
- ✅ PWA instalável

---

**Boa exploração! 🚀**

Dúvidas? Consulte [`SETUP.md`](./SETUP.md) para guia detalhado.
