require '../../ui.ls'
$ = require 'jquery/dist/jquery'

window.on-recaptchaed = ->
	$ \#recaptcha .find '> .caption > i' .attr \class 'fa fa-toggle-on'

window.on-recaptcha-expired = ->
	$ \#recaptcha .find '> .caption > i' .attr \class 'fa fa-toggle-off'

$ ->
	$form = $ '#form'

	$ '#screen-name > input' .keyup ->
		sn = $ '#screen-name > input' .val!
		if sn != ''
			err = switch
				| not sn.match /^[a-zA-Z0-9\-]+$/ => '半角英数字、ハイフンで入力してください'
				| sn.length < 2chars              => '2文字以上にしてください'
				| sn.length > 15chars             => '15文字以内にしてください'
				| _                               => null

			if err
				$ '#screen-name > .info'
					..children \i .attr \class 'fa fa-exclamation-triangle'
					..children \span .text err
					..attr \data-state \error
				$ '#screen-name > .profile-page-url-preview' .text ""
			else
				$ '#screen-name > .info'
					..children \i .attr \class 'fa fa-spinner fa-pulse'
					..children \span .text '確認中...'
					..attr \data-state \processing

				$.ajax "#{CONFIG.urls.api}/screen-name/available" {
					data: {'screen-name': sn}
				} .done (result) ->
					if result.available
						$ '#screen-name > .info'
							..children \i .attr \class 'fa fa-check'
							..children \span .text 'このIDは利用できます！'
							..attr \data-state \ok
					else
						$ '#screen-name > .info'
							..children \i .attr \class 'fa fa-exclamation-triangle'
							..children \span .text 'このIDは既に使用されています'
							..attr \data-state \error
				.fail (err) ->
					$ '#screen-name > .info'
						..children \i .attr \class 'fa fa-exclamation-triangle'
						..children \span .text '確認に失敗しました'
						..attr \data-state \error
		else
			$ '#screen-name > .profile-page-url-preview' .text ""

	$ '#password > input' .keyup ->
		password = $ '#password > input' .val!
		if password != ''
			err = switch
				| password.length < 8chars       => '短すぎます'
				| _                              => null
			if err
				$ '#password > .info'
					..children \i .attr \class 'fa fa-exclamation-triangle'
					..children \span .text err
					..attr \data-state \error
			else
				$ '#password > .info'
					..children \i .attr \class 'fa fa-check'
					..children \span .text 'OK'
					..attr \data-state \ok

	$ '#retype-password > input' .keyup ->
		password = $ '#password > input' .val!
		retyped-password = $ '#retype-password > input' .val!
		if retyped-password != ''
			err = switch
				| retyped-password != password   => 'パスワードが一致していません'
				| _                              => null
			if err
				$ '#retype-password > .info'
					..children \i .attr \class 'fa fa-exclamation-triangle'
					..children \span .text err
					..attr \data-state \error
			else
				$ '#retype-password > .info'
					..children \i .attr \class 'fa fa-check'
					..children \span .text 'OK'
					..attr \data-state \ok

	$form.submit (event) ->
		event.prevent-default!

		$submit-button = $form.find '[type=submit]'
			..attr \disabled on
			..find \span .text '作成中...'
			..find \i .attr \class 'fa fa-spinner fa-pulse'

		$form.find \input .attr \disabled on

		screen-name = $form.find '[name="screen-name"]' .val!
		password = $form.find '[name="password"]' .val!

		$ \html .add-class \processing

		$.ajax "#{CONFIG.urls.api}/account/create" {
			data:
				'screen-name': screen-name
				'password': password
				'g-recaptcha-response': grecaptcha.get-response!
		} .done ->
			$submit-button
				.find \span .text 'ログイン中...'

			if CALLBACK?
				location.href = "#{CONFIG.urls.signin}?screen-name=#{screen-name}&password=#{password}&callback=#{CALLBACK}"
			else
				location.href = "#{CONFIG.urls.signin}?screen-name=#{screen-name}&password=#{password}"
		.fail ->
			grecaptcha.reset!

			$submit-button
				..attr \disabled off
				.find \span .text 'アカウント作成'
				..find \i .attr \class 'fa fa-check'

			$form.find \input .attr \disabled off

			$ \html .remove-class \processing
