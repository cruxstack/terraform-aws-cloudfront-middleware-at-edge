# Terraform Module: CloudFront Middleware-at-Edge

_This module is under active development and is not yet ready for use. Please
see `dev` branch for current progress._

## Features

- TBA

## Usage

```hcl
module "cloudfront_middleware_at_edge" {
  source  = "sgtoj/cloudfront-middleware-at-edge/aws"
  version = "x.x.x"

  # TBD
}
```

## Requirements

- Terraform 1.3.0 or later
- AWS provider
- Docker provider
- Docker installed and running on the machine where Terraform is executed

## Inputs

_This module does not currently provide any input._

### Note

This module uses the `cloudposse/label/null` module for naming and tagging
resources. As such, it also includes a `context.tf` file with additional
optional variables you can set. Refer to the [`cloudposse/label` documentation](https://registry.terraform.io/modules/cloudposse/label/null/latest)
for more details on these variables.

## Outputs

_This module does not currently provide any outputs._

## Contributing

We welcome contributions to this project. For information on setting up a
development environment and how to make a contribution, see [CONTRIBUTING](./CONTRIBUTING.md)
documentation.
