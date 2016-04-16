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
		ruby = $form.find '[name="ruby"]' .val!
		screen-name = $form.find '[name="screen-name"]' .val!
		aliases = $form.find '[name="aliases"]' .val!
		color = $form.find '[name="color"]' .val!
		bio = $form.find '[name="bio"]' .val!
		gender = $form.find '[name="gender"]' .val!
		image = if $form.find '[name="image"]' .val! != ''
			then ($form.find '[name="image"]' .prop \files)[0]
			else null
		icon = if $form.find '[name="icon"]' .val! != ''
			then ($form.find '[name="icon"]' .prop \files)[0]
			else null

		data = new FormData!
			..append 'character-id' window.CHARACTER_ID
			..append 'series-id' series
			..append 'name' name
			..append 'kana' kana
			..append 'ruby' ruby
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

		if icon?
			data.append \icon icon

		$.ajax "#{CONFIG.urls.api}/character/update" {
			+async
			-process-data
			-content-type
			data: data
			headers:
				'csrf-token': window.CSRF_TOKEN
		} .done ->
			alert '更新が完了しました。'
			location.reload!
		.fail (err) ->
			console.error err

			alert "更新に失敗しました。\r\nERR: [(#{err.status} #{err.status-text}) #{err.response-text}]"

			grecaptcha.reset!

			$submit-button
				..attr \disabled off
				.find \span .text '更新'
				..find \i .attr \class 'fa fa-check'

			$form.find \input .attr \disabled off

			$ \html .remove-class \processing
