$ = require 'jquery'

CONFIG = require 'config'
require '../../ui.ls'

$ ->
	$ss = $ 'main > article'

	ss-id = $ss.attr \data-id

	$read-later = $ss.find '> header .read-later'

	$read-later.click ->
		if LOGIN
			$read-later.attr \disabled on
			$read-later.children \i .attr \class 'wait fa fa-spinner fa-spin'
			read-later-tooltip.close!
			$.ajax "#{CONFIG.urls.api}/account/read-later-list/add" {
				data:
					'ss-id': ss-id
			}
			.done ->
				$read-later.attr \disabled on
				$read-later.children \i .attr \class 'fa fa-check'
				read-later-tooltip.destroy!
				set-timeout ->
					$read-later.animate {
						opacity: 0
					} 200ms \linear ->
						$read-later.remove!
				, 1000ms
		else
			alert '「あとで読む」機能を利用するにはログインしてください。'
