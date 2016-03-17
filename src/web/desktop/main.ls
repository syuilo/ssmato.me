$ = require 'jquery/dist/jquery'

require './ui.ls'

$ window .on 'load resize' ->
	window-height = window.inner-height
	window-top-margin = 0

	$container = $ '#ui-contents > .main-container'
	container-height = $container.outer-height!
	$side = $container.children \.side
	$side-body = $side.children \.body
	side-top = $side.offset!.top
	side-height = $side-body.outer-height!

	top-margin = side-top

	f!

	$ window .off 'scroll.side-reposition'
	$ window .on 'scroll.side-reposition' f

	function f
		window-top = $ window .scroll-top!

		if window-top > 500px
			$ \#ui-go-top-button .remove-class \hidden
		else
			$ \#ui-go-top-button .add-class \hidden

		if window-top + window-height > side-top + side-height and window-top + window-top-margin > top-margin
			side-overflow = (side-top + side-height) - window-height
			if side-overflow < 0 then side-overflow = 0
			padding = window-height - side-height - window-top-margin
			if padding < 0 then padding = 0
			if window-height > side-top + side-height then padding -= window-height - (side-top + side-height)
			margin = window-top - side-overflow - padding
			if side-height + margin > container-height then margin = container-height - side-height - 2px
			$side-body.css \transform "translateY(#{margin}px)"
		else
			$side-body.css \transform \none

$ ->
	$ \#ui-go-top-button .click ->
		$ 'html, body' .animate {
			scroll-top: 0
		} 300ms \swing
