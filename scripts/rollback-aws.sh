#!/bin/bash

# Script de Rollback - Pequenos Grupos Manager
# Reverte para a versão anterior em caso de problemas

set -e

echo "======================================"
echo "  Rollback AWS Amplify"
echo "======================================"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não instalado!"
    exit 1
fi

# Solicitar informações
read -p "AWS Region (ex: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Nome do App Amplify (default: pequenos-grupos): " APP_NAME
APP_NAME=${APP_NAME:-pequenos-grupos}

echo ""
echo "🔍 Buscando app Amplify..."

# Buscar App ID
APP_ID=$(aws amplify list-apps \
  --region $AWS_REGION \
  --query "apps[?name=='$APP_NAME'].appId" \
  --output text)

if [ -z "$APP_ID" ]; then
    echo "❌ App '$APP_NAME' não encontrado!"
    exit 1
fi

echo "✅ App encontrado: $APP_ID"
echo ""

# Listar últimos deploys
echo "📋 Últimos deploys:"
echo ""

aws amplify list-jobs \
  --app-id $APP_ID \
  --branch-name main \
  --max-results 10 \
  --region $AWS_REGION \
  --query 'jobSummaries[*].[jobId,status,commitTime,commitMessage]' \
  --output table

echo ""
read -p "Digite o Job ID para fazer rollback (ou Enter para cancelar): " JOB_ID

if [ -z "$JOB_ID" ]; then
    echo "Rollback cancelado."
    exit 0
fi

echo ""
echo "⚠️  ATENÇÃO: Você está prestes a fazer rollback!"
echo "   App: $APP_NAME ($APP_ID)"
echo "   Job ID: $JOB_ID"
echo ""
read -p "Tem certeza? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelado."
    exit 0
fi

echo ""
echo "🔄 Fazendo rollback..."

# Fazer rollback (criar novo job com commit anterior)
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region $AWS_REGION

echo ""
echo "✅ Rollback iniciado!"
echo ""
echo "📊 Acompanhe o progresso em:"
echo "https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$APP_ID/main"
echo ""
