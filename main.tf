locals {
  name                       = coalesce(module.this.name, var.name, "cf-middleware-${random_string.mw_service_random_suffix.result}")
  enabled                    = module.this.enabled
  auth_service_enabled       = local.enabled && var.auth_service_config.enabled
  urlrewrite_service_enabled = local.enabled && var.urlrewrite_service_config.enabled

  aws_account_id  = try(coalesce(var.aws_account_id, data.aws_caller_identity.current[0].account_id), "")
  aws_region_name = try(coalesce(var.aws_region_name, data.aws_region.current[0].name), "")

  service_config = {
    rewrite_url = {
      enabled = local.urlrewrite_service_enabled
      handler = "index.handle"
      type    = "urlrewrite"
    }
    check_auth = {
      enabled = local.auth_service_enabled
      handler = "index.checkAuthHandler"
      type    = "auth"
    }
    parse_auth = {
      enabled = local.auth_service_enabled
      handler = "index.parseAuthHandler"
      type    = "auth"
    }
    refresh_auth = {
      enabled = local.auth_service_enabled
      handler = "index.refreshAuthHandler"
      type    = "auth"
    }
    revoke_auth = {
      enabled = local.auth_service_enabled
      handler = "index.revokeAuthHandler"
      type    = "auth"
    }
  }

  auth_service_names = toset([for svc_name, svc_opts in local.service_config : svc_name if svc_opts.enabled && svc_opts.type == "auth"])

  auth_service_config = {
    awsRegion               = coalesce(var.auth_service_config.aws_region, local.aws_region_name)
    cognitoIdpArn           = var.auth_service_config.cognito_idp_arn
    cognitoIdpDomain        = var.auth_service_config.cognito_idp_domain
    cognitoIdpJwks          = var.auth_service_config.cognito_idp_jwks
    cognitoIdpClientId      = var.auth_service_config.cognito_idp_client_id
    cognitoIdpClientSecret  = var.auth_service_config.cognito_idp_client_secret
    cognitoIdpClientScopes  = var.auth_service_config.cognito_idp_client_scopes
    redirectPathAuthRefresh = "/_edge/auth/refresh"
    redirectPathAuthSignIn  = "/_edge/auth/signin"
    redirectPathAuthSignOut = "/"
    urlSignOut              = "/_edge/auth/signout"
    logLevel                = var.auth_service_config.log_level
    oidcStateEncryptionKey  = local.enabled ? random_password.auth_service_oidc_state_encrypt_key[0].result : ""
    opaPolicyEnabled        = var.auth_service_config.opa_policy_content != null && var.auth_service_config.opa_policy_content != ""
    opaPolicyData           = var.auth_service_config.opa_policy_data
  }

  auth_service_config_default_opa_policy_content = <<-EOF
    package auth_at_edge_authz
    results := []
  EOF

  urlrewrite_service_names = toset([for svc_name, svc_opts in local.service_config : svc_name if svc_opts.enabled && svc_opts.type == "urlrewrite"])

  urlrewrite_service_config = {
    logLevel   = var.urlrewrite_service_config.log_level
    policyPath = "/opt/app/dist/policy.wasm"
  }

  urlrewrite_policy_content = coalesce(
    var.urlrewrite_service_config.policy_content,
    <<-EOF
      package urlrewriter
      result := []
    EOF
  )
}

data "aws_caller_identity" "current" {
  count = module.this.enabled && var.aws_account_id == "" ? 1 : 0
}

data "aws_region" "current" {
  count = module.this.enabled && var.aws_region_name == "" ? 1 : 0
}

# ====================================================== middleware-services ===

module "mw_service_label" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  name    = local.name
  context = module.this.context
}

resource "random_string" "mw_service_random_suffix" {
  length  = 6
  special = false
  upper   = false
}

# --------------------------------------------------------------- cf-polices ---

data "aws_cloudfront_response_headers_policy" "cors_preflight_hsts" {
  count = local.enabled ? 1 : 0
  name  = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

data "aws_cloudfront_origin_request_policy" "all" {
  count = local.enabled ? 1 : 0
  name  = "Managed-AllViewer"
}

data "aws_cloudfront_cache_policy" "disabled" {
  count = local.enabled ? 1 : 0
  name  = "Managed-CachingDisabled"
}

# ---------------------------------------------------------------------- iam ---

resource "aws_iam_role" "this" {
  count = local.enabled ? 1 : 0

  name        = module.mw_service_label.id
  description = ""

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow"
      Principal = { "Service" : ["edgelambda.amazonaws.com", "lambda.amazonaws.com"] }
      Action    = ["sts:AssumeRole", "sts:TagSession"]
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]

  tags = module.mw_service_label.tags

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================ auth-services ===

module "mw_auth_service_label" {
  source   = "cloudposse/label/null"
  version  = "0.25.0"
  for_each = local.auth_service_names

  attributes = [each.key]
  context    = module.mw_service_label.context
}

module "auth_service_code" {
  source  = "cruxstack/artifact-packager/docker"
  version = "1.3.2"

  enabled                = local.auth_service_enabled
  attributes             = ["auth"]
  artifact_src_path      = "/tmp/package.zip"
  artifact_dst_directory = "${path.module}/dist"
  docker_build_context   = abspath("${path.module}/assets/cf-mw-auth")
  docker_build_args      = { SERVICE_CONFIG_ENCODED = base64encode(jsonencode(local.auth_service_config)), SERVICE_POLICY_ENCODED = base64encode(coalesce(var.auth_service_config.opa_policy_content, local.auth_service_config_default_opa_policy_content)) }
  docker_build_target    = "package"

  context = module.mw_service_label.context
}

resource "random_password" "auth_service_oidc_state_encrypt_key" {
  count = local.enabled ? 1 : 0

  length  = 32 # 256 bits
  special = true
}

resource "random_string" "auth_service" {
  for_each = local.auth_service_names

  length  = 8
  special = false
  lower   = false
  upper   = true

  keepers = {
    name = each.key
  }
}

resource "aws_lambda_function" "auth_service" {
  for_each = local.auth_service_names

  function_name = "${module.mw_auth_service_label[each.key].id}-${random_string.auth_service[each.key].result}"
  filename      = module.auth_service_code.artifact_package_path
  handler       = local.service_config[each.key].handler
  publish       = true
  runtime       = "nodejs18.x"
  timeout       = 5
  role          = aws_iam_role.this[0].arn
  layers        = []

  tags = module.mw_auth_service_label[each.key].tags

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    module.auth_service_code
  ]
}

resource "aws_lambda_permission" "auth_service_allow_cloudfront" {
  for_each = aws_lambda_function.auth_service

  function_name = each.value.function_name
  statement_id  = "AllowExecutionFromCloudFront"
  action        = "lambda:GetFunction"
  principal     = "edgelambda.amazonaws.com"
}

# ====================================================== urlrewrite-services ===

module "mw_urlrewrite_service_label" {
  source   = "cloudposse/label/null"
  version  = "0.25.0"
  for_each = local.urlrewrite_service_names

  attributes = [each.key]
  context    = module.mw_service_label.context
}

module "urlrewrite_service_code" {
  source  = "cruxstack/artifact-packager/docker"
  version = "1.3.2"

  enabled                = local.urlrewrite_service_enabled
  attributes             = ["urlrewrite"]
  artifact_dst_directory = "${path.module}/dist"
  artifact_src_path      = "/tmp/package.zip"
  docker_build_context   = abspath("${path.module}/assets/cf-mw-urlrewrite")
  docker_build_args      = { SERVICE_CONFIG_ENCODED = base64encode(jsonencode(local.urlrewrite_service_config)), SERVICE_POLICY_ENCODED = base64encode(local.urlrewrite_policy_content) }
  docker_build_target    = "package"

  context = module.mw_service_label.context
}

resource "random_string" "urlrewrite_service" {
  for_each = local.urlrewrite_service_names

  length  = 8
  special = false
  lower   = false
  upper   = true

  keepers = {
    name = each.key
  }
}

resource "aws_lambda_function" "urlrewrite_service" {
  for_each = local.urlrewrite_service_names

  function_name = "${module.mw_urlrewrite_service_label[each.key].id}- ${random_string.urlrewrite_service[each.key].result}"
  filename      = module.urlrewrite_service_code.artifact_package_path
  handler       = local.service_config[each.key].handler
  publish       = true
  runtime       = "nodejs18.x"
  timeout       = 5
  role          = aws_iam_role.this[0].arn
  layers        = []

  tags = module.mw_urlrewrite_service_label[each.key].tags

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    module.urlrewrite_service_code
  ]
}

resource "aws_lambda_permission" "urlrewrite_service_allow_cloudfront" {
  for_each = aws_lambda_function.urlrewrite_service

  function_name = each.value.function_name
  statement_id  = "AllowExecutionFromCloudFront"
  action        = "lambda:GetFunction"
  principal     = "edgelambda.amazonaws.com"
}

