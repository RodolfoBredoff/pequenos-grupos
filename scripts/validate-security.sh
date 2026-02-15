#!/bin/bash

# Script de Validação de Segurança
# Verifica se não há secrets hardcoded e se as configurações estão corretas

set -e

echo "======================================"
echo "  Validação de Segurança"
echo "======================================"
echo ""

ERRORS=0

# 1. Verificar secrets hardcoded
echo "🔍 Verificando secrets hardcoded no código..."

if grep -r "eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ components/ lib/ 2>/dev/null; then
    echo "❌ JWT tokens encontrados no código!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhum JWT hardcoded"
fi

if grep -r "AKIA[0-9A-Z]{16}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
    echo "❌ AWS Access Keys encontradas no código!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhuma AWS key hardcoded"
fi

if grep -r "sk_live_[a-zA-Z0-9]" --include="*.ts" --include="*.tsx" . 2>/dev/null; then
    echo "❌ API keys encontradas no código!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhuma API key hardcoded"
fi

echo ""

# 2. Verificar .env.local não está commitado
echo "🔍 Verificando .env.local..."

if [ -f ".env.local" ] && git ls-files --error-unmatch .env.local 2>/dev/null; then
    echo "❌ .env.local está commitado no Git!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .env.local não está no Git"
fi

echo ""

# 3. Verificar .gitignore
echo "🔍 Verificando .gitignore..."

if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    echo "❌ .env.local não está no .gitignore!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .gitignore configurado corretamente"
fi

echo ""

# 4. Verificar dependencies vulnerabilities
echo "🔍 Verificando vulnerabilidades em dependências..."

if command -v npm &> /dev/null; then
    npm audit --audit-level=high 2>&1 | grep -E "vulnerabilities|found" || true
    echo "✅ Audit concluído"
else
    echo "⚠️  npm não instalado, pulando audit"
fi

echo ""

# 5. Verificar TypeScript types
echo "🔍 Verificando tipos TypeScript..."

if [ -f "tsconfig.json" ] && command -v npx &> /dev/null; then
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
        echo "❌ Erros de TypeScript encontrados!"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ TypeScript sem erros"
    fi
else
    echo "⚠️  TypeScript check não disponível"
fi

echo ""

# 6. Verificar CSP headers
echo "🔍 Verificando headers de segurança..."

if [ -f "amplify.yml" ]; then
    if grep -q "Content-Security-Policy" amplify.yml; then
        echo "✅ CSP configurado no amplify.yml"
    else
        echo "⚠️  CSP não encontrado no amplify.yml"
    fi
else
    echo "⚠️  amplify.yml não encontrado"
fi

echo ""

# Resumo final
echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo "  ✅ Validação Completa: PASSOU"
    echo "======================================"
    echo ""
    echo "Sistema pronto para deploy com segurança!"
    exit 0
else
    echo "  ❌ Validação Completa: FALHOU"
    echo "======================================"
    echo ""
    echo "Encontrados $ERRORS problema(s) de segurança."
    echo "Corrija antes de fazer deploy em produção!"
    exit 1
fi
