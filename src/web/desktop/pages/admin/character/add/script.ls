$ = require 'jquery'

CONFIG = require 'config'
require '../../../../ui.ls'

$ ->
	$form = $ \#form

	$form.submit (event) ->
		event.prevent-default!

		$ \html .add-class \processing

		$submit-button = $form.find '[type=submit]'
			..attr \disabled on
			..find \span .text '登録中...'
			..find \i .attr \class 'fa fa-spinner fa-pulse'

		$form.find \input .attr \disabled on

		series = $form.find '[name="series"]' .val!
		name = $form.find '[name="name"]' .val!
		kana = $form.find '[name="kana"]' .val!
		screen-name = $form.find '[name="screen-name"]' .val!
		aliases = $form.find '[name="aliases"]' .val!
		color = $form.find '[name="color"]' .val!
		bio = $form.find '[name="bio"]' .val!
		gender = $form.find 'input[name="gender"]:checked' .val!
		image = if $form.find '[name="image"]' .val! != ''
			then ($form.find '[name="image"]' .prop \files)[0]
			else null

		data = new FormData!
			..append 'series-id' series
			..append 'name' name
			..append 'kana' kana
			..append 'screen-name' screen-name
			..append 'color' color
			..append 'aliases' aliases
			..append 'g-recaptcha-response' grecaptcha.get-response!

		if bio.trim! != ''
			data.append \bio bio

		if gender?
			data.append \gender gender

		if image?
			data.append \image image

		$.ajax "#{CONFIG.urls.api}/character/add" {
			+async
			-process-data
			-content-type
			data: data
			headers:
				'csrf-token': window.CSRF_TOKEN
		} .done ->
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
