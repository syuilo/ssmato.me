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

		url = $form.find '[name="url"]' .val!

		data = {
			'url': url
		}

		$ \html .add-class \processing

		$.ajax "#{CONFIG.urls.api}/ss/get" { data }
		.done (ss) ->
			console.log ss
			text = "登録が完了しました。\r\n解析の結果、タイトルは『#{ss.title}』で、"
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

			alert "登録に失敗しました。\r\nERR: [(#{err.status} #{err.status-text}) #{err.response-text}]"

			$submit-button
				..attr \disabled off
				.find \span .text '登録'
				..find \i .attr \class 'fa fa-check'

			$form.find \input .attr \disabled off

			$ \html .remove-class \processing
