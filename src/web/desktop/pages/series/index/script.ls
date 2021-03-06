$ = require 'jquery'

require '../../../ui.ls'
ss = require '../../../common/ss-preview.ls'

$ ->
	$ '.sss .ss' .each ->
		ss $ @

	$ '#characters ul > li > a' .each ->
		$a = $ @
		$card = $a.children \div

		$a.on 'mousedown' (e) ->
			force = 23
			cx = e.offset-x
			cy = e.offset-y
			w = $card.outer-width!
			h = $card.outer-height!
			cxp = ((cx / w) * 2) - 1
			cyp = ((cy / h) * 2) - 1
			angle = Math.max(Math.abs(cxp), Math.abs(cyp)) * force
			$card
				.css \transition 'transform 0.05s ease'
				.css \transform "perspective(256px) rotate3d(#{-cyp}, #{cxp}, 0, #{angle}deg)"

		$a.on 'mouseleave mouseup' (e) ->
			$card
				.css \transition 'transform 1s ease'
				.css \transform 'perspective(256px) rotate3d(0, 0, 0, 0deg)'
