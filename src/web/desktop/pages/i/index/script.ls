$ = require 'jquery'

require '../../../ui.ls'
ss = require '../../../common/ss-preview.ls'
tab = require '../../../common/tab.js'

$ ->
	tab ($ \#tabs), ($ \#pages)

	$ '#read-later .sss .ss' .each ->
		ss $ @

	$ '#favorites .sss .ss' .each ->
		ss $ @

	$ '#history .sss .ss' .each ->
		ss $ @
