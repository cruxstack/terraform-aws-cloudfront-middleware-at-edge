locals {
  domain_name                  = var.domain_name
  domain_parent_hosted_zone_id = var.domain_parent_hosted_zone_id

  mime_types = {
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
    "json" = "application/json"
    "png"  = "image/png"
    "jpg"  = "image/jpeg"
    "gif"  = "image/gif"
    "svg"  = "image/svg+xml"
  }
}

# ================================================================== example ===

module "cognito_user_pool_client" {
  source  = "rallyware/cognito-user-pool-client/aws"
  version = "0.2.0"

  user_pool_id                         = module.cognito_user_pool.id
  allowed_oauth_flows_user_pool_client = true
  generate_secret                      = true
  allowed_oauth_flows                  = ["code", ]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = ["https://${local.domain_name}/_edge/auth/signin"]
  logout_urls                          = ["https://google.com"]
  supported_identity_providers         = ["COGNITO"]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]

  context = module.example_label.context
}

module "cloudfront_middleware_at_edge" {
  source = "../../"

  auth_service_config = {
    enabled                   = true
    log_level                 = "debug"
    cognito_idp_arn           = module.cognito_user_pool.arn
    cognito_idp_domain        = "${aws_cognito_user_pool_domain.this.domain}.auth.us-east-1.amazoncognito.com"
    cognito_idp_client_id     = module.cognito_user_pool_client.id
    cognito_idp_client_secret = module.cognito_user_pool_client.client_secret
    cognito_idp_client_scopes = ["openid", "email", "profile"]
    cognito_idp_jwks          = jsondecode(data.http.cognito_user_pool_jwks.response_body)
  }

  # urlrewrite_service_config = {
  #   enabled        = true
  #   log_level      = "debug"
  #   policy_content = <<-EOF
  #     package urlrewriter
  #     result := []
  #   EOF
  # }

  context = module.example_label.context # not-required
}

module "website" {
  source  = "cloudposse/cloudfront-s3-cdn/aws"
  version = "0.90.0"

  aliases             = [local.domain_name]
  acm_certificate_arn = module.ssl_certificate.arn
  dns_alias_enabled   = false

  custom_origins = [{
    # blackhole (never served) origin assigned to auth-at-edge behaviors/paths
    domain_name    = "blackhole.example.com"
    origin_id      = "blackhole"
    origin_path    = ""
    custom_headers = []
    custom_origin_config = {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 60
      origin_read_timeout      = 60
    }
  }]

  ordered_cache = [
    for x in module.cloudfront_middleware_at_edge.auth_routes : {
      target_origin_id            = "blackhole"
      path_pattern                = x.path_pattern
      allowed_methods             = x.allowed_methods
      compress                    = x.compress
      cache_policy_id             = x.cache_policy
      origin_request_policy_id    = x.origin_request_policy
      response_headers_policy_id  = x.response_headers_policy
      lambda_function_association = x.lambda_function_association
      viewer_protocol_policy      = x.viewer_protocol_policy

      // using cf policies so these are not used but are required to be defined
      cached_methods                    = ["GET", "HEAD"]
      default_ttl                       = null
      forward_cookies                   = null
      forward_cookies_whitelisted_names = null
      forward_header_values             = null
      forward_query_string              = null
      function_association              = []
      max_ttl                           = null
      min_ttl                           = null
      trusted_key_groups                = null
      trusted_signers                   = null
  }]

  cache_policy_id            = try(data.aws_cloudfront_cache_policy.disabled.id)
  origin_request_policy_id   = try(data.aws_cloudfront_origin_request_policy.cors_s3origin.id)
  response_headers_policy_id = try(data.aws_cloudfront_response_headers_policy.cors_preflight_hsts.id)

  lambda_function_association = [
    {
      event_type   = "viewer-request"
      lambda_arn   = module.cloudfront_middleware_at_edge.auth_services.check_auth.fn_arn
      include_body = false
    },
  ]

  cloudfront_access_log_create_bucket = false
  cloudfront_access_logging_enabled   = false
  s3_access_logging_enabled           = false
  versioning_enabled                  = false

  context = module.example_label.context
}

# ===================================================== supporting-resources ===

module "example_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  name = "example-cf-middleware-${random_string.example_random_suffix.result}"
}

resource "random_string" "example_random_suffix" {
  length  = 6
  special = false
  upper   = false
}

# ------------------------------------------------------------------ website ---

resource "aws_s3_object" "website_assets" {
  for_each = fileset("${path.module}/assets", "**/*")

  bucket       = module.website.s3_bucket
  key          = each.key
  source       = "${path.module}/assets/${each.key}"
  etag         = filemd5("${path.module}/assets/${each.key}")
  content_type = lookup(local.mime_types, try(split(".", each.key)[1], "unknown"), "application/octet-stream")
}

module "dns" {
  source  = "cloudposse/route53-alias/aws"
  version = "0.13.0"

  aliases         = [local.domain_name]
  parent_zone_id  = local.domain_parent_hosted_zone_id
  target_dns_name = module.website.cf_domain_name
  target_zone_id  = module.website.cf_hosted_zone_id
  ipv6_enabled    = false

  context = module.example_label.context
}

module "ssl_certificate" {
  source  = "cloudposse/acm-request-certificate/aws"
  version = "0.17.0"

  domain_name                       = local.domain_name
  process_domain_validation_options = true
  ttl                               = "60"
  zone_id                           = local.domain_parent_hosted_zone_id

  tags    = merge(module.example_label.tags, { Name = module.example_label.id })
  context = module.example_label.context
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "cors_s3origin" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_response_headers_policy" "cors_preflight_hsts" {
  name = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

# ------------------------------------------------------------------ cognito ---

module "cognito_user_pool" {
  source  = "lgallard/cognito-user-pool/aws"
  version = "0.22.0"

  user_pool_name           = module.example_label.id
  alias_attributes         = []
  auto_verified_attributes = []
  deletion_protection      = "INACTIVE"

  admin_create_user_config = {
    allow_admin_create_user_only = true
  }

  tags = module.example_label.tags
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = module.example_label.id
  user_pool_id = module.cognito_user_pool.id
}

resource "random_password" "test_user_password" {
  special          = true
  override_special = "!#$-_=+"
  length           = 16
  min_numeric      = 1
  min_lower        = 1
  min_upper        = 1
  min_special      = 1
}

resource "aws_cognito_user" "test_user" {
  user_pool_id = module.cognito_user_pool.id
  username     = "test@example.com"
  password     = random_password.test_user_password.result
  enabled      = true
}

data "http" "cognito_user_pool_jwks" {
  url = "https://${module.cognito_user_pool.endpoint}/.well-known/jwks.json"
}
