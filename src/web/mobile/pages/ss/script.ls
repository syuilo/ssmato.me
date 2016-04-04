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

	$posts = $ss.find '> .content > .body > .posts > .post'

	$posts.each ->
		$post = $ @
		post-id = $post.attr \data-id
		$like = $post.find '> .body > .actions > .like'
		$dislike = $post.find '> .body > .actions > .dislike'

		is-status-inited = false

		$post.click ->
			$posts.each ->
				($ @).remove-class \active
			$post.add-class \active
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
