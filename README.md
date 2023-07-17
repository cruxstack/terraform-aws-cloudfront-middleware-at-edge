# Terraform Module: CloudFront Middleware-at-Edge

This Terraform module deploys customizable and reusable Lambda@Edge functions
that provide middleware for AWS CloudFront.

## Features

- **Authentication & Authorization**: This feature provides authentication and
  authorization to restrict access to a site hosted on CloudFront. Users can
  optionally customize the authorization rules via an Open Policy Agent (OPA)
  policy.
- **URL Rewriting**: This feature rewrites the URLs of requests. Users can
  define URL rewrite rules via an Open Policy Agent (OPA) policy.

## Usage

```hcl
module "cloudfront_middleware_at_edge" {
  source  = "sgtoj/cloudfront-middleware-at-edge/aws"
  version = "x.x.x"

  auth_service_config = {
    enabled                   = true
    cognito_idp_arn           = "arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_TESTPOOL"
    cognito_idp_domain        = "test.auth.us-east-1.amazoncognito.com"
    cognito_idp_client_id     = "your-client-id"
    cognito_idp_client_secret = "your-client-secret"
    cognito_idp_client_scopes = ["openid", "email", "profile"]

    cognito_idp_jwks = {
      keys = [
        { "alg": "RS256", "e": "AQAB", "kid": "...", "kty": "RSA", "n": "...", "use": "sig" },
        { "alg": "RS256", "e": "AQAB", "kid": "...", "kty": "RSA", "n": "...", "use": "sig" },
      ]
    }
  }

  urlrewrite_service_config = {
    enabled    = true
    policy_content = <<-EOF
      package urlrewriter
      result := []
    EOF
  }
}
```

## Requirements

- Terraform 1.3.0 or later
- AWS provider
- Docker provider
- Docker installed and running on the machine where Terraform is executed

## Inputs

In addition to the variables documented below, this module includes several
other optional variables (e.g., `name`, `tags`, etc.) provided by the
`cloudposse/label/null` module. Please refer to the [`cloudposse/label` documentation](https://registry.terraform.io/modules/cloudposse/label/null/latest) for more details on these variables.

| Name                      | Description                                                               |  Type  | Default | Required |
|---------------------------|---------------------------------------------------------------------------|:------:|:-------:|:--------:|
| auth_service_config       | Configuration details for the authentication service. More details below. | object |  `{}`   |    no    |
| urlrewrite_service_config | Configuration details for the URL rewrite service, More details below.    | object |  `{}`   |    no    |
| aws_account_id            | The AWS account ID that the module will be deployed in                    | string |  `""`   |    no    |
| aws_region_name           | The AWS region name where the module will be deployed                     | string |  `""`   |    no    |

### `auth_service_config`

| Property                  | Description                                    | Type                                 | Default  | Required |
|---------------------------|------------------------------------------------|--------------------------------------|----------|----------|
| enabled                   | Enable the authentication service              | bool                                 | `true`   | no       |
| log_level                 | Logging level                                  | string                               | `"info"` | no       |
| aws_region                | AWS region for the service                     | string                               | `null`   | no       |
| cognito_idp_arn           | ARN of the Cognito Identity Provider           | string                               | n/a      | yes      |
| cognito_idp_domain        | Domain of the Cognito Identity Provider        | string                               | n/a      | yes      |
| cognito_idp_jwks          | JWKS of the Cognito Identity Provider          | object({ keys = list(map(string)) }) | n/a      | yes      |
| cognito_idp_client_id     | Client ID of the Cognito Identity Provider     | string                               | n/a      | yes      |
| cognito_idp_client_secret | Client secret of the Cognito Identity Provider | string                               | n/a      | yes      |
| cognito_idp_client_scopes | Client scopes of the Cognito Identity Provider | list(string)                         | n/a      | yes      |
| opa_policy_content        | Content of the OPA policy                      | string                               | `null`   | no       |
| opa_policy_data           | Data for the OPA policy                        | map(string)                          | `{}`     | no       |

### `urlrewrite_service_config`

| Property       | Description                       | Type   | Default                               | Required |
|----------------|-----------------------------------|--------|---------------------------------------|----------|
| enabled        | Enable the URL rewrite service    | bool   | `false`                               | no       |
| log_level      | Logging level                     | string | `"info"`                              | no       |
| aws_region     | AWS region for the service        | string | `null`                                | no       |
| policy_content | Content of the URL rewrite policy | string | `"package urlrewriter\nresult := []"` | no       |

## Outputs

| Name                | Description                                                               |
|---------------------|---------------------------------------------------------------------------|
| auth_services       | Details of the created AWS Lambda functions for each of the auth services |
| auth_routes         | Route configurations for the auth services                                |
| urlrewrite_services | Details of the created AWS Lambda function for the URL rewrite service    |

## Contributing

We welcome contributions to this project. For information on setting up a
development environment and how to make a contribution, see [CONTRIBUTING](./CONTRIBUTING.md)
documentation.
