# 🚀 COMECE AQUI - Pequenos Grupos Manager V1.1

## ⚡ Início Rápido em 3 Passos

### Passo 1: Instalar Node.js

```bash
# MacOS (Homebrew)
brew install node

# Ou baixe em: https://nodejs.org
```

### Passo 2: Instalar e Executar

```bash
cd pequenos-grupos

# Opção A: Script Automático
./install-and-run.sh

# Opção B: Manual
npm install
npm run dev
```

### Passo 3: Acessar

Abra no navegador: **http://localhost:3000**

---

## 📚 Guias Disponíveis

Escolha baseado no seu objetivo:

### 🏃 Quer Começar RÁPIDO? (15 minutos)
**→ [QUICKSTART.md](./QUICKSTART.md)**
- Setup mínimo
- Criar primeiro usuário
- Testar funcionalidades básicas

### 🔧 Quer Setup COMPLETO? (45 minutos)
**→ [SETUP.md](./SETUP.md)**
- Configuração detalhada do Supabase
- Deploy Edge Functions
- Configuração de autenticação
- Criar organização e grupos

### 📖 Quer Entender TUDO? (Leitura)
**→ [README.md](./README.md)**
- Documentação completa
- Arquitetura do sistema
- Tecnologias utilizadas
- Troubleshooting

### 🎁 Quer Testar FUNCIONALIDADES NOVAS? (30 minutos)
**→ [TESTE_FUNCIONALIDADES_BONUS.md](./TESTE_FUNCIONALIDADES_BONUS.md)**
- Dashboard de Engajamento (gráficos)
- Broadcast WhatsApp (envio em massa)
- Modo Offline (funciona sem internet)

### 🚢 Quer Fazer DEPLOY? (1-2 horas)

#### Opção 1: AWS Amplify (Recomendado - Custo Mínimo) 💰
**→ [DEPLOY_AWS.md](./DEPLOY_AWS.md)**
- Deploy com **$0-5/mês** (vs $20+/mês Vercel)
- **IAM Roles com OIDC** - Zero long-lived credentials! 🔐
- CI/CD gratuito via GitHub Actions
- Segurança máxima (IAM, SSM, CloudWatch)
- Terraform para automação (IaC)
- Scripts utilitários incluídos

**→ [MIGRACAO_IAM_ROLES.md](./MIGRACAO_IAM_ROLES.md)**
- Por que usar IAM Roles (não Users)
- Arquitetura OIDC explicada
- Comparação de segurança

**→ [CUSTOS_COMPARACAO.md](./CUSTOS_COMPARACAO.md)**
- Comparação detalhada AWS vs Vercel
- Projeções de custo por cenário
- Recomendações por caso de uso

#### Opção 2: Vercel (Rápido e Simples)
**→ [DEPLOY.md](./DEPLOY.md)**
- Deploy no Vercel (Free tier)
- Setup em 10 minutos
- Ideal para MVP/protótipo

### 📝 Quer Ver O QUE FOI FEITO?
**→ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Resumo técnico  
**→ [CHANGELOG.md](./CHANGELOG.md)** - Histórico de mudanças (MVP)  
**→ [CHANGELOG_AWS.md](./CHANGELOG_AWS.md)** - Histórico de mudanças (AWS Deploy)  
**→ [MIGRACAO_IAM_ROLES.md](./MIGRACAO_IAM_ROLES.md)** - **NOVO:** Migração para IAM Roles (OIDC)  
**→ [FUNCIONALIDADES_COMPLETAS.md](./FUNCIONALIDADES_COMPLETAS.md)** - Features detalhadas

---

## ✅ O Que Você Tem Agora

### MVP Completo (V1.0)
- ✅ Gestão de Pessoas (CRUD)
- ✅ Agenda Inteligente
- ✅ Chamada Digital
- ✅ Alertas de Faltas (3+ consecutivas)
- ✅ Alertas de Aniversários
- ✅ Integração WhatsApp
- ✅ Dashboard com Estatísticas
- ✅ PWA (instalável como app)
- ✅ Autenticação Segura (Magic Link)
- ✅ Multi-tenancy (múltiplos grupos)

### Funcionalidades Bônus (V1.1) 🎁
- ✅ **Dashboard de Engajamento**
  - Gráficos de presença mensal
  - Rankings (Top 5 mais/menos presentes)
  - Membros destaque (100% presença)
  
- ✅ **Broadcast WhatsApp**
  - Enviar mensagem para múltiplas pessoas
  - Filtros: Todos/Participantes/Visitantes
  - Personalização automática com `{nome}`
  
- ✅ **Modo Offline Completo**
  - Funciona sem internet
  - Sync automático ao reconectar
  - Indicador visual de status
  - Cache local (IndexedDB)

---

## 🎯 Fluxo Recomendado

### Se É Sua Primeira Vez:

1. **Instalar Node.js** (se não tiver)
2. **Executar:** `npm install && npm run dev`
3. **Seguir:** [QUICKSTART.md](./QUICKSTART.md)
4. **Configurar Supabase** (15min)
5. **Criar primeiro usuário**
6. **Testar funcionalidades básicas**

### Depois do Setup Inicial:

7. **Testar funcionalidades bônus:** [TESTE_FUNCIONALIDADES_BONUS.md](./TESTE_FUNCIONALIDADES_BONUS.md)
8. **Deploy em produção:** [DEPLOY.md](./DEPLOY.md)
9. **Convidar líderes**
10. **Coletar feedback**

---

## 📦 Estrutura do Projeto

```
pequenos-grupos/
├── 📄 COMECE_AQUI.md (← VOCÊ ESTÁ AQUI!)
├── 📄 README.md (Documentação principal)
├── 📄 QUICKSTART.md (Começar rápido)
├── 📄 SETUP.md (Setup completo)
├── 📄 DEPLOY.md (Deploy produção)
├── 📄 TESTE_FUNCIONALIDADES_BONUS.md (Testar novas features)
├── 📄 FUNCIONALIDADES_COMPLETAS.md (Resumo features)
├── 📄 PROJECT_SUMMARY.md (Resumo técnico)
├── 📄 CHANGELOG.md (Histórico)
│
├── 🔧 install-and-run.sh (Script automático)
├── 📦 package.json (Dependências)
├── ⚙️ next.config.js (Config Next.js)
├── 🎨 tailwind.config.ts (Config Tailwind)
│
├── 📂 app/ (Páginas Next.js)
├── 📂 components/ (Componentes React)
├── 📂 lib/ (Utilitários)
├── 📂 hooks/ (React hooks)
├── 📂 supabase/ (Database + Functions)
└── 📂 public/ (Assets estáticos)
```

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

**Node.js não instalado:**
```bash
brew install node
# Ou: https://nodejs.org
```

**Erro ao instalar dependências:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Erro ao executar:**
```bash
# Verifique se .env.local existe e está configurado
cp .env.local.example .env.local
# Edite com suas credenciais do Supabase
```

**Não consigo fazer login:**
- Verifique email (pode estar no spam)
- Confirme que Supabase Auth está configurado
- Veja [SETUP.md](./SETUP.md) seção de Auth

### Onde Encontrar Respostas

| Dúvida | Documento |
|--------|-----------|
| Como instalar? | [QUICKSTART.md](./QUICKSTART.md) |
| Como configurar Supabase? | [SETUP.md](./SETUP.md) |
| Como testar novas features? | [TESTE_FUNCIONALIDADES_BONUS.md](./TESTE_FUNCIONALIDADES_BONUS.md) |
| Como fazer deploy? | [DEPLOY.md](./DEPLOY.md) |
| O que tem no sistema? | [FUNCIONALIDADES_COMPLETAS.md](./FUNCIONALIDADES_COMPLETAS.md) |
| Detalhes técnicos? | [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) |

---

## 🎉 Você Está Pronto!

O sistema está **100% funcional** e pronto para uso.

**Próximo passo:** Escolha um dos guias acima e comece! 🚀

### Recomendação:

1. **Primeira vez?** → [QUICKSTART.md](./QUICKSTART.md)
2. **Já tem Node.js?** → Execute `./install-and-run.sh`
3. **Quer ver gráficos?** → [TESTE_FUNCIONALIDADES_BONUS.md](./TESTE_FUNCIONALIDADES_BONUS.md)

---

**Desenvolvido com ❤️ para comunidades de Pequenos Grupos**

Versão: **1.1.0** | Data: **12/02/2026** | Status: **✅ Production Ready**
