# Migração: IAM Users → IAM Roles (OIDC)

## 🎯 Resumo da Mudança

O projeto foi **completamente refatorado** para usar **apenas IAM Roles com OIDC**, eliminando todos os IAM Users e long-lived credentials (Access Keys).

---

## 🔐 Por Que Essa Mudança?

### ❌ Arquitetura Anterior (IAM Users)

```
GitHub Actions
     │
     │ Usa AWS_ACCESS_KEY_ID
     │     AWS_SECRET_ACCESS_KEY (permanentes!)
     ↓
AWS API
```

**Problemas:**
- ⚠️  Credenciais permanentes (até rotacionar manualmente)
- ⚠️  Se vazar, é válida para sempre
- ⚠️  Difícil auditoria (quem usou?)
- ⚠️  Contra as melhores práticas AWS
- ⚠️  Rotação manual obrigatória

### ✅ Arquitetura Nova (IAM Roles + OIDC)

```
GitHub Actions
     │
     │ 1. Request token from GitHub OIDC
     ↓
GitHub OIDC Provider
     │
     │ 2. Validate & issue JWT token
     ↓
AWS STS AssumeRoleWithWebIdentity
     │
     │ 3. Return temporary credentials (15min-1h)
     ↓
GitHub Actions (temporary session)
     │
     │ 4. Deploy to AWS
     ↓
AWS Amplify
```

**Benefícios:**
- ✅ **Zero long-lived credentials**
- ✅ **Tokens temporários** (expiram automaticamente)
- ✅ **Auditoria completa** (CloudTrail registra tudo)
- ✅ **Rotação automática** (cada run = novo token)
- ✅ **Vazamento seguro** (token expira em minutos)
- ✅ **Melhores práticas AWS** (recomendação oficial)

---

## 📊 O Que Mudou?

### 1. Documentação

#### DEPLOY_AWS.md
- ✅ **Reescrito completamente** com passo a passo detalhado
- ✅ Arquitetura OIDC explicada
- ✅ Configuração de OIDC Provider
- ✅ Criação de IAM Roles (não Users!)
- ✅ 10 passos detalhados de configuração
- ✅ Troubleshooting específico para OIDC

**Removido:**
- ❌ Seção "Criar IAM User"
- ❌ Instruções para gerar Access Keys
- ❌ Configuração de AWS_ACCESS_KEY_ID/SECRET

**Adicionado:**
- ✅ PASSO 1: Configurar GitHub OIDC na AWS
- ✅ PASSO 2: Criar IAM Role para Amplify
- ✅ Explicação de trust policies
- ✅ Validações de configuração

### 2. Scripts

#### scripts/setup-aws-oidc.sh (NOVO)
```bash
#!/bin/bash
# Setup completo com IAM Roles e OIDC
# - Cria GitHub OIDC Provider
# - Cria GitHubActionsRole-PequenosGrupos
# - Cria AmplifyServiceRole-PequenosGrupos
# - Configura trust policies
# - Cria SSM Parameters
# - Zero IAM Users criados!
```

**Features:**
- ✅ Validação de credenciais AWS
- ✅ Criação automática de OIDC Provider
- ✅ Criação de 2 IAM Roles
- ✅ Trust policies corretas
- ✅ Validações de segurança
- ✅ Output com ARNs e próximos passos

#### scripts/setup-aws.sh (antigo)
- ⚠️  Movido para `setup-aws-old-iam-users.sh.backup`
- ❌ NÃO usar mais!

### 3. GitHub Actions Workflows

#### .github/workflows/deploy.yml

**Antes (IAM Users):**
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
```

**Depois (OIDC):**
```yaml
permissions:
  id-token: write   # ⚠️ CRÍTICO para OIDC
  contents: read

- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ secrets.AWS_REGION }}
    role-session-name: GitHubActions-PequenosGrupos-${{ github.run_id }}
```

**Mudanças:**
- ✅ Adiciona `permissions.id-token: write`
- ✅ Usa `role-to-assume` ao invés de access keys
- ✅ Define `role-session-name` para auditoria
- ✅ Validação de identidade AWS

#### .github/workflows/preview.yml
- ✅ Adiciona `permissions.id-token: write`
- ✅ Verifica se workflows usam OIDC
- ✅ Valida que não há AWS_ACCESS_KEY_ID

### 4. Terraform

#### aws/terraform/main.tf

**Adicionado:**
```hcl
# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM Role para GitHub Actions (OIDC)
resource "aws_iam_role" "github_actions" {
  assume_role_policy = jsonencode({
    # Trust policy com OIDC
    Principal = {
      Federated = aws_iam_openid_connect_provider.github.arn
    }
    Action = "sts:AssumeRoleWithWebIdentity"
  })
}
```

**Removido:**
- ❌ Criação de IAM Users
- ❌ Criação de Access Keys
- ❌ Policies anexadas a Users

#### aws/terraform/variables.tf

**Adicionado:**
```hcl
variable "github_repository" {
  description = "GitHub repository (owner/repo) para OIDC trust policy"
  type        = string
}
```

**Validações:**
- ✅ Formato `owner/repo` validado
- ✅ JWT tokens validados
- ✅ Email validado

### 5. Documentação Adicional

#### MIGRACAO_IAM_ROLES.md (ESTE ARQUIVO)
- ✅ Explica a mudança
- ✅ Comparação antes/depois
- ✅ Checklist de migração

---

## 🚀 Como Usar a Nova Arquitetura

### Opção 1: Script Automático

```bash
cd pequenos-grupos

# Executar novo script
./scripts/setup-aws-oidc.sh

# Ou (link simbólico)
./scripts/setup-aws.sh
```

### Opção 2: Terraform

```bash
cd aws/terraform

# 1. Configurar variáveis
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# Adicione github_repository:
github_repository = "seu-usuario/pequenos-grupos"

# 2. Aplicar
terraform init
terraform apply
```

### Opção 3: Manual (Passo a Passo)

Seguir **DEPLOY_AWS.md** completamente reescrito.

---

## ✅ Checklist de Migração

### Se Você Já Tem Deploy Com IAM Users

1. **Backup das credenciais antigas** (por segurança)
   ```bash
   # Anotar:
   # - IAM User name
   # - Access Key ID (se precisar reverter)
   ```

2. **Criar OIDC Provider e Roles**
   ```bash
   ./scripts/setup-aws-oidc.sh
   ```

3. **Atualizar GitHub Secrets**
   
   **Remover:**
   - ❌ `AWS_ACCESS_KEY_ID`
   - ❌ `AWS_SECRET_ACCESS_KEY`
   
   **Adicionar:**
   - ✅ `AWS_ROLE_ARN` (do output do script)
   - ✅ `AWS_REGION` (manter)

4. **Atualizar GitHub Actions workflows**
   ```bash
   # Já está atualizado no repositório!
   git pull origin main
   ```

5. **Testar CI/CD**
   ```bash
   git commit --allow-empty -m "test: CI/CD com OIDC"
   git push origin main
   
   # Ver logs em GitHub Actions
   ```

6. **Deletar IAM User antigo** (após validação)
   ```bash
   aws iam delete-access-key \
     --user-name pequenos-grupos-cicd \
     --access-key-id AKIA...
   
   aws iam delete-user \
     --user-name pequenos-grupos-cicd
   ```

### Se É Deploy Novo (Zero Setup)

1. **Executar setup**
   ```bash
   ./scripts/setup-aws-oidc.sh
   ```

2. **Seguir instruções do output**
   - Configurar GitHub Secrets
   - Criar app no Amplify
   - Deploy

**✅ Pronto!** Zero IAM Users, 100% seguro.

---

## 🔍 Validações

### Verificar Se Está Usando OIDC

```bash
# 1. GitHub Actions deve ter 'id-token: write'
grep -r "id-token: write" .github/workflows/

# 2. Não deve ter AWS_ACCESS_KEY_ID
grep -r "AWS_ACCESS_KEY_ID" .github/workflows/ && echo "❌ FOUND!" || echo "✅ OK"

# 3. Deve ter role-to-assume
grep -r "role-to-assume" .github/workflows/

# 4. OIDC Provider deve existir na AWS
aws iam list-open-id-connect-providers
```

### Verificar IAM Roles

```bash
# GitHubActionsRole deve existir
aws iam get-role --role-name GitHubActionsRole-PequenosGrupos

# Deve ter trust policy com OIDC
aws iam get-role --role-name GitHubActionsRole-PequenosGrupos \
  --query 'Role.AssumeRolePolicyDocument' \
  | grep "token.actions.githubusercontent.com"
```

### Teste End-to-End

```bash
# Push para main
git commit --allow-empty -m "test: validar OIDC"
git push origin main

# Acompanhar GitHub Actions
# https://github.com/SEU-USUARIO/pequenos-grupos/actions

# Ver logs do assume role:
# "✅ Authenticated as: arn:aws:sts::ACCOUNT_ID:assumed-role/GitHubActionsRole-PequenosGrupos/..."
```

---

## 📊 Comparação de Segurança

| Aspecto | IAM Users | IAM Roles (OIDC) |
|---------|-----------|------------------|
| **Credenciais** | Permanentes | Temporárias (15min-1h) |
| **Rotação** | Manual | Automática |
| **Vazamento** | ⚠️ Válida para sempre | ✅ Expira em minutos |
| **Auditoria** | Difícil (quem?) | ✅ CloudTrail (session name) |
| **Compliance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Recomendação AWS** | ❌ Evitar | ✅ Usar sempre |
| **Zero Trust** | ❌ | ✅ |

---

## 🚨 Troubleshooting Migração

### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Causa:** Trust policy incorreta ou OIDC Provider não criado

**Solução:**
```bash
# 1. Verificar OIDC Provider
aws iam list-open-id-connect-providers

# 2. Verificar trust policy
aws iam get-role --role-name GitHubActionsRole-PequenosGrupos

# 3. Repositório no trust policy deve estar correto
# Deve ser: "repo:SEU-USUARIO/pequenos-grupos:*"
```

### Erro: "Permissions id-token: write not granted"

**Causa:** Workflow sem permissão OIDC

**Solução:**
```yaml
# Adicionar no workflow:
permissions:
  id-token: write
  contents: read
```

### GitHub Actions ainda usa Access Keys

**Causa:** Workflow antigo ou secrets antigos

**Solução:**
```bash
# 1. Atualizar workflows
git pull origin main

# 2. Verificar secrets no GitHub
# Settings → Secrets → Actions
# Deletar: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

---

## 📚 Recursos Adicionais

### Documentação AWS
- [IAM Roles for OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Security Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### Blog Posts AWS
- [Use IAM Roles, Not Users](https://aws.amazon.com/blogs/security/how-to-use-trust-policies-with-iam-roles/)
- [OIDC with GitHub Actions](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/)

### Vídeos
- [AWS re:Invent - IAM Best Practices](https://www.youtube.com/watch?v=YMvP7o9Qal0)
- [GitHub Actions OIDC Tutorial](https://www.youtube.com/watch?v=CUYhD6YRPEE)

---

## 🎯 Conclusão

**Migração completa para IAM Roles com OIDC:**

✅ **0 IAM Users**  
✅ **0 Long-Lived Credentials**  
✅ **100% Temporary Tokens**  
✅ **Máxima Segurança**  
✅ **Compliance AWS Well-Architected**  

**Status:** ✅ **Production-Ready**

**Próximo passo:** Execute `./scripts/setup-aws-oidc.sh` e comece o deploy!

---

**Atualizado:** 2026-02-12  
**Versão:** 1.3.0 (IAM Roles Only)
