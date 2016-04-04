$ = require 'jquery'

require '../../main.ls'
ss = require '../../common/ss-preview.ls'

$ ->
	$ '.sss .ss' .each ->
		ss $ @
