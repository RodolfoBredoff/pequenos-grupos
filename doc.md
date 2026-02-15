A documentação completa de deploy já foi criada. O documento principal é:
📖 DEPLOY_AWS.md
Este é o guia completo de deploy na AWS com 1.442 linhas dividido em 10 passos detalhados.
📋 Conteúdo do DEPLOY_AWS.md
Estrutura:
📊 Arquitetura
Diagrama completo da infraestrutura
Arquitetura de segurança OIDC
Fluxo de autenticação
💰 Estimativa de Custos
Free Tier (12 meses): $0-0.50/mês
Após Free Tier: $4-7/mês
Alta escala: $70-80/mês
🔐 10 PASSOS DETALHADOS:
PASSO 1: Configurar GitHub OIDC na AWS (Zero IAM Users!)
Criar Identity Provider (OIDC)
Criar IAM Role para GitHub Actions
Configurar trust policy
Validações
PASSO 2: Criar IAM Role para Amplify
Criar IAM Policy customizada
Criar IAM Role com trust policy
Anexar policies
Anotar ARN
PASSO 3: Configurar SSM Parameter Store
Obter credenciais Supabase
Gerar CRON_SECRET
Criar 5 parâmetros (encrypted)
Validar acesso
PASSO 4: Criar Repositório GitHub
Inicializar Git
Push código
Configurar Secrets (apenas 2: AWS_REGION e AWS_ROLE_ARN)
⚠️ Sem Access Keys!
PASSO 5: Criar App no AWS Amplify
Conectar GitHub
Configurar build settings
Anexar Service Role
Configurar Environment Variables (via SSM)
Deploy inicial
PASSO 6: Configurar CI/CD (GitHub Actions)
Workflow já configurado com OIDC
Testar deploy automático
Validar
PASSO 7: Configurar Monitoramento
CloudWatch Alarms
SNS Topic para alertas
Budget ($10/mês)
PASSO 8: Configurar Domínio Customizado (Opcional)
Route 53
DNS externo
SSL/TLS automático
PASSO 9: Configurar Supabase para Produção
Redirect URLs
Email templates
Testar autenticação
PASSO 10: Deploy Edge Functions
Instalar Supabase CLI
Deploy functions
Configurar secrets
Testar
🎯 Pontos Chave do Documento
✅ Características Únicas
Arquitetura OIDC (Zero long-lived credentials)
   GitHub → OIDC Provider → STS → Temporary Tokens → AWS
Passo a Passo com Validações
Cada passo tem comandos de validação
Checkpoints em cada etapa
Troubleshooting específico
Segurança Máxima
IAM Roles only (sem IAM Users)
SSM SecureString (KMS encrypted)
Least privilege policies
CloudTrail audit
Custo Mínimo
$0-5/mês primeiro ano
$4-7/mês depois
Comparação com Vercel
📚 Documentação Complementar
Se precisar de informações adicionais:
MIGRACAO_IAM_ROLES.md
Por que usar IAM Roles (não Users)
Comparação de segurança
Checklist de migração
CUSTOS_COMPARACAO.md
AWS vs Vercel (detalhado)
Projeções de custos
Cenários práticos
DECISAO_DEPLOY.md
Fluxograma de decisão
Quando usar AWS vs Vercel
Perguntas frequentes
COMECE_AQUI.md
Ponto de entrada geral
Navegação por todos os documentos
🚀 Como Começar
Opção 1: Seguir o Guia Completo
# Abrir e seguir passo a passo:open pequenos-grupos/DEPLOY_AWS.md
Opção 2: Usar Script Automático
cd pequenos-grupos./scripts/setup-aws-oidc.sh
Opção 3: Terraform
cd pequenos-grupos/aws/terraformterraform initterraform apply
📊 Resumo Visual
DEPLOY_AWS.md (1.442 linhas)├── Introdução e Objetivos├── Arquitetura (diagramas)├── Estimativa de Custos├── 📍 PASSO 1: GitHub OIDC├── 📍 PASSO 2: IAM Role Amplify├── 📍 PASSO 3: SSM Parameters├── 📍 PASSO 4: GitHub Setup├── 📍 PASSO 5: AWS Amplify├── 📍 PASSO 6: CI/CD├── 📍 PASSO 7: Monitoramento├── 📍 PASSO 8: Domínio (opcional)├── 📍 PASSO 9: Supabase Prod├── 📍 PASSO 10: Edge Functions├── ✅ Checklist Final├── 🔄 Workflow de Deploy├── 🔍 Monitoramento e Logs└── 🚨 Troubleshooting (detalhado)
✅ Status
Documento: ✅ Completo e Production-Ready
Última atualização: 2026-02-12
Versão: 1.3.0 (IAM Roles OIDC Architecture)
Pronto para uso!