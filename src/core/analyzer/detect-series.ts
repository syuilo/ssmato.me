import { ISS, ISeries } from './interfaces';

import World from './world';
import askSeries from './ask-series';
import askCharacter from './ask-character';
import checkCross from './check-cross';
import extractCharacterNames from './extract-character-names';

/**
 * SSのシリーズを同定します
 * @param world World
 * @param ss SS
 * @return 同定されたシリーズ
 */
export default(
	world: World,
	ss: ISS & {
		posts: {
			isMaster: boolean
		}[]
	}
): Promise<ISeries[]> => new Promise((resolve, reject) => {

	// クロスSSかどうか
	const isCross = checkCross(ss);

	// SS内に登場するすべてのキャラクター名(と思われる文字列)を抽出
	const extractedNames = extractCharacterNames(ss)
		// 重複は除去
		.filter((x, i, self) => self.indexOf(x) === i);

	// 登場頻度ランキング
	const chart: {
		series: ISeries;
		found: string[]
	}[] = world.series.map(series => {
		return {
			series: series,
			found: []
		};
	});

	world.characters.forEach(char => {
		char.series.forEach(charSeries => {
			// ランキング内のシリーズコンテキストを取得
			let seriesContext = chart.filter(x => x.series.id === charSeries)[0];

			// キャラがこのSSに登場したらそのキャラのシリーズに+1
			extractedNames.forEach(name => {
				if (!askCharacter(char, name)) {
					return;
				}

				// 同じキャラの複数登場よるn重+1防止
				if (seriesContext.found.indexOf(char.id) !== -1) {
					return;
				}

				seriesContext.found.push(char.id);
			});
		});
	});

	// 見つかったキャラクターの多さでソート
	chart.sort((a, b) => a.found.length > b.found.length ? -1 : 1);

	// シリーズが見つかったら
	if (chart[0].found.length > 0) {
		// クロスオーバーかつ第二候補も見つかったら
		if (isCross && chart[1].found.length > 0) {
			resolve([chart[0].series, chart[1].series]);
			return;
		}

		// それ以外は最有力候補をシリーズとして断定
		resolve([chart[0].series]);
		return;
	}

	// タイトル内の【】内の文字列
	const textInBracketsMatch = ss.title.match(/【(.+?)】/g);
	const textInBrackets = textInBracketsMatch === null ? null : textInBracketsMatch
		.map(x => x.trim())
		.map(x => x.substr(1, x.length - 2));

	// 【】内の文字列に一致するシリーズを探す
	const seriesInTitle =
		textInBrackets === null
			? null
			: world.series
				.filter(series =>
					textInBrackets.map(text =>
						askSeries(series, text)
					).indexOf(true) !== -1)
				[0];

	// SSタイトルでシリーズを推定出来たら
	if (seriesInTitle !== undefined && seriesInTitle !== null) {
		resolve([seriesInTitle]);
		return;
	}

	// 該当なし(同定失敗)
	resolve(null);
});
