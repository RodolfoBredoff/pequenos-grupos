# Terraform Configuration - Pequenos Grupos Manager

## 📋 O Que Este Terraform Cria

Este código Terraform automatiza a criação de:

- ✅ **SSM Parameters** (5 parâmetros) - Variáveis de ambiente seguras
- ✅ **IAM Policy** - Permissões mínimas para Amplify
- ✅ **IAM Role** - Role de execução para Amplify
- ✅ **CloudWatch Log Group** - Logs centralizados
- ✅ **CloudWatch Alarm** - Alerta de falhas de build
- ✅ **SNS Topic** - Notificações por email
- ✅ **AWS Budget** - Controle de gastos ($10/mês)

**Custo:** $0 (todos os recursos estão no free tier)

---

## 🚀 Como Usar

### Pré-requisitos

```bash
# Instalar Terraform
brew install terraform

# Instalar AWS CLI
brew install awscli

# Configurar credenciais
aws configure
```

### Passo 1: Preparar Variáveis

```bash
# Copiar template
cp terraform.tfvars.example terraform.tfvars

# Editar com seus valores
nano terraform.tfvars
```

**Preencha:**
- `aws_region` - Ex: us-east-1 ou sa-east-1
- `alert_email` - Seu email
- `supabase_url` - URL do Supabase
- `supabase_anon_key` - Anon key
- `supabase_service_role_key` - Service role key
- `cron_secret` - Gerar com: `openssl rand -base64 32`

### Passo 2: Inicializar Terraform

```bash
cd aws/terraform
terraform init
```

### Passo 3: Revisar Plano

```bash
terraform plan
```

Terraform mostrará:
- Recursos que serão criados
- Valores das variáveis (secrets aparecem como "sensitive")

### Passo 4: Aplicar

```bash
terraform apply
```

Digite `yes` para confirmar.

### Passo 5: Ver Outputs

```bash
terraform output
```

Você verá:
- Paths dos SSM parameters
- ARN do IAM Role
- Próximos passos

---

## 📊 Recursos Criados

### SSM Parameters
```
/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL (String)
/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY (SecureString)
/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY (SecureString)
/pequenos-grupos/prod/CRON_SECRET (SecureString)
/pequenos-grupos/prod/NODE_ENV (String)
```

### IAM
- **Policy:** PequenosGruposAmplifyPolicy-prod
- **Role:** AmplifyExecutionRole-PequenosGrupos-prod

### CloudWatch
- **Log Group:** /aws/amplify/pequenos-grupos
- **Alarm:** pequenos-grupos-build-failures

### Budget
- **Nome:** pequenos-grupos-monthly-budget
- **Limite:** $10/mês
- **Alertas:** 80% (real) e 100% (forecast)

---

## 🔐 Segurança

### Secrets Management

- ✅ Secrets armazenados como **SecureString** no SSM
- ✅ Criptografia automática com **AWS KMS**
- ✅ Acesso via IAM (least privilege)
- ✅ Terraform state pode ser remoto (S3 + DynamoDB)

### IAM Best Practices

- ✅ Políticas com escopos específicos (não `Resource: "*"`)
- ✅ Conditions para KMS (acesso apenas via SSM)
- ✅ External ID para assume role (previne confused deputy)
- ✅ AWS managed policy (AdministratorAccess-Amplify)

### Auditoria

- ✅ CloudTrail: Todas as ações IAM/SSM registradas
- ✅ CloudWatch Logs: 7 dias de retenção
- ✅ Tags: Todos os recursos tagueados

---

## 💰 Custos

| Recurso | Quantidade | Custo/Mês |
|---------|------------|-----------|
| SSM Parameters (Standard) | 5 | $0 |
| IAM Roles/Policies | 2 | $0 |
| CloudWatch Logs (5GB) | ~1GB | $0 (free tier) |
| CloudWatch Alarms | 1 | $0 (10 free) |
| SNS (Email) | ~100 notif | $0 (1000 free) |
| AWS Budgets | 1 | $0 (2 free) |
| **TOTAL** | | **$0** |

---

## 🔄 Atualizar Recursos

Para atualizar secrets ou configurações:

```bash
# Editar terraform.tfvars
nano terraform.tfvars

# Ver mudanças
terraform plan

# Aplicar
terraform apply
```

---

## 🗑️ Destruir Recursos

**⚠️ CUIDADO: Isso deletará todos os recursos!**

```bash
terraform destroy
```

---

## 🆘 Troubleshooting

### Erro: "AccessDenied" ao criar recursos

Verifique se suas credenciais AWS têm permissões:
```bash
aws sts get-caller-identity
aws iam get-user
```

### Erro: "Parameter already exists"

Adicione flag `--overwrite` ou delete manualmente:
```bash
aws ssm delete-parameter --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL"
```

### State lock (se usar S3 backend)

```bash
# Ver locks
aws dynamodb scan --table-name terraform-state-lock

# Forçar unlock (cuidado!)
terraform force-unlock LOCK_ID
```

---

## 📚 Recursos Adicionais

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Amplify Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/amplify_app)
- [SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

---

**Infraestrutura como Código (IaC) Pronta! 🚀**
