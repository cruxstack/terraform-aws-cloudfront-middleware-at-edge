output "auth_services" {
  description = "Details of the created AWS Lambda functions for each of the auth services"

  value = {
    check_auth = {
      enabled = local.service_config.check_auth.enabled
      fn_arn  = local.service_config.check_auth.enabled ? try("${aws_lambda_function.auth_service["check_auth"].arn}:${aws_lambda_function.auth_service["check_auth"].version}", "") : null
    }
    parse_auth = {
      enabled = local.service_config.parse_auth.enabled
      fn_arn  = local.service_config.check_auth.enabled ? try("${aws_lambda_function.auth_service["parse_auth"].arn}:${aws_lambda_function.auth_service["parse_auth"].version}", "") : null
    }
    refresh_auth = {
      enabled = local.service_config.refresh_auth.enabled
      fn_arn  = local.service_config.check_auth.enabled ? try("${aws_lambda_function.auth_service["refresh_auth"].arn}:${aws_lambda_function.auth_service["refresh_auth"].version}", "") : null
    }
    revoke_auth = {
      enabled = local.service_config.revoke_auth.enabled
      fn_arn  = local.service_config.check_auth.enabled ? try("${aws_lambda_function.auth_service["revoke_auth"].arn}:${aws_lambda_function.auth_service["revoke_auth"].version}", "") : null
    }
  }

  depends_on = [
    aws_lambda_function.auth_service["check_auth"],
    aws_lambda_function.auth_service["parse_auth"],
    aws_lambda_function.auth_service["refresh_auth"],
    aws_lambda_function.auth_service["revoke_auth"],
  ]
}

output "auth_routes" {
  description = "Details of the created AWS Lambda functions for each of the auth services"

  value = local.auth_service_enabled ? [
    {
      path_pattern            = local.auth_service_config.redirectPathAuthSignIn
      allowed_methods         = ["GET", "HEAD"]
      compress                = true
      cache_policy            = try(data.aws_cloudfront_cache_policy.disabled[0].id)
      origin_request_policy   = try(data.aws_cloudfront_origin_request_policy.all[0].id)
      response_headers_policy = try(data.aws_cloudfront_response_headers_policy.cors_preflight_hsts[0].id)
      viewer_protocol_policy  = "redirect-to-https"

      lambda_function_association = [{
        event_type   = "viewer-request"
        lambda_arn   = try("${aws_lambda_function.auth_service["parse_auth"].arn}:${aws_lambda_function.auth_service["parse_auth"].version}", "")
        include_body = false
      }]
      }, {
      path_pattern            = local.auth_service_config.redirectPathAuthRefresh
      allowed_methods         = ["GET", "HEAD"]
      compress                = true
      cache_policy            = try(data.aws_cloudfront_cache_policy.disabled[0].id)
      origin_request_policy   = try(data.aws_cloudfront_origin_request_policy.all[0].id)
      response_headers_policy = try(data.aws_cloudfront_response_headers_policy.cors_preflight_hsts[0].id)
      viewer_protocol_policy  = "redirect-to-https"

      lambda_function_association = [{
        event_type   = "viewer-request"
        lambda_arn   = try("${aws_lambda_function.auth_service["refresh_auth"].arn}:${aws_lambda_function.auth_service["refresh_auth"].version}", "")
        include_body = false
      }]
    },
    {
      path_pattern            = local.auth_service_config.urlSignOut
      allowed_methods         = ["GET", "HEAD"]
      compress                = true
      cache_policy            = try(data.aws_cloudfront_cache_policy.disabled[0].id)
      origin_request_policy   = try(data.aws_cloudfront_origin_request_policy.all[0].id)
      response_headers_policy = try(data.aws_cloudfront_response_headers_policy.cors_preflight_hsts[0].id)
      viewer_protocol_policy  = "redirect-to-https"

      lambda_function_association = [{
        event_type   = "viewer-request"
        lambda_arn   = try("${aws_lambda_function.auth_service["revoke_auth"].arn}:${aws_lambda_function.auth_service["revoke_auth"].version}", "")
        include_body = false
      }]
    }
  ] : []

  depends_on = [
    aws_lambda_function.auth_service["check_auth"],
    aws_lambda_function.auth_service["parse_auth"],
    aws_lambda_function.auth_service["refresh_auth"],
    aws_lambda_function.auth_service["revoke_auth"],
  ]
}

output "urlrewrite_services" {
  description = "Details of the created AWS Lambda functions for each of the auth services"

  value = {
    rewrite_url = {
      enabled    = local.urlrewrite_service_enabled
      fn_arn     = local.urlrewrite_service_enabled ? try("${aws_lambda_function.urlrewrite_service["rewrite_url"].arn}:${aws_lambda_function.urlrewrite_service["rewrite_url"].version}", "") : null
      fn_name    = local.urlrewrite_service_enabled ? aws_lambda_function.urlrewrite_service["rewrite_url"].function_name : ""
      fn_version = local.urlrewrite_service_enabled ? aws_lambda_function.urlrewrite_service["rewrite_url"].version : ""
    }
  }

  depends_on = [
    aws_lambda_function.urlrewrite_service["rewrite_url"],
  ]
}
