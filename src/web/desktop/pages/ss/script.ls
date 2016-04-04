$ = require 'jquery'

CONFIG = require 'config'
require '../../main.ls'
tooltip = require '../../common/tooltiper.ls'

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

	$ss.find '> .body > .posts > .post' .each ->
		$post = $ @
		post-id = $post.attr \data-id
		$like = $post.find '> .body > .actions > .like'
		$dislike = $post.find '> .body > .actions > .dislike'

		is-status-inited = false

		$post.hover ->
			if not is-status-inited and LOGIN
				is-status-inited := true
				$.ajax "#{CONFIG.urls.api}/ss/posts/get-my-rating" {
					data:
						'post-id': post-id
				}
				.done (status) ->
					if status == \like
						$like.children \i .attr \class 'fa fa-thumbs-up'
						$dislike.children \i .attr \class 'fa fa-thumbs-o-down'
					else if status == \dislike
						$like.children \i .attr \class 'fa fa-thumbs-o-up'
						$dislike.children \i .attr \class 'fa fa-thumbs-down'

		$like.click ->
			if LOGIN
				$like.attr \disabled on
				$.ajax "#{CONFIG.urls.api}/ss/posts/like" {
					data:
						'post-id': post-id
				}
				.done ->
					$like.attr \disabled off
					$like.children \i .attr \class 'fa fa-thumbs-up'
					$dislike.children \i .attr \class 'fa fa-thumbs-o-down'
			else
				alert '投稿を評価していただきありがとうございます。しかし、あなたは現在ログインしていないようです。投稿を評価するにはログインするか新規登録を行ってください。'

		$dislike.click ->
			if LOGIN
				$dislike.attr \disabled on
				$.ajax "#{CONFIG.urls.api}/ss/posts/dislike" {
					data:
						'post-id': post-id
				}
				.done ->
					$dislike.attr \disabled off
					$like.children \i .attr \class 'fa fa-thumbs-o-up'
					$dislike.children \i .attr \class 'fa fa-thumbs-down'
			else
				alert '投稿を評価していただきありがとうございます。しかし、あなたは現在ログインしていないようです。投稿を評価するにはログインするか新規登録を行ってください。'
