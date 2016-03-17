require '../../../../ui.ls'
$ = require 'jquery/dist/jquery'

$ ->
	$form = $ \#form

	$form.submit (event) ->
		event.prevent-default!

		$submit-button = $form.find '[type=submit]'
			..attr \disabled on
			..find \span .text '登録中...'
			..find \i .attr \class 'fa fa-spinner fa-pulse'

		$form.find \input .attr \disabled on

		title = $form.find '[name="title"]' .val!
		kana = $form.find '[name="kana"]' .val!
		aliases = $form.find '[name="aliases"]' .val!

		data = {
			'title': title
			'kana': kana
			'aliases': aliases
			'g-recaptcha-response': grecaptcha.get-response!
		}

		description = $form.find '[name="description"]' .val!

		if description.trim! != ''
			data['description'] = description

		$ \html .add-class \processing

		$.ajax "#{CONFIG.urls.api}/series/add" { data }
		.done ->
			alert '登録が完了しました。'
			location.reload!
		.fail (err) ->
			console.error err

			alert "登録に失敗しました。\r\nERR: [(#{err.status} #{err.status-text}) #{err.response-text}]"

			grecaptcha.reset!

			$submit-button
				..attr \disabled off
				.find \span .text '登録'
				..find \i .attr \class 'fa fa-check'

			$form.find \input .attr \disabled off

			$ \html .remove-class \processing
