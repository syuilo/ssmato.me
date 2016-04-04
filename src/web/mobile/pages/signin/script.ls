$ = require 'jquery'

CONFIG = require 'config'
require '../../ui.ls'

$ ->
	$form = $ \#form

	$form.submit (event) ->
		event.prevent-default!

		$submit-button = $form.find '[type=submit]'
			..attr \disabled on
			..find \span .text 'ログイン中...'
			..find \i .attr \class 'fa fa-spinner fa-pulse'

		$form.find \input .attr \disabled on

		$ \html .add-class \processing

		$.ajax CONFIG.urls.signin, {
			data:
				'screen-name': $form.find '[name="screen-name"]' .val!
				'password': $form.find '[name="password"]' .val!
		}
		.done ->
			if CALLBACK?
				location.href = CALLBACK
			else
				if location.host == CONFIG.domains.signin + '.' + CONFIG.domain
					location.href = CONFIG.url
				else
					location.reload!
		.fail (err) ->
			console.error err

			$submit-button
				..attr \disabled off
				.find \span .text 'ログイン'
				..find \i .attr \class 'fa fa-sign-in'

			$form.find \input .attr \disabled off

			$ \html .remove-class \processing

			text = switch (err.response-text)
				| \user-not-found => 'ユーザーIDが間違っています'
				| \failed => 'パスワードが間違っています'

			$form.find '.info'
				..children \i .attr \class 'fa fa-exclamation-triangle'
				..children \span .text text
				..attr \data-state \error
