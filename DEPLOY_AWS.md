# Deploy na AWS - Pequenos Grupos Manager

## 🎯 Objetivo

Deploy do sistema com **custo mínimo** (~$0-5/mês), **máxima segurança** usando apenas IAM Roles (sem IAM Users), e CI/CD automatizado via GitHub OIDC.

---

## 🔐 Arquitetura de Segurança (IAM Roles Only)

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITETURA OIDC                          │
│              (Zero Long-Lived Credentials)                   │
└─────────────────────────────────────────────────────────────┘

GitHub Actions (Push)
        │
        │ 1. Request Token
        ↓
GitHub OIDC Provider
        │
        │ 2. Validate & Issue Token
        ↓
AWS STS (AssumeRoleWithWebIdentity)
        │
        │ 3. Return Temporary Credentials (15min-1h)
        ↓
GitHub Actions Runner
        │
        │ 4. Deploy to Amplify
        ↓
AWS Amplify
        │
        │ 5. AssumeRole (AmplifyServiceRole)
        ↓
Build & Deploy
        │
        │ 6. Read Secrets from SSM
        ↓
Application Running
```

**✅ Benefícios:**
- **Zero Access Keys** - Sem long-lived credentials
- **Tokens Temporários** - Expiram em minutos/horas
- **Auditoria Completa** - CloudTrail registra tudo
- **Least Privilege** - Permissões granulares por role
- **Rotação Automática** - Tokens auto-renovados

---

## 📊 Arquitetura da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                              │
│                    (Browser/Mobile)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              AWS CloudFront (CDN)                            │
│         • Cache global (225+ PoPs)                           │
│         • SSL/TLS gratuito (AWS Certificate Manager)        │
│         • DDoS protection (AWS Shield)                       │
│         • WAF opcional ($5/mês)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify Hosting                             │
│         • Next.js 15 (SSR/SSG/ISR)                          │
│         • Build automático via Git                           │
│         • Preview deploys (PRs)                              │
│         • Environment variables via SSM                      │
│         • IAM Role: AmplifyServiceRole                       │
│         • Free tier: 1000 build min/mês                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS API Calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Cloud (Backend)                        │
│         • PostgreSQL 15 + PostGIS                            │
│         • Row Level Security (RLS)                           │
│         • Realtime subscriptions                             │
│         • Edge Functions (Deno)                              │
│         • Auth (Magic Link)                                  │
│         • Storage (arquivos)                                 │
│         • Free tier: 500MB DB, 2GB bandwidth                 │
└─────────────────────────────────────────────────────────────┘
                       │ Secrets Management
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         AWS Systems Manager Parameter Store                  │
│         • NEXT_PUBLIC_SUPABASE_URL                           │
│         • NEXT_PUBLIC_SUPABASE_ANON_KEY                      │
│         • SUPABASE_SERVICE_ROLE_KEY (SecureString)           │
│         • CRON_SECRET (SecureString)                         │
│         • Criptografia: AWS KMS                              │
│         • Versionamento: Sim                                 │
│         • Acesso via IAM Roles                               │
│         • Free tier: Standard params ilimitados              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CI/CD Pipeline (OIDC)                      │
│                                                              │
│   GitHub → OIDC → STS → GitHub Actions → AWS Amplify        │
│         • Trigger: push to main                              │
│         • Tests: lint, typecheck, build                      │
│         • Deploy: Amplify start-job                          │
│         • Preview: PR auto-deploy                            │
│         • Rollback: git revert + redeploy                    │
│         • Free tier: 2000 min/mês                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Estimativa de Custos

### Free Tier (Primeiros 12 Meses)

| Serviço | Free Tier | Uso Estimado | Custo/Mês |
|---------|-----------|--------------|-----------|
| **AWS Amplify** | 1000 build min + 15GB out | ~200 min + 3GB | **$0** |
| **CloudFront** | 1TB transfer + 10M requests | ~20GB + 50K | **$0** |
| **SSM Parameter Store** | Standard params ilimitados | 5 params | **$0** |
| **CloudWatch Logs** | 5GB ingest + 5GB storage | ~500MB | **$0** |
| **CloudWatch Alarms** | 10 alarms | 2 alarms | **$0** |
| **Supabase** | 500MB DB + 2GB bandwidth | 200MB + 1GB | **$0** |
| **GitHub Actions** | 2000 min/mês | ~150 min | **$0** |
| **Route 53** (opcional) | - | 1 hosted zone | **$0.50** |
| **TOTAL MENSAL** | | | **$0-0.50** |

### Após Free Tier (Mês 13+)

| Serviço | Custo Mensal |
|---------|--------------|
| AWS Amplify | $3-5 (build + hosting) |
| CloudFront | $1-2 (bandwidth) |
| SSM/CloudWatch | $0 |
| Supabase | $0 (free tier permanente) |
| **TOTAL** | **$4-7/mês** |

### Escalabilidade (500+ usuários, 500GB bandwidth)

| Serviço | Custo Mensal |
|---------|--------------|
| AWS Amplify | $5 |
| CloudFront | $42 (500GB @ $0.085/GB) |
| Supabase | $25 (upgrade para Pro) |
| **TOTAL** | **$70-80/mês** |

**💡 Nota:** Ainda mais barato que Vercel Pro ($20 base + $40/TB extra)

---

## 🚀 PASSO 1: Configurar GitHub OIDC na AWS

### 1.1 Criar Identity Provider (Console AWS)

**AWS Console → IAM → Identity Providers → Add Provider**

```
Provider Type: OpenID Connect
Provider URL: https://token.actions.githubusercontent.com
Audience: sts.amazonaws.com
```

**Clique em "Get thumbprint"** → **Add provider**

![GitHub OIDC Provider](https://docs.github.com/assets/cb-68233/images/help/actions/aws-iam-identity-provider.png)

**Validação:**
```bash
aws iam list-open-id-connect-providers
```

Você deve ver:
```json
{
  "OpenIDConnectProviderList": [
    {
      "Arn": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
    }
  ]
}
```

### 1.2 Criar IAM Role para GitHub Actions

**IAM → Roles → Create Role**

**Trusted entity:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:SEU-USUARIO/pequenos-grupos:*"
        }
      }
    }
  ]
}
```

**⚠️ IMPORTANTE:** Substitua:
- `ACCOUNT_ID` pelo seu AWS Account ID
- `SEU-USUARIO/pequenos-grupos` pelo seu repositório GitHub

**Role name:** `GitHubActionsRole-PequenosGrupos`

### 1.3 Criar IAM Policy para GitHub Actions

**IAM → Policies → Create Policy → JSON**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmplifyDeployAccess",
      "Effect": "Allow",
      "Action": [
        "amplify:GetApp",
        "amplify:ListApps",
        "amplify:GetBranch",
        "amplify:ListBranches",
        "amplify:StartJob",
        "amplify:GetJob",
        "amplify:ListJobs",
        "amplify:StopJob"
      ],
      "Resource": [
        "arn:aws:amplify:*:*:apps/*/branches/main",
        "arn:aws:amplify:*:*:apps/*/branches/develop"
      ]
    },
    {
      "Sid": "AmplifyListApps",
      "Effect": "Allow",
      "Action": [
        "amplify:ListApps"
      ],
      "Resource": "*"
    }
  ]
}
```

**Policy name:** `GitHubActionsAmplifyPolicy`

**Clique em "Create policy"**

### 1.4 Anexar Policy ao Role

**IAM → Roles → GitHubActionsRole-PequenosGrupos → Permissions**

**Add permissions → Attach policies**

Selecione:
- ✅ `GitHubActionsAmplifyPolicy` (custom)

**Clique em "Add permissions"**

### 1.5 Validar Configuração

```bash
# Ver detalhes do role
aws iam get-role --role-name GitHubActionsRole-PequenosGrupos

# Ver policies anexadas
aws iam list-attached-role-policies --role-name GitHubActionsRole-PequenosGrupos
```

**✅ Checkpoint:** Você deve ter:
- [x] OIDC Provider criado
- [x] IAM Role `GitHubActionsRole-PequenosGrupos`
- [x] Policy `GitHubActionsAmplifyPolicy` anexada
- [x] Trust policy configurada com seu repositório

---

## 🚀 PASSO 2: Criar IAM Role para Amplify

### 2.1 Criar IAM Policy para Amplify

**IAM → Policies → Create Policy → JSON**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSMParameterAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:ACCOUNT_ID:parameter/pequenos-grupos/*"
    },
    {
      "Sid": "KMSDecryptAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:*:ACCOUNT_ID:alias/aws/ssm",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.*.amazonaws.com"
        }
      }
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:ACCOUNT_ID:log-group:/aws/amplify/*:*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

**⚠️ Substitua** `ACCOUNT_ID` pelo seu AWS Account ID

**Policy name:** `AmplifyServicePolicy-PequenosGrupos`

### 2.2 Criar IAM Role para Amplify

**IAM → Roles → Create Role**

**Trusted entity type:** AWS Service  
**Use case:** Amplify

**Trust policy** (automático):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Role name:** `AmplifyServiceRole-PequenosGrupos`

### 2.3 Anexar Policies ao Amplify Role

**Permissions → Add permissions → Attach policies**

Selecione:
- ✅ `AmplifyServicePolicy-PequenosGrupos` (custom)
- ✅ `AdministratorAccess-Amplify` (AWS managed)

**⚠️ Nota:** `AdministratorAccess-Amplify` é uma policy AWS managed com permissões necessárias para Amplify funcionar (S3, CloudFront, etc)

### 2.4 Anotar Role ARN

```bash
aws iam get-role --role-name AmplifyServiceRole-PequenosGrupos --query 'Role.Arn' --output text
```

**Copie o ARN**, exemplo:
```
arn:aws:iam::123456789012:role/AmplifyServiceRole-PequenosGrupos
```

**✅ Checkpoint:**
- [x] IAM Role `AmplifyServiceRole-PequenosGrupos` criado
- [x] Policies anexadas
- [x] ARN anotado

---

## 🚀 PASSO 3: Configurar SSM Parameter Store

### 3.1 Obter Credenciais do Supabase

**Supabase Dashboard → Settings → API**

Copie:
- **Project URL:** `https://xxxxx.supabase.co`
- **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3.2 Gerar CRON_SECRET

```bash
openssl rand -base64 32
```

**Copie o output**, exemplo:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Sem terminal?** Gere uma string aleatória longa (ex.: use um gerador online de “random string” com 32+ caracteres) e guarde como CRON_SECRET.

### 3.3 Alternativa: Criar parâmetros pelo Console AWS (sem CLI)

Use a mesma região do Amplify (ex.: **us-east-1**). No canto superior direito da Console, confira a região.

1. **Abrir o Parameter Store**
   - Acesse: https://console.aws.amazon.com/systems-manager/
   - No menu lateral esquerdo, em **Application Management**, clique em **Parameter Store**.
   - Ou busque por “Parameter Store” na barra de busca do AWS.

2. **Criar cada parâmetro**
   - Clique em **Create parameter**.
   - Preencha conforme a tabela abaixo e clique em **Create parameter**.
   - Repita para os 5 parâmetros.

| # | Name | Type | Value | Description |
|---|------|------|--------|-------------|
| 1 | `/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL` | String | `https://xxxxx.supabase.co` (sua Project URL) | Supabase Project URL |
| 2 | `/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY` | **SecureString** | Cole a anon/public key do Supabase | Supabase Anon Key (public) |
| 3 | `/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY` | **SecureString** | Cole a service_role key do Supabase | Supabase Service Role Key |
| 4 | `/pequenos-grupos/prod/CRON_SECRET` | **SecureString** | Cole o CRON_SECRET (ex.: gerado com `openssl rand -base64 32`) | Cron Job Authentication Secret |
| 5 | `/pequenos-grupos/prod/NODE_ENV` | String | `production` | Node.js Environment |

**Detalhes na tela “Create parameter”:**
- **Name:** exatamente como na tabela (incluindo o caminho `/pequenos-grupos/prod/...`).
- **Type:** String para URL e NODE_ENV; **SecureString** para as chaves e o CRON_SECRET.
- **Value:** cole o valor (URL, chave ou secret); para SecureString não é mostrado depois.
- **Description:** opcional; pode usar a descrição da tabela.

3. **Validar**
   - Em Parameter Store, use o filtro de busca e digite `/pequenos-grupos/prod`.
   - Você deve ver os 5 parâmetros listados.

**Checkpoint:** 5 parâmetros criados (2 String, 3 SecureString).

### 3.4 Criar Parâmetros no SSM (via CLI)

**Região:** Escolha a mesma região onde criará o Amplify (ex: `us-east-1`)

#### Parâmetro 1: Supabase URL

```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL" \
  --value "https://xxxxx.supabase.co" \
  --type "String" \
  --description "Supabase Project URL" \
  --region us-east-1
```

**✅ Output esperado:**
```json
{
  "Version": 1,
  "Tier": "Standard"
}
```

#### Parâmetro 2: Supabase Anon Key

```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --type "SecureString" \
  --description "Supabase Anon Key (public)" \
  --region us-east-1
```

#### Parâmetro 3: Supabase Service Role Key

```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY" \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --type "SecureString" \
  --description "Supabase Service Role Key (admin privileges)" \
  --region us-east-1
```

#### Parâmetro 4: Cron Secret

```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/prod/CRON_SECRET" \
  --value "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6" \
  --type "SecureString" \
  --description "Cron Job Authentication Secret" \
  --region us-east-1
```

#### Parâmetro 5: Node Environment

```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NODE_ENV" \
  --value "production" \
  --type "String" \
  --description "Node.js Environment" \
  --region us-east-1
```

### 3.5 Validar Parâmetros Criados

```bash
# Listar todos os parâmetros
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Option=BeginsWith,Values=/pequenos-grupos/prod" \
  --region us-east-1

# Testar leitura (URL público)
aws ssm get-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL" \
  --region us-east-1

# Testar leitura (SecureString com decrypt)
aws ssm get-parameter \
  --name "/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY" \
  --with-decryption \
  --region us-east-1
```

**✅ Checkpoint:**
- [x] 5 parâmetros criados no SSM
- [x] SecureStrings criptografados (3)
- [x] Validação OK

---

## 🚀 PASSO 4: Criar Repositório GitHub

### 4.1 Criar Repositório no GitHub

**GitHub.com → New Repository**

```
Repository name: pequenos-grupos
Visibility: Private (recomendado)
Initialize: ❌ Don't add README/gitignore (já temos localmente)
```

**Create repository**

### 4.2 Conectar Repositório Local

```bash
cd pequenos-grupos

# Inicializar Git (se ainda não foi)
git init

# Adicionar remote
git remote add origin git@github.com:SEU-USUARIO/pequenos-grupos.git

# Verificar
git remote -v
```

### 4.3 Commit Inicial

```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "Initial commit - Pequenos Grupos v1.2.0 com AWS Deploy"

# Push para main
git branch -M main
git push -u origin main
```

### 4.4 Configurar GitHub Secrets

**GitHub → Repository → Settings → Secrets and variables → Actions**

**Clique em "New repository secret"**

#### Secret 1: AWS_REGION

```
Name: AWS_REGION
Value: us-east-1
```

(Ou a região que você escolheu)

#### Secret 2: AWS_ROLE_ARN

```
Name: AWS_ROLE_ARN
Value: arn:aws:iam::123456789012:role/GitHubActionsRole-PequenosGrupos
```

(ARN do role criado no Passo 1)

**⚠️ IMPORTANTE:** Não precisamos de `AWS_ACCESS_KEY_ID` nem `AWS_SECRET_ACCESS_KEY` porque usamos OIDC!

### 4.5 Validar Secrets

**Actions secrets:**
- [x] `AWS_REGION`
- [x] `AWS_ROLE_ARN`

**✅ Checkpoint:**
- [x] Repositório criado
- [x] Código pushed
- [x] Secrets configurados (apenas 2!)

---

## 🚀 PASSO 5: Criar App no AWS Amplify

**Fluxo em ordem (Console em PT-BR):**  
Conectar repositório (5.2) → **Criar nova aplicação** → Build settings / Editar YML (5.3) → **Avançar** → Perfil de serviço (5.4) → **Avançar** → Configurações avançadas → Variáveis de ambiente (5.5) → **Salvar e implantar** (5.6).

### 5.1 Acessar Amplify Console

**AWS Console → Amplify → Get started**

### 5.2 Conectar Repositório GitHub

**New app → Host web app → GitHub**

1. **Autorizar AWS Amplify** no GitHub
2. **Selecionar repositório:** `pequenos-grupos`
3. **Selecionar branch:** `main`
4. **Next**

### 5.3 Configurar Build Settings (Configurações de compilação)

Na tela **"Criar nova aplicação"** você verá:

1. **Nome do app:** use `pequenos-grupos` (se o campo existir).
2. **Frameworks detectados automaticamente:** deve aparecer o tag **Next.js**.  
   - Se aparecer **Comando de desenvolvimento front-end** e **Desenvolver diretório de saída**, o diretório de saída deve ser **`.next`**. O comando pode vir preenchido automaticamente.
3. **Editar arquivo YML:** clique em **"Editar arquivo YML"** e confira (ou cole) o conteúdo abaixo. O arquivo `amplify.yml` do repositório já tem isso; se a detecção automática não carregou, use este bloco mínimo:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

Salve o YML e volte. **Não marque** "Proteger meu site com senha".

4. Clique em **"Avançar"** / **Next**.

### 5.4 Configurar Perfil de Serviço (Service Role)

Na mesma sequência da criação do app:

1. **Perfil de serviço (Service profile)**  
   - Texto: *"O Amplify requer permissões para publicar logs de renderização no lado do servidor (SSR) na sua conta do CloudWatch."*
2. Selecione: **"Criar e usar um novo perfil de serviço"** (Create and use a new service profile).  
   - Se você já tiver um role do Passo 2 (ex.: `AmplifyServiceRole-PequenosGrupos`), pode escolher **"Usar um perfil de serviço existente"** e selecioná-lo.
3. Clique em **"Avançar"** / **Next**.

### 5.5 Configurar Variáveis de Ambiente

1. Expanda a seção **"Configurações avançadas"** (Advanced settings).
2. Procure **"Variáveis de ambiente"** / **Environment variables**.
3. Clique em **"Adicionar variável"** / **Add variable** e adicione **uma linha para cada**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `_ssm:/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `_ssm:/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `_ssm:/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY` |
| `CRON_SECRET` | `_ssm:/pequenos-grupos/prod/CRON_SECRET` |
| `NODE_ENV` | `production` |

**⚠️ CRÍTICO:** O valor com prefixo **`_ssm:`** faz o Amplify buscar no Parameter Store (SSM). O IAM Role do Amplify precisa ter permissão de leitura no SSM (Passo 2).

### 5.6 Revisar e Criar

1. Revise as configurações (build, perfil de serviço, variáveis).
2. Clique em **"Salvar e implantar"** / **Save and deploy** (ou **Criar** / **Create**).

Amplify criará o app e iniciará o primeiro build automaticamente.

**⏱️ Tempo esperado:** 5-10 minutos

### 5.7 Monitorar Build

**Amplify Console → App → main branch**

Você verá:
```
1. Provision   ✅ (30s)
2. Build       ⏳ (5-8 min)
3. Deploy      ⏳ (1-2 min)
4. Verify      ⏳ (30s)
```

**Logs em tempo real:** Clique em qualquer fase para ver logs

### 5.8 Validar Deploy

Após "Verify" ✅, você terá:

**URL do app:**
```
https://main.xxxxxxxxxxxxx.amplifyapp.com
```

**Teste:**
1. Abra a URL no navegador
2. Deve ver a página de login
3. Verifique console (F12) - sem erros de conexão Supabase

**✅ Checkpoint:**
- [x] App criado no Amplify
- [x] Service Role configurado
- [x] Env vars (SSM) configuradas
- [x] Build concluído com sucesso
- [x] App acessível via HTTPS

---

## 🚀 PASSO 6: Configurar CI/CD (GitHub Actions)

### 6.1 Atualizar GitHub Actions Workflow

O arquivo `.github/workflows/deploy.yml` já está configurado para OIDC!

**Verificar configuração:**

```yaml
jobs:
  deploy:
    permissions:
      id-token: write  # ⚠️ CRÍTICO para OIDC
      contents: read
    
    steps:
      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
          role-session-name: GitHubActions-PequenosGrupos
```

**✅ Sem access keys!** Tudo via OIDC.

### 6.2 Testar CI/CD

**Fazer uma mudança pequena:**

```bash
# Editar README.md
echo "\n## Deploy via AWS Amplify + OIDC" >> README.md

# Commit e push
git add README.md
git commit -m "test: CI/CD via OIDC"
git push origin main
```

### 6.3 Monitorar GitHub Actions

**GitHub → Repository → Actions**

Você verá o workflow executando:

```
1. test         ⏳ (2-3 min)
   - Checkout
   - Setup Node
   - npm ci
   - Lint
   - Type check
   - Build

2. deploy       ⏳ (5-8 min)
   - Configure AWS via OIDC ✅
   - Trigger Amplify deployment
   - Wait for completion
   
3. notify       ✅
   - Success message
```

**Ver logs:** Clique no job → Ver cada step

### 6.4 Validar Deploy Automático

**Após GitHub Actions ✅:**

1. **Amplify Console** → Você verá novo build iniciado
2. **Aguarde conclusão** (5-8 min)
3. **Teste o app** na URL do Amplify

**✅ Checkpoint:**
- [x] GitHub Actions configurado com OIDC
- [x] Build e deploy automático funcionando
- [x] Zero access keys usadas

---

## 🚀 PASSO 7: Configurar Monitoramento

### 7.1 Criar CloudWatch Alarm para Build Failures

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name pequenos-grupos-build-failures \
  --alarm-description "Alert on Amplify build failures" \
  --metric-name BuildFailed \
  --namespace AWS/Amplify \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 0 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region us-east-1
```

### 7.2 Criar SNS Topic para Alertas

```bash
# Criar topic
aws sns create-topic \
  --name pequenos-grupos-alerts \
  --region us-east-1

# Copie o TopicArn do output

# Subscribir email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:pequenos-grupos-alerts \
  --protocol email \
  --notification-endpoint seu@email.com \
  --region us-east-1
```

**Confirme o email** (checar inbox)

### 7.3 Anexar Alarm ao SNS

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name pequenos-grupos-build-failures \
  --alarm-description "Alert on Amplify build failures" \
  --metric-name BuildFailed \
  --namespace AWS/Amplify \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 0 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:pequenos-grupos-alerts \
  --region us-east-1
```

### 7.4 Criar Budget Alert

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://budget-notifications.json
```

**budget.json:**
```json
{
  "BudgetName": "pequenos-grupos-monthly",
  "BudgetType": "COST",
  "TimeUnit": "MONTHLY",
  "BudgetLimit": {
    "Amount": "10",
    "Unit": "USD"
  },
  "CostFilters": {
    "TagKeyValue": ["user:Project$pequenos-grupos"]
  }
}
```

**budget-notifications.json:**
```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "seu@email.com"
      }
    ]
  }
]
```

**✅ Checkpoint:**
- [x] CloudWatch Alarm criado
- [x] SNS Topic criado e subscrito
- [x] Budget configurado

---

## 🚀 PASSO 8: Configurar Domínio Customizado (Opcional)

### 8.1 Se Domínio no Route 53

**Amplify Console → App → Domain management → Add domain**

1. **Selecione seu domínio** (ex: `meusite.com`)
2. **Configure subdomínio:**
   - `www.meusite.com` → main branch
   - `meusite.com` (apex) → main branch
3. **Amplify configura DNS automaticamente** ✅
4. **SSL/TLS automático** via AWS Certificate Manager ✅

**⏱️ Propagação:** 5 minutos - 24 horas

### 8.2 Se Domínio Externo (GoDaddy, Namecheap, etc)

**Amplify Console → App → Domain management → Add domain**

1. **Digite domínio:** `meusite.com`
2. **Amplify fornecerá CNAME records:**

```
Type: CNAME
Name: www
Value: xxxxx.cloudfront.net

Type: CNAME  
Name: @  (ou deixe vazio para apex)
Value: yyyyy.cloudfront.net

Type: CNAME
Name: _xxx (validação SSL)
Value: _yyy.acm-validations.aws
```

3. **Configure no seu provedor DNS**
4. **Aguarde validação SSL** (até 48h)

### 8.3 Validar Domínio

```bash
# Testar DNS
dig www.meusite.com

# Testar HTTPS
curl -I https://www.meusite.com
```

**✅ Checkpoint (se configurado):**
- [x] Domínio customizado adicionado
- [x] DNS configurado
- [x] SSL/TLS ativo

---

## 🚀 PASSO 9: Configurar Supabase para Produção

### 9.1 Atualizar Redirect URLs

**Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
```
https://main.xxxxx.amplifyapp.com
```

(Ou seu domínio customizado se configurou)

**Redirect URLs (adicionar):**
```
https://main.xxxxx.amplifyapp.com/**
https://www.meusite.com/** (se tiver domínio)
```

**Save**

### 9.2 Configurar Email Templates

**Authentication → Email Templates**

Customize:
- **Confirm signup** (não usado, usamos Magic Link)
- **Magic Link** ← **IMPORTANTE**
- **Change email address**
- **Reset password**

**Exemplo Magic Link template:**
```html
<h2>Login no Pequenos Grupos</h2>
<p>Clique no link abaixo para fazer login:</p>
<p><a href="{{ .ConfirmationURL }}">Entrar no Sistema</a></p>
<p>Ou copie e cole este link:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Este link expira em 1 hora.</p>
```

### 9.3 Testar Autenticação

1. Acesse o app em produção
2. Digite seu email na tela de login
3. Cheque inbox
4. Clique no link do email
5. Deve ser redirecionado para `/dashboard` logado ✅

**✅ Checkpoint:**
- [x] Redirect URLs configuradas
- [x] Magic Link funcionando
- [x] Login em produção OK

---

## 🚀 PASSO 10: Deploy Edge Functions (Supabase)

### 10.1 Instalar Supabase CLI

```bash
# MacOS
brew install supabase/tap/supabase

# Verificar
supabase --version
```

### 10.2 Login no Supabase

```bash
supabase login
```

**Abrirá browser** → Autorizar CLI

### 10.3 Linkar Projeto

```bash
cd pequenos-grupos

supabase link --project-ref xxxxx
```

(Seu project ref está no dashboard: Settings → General)

### 10.4 Deploy Edge Functions

```bash
# Deploy check-absences
supabase functions deploy check-absences

# Deploy check-birthdays  
supabase functions deploy check-birthdays
```

**✅ Output esperado:**
```
Deploying function check-absences...
Function check-absences deployed successfully
URL: https://xxxxx.supabase.co/functions/v1/check-absences
```

### 10.5 Configurar Secrets das Functions

```bash
# CRON_SECRET (mesmo valor do SSM)
supabase secrets set CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Verificar
supabase secrets list
```

### 10.6 Testar Edge Functions

```bash
# Testar check-absences
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/check-absences \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"}'
```

**✅ Resposta esperada:**
```json
{
  "success": true,
  "message": "Absence checks completed",
  "notificationsCreated": 0
}
```

**✅ Checkpoint:**
- [x] Edge Functions deployed
- [x] Secrets configurados
- [x] Functions testadas

---

## 🎉 DEPLOY COMPLETO!

### ✅ Checklist Final

#### AWS
- [x] GitHub OIDC Provider criado
- [x] IAM Role GitHub Actions (OIDC)
- [x] IAM Role Amplify Service
- [x] SSM Parameters (5) criados
- [x] CloudWatch Alarms configurados
- [x] Budget configurado

#### GitHub
- [x] Repositório criado
- [x] Código pushed
- [x] Secrets configurados (AWS_REGION, AWS_ROLE_ARN)
- [x] GitHub Actions funcionando

#### AWS Amplify
- [x] App criado
- [x] Branch main conectada
- [x] Service Role configurado
- [x] Env vars (SSM) configuradas
- [x] Build concluído
- [x] App acessível via HTTPS
- [x] Domínio customizado (opcional)

#### Supabase
- [x] Database configurada
- [x] RLS habilitada
- [x] Redirect URLs atualizadas
- [x] Edge Functions deployed
- [x] Secrets configurados

#### Testes
- [x] Login funcionando
- [x] CRUD de pessoas OK
- [x] Chamada funcionando
- [x] Alertas funcionando
- [x] WhatsApp integration OK

---

## 🔄 Workflow de Deploy

### Deploy Automático (Main)

```bash
# Fazer mudanças
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# GitHub Actions executará automaticamente:
# 1. Tests (lint, typecheck, build)
# 2. Deploy to Amplify (via OIDC)
# 3. Notification

# ⏱️ Tempo total: 8-12 minutos
```

### Preview Deploy (Pull Request)

```bash
# Criar branch
git checkout -b feature/nova-feature

# Fazer mudanças
git add .
git commit -m "feat: implementar X"
git push origin feature/nova-feature

# Criar PR no GitHub
# Amplify criará preview automático:
# URL: https://pr-123.xxxxx.amplifyapp.com
```

### Rollback

```bash
# Opção 1: Git revert
git revert HEAD
git push origin main

# Opção 2: Script
./scripts/rollback-aws.sh

# Opção 3: Console Amplify
# Amplify Console → Redeploy versão anterior
```

---

## 🔍 Monitoramento e Logs

### CloudWatch Logs

```bash
# Ver logs do Amplify
aws logs tail /aws/amplify/pequenos-grupos --follow

# Ver logs com filtro
aws logs filter-log-events \
  --log-group-name /aws/amplify/pequenos-grupos \
  --filter-pattern "ERROR"
```

### CloudWatch Metrics

**Amplify Console → Monitoring**

Métricas disponíveis:
- Build duration
- Deploy duration
- Request count
- Bytes downloaded
- Error rate

### Custos

```bash
# Executar script de monitoramento
./scripts/monitor-costs.sh

# Ou via AWS Console
# Cost Explorer → Filter by Tag: Project=pequenos-grupos
```

---

## 🚨 Troubleshooting

### Build Falha no Amplify

**Erro: "Module not found"**

```bash
# Limpar cache do Amplify
Amplify Console → App → Build settings → Clear cache
Redeploy
```

**Erro: "Permission denied SSM"**

```bash
# Verificar IAM Role do Amplify
aws iam get-role --role-name AmplifyServiceRole-PequenosGrupos

# Verificar policies anexadas
aws iam list-attached-role-policies --role-name AmplifyServiceRole-PequenosGrupos

# Anexar policy se necessário
aws iam attach-role-policy \
  --role-name AmplifyServiceRole-PequenosGrupos \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/AmplifyServicePolicy-PequenosGrupos
```

### GitHub Actions Falha (OIDC)

**Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"**

**Causa:** Trust policy incorreta

**Solução:**

```bash
# 1. Verificar trust policy do role
aws iam get-role --role-name GitHubActionsRole-PequenosGrupos

# 2. Verificar se repository path está correto
# Deve ser: "repo:SEU-USUARIO/pequenos-grupos:*"

# 3. Atualizar trust policy se necessário
aws iam update-assume-role-policy \
  --role-name GitHubActionsRole-PequenosGrupos \
  --policy-document file://trust-policy.json
```

**trust-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:SEU-USUARIO/pequenos-grupos:*"
        }
      }
    }
  ]
}
```

### Variáveis de Ambiente Não Carregam

**Erro: "NEXT_PUBLIC_SUPABASE_URL is undefined"**

**Causa:** Prefixo `_ssm:` faltando ou IAM role sem permissão

**Solução:**

```bash
# 1. Verificar env vars no Amplify
Amplify Console → App → Environment variables

# 2. Verificar se tem prefixo _ssm:
# ✅ Correto: _ssm:/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL
# ❌ Errado: /pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL

# 3. Testar acesso SSM manualmente
aws ssm get-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL" \
  --region us-east-1

# 4. Verificar IAM role tem permissão SSM
aws iam get-role-policy \
  --role-name AmplifyServiceRole-PequenosGrupos \
  --policy-name AmplifyServicePolicy
```

### Custo Inesperado

```bash
# 1. Ver breakdown de custos
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-12 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE

# 2. Identificar serviço caro
# Geralmente: CloudFront bandwidth ou Amplify builds

# 3. Otimizações:
# - Habilitar cache agressivo (CloudFront)
# - Reduzir builds desnecessários (skip [ci skip])
# - Comprimir assets (já configurado no amplify.yml)
```

---

## 📊 Comparação: IAM Users vs IAM Roles

| Aspecto | IAM Users (Antigo) | IAM Roles (Novo) |
|---------|-------------------|------------------|
| **Credenciais** | Access Key + Secret Key | Tokens temporários via STS |
| **Duração** | Permanente (até rotacionar) | Temporário (15min - 12h) |
| **Rotação** | Manual | Automática |
| **Vazamento** | ⚠️ Alto risco | ✅ Baixo risco (expira) |
| **Auditoria** | Difícil (quem usou?) | ✅ Fácil (CloudTrail + session name) |
| **Configuração** | Mais simples | Um pouco mais complexa |
| **Segurança** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Recomendação AWS** | ❌ Evitar | ✅ Usar sempre que possível |

---

## 🎯 Próximos Passos

### Curto Prazo (Semana 1-2)
- [ ] Configurar domínio customizado
- [ ] Testar todas as funcionalidades em produção
- [ ] Configurar backup automático (Supabase → S3)
- [ ] Documentar processos internos

### Médio Prazo (Mês 1-3)
- [ ] Implementar WAF no CloudFront ($5/mês)
- [ ] Multi-region deployment (opcional)
- [ ] A/B testing via CloudFront
- [ ] Performance monitoring (New Relic/Datadog)

### Longo Prazo (6+ meses)
- [ ] Terraform remote state (S3 + DynamoDB)
- [ ] Blue-green deployments
- [ ] Custom monitoring dashboard
- [ ] Automated load testing

---

## 📚 Recursos Úteis

### Documentação AWS
- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [IAM Roles for OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html)
- [SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [GitHub Actions AWS OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

### Scripts Úteis
```bash
./scripts/setup-aws-oidc.sh        # Setup com OIDC
./scripts/monitor-costs.sh         # Monitorar custos
./scripts/validate-security.sh     # Validar segurança
./scripts/rollback-aws.sh          # Rollback
```

### Dashboards
- [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 🔒 Melhores Práticas de Segurança Implementadas

1. ✅ **Zero Long-Lived Credentials** - OIDC apenas
2. ✅ **Least Privilege** - Policies granulares
3. ✅ **Secrets Encrypted** - SSM SecureString + KMS
4. ✅ **Auditoria Completa** - CloudTrail enabled
5. ✅ **Budget Alerts** - Proteção contra custos
6. ✅ **Security Headers** - CSP, HSTS, X-Frame-Options
7. ✅ **HTTPS Only** - CloudFront + ACM
8. ✅ **Row Level Security** - Supabase RLS
9. ✅ **Multi-Factor** - AWS account (recomendado)
10. ✅ **Backup Strategy** - Supabase daily backups

---

**🎉 Deploy AWS com IAM Roles (OIDC) - Completo e Production-Ready!**

**Próximo passo:** Execute o Passo 1 e comece o deploy!

**Dúvidas?** Consulte a seção Troubleshooting ou os scripts em `/scripts`.
