# Terraform Module Example

## Complete Example

This directory provides a complete example of how to use the CloudFront
Middleware-at-Edge module. This example deploys a simple static website using
CloudFront and S3, with a Cognito User Pool for authentication and
authorization. Lambda@Edge functions are deployed for URL rewriting and managing
authentication.

### Usage

To run this example, provide your own values for the following variables in a
`terraform.tfvars` file:

```hcl
domain_name                  = "example.com"
domain_parent_hosted_zone_id = "Z0123456789ABCDEFG"
```

### Inputs

| Name                         | Description                                      |  Type  | Default | Required |
|------------------------------|--------------------------------------------------|:------:|:-------:|:--------:|
| domain_name                  | The domain name for the CloudFront distribution. | string |   n/a   |   yes    |
| domain_parent_hosted_zone_id | The ID of the parent hosted zone in Route 53.    | string |   n/a   |   yes    |

### Outputs

| Name                   | Description                                     |
|------------------------|-------------------------------------------------|
| website_domain_name    | The domain name of the website.                 |
| website_cf_domain_name | The domain name of the CloudFront distribution. |
| test_user_credentials  | The credentials of the test user.               |
