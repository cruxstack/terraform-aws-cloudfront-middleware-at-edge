package urlrewriter

import future.keywords.contains
import future.keywords.every
import future.keywords.if
import future.keywords.in

rules = [
	{
		# /product/:productId/:productSerial
		"match_uri_parts": ["product"],
		"match_qs_keys": ["productId", "productSerial"],
		"rewrite_base_path": "/product/index.html",
	},
	{
		# /product/:productId
		"match_uri_parts": ["product"],
		"match_qs_keys": ["productId"],
		"rewrite_base_path": "/product/index.html",
	},
	{
		# /profile/:displayName
		"match_uri_parts": ["profile"],
		"match_qs_keys": ["displayName"],
		"rewrite_base_path": "/profile/index.html",
	},
	{
		# /wallet/:tab
		"match_uri_parts": ["wallet"],
		"match_qs_keys": ["tab"],
		"rewrite_base_path": "/wallet/index.html",
	},
	{
		# /withdrawal/:productId/:productSerial
		"match_uri_parts": ["withdrawal"],
		"match_qs_keys": ["productId", "productSerial"],
		"rewrite_base_path": "/withdrawal/index.html",
	},
	{
		# /withdrawal/:productId
		"match_uri_parts": ["withdrawal"],
		"match_qs_keys": ["productId"],
		"rewrite_base_path": "/product/index.html", # intended
	},
	{
		# /drops/:dropId
		"match_uri_parts": ["drops"],
		"match_qs_keys": ["dropId"],
		"rewrite_base_path": "/drops/index.html",
	},
	{
		# /pack-open/:productId/:productSerial
		"match_uri_parts": ["pack-open"],
		"match_qs_keys": ["productId", "productSerial"],
		"rewrite_base_path": "/pack-open/index.html",
	},
	{
		# /challenge/:challengeId
		"match_uri_parts": ["challenge"],
		"match_qs_keys": ["challengeId"],
		"rewrite_base_path": "/challenge/index.html",
	},
	{
		# /claim/:claimCodeId
		"match_uri_parts": ["claim"],
		"match_qs_keys": ["claimCodeId"],
		"rewrite_base_path": "/claim/index.html",
	},
]

REGXP_NAMED_UUID := "^[a-zA-Z0-9-_]*-([a-zA-Z0-9-]{36})$"

REGXP_FILE_WITH_EXTENSION := ".html$"

DEFAULT_RESULT := {
	"uri": input.uri,
	"querystring": input.querystring,
	"action": "FORWARD",
}

hasFileExtension(uri_parts) if {
	last_path_part = uri_parts[count(uri_parts) - 1]
	regex.match(REGXP_FILE_WITH_EXTENSION, last_path_part)
}

rewrite_that_match_rules contains output if {
	not hasFileExtension(input.uri_parts)

	# check input against each rule
	some rule in rules
	rule.match_uri_parts[rule_uri_part_index] == input.uri_parts[rule_uri_part_index]
	count(input.uri_parts) == count(rule.match_uri_parts) + count(rule.match_qs_keys)

	rewrite_qs_keyvalues := array.concat(
		# parse uuid out of named id within the first param
		array.concat(
			[x |
				x := sprintf("%v=%v", [rule.match_qs_keys[0], regex.find_all_string_submatch_n(REGXP_NAMED_UUID, input.uri_parts[1], -1)[0][1]])
			],
			[x |
				not regex.match(REGXP_NAMED_UUID, input.uri_parts[1])
				x := sprintf("%v=%v", [rule.match_qs_keys[0], input.uri_parts[1]])
			],
		),
		# pair param key with value skipping the first param
		[x |
			some match_param_index, _ in rule.match_qs_keys
			match_param_index != 0
			x := sprintf("%v=%v", [rule.match_qs_keys[match_param_index], input.uri_parts[match_param_index + 1]])
		],
	)

	output := {
		"uri": rule.rewrite_base_path,
		"querystring": trim_prefix(concat("&", array.concat([input.querystring], rewrite_qs_keyvalues)), "&"),
		"action": "FORWARD",
	}
}

rewrite_path_with_index_suffix contains output if {
	not hasFileExtension(input.uri_parts)
	regex.match("/$", input.uri)

	output := {
		"uri": sprintf("/%v/index.html", [concat("/", input.uri_parts)]),
		"querystring": trim_prefix(input.querystring, "&"),
		"action": "FORWARD",
	}
}

redirect_path_without_trailing_slash contains output if {
	not hasFileExtension(input.uri_parts)
	not regex.match("/$", input.uri)

	output := {
		"uri": sprintf("/%v/", [concat("/", input.uri_parts)]),
		"querystring": trim_prefix(input.querystring, "&"),
		"action": "REDIRECT_301",
	}
}

# finalize result (only first item is used if items in 'result' array)
result := array.concat(
	[x | some x in rewrite_that_match_rules],
	array.concat(
		[x | some x in (rewrite_path_with_index_suffix | redirect_path_without_trailing_slash)],
		[DEFAULT_RESULT],
	),
)
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "challengeId=ce792c7e-3b2f-42c9-975a-5aa4d28bf845",
		"uri": "/challenge/index.html",
		"action": "FORWARD",
	}
}

test_claim_path if {
	request := gen_request("/claim/", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "",
		"uri": "/claim/index.html",
		"action": "FORWARD",
	}
}

test_claim_path_with_id if {
	request := gen_request("/claim/AB-CD-12-34", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "claimCodeId=AB-CD-12-34",
		"uri": "/claim/index.html",
		"action": "FORWARD",
	}
}
