#
# this is for unit testing usage only
#

package auth_at_edge_authz

import future.keywords.if
import future.keywords.in

default results := [{
	"allowed": false,
	"message": "unauthorized access",
}]

results := x if {
	token := input.tokens.idToken
	email_patterns = split(data.email_patterns, ",")
	regex.match(email_patterns[_], token.email)

	x := [{
		"allowed": true,
		"message": "",
	}]
}
