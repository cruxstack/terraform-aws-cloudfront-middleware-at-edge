package urlrewriter

import future.keywords.contains
import future.keywords.every
import future.keywords.if
import future.keywords.in

gen_request(uri, querystring) = value if {
	value := {
		"uri": uri,
		"uri_parts": split(trim_suffix(trim_prefix(uri, "/"), "/"), "/"),
		"querystring": querystring,
	}
}

test_passthrough_for_request_with_file_extensions if {
	request := gen_request("/test.html", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "",
		"uri": "/test.html",
		"action": "FORWARD",
	}
}

test_redirect_with_trailing_slash if {
	request := gen_request("/foo", "foo=bar")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "foo=bar",
		"uri": "/foo/",
		"action": "REDIRECT_301",
	}
}

test_suffixing_index_html if {
	request := gen_request("/foo/", "foo=bar")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "foo=bar",
		"uri": "/foo/index.html",
		"action": "FORWARD",
	}
}

test_product_path_with_id if {
	request := gen_request("/product/testing-foo-00000000-aaaa-bbbb-cccc-111111111111", "foo=bar")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "foo=bar&productId=00000000-aaaa-bbbb-cccc-111111111111",
		"uri": "/product/index.html",
		"action": "FORWARD",
	}
}

test_product_path_with_id_and_serial if {
	request := gen_request("/product/testing-foo-00000000-aaaa-bbbb-cccc-111111111111/123", "foo=bar")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "foo=bar&productId=00000000-aaaa-bbbb-cccc-111111111111&productSerial=123",
		"uri": "/product/index.html",
		"action": "FORWARD",
	}
}

test_withdrawal_path if {
	request := gen_request("/withdrawal/", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "",
		"uri": "/withdrawal/index.html",
		"action": "FORWARD",
	}
}

test_withdrawal_path_with_id if {
	request := gen_request("/withdrawal/00000000-aaaa-bbbb-cccc-222222222222", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "productId=00000000-aaaa-bbbb-cccc-222222222222",
		"uri": "/product/index.html", # intended
		"action": "FORWARD",
	}
}

test_withdrawal_path_with_id_and_serial if {
	request := gen_request("/withdrawal/00000000-aaaa-bbbb-cccc-222222222222/234", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "productId=00000000-aaaa-bbbb-cccc-222222222222&productSerial=234",
		"uri": "/withdrawal/index.html",
		"action": "FORWARD",
	}
}

test_drops_path if {
	request := gen_request("/drops/", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "",
		"uri": "/drops/index.html",
		"action": "FORWARD",
	}
}

test_drops_path_with_id if {
	request := gen_request("/drops/00000000-aaaa-bbbb-cccc-333333333333", "")
	response = result with input as request
	print(response[0])
	response[0] == {
		"querystring": "dropId=00000000-aaaa-bbbb-cccc-333333333333",
		"uri": "/drops/index.html",
		"action": "FORWARD",
	}
}
