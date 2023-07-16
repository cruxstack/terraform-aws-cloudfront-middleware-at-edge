package sample

import future.keywords.if

test_sample if {
	request := {"message": "world"}
	response = validate with input as request
	print(response)
	response == true
}
