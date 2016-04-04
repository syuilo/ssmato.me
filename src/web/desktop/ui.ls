$ = require 'jquery'

CONFIG = require 'config'
require '../common.ls'

$ ->
	if LOGIN
		$.ajax "#{CONFIG.urls.api}/account/read-later-list/count" {}
		.done (count) ->
			if count != '0'
				$ '#ui-header > .nav .read-later' .append $ "<span class=count>#{count}</span>"
