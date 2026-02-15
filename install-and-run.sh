#!/bin/bash

# Script de Instalação e Execução - Pequenos Grupos Manager
# Autor: Sistema de Pequenos Grupos
# Data: 2026-02-12

set -e

echo "======================================"
echo "  Pequenos Grupos Manager v1.1.0"
echo "  Instalação e Configuração"
echo "======================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo ""
    echo "Por favor, instale Node.js primeiro:"
    echo "  - MacOS: brew install node"
    echo "  - Ou baixe em: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo "✅ npm encontrado: $(npm --version)"
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo ""
    echo "Criando a partir do template..."
    cp .env.local.example .env.local
    echo "✅ Arquivo .env.local criado!"
    echo ""
    echo "⚠️  IMPORTANTE: Edite .env.local com suas credenciais do Supabase antes de continuar!"
    echo ""
    read -p "Pressione ENTER após configurar o .env.local..."
fi

echo ""
echo "======================================"
echo "  Instalando Dependências"
echo "======================================"
echo ""

# Instalar dependências
npm install

echo ""
echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "Pacotes instalados:"
echo "  - Next.js 15 + React 19"
echo "  - Supabase Client"
echo "  - Tailwind CSS + shadcn/ui"
echo "  - Recharts (gráficos)"
echo "  - Dexie (offline mode)"
echo ""

# Verificar se build funciona
echo "======================================"
echo "  Verificando Build"
echo "======================================"
echo ""

npm run build

echo ""
echo "✅ Build concluído com sucesso!"
echo ""

# Instruções finais
echo "======================================"
echo "  🎉 Instalação Completa!"
echo "======================================"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Execute o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "2. Acesse no navegador:"
echo "   http://localhost:3000"
echo ""
echo "3. Funcionalidades disponíveis:"
echo "   ✅ Dashboard + Estatísticas"
echo "   ✅ Gestão de Pessoas (CRUD)"
echo "   ✅ Chamada Digital"
echo "   ✅ Agenda de Reuniões"
echo "   ✅ Dashboard de Engajamento (NOVO!)"
echo "   ✅ Broadcast WhatsApp (NOVO!)"
echo "   ✅ Modo Offline Completo (NOVO!)"
echo ""
echo "4. Documentação:"
echo "   - README.md - Visão geral"
echo "   - SETUP.md - Configuração detalhada"
echo "   - TESTE_FUNCIONALIDADES_BONUS.md - Testar novas features"
echo "   - QUICKSTART.md - Começar rápido"
echo ""
echo "======================================"
echo ""
read -p "Deseja iniciar o servidor agora? (s/N): " start_server

if [ "$start_server" = "s" ] || [ "$start_server" = "S" ]; then
    echo ""
    echo "Iniciando servidor..."
    echo ""
    npm run dev
else
    echo ""
    echo "Para iniciar depois, execute:"
    echo "  npm run dev"
    echo ""
fi
