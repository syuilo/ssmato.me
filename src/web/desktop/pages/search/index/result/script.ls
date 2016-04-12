$ = require 'jquery'

require '../../../../ui.ls'
ss = require '../../../../common/ss-preview.ls'

$ ->
	$ '#result .sss .ss' .each ->
		ss $ @
