output "website_domain_name" {
  description = "The domain name of the website"
  value       = "https://${local.domain_name}"
}

output "website_cf_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = module.website.cf_domain_name
}

output "test_user_credentials" {
  description = "The credentials of the test user"
  value = {
    username = aws_cognito_user.test_user.username
    password = nonsensitive(random_password.test_user_password.result)
  }
}
