# Terraform Outputs

output "ssm_parameters" {
  description = "SSM Parameter Store paths criados"
  value = {
    supabase_url      = aws_ssm_parameter.supabase_url.name
    supabase_anon_key = aws_ssm_parameter.supabase_anon_key.name
    service_role_key  = aws_ssm_parameter.supabase_service_role_key.name
    cron_secret       = aws_ssm_parameter.cron_secret.name
    node_env          = aws_ssm_parameter.node_env.name
  }
}

output "iam_role_arn" {
  description = "ARN do IAM Role para Amplify"
  value       = aws_iam_role.amplify_role.arn
}

output "iam_role_name" {
  description = "Nome do IAM Role para Amplify"
  value       = aws_iam_role.amplify_role.name
}

output "sns_topic_arn" {
  description = "ARN do SNS Topic para alertas"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group para Amplify"
  value       = aws_cloudwatch_log_group.amplify_logs.name
}

output "budget_name" {
  description = "Nome do AWS Budget criado"
  value       = aws_budgets_budget.monthly_cost.name
}

output "next_steps" {
  description = "Próximos passos após Terraform apply"
  value = <<-EOT
  
  ✅ Recursos AWS criados com sucesso!
  
  Próximos passos:
  
  1. Criar app no AWS Amplify Console:
     https://console.aws.amazon.com/amplify/home?region=${var.aws_region}
  
  2. Conectar ao GitHub e selecionar branch 'main'
  
  3. Configurar Service Role no Amplify:
     Role ARN: ${aws_iam_role.amplify_role.arn}
  
  4. Configurar Environment Variables no Amplify Console:
     NEXT_PUBLIC_SUPABASE_URL = _ssm:${aws_ssm_parameter.supabase_url.name}
     NEXT_PUBLIC_SUPABASE_ANON_KEY = _ssm:${aws_ssm_parameter.supabase_anon_key.name}
     SUPABASE_SERVICE_ROLE_KEY = _ssm:${aws_ssm_parameter.supabase_service_role_key.name}
     CRON_SECRET = _ssm:${aws_ssm_parameter.cron_secret.name}
     NODE_ENV = production
  
  5. Deploy!
  
  EOT
}
