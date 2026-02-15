#!/bin/bash

# Script de Setup AWS com OIDC - Pequenos Grupos Manager
# Automatiza a criação de recursos AWS usando IAM Roles (sem IAM Users)

set -e

echo "======================================"
echo "  AWS Setup - OIDC (IAM Roles Only)"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI não está instalado!${NC}"
    echo ""
    echo "Instale com:"
    echo "  - MacOS: brew install awscli"
    echo "  - Linux: pip install awscli"
    echo "  - Windows: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI encontrado:${NC} $(aws --version)"
echo ""

# Verificar credenciais AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Credenciais AWS não configuradas!${NC}"
    echo ""
    echo "Configure com:"
    echo "  aws configure"
    exit 1
fi

echo -e "${GREEN}✅ Credenciais AWS válidas${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Account ID: $ACCOUNT_ID"
echo ""

# Solicitar informações
read -p "AWS Region (ex: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "GitHub Repository (ex: usuario/pequenos-grupos): " GITHUB_REPO
if [ -z "$GITHUB_REPO" ]; then
    echo -e "${RED}❌ Repositório GitHub é obrigatório!${NC}"
    exit 1
fi

read -p "Supabase Project URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -p "Cron Secret (deixe vazio para gerar): " CRON_SECRET

if [ -z "$CRON_SECRET" ]; then
    CRON_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Cron Secret gerado automaticamente${NC}"
fi

echo ""
echo "======================================"
echo "  1. Criando OIDC Provider"
echo "======================================"
echo ""

# Verificar se OIDC provider já existe
OIDC_EXISTS=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')].Arn" --output text)

if [ -z "$OIDC_EXISTS" ]; then
    echo "Criando GitHub OIDC Provider..."
    
    THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"
    
    aws iam create-open-id-connect-provider \
      --url https://token.actions.githubusercontent.com \
      --client-id-list sts.amazonaws.com \
      --thumbprint-list $THUMBPRINT \
      --tags Key=Project,Value=pequenos-grupos
    
    OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
    echo -e "${GREEN}✅ OIDC Provider criado!${NC}"
else
    OIDC_PROVIDER_ARN=$OIDC_EXISTS
    echo -e "${YELLOW}⚠️  OIDC Provider já existe, pulando...${NC}"
fi

echo "   ARN: $OIDC_PROVIDER_ARN"
echo ""

echo "======================================"
echo "  2. Criando IAM Roles e Policies"
echo "======================================"
echo ""

# 2.1 Policy para GitHub Actions
echo "Criando GitHubActionsAmplifyPolicy..."

cat > /tmp/github-actions-policy.json <<EOF
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
        "arn:aws:amplify:*:${ACCOUNT_ID}:apps/*/branches/main",
        "arn:aws:amplify:*:${ACCOUNT_ID}:apps/*/branches/develop"
      ]
    },
    {
      "Sid": "AmplifyListApps",
      "Effect": "Allow",
      "Action": ["amplify:ListApps"],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name GitHubActionsAmplifyPolicy \
  --policy-document file:///tmp/github-actions-policy.json \
  --description "Policy for GitHub Actions to deploy to Amplify" \
  --tags Key=Project,Value=pequenos-grupos \
  2>/dev/null && echo -e "${GREEN}✅ GitHubActionsAmplifyPolicy criada!${NC}" || echo -e "${YELLOW}⚠️  Policy já existe${NC}"

# 2.2 Trust Policy para GitHub Actions Role
echo "Criando GitHubActionsRole-PequenosGrupos..."

cat > /tmp/github-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${OIDC_PROVIDER_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name GitHubActionsRole-PequenosGrupos \
  --assume-role-policy-document file:///tmp/github-trust-policy.json \
  --description "Role for GitHub Actions to deploy to AWS Amplify" \
  --tags Key=Project,Value=pequenos-grupos \
  2>/dev/null && echo -e "${GREEN}✅ GitHubActionsRole criado!${NC}" || echo -e "${YELLOW}⚠️  Role já existe${NC}"

# Anexar policy ao role
aws iam attach-role-policy \
  --role-name GitHubActionsRole-PequenosGrupos \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/GitHubActionsAmplifyPolicy \
  2>/dev/null || echo -e "${YELLOW}⚠️  Policy já anexada${NC}"

echo ""

# 2.3 Policy para Amplify Service
echo "Criando AmplifyServicePolicy-PequenosGrupos..."

cat > /tmp/amplify-service-policy.json <<EOF
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
      "Resource": "arn:aws:ssm:*:${ACCOUNT_ID}:parameter/pequenos-grupos/*"
    },
    {
      "Sid": "KMSDecryptAccess",
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:*:${ACCOUNT_ID}:alias/aws/ssm",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.${AWS_REGION}.amazonaws.com"
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
      "Resource": "arn:aws:logs:*:${ACCOUNT_ID}:log-group:/aws/amplify/*:*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name AmplifyServicePolicy-PequenosGrupos \
  --policy-document file:///tmp/amplify-service-policy.json \
  --description "Policy for Amplify Service Role" \
  --tags Key=Project,Value=pequenos-grupos \
  2>/dev/null && echo -e "${GREEN}✅ AmplifyServicePolicy criada!${NC}" || echo -e "${YELLOW}⚠️  Policy já existe${NC}"

# 2.4 Amplify Service Role
echo "Criando AmplifyServiceRole-PequenosGrupos..."

cat > /tmp/amplify-trust-policy.json <<EOF
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
EOF

aws iam create-role \
  --role-name AmplifyServiceRole-PequenosGrupos \
  --assume-role-policy-document file:///tmp/amplify-trust-policy.json \
  --description "Service role for AWS Amplify" \
  --tags Key=Project,Value=pequenos-grupos \
  2>/dev/null && echo -e "${GREEN}✅ AmplifyServiceRole criado!${NC}" || echo -e "${YELLOW}⚠️  Role já existe${NC}"

# Anexar policies ao Amplify role
aws iam attach-role-policy \
  --role-name AmplifyServiceRole-PequenosGrupos \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/AmplifyServicePolicy-PequenosGrupos \
  2>/dev/null || echo -e "${YELLOW}⚠️  Custom policy já anexada${NC}"

aws iam attach-role-policy \
  --role-name AmplifyServiceRole-PequenosGrupos \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify \
  2>/dev/null || echo -e "${YELLOW}⚠️  AWS managed policy já anexada${NC}"

echo ""

echo "======================================"
echo "  3. Criando SSM Parameters"
echo "======================================"
echo ""

aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL" \
  --value "$SUPABASE_URL" \
  --type "String" \
  --description "Supabase Project URL" \
  --region $AWS_REGION \
  --overwrite \
  --tags Key=Project,Value=pequenos-grupos \
  || echo -e "${YELLOW}⚠️  Parâmetro já existe, atualizando...${NC}"

aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --value "$SUPABASE_ANON_KEY" \
  --type "SecureString" \
  --description "Supabase Anon Key" \
  --region $AWS_REGION \
  --overwrite \
  --tags Key=Project,Value=pequenos-grupos \
  || echo -e "${YELLOW}⚠️  Parâmetro já existe, atualizando...${NC}"

aws ssm put-parameter \
  --name "/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY" \
  --value "$SUPABASE_SERVICE_ROLE_KEY" \
  --type "SecureString" \
  --description "Supabase Service Role Key" \
  --region $AWS_REGION \
  --overwrite \
  --tags Key=Project,Value=pequenos-grupos \
  || echo -e "${YELLOW}⚠️  Parâmetro já existe, atualizando...${NC}"

aws ssm put-parameter \
  --name "/pequenos-grupos/prod/CRON_SECRET" \
  --value "$CRON_SECRET" \
  --type "SecureString" \
  --description "Cron Job Authentication Secret" \
  --region $AWS_REGION \
  --overwrite \
  --tags Key=Project,Value=pequenos-grupos \
  || echo -e "${YELLOW}⚠️  Parâmetro já existe, atualizando...${NC}"

aws ssm put-parameter \
  --name "/pequenos-grupos/prod/NODE_ENV" \
  --value "production" \
  --type "String" \
  --description "Node Environment" \
  --region $AWS_REGION \
  --overwrite \
  --tags Key=Project,Value=pequenos-grupos \
  || echo -e "${YELLOW}⚠️  Parâmetro já existe, atualizando...${NC}"

echo -e "${GREEN}✅ Parâmetros criados no SSM Parameter Store!${NC}"
echo ""

# Limpar arquivos temporários
rm -f /tmp/github-actions-policy.json
rm -f /tmp/github-trust-policy.json
rm -f /tmp/amplify-service-policy.json
rm -f /tmp/amplify-trust-policy.json

echo "======================================"
echo "  ✅ Setup AWS OIDC Completo!"
echo "======================================"
echo ""
echo -e "${GREEN}Recursos criados com sucesso!${NC}"
echo ""
echo "📋 ARNs dos Roles:"
echo ""
echo "GitHub Actions Role:"
echo "  arn:aws:iam::${ACCOUNT_ID}:role/GitHubActionsRole-PequenosGrupos"
echo ""
echo "Amplify Service Role:"
echo "  arn:aws:iam::${ACCOUNT_ID}:role/AmplifyServiceRole-PequenosGrupos"
echo ""
echo "======================================"
echo "  🔐 Configurar GitHub Secrets"
echo "======================================"
echo ""
echo "GitHub → Repository → Settings → Secrets and variables → Actions"
echo ""
echo "Adicione os seguintes secrets:"
echo ""
echo "AWS_REGION:"
echo "  $AWS_REGION"
echo ""
echo "AWS_ROLE_ARN:"
echo "  arn:aws:iam::${ACCOUNT_ID}:role/GitHubActionsRole-PequenosGrupos"
echo ""
echo -e "${YELLOW}⚠️  NÃO adicione AWS_ACCESS_KEY_ID nem AWS_SECRET_ACCESS_KEY!${NC}"
echo -e "${YELLOW}   Usamos OIDC - zero long-lived credentials!${NC}"
echo ""
echo "======================================"
echo "  📦 Próximos Passos"
echo "======================================"
echo ""
echo "1. Configurar GitHub Secrets (veja acima)"
echo ""
echo "2. Criar app no AWS Amplify Console:"
echo "   https://console.aws.amazon.com/amplify/home?region=${AWS_REGION}"
echo ""
echo "3. Configurar Amplify:"
echo "   - Conectar ao GitHub"
echo "   - Branch: main"
echo "   - Service Role: AmplifyServiceRole-PequenosGrupos"
echo "   - Environment Variables:"
echo "     NEXT_PUBLIC_SUPABASE_URL = _ssm:/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_URL"
echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY = _ssm:/pequenos-grupos/prod/NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     SUPABASE_SERVICE_ROLE_KEY = _ssm:/pequenos-grupos/prod/SUPABASE_SERVICE_ROLE_KEY"
echo "     CRON_SECRET = _ssm:/pequenos-grupos/prod/CRON_SECRET"
echo "     NODE_ENV = production"
echo ""
echo "4. Deploy!"
echo "   git push origin main"
echo ""
echo "🔑 Cron Secret (guarde em local seguro):"
echo "  $CRON_SECRET"
echo ""
echo -e "${GREEN}✅ Pronto para deploy!${NC}"
echo ""
