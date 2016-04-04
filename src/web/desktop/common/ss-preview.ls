$ = require 'jquery/dist/jquery'
tooltip = require './tooltiper.ls'

module.exports = ($ss) ->
	ss-id = $ss.attr \data-id

	is-favorited-checked = false
	is-favorited = false

	$favorite-button = $ss.find '> header > .title > .favorite'
	favorite-button-tooltip = tooltip $favorite-button

	if LOGIN
		$ss.mouseover ->
			if is-favorited-checked
				return
			is-favorited-checked := true

			$.ajax "#{CONFIG.urls.api}/favorites/check" {
				data:
					'ss-id': ss-id
			}
			.done (x) ->
				is-favorited := x == 'true'
				$ss.attr \data-is-favorited x
				$favorite-button.attr \data-tooltip (if is-favorited then 'お気に入り解除' else 'お気に入りに登録')

	$favorite-button.click ->
		if LOGIN
			if not is-favorited
				$favorite-button.attr \disabled on
				favorite-button-tooltip.close!
				$.ajax "#{CONFIG.urls.api}/favorites/create" {
					data:
						'ss-id': ss-id
				}
				.done ->
					$favorite-button.attr \disabled off
					is-favorited := true
					$ss.attr \data-is-favorited \true
					$favorite-button.attr \data-tooltip 'お気に入り解除'
					$counter = $ss.find '> footer > .status > .favorites .count'
					$counter.text (parse-int $counter.html!, 10) + 1
			else
				$favorite-button.attr \disabled on
				favorite-button-tooltip.close!
				$.ajax "#{CONFIG.urls.api}/favorites/destroy" {
					data:
						'ss-id': ss-id
				}
				.done ->
					$favorite-button.attr \disabled off
					is-favorited := false
					$ss.attr \data-is-favorited \false
					$favorite-button.attr \data-tooltip 'お気に入りに登録'
					$counter = $ss.find '> footer > .status > .favorites .count'
					$counter.text (parse-int $counter.html!, 10) - 1
		else
			alert 'このSSをお気に入りに登録するにはログインしてください。'

	$read-later = $ss.find '> header > .actions .read-later'
	read-later-tooltip = tooltip $read-later
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

	$remove-later = $ss.find '> header > .actions .remove-later'
	remove-later-tooltip = tooltip $remove-later
	$remove-later.click ->
		$ss.remove!
		remove-later-tooltip.destroy!
		$.ajax "#{CONFIG.urls.api}/account/read-later-list/remove" {
			data:
				'ss-id': ss-id
		}
