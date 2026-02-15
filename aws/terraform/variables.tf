# Variables Configuration - IAM Roles com OIDC

variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast)-[1-9]$", var.aws_region))
    error_message = "AWS region must be valid (ex: us-east-1, sa-east-1)"
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev"
  }
}

variable "github_repository" {
  description = "GitHub repository in format: owner/repo (ex: usuario/pequenos-grupos)"
  type        = string
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$", var.github_repository))
    error_message = "GitHub repository must be in format: owner/repo"
  }
}

variable "alert_email" {
  description = "Email address for CloudWatch and Budget alerts"
  type        = string
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Must be a valid email address"
  }
}

# Sensitive variables (passar via -var-file ou environment variables)
variable "supabase_url" {
  description = "Supabase Project URL"
  type        = string
  sensitive   = false
  
  validation {
    condition     = can(regex("^https://[a-z0-9-]+\\.supabase\\.co$", var.supabase_url))
    error_message = "Must be a valid Supabase URL (https://xxxxx.supabase.co)"
  }
}

variable "supabase_anon_key" {
  description = "Supabase Anonymous Key (public)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$", var.supabase_anon_key))
    error_message = "Must be a valid JWT token (starts with eyJ)"
  }
}

variable "supabase_service_role_key" {
  description = "Supabase Service Role Key (admin privileges)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$", var.supabase_service_role_key))
    error_message = "Must be a valid JWT token (starts with eyJ)"
  }
}

variable "cron_secret" {
  description = "Secret for Cron Job authentication (gerar com: openssl rand -base64 32)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.cron_secret) >= 32
    error_message = "Cron secret must be at least 32 characters"
  }
}

# Tags padrão
variable "default_tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Project     = "pequenos-grupos"
    ManagedBy   = "terraform"
    Application = "pequenos-grupos-manager"
    Security    = "oidc-only"
  }
}
