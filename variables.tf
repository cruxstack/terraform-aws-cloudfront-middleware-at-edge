variable "auth_service_config" {
  description = "Configuration details for the authentication service"
  type = object({
    enabled                   = optional(bool, true)
    log_level                 = optional(string, "info")
    aws_region                = optional(string)
    cognito_idp_arn           = string
    cognito_idp_domain        = string
    cognito_idp_jwks          = object({ keys = list(map(string)) })
    cognito_idp_client_id     = string
    cognito_idp_client_secret = string
    cognito_idp_client_scopes = list(string)
    opa_policy_content        = optional(string)
    opa_policy_data           = optional(map(string), {})
  })
}

variable "urlrewrite_service_config" {
  description = "Configuration details for the URL rewrite service"
  type = object({
    enabled    = optional(bool, false)
    log_level  = optional(string, "info")
    aws_region = optional(string)
    policy_content = optional(string, <<-EOF
      package urlrewriter
      result := []
    EOF
    )
  })
  default = {}
}

variable "aws_account_id" {
  description = "The AWS account ID that the module will be deployed in"
  type        = string
  default     = ""
}

variable "aws_region_name" {
  description = "The AWS region name where the module will be deployed"
  type        = string
  default     = ""
}
