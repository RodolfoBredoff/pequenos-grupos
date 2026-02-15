# Changelog - AWS Deployment

Documentação de todas as mudanças relacionadas ao deploy na AWS.

---

## [1.2.0] - 2026-02-12

### ✨ Adicionado - Deploy AWS Completo

#### 📖 Documentação
- **`DEPLOY_AWS.md`** - Guia completo de deploy na AWS
  - Arquitetura com AWS Amplify + CloudFront
  - Estimativa de custos detalhada ($0-5/mês)
  - Configuração passo-a-passo de IAM, SSM, Amplify
  - Melhores práticas de segurança
  - Troubleshooting e monitoramento
  - Plano de disaster recovery
  - Checklist completo de deploy

- **`CUSTOS_COMPARACAO.md`** - Análise comparativa AWS vs Vercel
  - Breakdown detalhado de custos
  - Projeções para diferentes cenários
  - Recomendações por caso de uso
  - Fatores além do custo (segurança, compliance, DX)
  - Otimizações de custo

#### 🤖 Automação CI/CD

- **`.github/workflows/deploy.yml`** - Pipeline principal
  - Testes automáticos (lint, type check, build)
  - Deploy automático ao push para `main`
  - Integração com AWS Amplify via AWS CLI
  - Notificações de sucesso/falha

- **`.github/workflows/preview.yml`** - Preview deploys
  - Build automático em Pull Requests
  - Verificações de segurança (npm audit, secrets scan)
  - Comentários automáticos no PR com URL de preview

#### 🏗️ Infraestrutura como Código (IaC)

- **`aws/terraform/main.tf`** - Configuração Terraform
  - SSM Parameters (5 parâmetros)
  - IAM Policy customizada (least privilege)
  - IAM Role para Amplify
  - CloudWatch Log Group e Alarms
  - SNS Topic para alertas
  - AWS Budget ($10/mês threshold)

- **`aws/terraform/variables.tf`** - Variáveis Terraform
  - Validações para region, environment, email
  - Variáveis sensitive para secrets
  - Tags padrão

- **`aws/terraform/outputs.tf`** - Outputs Terraform
  - Paths dos SSM parameters
  - ARN do IAM Role
  - Instruções de próximos passos

- **`aws/terraform/terraform.tfvars.example`** - Template de variáveis
  - Exemplo de configuração
  - Instruções de preenchimento

- **`aws/terraform/README.md`** - Documentação Terraform
  - Como usar o Terraform
  - Pré-requisitos
  - Comandos principais
  - Troubleshooting

#### 🔐 Segurança

- **`aws/iam-policies.json`** - Políticas IAM detalhadas
  - AmplifyDeploymentPolicy (mínimo para CI/CD)
  - AmplifyExecutionPolicy (runtime)
  - DeveloperReadOnlyPolicy (desenvolvedores)
  - Trust policies (Amplify, GitHub OIDC)
  - Configuração de Budget alerts
  - Tags obrigatórias

#### 🛠️ Scripts de Utilidade

- **`scripts/setup-aws.sh`** - Setup automático AWS
  - Criação de SSM parameters
  - Criação de IAM policies e roles
  - Validação de credenciais
  - Instruções interativas

- **`scripts/rollback-aws.sh`** - Rollback de deployments
  - Lista deployments recentes
  - Rollback para versão anterior
  - Confirmação de segurança

- **`scripts/monitor-costs.sh`** - Monitoramento de custos
  - Busca custos do mês via AWS Cost Explorer
  - Breakdown por serviço
  - Alertas de threshold
  - Forecast de fim de mês

- **`scripts/validate-security.sh`** - Validação de segurança
  - Busca secrets hardcoded (JWT, AWS keys)
  - Verifica .env.local não commitado
  - npm audit de vulnerabilidades
  - TypeScript type checking
  - Validação de CSP headers

#### ⚙️ Configurações

- **`amplify.yml`** - Build configuration AWS Amplify
  - Fases de build (preBuild, build, postBuild)
  - Configuração de cache
  - Headers de segurança (HSTS, CSP, X-Frame-Options, etc)
  - Cache-Control otimizado

- **`.gitignore`** (atualizado)
  - Arquivos Terraform (.terraform/, *.tfstate)
  - Credenciais AWS
  - terraform.tfvars (exceto .example)

- **`README.md`** (atualizado)
  - Seção sobre deploy AWS
  - Recomendação de AWS como opção principal
  - Link para DEPLOY_AWS.md

#### 📦 Estrutura de Diretórios

```
aws/
├── iam-policies.json           # Políticas IAM detalhadas
└── terraform/                  # Infraestrutura como código
    ├── main.tf                # Recursos principais
    ├── variables.tf           # Definição de variáveis
    ├── outputs.tf            # Outputs do Terraform
    ├── terraform.tfvars.example  # Template de variáveis
    └── README.md             # Documentação Terraform

scripts/
├── setup-aws.sh              # Setup automático AWS
├── rollback-aws.sh           # Rollback de deployments
├── monitor-costs.sh          # Monitoramento de custos
└── validate-security.sh      # Validação de segurança

.github/workflows/
├── deploy.yml                # Pipeline principal
└── preview.yml               # Preview deploys em PRs
```

### 🔒 Melhorias de Segurança

1. **IAM Least Privilege**
   - Políticas com recursos específicos (não `*`)
   - Conditions para KMS (via SSM apenas)
   - External ID para assume role

2. **Secrets Management**
   - SSM Parameter Store (SecureString)
   - Criptografia KMS automática
   - Acesso via IAM (sem hardcoded)

3. **Headers de Segurança**
   - Content-Security-Policy
   - Strict-Transport-Security (HSTS)
   - X-Frame-Options (clickjacking)
   - X-Content-Type-Options
   - Permissions-Policy

4. **Auditoria e Compliance**
   - CloudTrail logging (todas ações IAM/SSM)
   - CloudWatch Logs (7 dias retenção)
   - Budget alerts (80% e 100%)
   - Tags em todos os recursos

5. **Validações Automatizadas**
   - Scan de secrets no código (CI)
   - npm audit em PRs
   - TypeScript strict mode
   - Linter obrigatório

### 📊 Monitoramento

1. **CloudWatch Alarms**
   - Build failures
   - Error rate 5xx
   - Latência > 2s (customizável)

2. **AWS Budget**
   - Threshold: $10/mês
   - Alertas: 80% (real) e 100% (forecast)
   - Notificação via email (SNS)

3. **Scripts de Monitoramento**
   - `monitor-costs.sh` - Custos em tempo real
   - CloudWatch Logs - Logs centralizados
   - Cost Explorer - Análise de tendências

### 💰 Custo Estimado

| Período | Custo Mensal | Acumulado (12m) |
|---------|--------------|-----------------|
| Mês 1-12 (Free Tier) | $0-2 | $0-24 |
| Mês 13+ | $4-7 | $48-84/ano |
| Alto tráfego (500GB) | $40-50 | - |

**Comparação com Vercel:**
- Vercel Hobby: $0 (mas não comercial)
- Vercel Pro: $20/mês + overages = $240+/ano
- **Economia com AWS:** ~$180-200/ano

### 🚀 Deploy Workflow

1. **Setup inicial** (uma vez)
   ```bash
   ./scripts/setup-aws.sh
   # ou
   cd aws/terraform && terraform apply
   ```

2. **Deploy contínuo** (automático)
   ```bash
   git push origin main
   # GitHub Actions → AWS Amplify
   ```

3. **Preview** (automático em PRs)
   ```bash
   git push origin feature-branch
   # Cria PR → Preview deploy automático
   ```

4. **Rollback** (se necessário)
   ```bash
   ./scripts/rollback-aws.sh
   # ou
   git revert HEAD && git push
   ```

### 📚 Documentação

- ✅ Guia de deploy AWS completo
- ✅ Comparação de custos AWS vs Vercel
- ✅ Documentação Terraform
- ✅ Scripts comentados
- ✅ Troubleshooting incluído
- ✅ Checklist de deploy
- ✅ Plano de disaster recovery

### 🎯 Próximos Passos (Futuras Melhorias)

- [ ] Terraform remote state (S3 + DynamoDB)
- [ ] Multi-region deployment
- [ ] Blue-green deployments
- [ ] A/B testing com CloudFront
- [ ] WAF rules (SQL injection, XSS)
- [ ] Automated backups (Supabase → S3)
- [ ] Custom domain automation
- [ ] SSL certificate automation (ACM)

---

## [1.1.0] - 2026-02-11

### ✨ Adicionado - Funcionalidades Bonus

- Dashboard de Engajamento (Recharts)
- Broadcast WhatsApp
- Modo Offline (IndexedDB + Dexie.js)

### 📦 Dependências Adicionadas

```json
"recharts": "^2.13.3",
"dexie": "^4.0.10",
"dexie-react-hooks": "^1.1.7"
```

---

## [1.0.0] - 2026-02-10

### 🎉 Lançamento Inicial - MVP

- Gestão de Pessoas (CRUD)
- Agenda e Chamada
- Alertas automáticos
- Integração WhatsApp
- PWA completo
- Row Level Security

---

**Convenções:**
- ✨ Feature nova
- 🔒 Segurança
- 🛠️ Ferramentas
- 📖 Documentação
- 🤖 Automação
- 💰 Custos
- 📦 Dependências
