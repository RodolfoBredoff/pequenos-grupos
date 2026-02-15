#!/bin/bash

# Script de Monitoramento de Custos - AWS
# Verifica custos do mês atual e alerta se exceder threshold

set -e

echo "======================================"
echo "  Monitoramento de Custos AWS"
echo "======================================"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não instalado!"
    exit 1
fi

# Threshold de alerta (em USD)
THRESHOLD=${1:-10}

echo "💰 Threshold de alerta: \$$THRESHOLD USD"
echo ""

# Data inicial (primeiro dia do mês)
START_DATE=$(date -u +%Y-%m-01)
END_DATE=$(date -u +%Y-%m-%d)

echo "📅 Período: $START_DATE a $END_DATE"
echo ""

# Buscar custos do mês
COST_DATA=$(aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE \
  --output json)

# Custo total
TOTAL_COST=$(echo $COST_DATA | jq -r '.ResultsByTime[0].Total.UnblendedCost.Amount')
TOTAL_COST_ROUNDED=$(printf "%.2f" $TOTAL_COST)

echo "======================================"
echo "  💵 Custo Total: \$$TOTAL_COST_ROUNDED USD"
echo "======================================"
echo ""

# Breakdown por serviço
echo "📊 Custos por Serviço:"
echo ""

echo $COST_DATA | jq -r '
  .ResultsByTime[0].Groups[] | 
  select(.Metrics.UnblendedCost.Amount != "0") |
  "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount | tonumber | . * 100 | round / 100)"
' | sort -t'$' -k2 -rn

echo ""

# Verificar threshold
if (( $(echo "$TOTAL_COST > $THRESHOLD" | bc -l) )); then
    echo "⚠️  ALERTA: Custo excedeu o threshold!"
    echo "   Threshold: \$$THRESHOLD"
    echo "   Atual: \$$TOTAL_COST_ROUNDED"
    echo ""
    echo "🔍 Recomendações:"
    echo "   1. Verifique AWS Cost Explorer para detalhes"
    echo "   2. Revise uso de bandwidth do Amplify"
    echo "   3. Verifique logs do CloudWatch (pode estar acumulando)"
    echo "   4. Considere configurar AWS Budgets"
    exit 1
else
    echo "✅ Custo dentro do esperado!"
fi

echo ""
echo "======================================"
echo "  Forecast (Projeção até fim do mês)"
echo "======================================"
echo ""

FORECAST=$(aws ce get-cost-forecast \
  --time-period Start=$(date -u +%Y-%m-%d),End=$(date -u -v+1m +%Y-%m-01) \
  --metric UNBLENDED_COST \
  --granularity MONTHLY \
  --output json 2>/dev/null || echo '{"Total":{"Amount":"0"}}')

FORECAST_AMOUNT=$(echo $FORECAST | jq -r '.Total.Amount // "0"')
FORECAST_ROUNDED=$(printf "%.2f" $FORECAST_AMOUNT)

echo "📈 Projeção: \$$FORECAST_ROUNDED USD"
echo ""

if (( $(echo "$FORECAST_AMOUNT > $THRESHOLD" | bc -l) )); then
    echo "⚠️  Projeção excederá o threshold!"
else
    echo "✅ Projeção dentro do esperado"
fi

echo ""
