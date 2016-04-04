$ = require 'jquery'

CONFIG = require 'config'
require '../../../../../ui.ls'

$ ->
	$sssae = $ \#sssae

	$reanalyze-button = $sssae.find '.reanalyze'

	$reanalyze-button.click ->
		$ \html .add-class \processing

		$.ajax "#{CONFIG.urls.api}/ss/analyze" {
			data:
				'ss-id': SSID
		}
		.done (ss) ->
			text = "解析が完了しました。"
			if ss.series.length == 1
				text += "シリーズは「#{ss.series[0].title}」だと同定されました。"
			else if ss.series.length > 1
				series = ss.series
					.map (x) -> x.title
					.join '」と「'
				text += "シリーズは「#{series}」(クロス)だと同定されました。"
			else
				text += "シリーズは判りませんでした(データベースの情報が不足しているか、オリジナルSSの可能性があります)。"
			alert text
			location.reload!
		.fail (err) ->
			console.error err

			alert "解析に失敗しました。\r\nERR: [(#{err.status} #{err.status-text}) #{err.response-text}]"

			$reanalyze-button
				..attr \disabled off
				.find \span .text '登録'
				..find \i .attr \class 'fa fa-search'

			$ \html .remove-class \processing

	$form = $ \#form

	$form.submit (event) ->
		event.prevent-default!

		$submit-button = $form.find '[type=submit]'
			..attr \disabled on
			..find \span .text '登録中...'
			..find \i .attr \class 'fa fa-spinner fa-pulse'

		$form.find \input .attr \disabled on

		url = $form.find '[name="url"]' .val!

		data = {
			'url': url
		}

		$ \html .add-class \processing
