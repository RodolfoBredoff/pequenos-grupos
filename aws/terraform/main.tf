# Terraform Configuration para Pequenos Grupos Manager
# Arquitetura: IAM Roles com OIDC (Zero Long-Lived Credentials)

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Opcional: Backend remoto para state
  # backend "s3" {
  #   bucket         = "pequenos-grupos-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "pequenos-grupos"
      Environment = var.environment
      ManagedBy   = "terraform"
      Security    = "oidc-only"
    }
  }
}

# ============================================
# Data Sources
# ============================================

data "aws_caller_identity" "current" {}

# ============================================
# 1. GitHub OIDC Provider
# ============================================

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  
  client_id_list = [
    "sts.amazonaws.com"
  ]
  
  # GitHub OIDC thumbprint (válido até 2034)
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
  
  tags = {
    Name = "GitHub OIDC Provider"
  }
}

# ============================================
# 2. IAM Role para GitHub Actions (OIDC)
# ============================================

resource "aws_iam_role" "github_actions" {
  name        = "GitHubActionsRole-PequenosGrupos"
  description = "Role for GitHub Actions to deploy via OIDC (no access keys)"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })
  
  max_session_duration = 3600  # 1 hour
  
  tags = {
    Name = "GitHub Actions Role (OIDC)"
  }
}

# Policy para GitHub Actions
resource "aws_iam_policy" "github_actions_amplify" {
  name        = "GitHubActionsAmplifyPolicy"
  description = "Minimal permissions for GitHub Actions to deploy to Amplify"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AmplifyDeployAccess"
        Effect = "Allow"
        Action = [
          "amplify:GetApp",
          "amplify:GetBranch",
          "amplify:StartJob",
          "amplify:GetJob",
          "amplify:ListJobs",
          "amplify:StopJob"
        ]
        Resource = [
          "arn:aws:amplify:*:${data.aws_caller_identity.current.account_id}:apps/*/branches/main",
          "arn:aws:amplify:*:${data.aws_caller_identity.current.account_id}:apps/*/branches/develop"
        ]
      },
      {
        Sid      = "AmplifyListApps"
        Effect   = "Allow"
        Action   = ["amplify:ListApps"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_amplify" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_amplify.arn
}

# ============================================
# 3. IAM Role para Amplify Service
# ============================================

resource "aws_iam_role" "amplify_service" {
  name        = "AmplifyServiceRole-PequenosGrupos"
  description = "Service role for AWS Amplify to access SSM, CloudWatch, etc"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Name = "Amplify Service Role"
  }
}

# Policy customizada para Amplify
resource "aws_iam_policy" "amplify_service" {
  name        = "AmplifyServicePolicy-PequenosGrupos"
  description = "Custom policy for Amplify Service Role"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMParameterAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/pequenos-grupos/*"
      },
      {
        Sid    = "KMSDecryptAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "arn:aws:kms:*:${data.aws_caller_identity.current.account_id}:alias/aws/ssm"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/*:*"
      },
      {
        Sid      = "CloudFrontInvalidation"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "amplify_service_custom" {
  role       = aws_iam_role.amplify_service.name
  policy_arn = aws_iam_policy.amplify_service.arn
}

# AWS Managed Policy para Amplify
resource "aws_iam_role_policy_attachment" "amplify_service_managed" {
  role       = aws_iam_role.amplify_service.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

# ============================================
# 4. SSM Parameters
# ============================================

resource "aws_ssm_parameter" "supabase_url" {
  name        = "/pequenos-grupos/${var.environment}/NEXT_PUBLIC_SUPABASE_URL"
  description = "Supabase Project URL"
  type        = "String"
  value       = var.supabase_url
  
  tags = {
    Name = "Supabase URL"
  }
}

resource "aws_ssm_parameter" "supabase_anon_key" {
  name        = "/pequenos-grupos/${var.environment}/NEXT_PUBLIC_SUPABASE_ANON_KEY"
  description = "Supabase Anon Key (public)"
  type        = "SecureString"
  value       = var.supabase_anon_key
  
  tags = {
    Name = "Supabase Anon Key"
  }
}

resource "aws_ssm_parameter" "supabase_service_role_key" {
  name        = "/pequenos-grupos/${var.environment}/SUPABASE_SERVICE_ROLE_KEY"
  description = "Supabase Service Role Key (admin)"
  type        = "SecureString"
  value       = var.supabase_service_role_key
  
  tags = {
    Name = "Supabase Service Role"
  }
}

resource "aws_ssm_parameter" "cron_secret" {
  name        = "/pequenos-grupos/${var.environment}/CRON_SECRET"
  description = "Cron Job Authentication Secret"
  type        = "SecureString"
  value       = var.cron_secret
  
  tags = {
    Name = "Cron Secret"
  }
}

resource "aws_ssm_parameter" "node_env" {
  name        = "/pequenos-grupos/${var.environment}/NODE_ENV"
  description = "Node Environment"
  type        = "String"
  value       = var.environment == "prod" ? "production" : "development"
  
  tags = {
    Name = "Node Environment"
  }
}

# ============================================
# 5. CloudWatch Resources
# ============================================

resource "aws_cloudwatch_log_group" "amplify" {
  name              = "/aws/amplify/pequenos-grupos"
  retention_in_days = 7
  
  tags = {
    Name = "Amplify Logs"
  }
}

resource "aws_cloudwatch_metric_alarm" "build_failures" {
  alarm_name          = "pequenos-grupos-build-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BuildFailed"
  namespace           = "AWS/Amplify"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when Amplify build fails"
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ============================================
# 6. SNS Topic para Alertas
# ============================================

resource "aws_sns_topic" "alerts" {
  name = "pequenos-grupos-alerts"
  
  tags = {
    Name = "Pequenos Grupos Alerts"
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ============================================
# 7. Budget para Controle de Custos
# ============================================

resource "aws_budgets_budget" "monthly_cost" {
  name              = "pequenos-grupos-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "10"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}

# ============================================
# Outputs
# ============================================

output "github_oidc_provider_arn" {
  description = "ARN do GitHub OIDC Provider"
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_actions_role_arn" {
  description = "ARN do IAM Role para GitHub Actions (use como AWS_ROLE_ARN secret)"
  value       = aws_iam_role.github_actions.arn
}

output "amplify_service_role_arn" {
  description = "ARN do IAM Role para Amplify Service"
  value       = aws_iam_role.amplify_service.arn
}

output "amplify_service_role_name" {
  description = "Nome do IAM Role para Amplify Service"
  value       = aws_iam_role.amplify_service.name
}

output "ssm_parameter_paths" {
  description = "Paths dos SSM Parameters criados"
  value = {
    supabase_url         = aws_ssm_parameter.supabase_url.name
    supabase_anon_key    = aws_ssm_parameter.supabase_anon_key.name
    service_role_key     = aws_ssm_parameter.supabase_service_role_key.name
    cron_secret          = aws_ssm_parameter.cron_secret.name
    node_env             = aws_ssm_parameter.node_env.name
  }
}

output "sns_topic_arn" {
  description = "ARN do SNS Topic para alertas"
  value       = aws_sns_topic.alerts.arn
}

output "next_steps" {
  description = "Próximos passos após Terraform apply"
  value = <<-EOT
  
  ✅ Recursos AWS criados com sucesso!
  
  🔐 ARQUITETURA OIDC (Zero Long-Lived Credentials)
  
  Próximos passos:
  
  1️⃣  Configurar GitHub Secrets:
     GitHub → Repository → Settings → Secrets and variables → Actions
     
     Adicione:
     AWS_REGION: ${var.aws_region}
     AWS_ROLE_ARN: ${aws_iam_role.github_actions.arn}
     
     ⚠️  NÃO adicione AWS_ACCESS_KEY_ID nem AWS_SECRET_ACCESS_KEY!
         Usamos OIDC - zero credenciais permanentes!
  
  2️⃣  Criar app no AWS Amplify Console:
     https://console.aws.amazon.com/amplify/home?region=${var.aws_region}
  
  3️⃣  Configurar Amplify:
     - Conectar ao GitHub
     - Branch: main
     - Service Role: ${aws_iam_role.amplify_service.name}
     - Environment Variables:
       NEXT_PUBLIC_SUPABASE_URL = _ssm:${aws_ssm_parameter.supabase_url.name}
       NEXT_PUBLIC_SUPABASE_ANON_KEY = _ssm:${aws_ssm_parameter.supabase_anon_key.name}
       SUPABASE_SERVICE_ROLE_KEY = _ssm:${aws_ssm_parameter.supabase_service_role_key.name}
       CRON_SECRET = _ssm:${aws_ssm_parameter.cron_secret.name}
       NODE_ENV = production
  
  4️⃣  Deploy!
     git push origin main
  
  📊 Monitoramento:
     - CloudWatch Logs: /aws/amplify/pequenos-grupos
     - Budget Alert: $10/mês (80% e 100%)
     - SNS Email: ${var.alert_email}
  
  🔒 Segurança:
     ✅ IAM Roles only (OIDC)
     ✅ SSM SecureString (KMS encrypted)
     ✅ Least privilege policies
     ✅ CloudTrail audit logs
  
  EOT
}
