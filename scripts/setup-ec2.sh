#!/bin/bash

# Script de configuração inicial da EC2 para Pequenos Grupos Manager
# Suporta Amazon Linux 2023 e Ubuntu 22.04 LTS

set -e

echo "🚀 Configurando EC2 para Pequenos Grupos Manager..."

# Detectar distribuição
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Não foi possível detectar a distribuição Linux"
    exit 1
fi

echo "📦 Distribuição detectada: $OS"

# Instalar Docker
if [ "$OS" = "amzn" ] || [ "$OS" = "amazon" ]; then
    echo "📦 Instalando Docker no Amazon Linux..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
    
elif [ "$OS" = "ubuntu" ]; then
    echo "📦 Instalando Docker no Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu || sudo usermod -aG docker $USER
else
    echo "❌ Distribuição não suportada: $OS"
    exit 1
fi

# Instalar Docker Compose (standalone)
echo "📦 Instalando Docker Compose..."
DOCKER_COMPOSE_VERSION="v2.24.0"
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
sudo mkdir -p /mnt/postgres-data
sudo chmod 755 /mnt/postgres-data

# Criar diretório da aplicação
APP_DIR="/opt/pequenos-grupos"
if [ "$OS" = "ubuntu" ]; then
    APP_DIR="/home/ubuntu/pequenos-grupos"
fi

mkdir -p $APP_DIR
cd $APP_DIR

echo "✅ Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o volume EBS e monte em /mnt/postgres-data"
echo "2. Clone o repositório em $APP_DIR"
echo "3. Configure os parâmetros no SSM Parameter Store"
echo "4. Execute: docker-compose up -d"
echo ""
echo "💡 Para aplicar as mudanças de grupo Docker, faça logout e login novamente"
