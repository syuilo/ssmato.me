$ = require 'jquery/dist/jquery'

require '../../../ui.ls'
ss = require '../../../common/ss-preview.ls'

$ ->
	$ '.sss .ss' .each ->
		ss $ @
