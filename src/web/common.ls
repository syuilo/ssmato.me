$ = require 'jquery/dist/jquery'

window.CSRF_TOKEN = $ 'meta[name="csrf-token"]' .attr \content

$.ajax-setup do
	type: \post
	cache: false
	xhr-fields:
		with-credentials: true
	# ヘッダーに含めるとCORSのプリフライトが発動して余計な通信が増えるので
	#headers:
	#	'csrf-token': window.CSRF_TOKEN
	#
	data:
		'_csrf': window.CSRF_TOKEN
