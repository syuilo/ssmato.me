$ = require 'jquery'

require '../../../ui.ls'
ss = require '../../../common/ss-preview.ls'

$ ->
	$ '#stack .sss .ss' .each ->
		ss $ @
