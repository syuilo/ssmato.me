$ = require 'jquery'
require 'fuck-adblock'

CONFIG = require 'config'
require '../../main.ls'
tooltip = require '../../common/tooltiper.ls'

if fuck-ad-block == undefined
	ad-block-detected!
else
	fuck-ad-block.on-detected ad-block-detected

function ad-block-detected
	$ 'main' .prepend $ '<p class="ad-block-detected"><i class="fa fa-exclamation-triangle"></i>SSまとめは広告収入によって運営されています。宜しければ、広告ブロッカーを無効にしてご利用ください！</p>'

$ ->
	$ss = $ 'main > article > .ss'

	ss-id = $ss.attr \data-id

	is-favorited = false

	$ss.find '.on-stage-ratio > a' .each ->
		tooltip $ @

	$favorite-button = $ss.find '> header .favorite'
	favorite-button-tooltip = tooltip $favorite-button

	if LOGIN
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
					$counter = $ss.find '> header > .info > .top > .status > .favorites .count'
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
					$counter = $ss.find '> header > .info > .top > .status > .favorites .count'
					$counter.text (parse-int $counter.html!, 10) - 1
		else
			alert 'このSSをお気に入りに登録するにはログインしてください。'

	$read-later = $ss.find '> header .read-later'
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
