import { Series, Character } from '../../db/models';
import { ISeries, ICharacter } from '../../db/interfaces';

import { ISS } from './interfaces';

import askSeries from './ask-series';
import askCharacter from './ask-character';
import checkCross from './check-cross';
import extractCharacterNames from './extract-character-names';

/**
 * SSのシリーズを同定します
 * @param ss SS
 * @return 同定されたシリーズ
 */
export default(
	ss: ISS & {
		posts: {
			isMaster: boolean
		}[]
	}
): Promise<ISeries[]> => new Promise((resolve, reject) => {
	Promise.all([
		// Get all series
		Series.find({}, '_id title kana aliases'),
		// Get all characters
		Character.find({}, '_id name kana screenName aliases series')
	]).then((results: any) => {
		const allseries = <ISeries[]>results[0];
		const allchars = <ICharacter[]>results[1];

		// タイトル内の【】内の文字列
		const textInBracketsMatch = ss.title.match(/【(.+?)】/g);
		const textInBrackets = textInBracketsMatch === null ? null : textInBracketsMatch
			.map(x => x.trim())
			.map(x => x.substr(1, x.length - 2));

		// 【】内の文字列に一致するシリーズを探す
		const seriesInTitle =
			textInBrackets === null
				? null
				: allseries
					.filter(series =>
						textInBrackets.map(text =>
							askSeries(series, text)
						).indexOf(true) !== -1)
					[0];

		// クロスSSかどうか
		const isCross = checkCross(ss);

		// SS内に登場するすべてのキャラクター名(と思われる文字列)を抽出
		const extractedNames = extractCharacterNames(ss)
			// 重複は除去
			.filter((x, i, self) => self.indexOf(x) === i);

		// 登場頻度ランキング
		let chart: any[] = [];

		allchars.forEach(char => {
			(<string[]>char.series).forEach(charSeries => {
				// ランキング内のシリーズコンテキストを取得
				let seriesContext = chart.filter(x => x.series === charSeries.toString())[0];

				// ランキングにシリーズがまだ登録されてなかったら登録
				if (seriesContext === undefined) {
					const i = chart.push({
						series: charSeries.toString(),
						found: []
					});
					seriesContext = chart[i - 1];
				}

				// キャラがこのSSに登場したらそのキャラのシリーズに+1
				extractedNames.forEach(name => {
					if (askCharacter(char, name)) {
						// 同じキャラの複数登場よるn重+1防止
						if (seriesContext.found.indexOf(char.id) === -1) {
							seriesContext.found.push(char.id);
						}
					}
				});
			});
		});

		// 見つかったキャラクターの多さでソート
		chart.sort((a, b) => a.found.length > b.found.length ? -1 : 1);

		// シリーズが見つかったら
		if (chart[0].found.length > 0) {
			// クロスオーバーかつ第二候補も見つかったら
			if (isCross && chart[1].found.length > 0) {
				Series.find({
					_id: { $in: [chart[0].series, chart[1].series] }
				}, (err: any, series: ISeries[]) => {
					if (err !== null) {
						reject(err);
					} else {
						resolve(series);
					}
				});
			}
			// それ以外は最有力候補をシリーズとして断定
			else {
				Series.findById(chart[0].series, (err: any, series: ISeries) => {
					if (err !== null) {
						reject(err);
					} else {
						resolve([series]);
					}
				});
			}
		// SS内からシリーズを判断できないかつSSタイトルでシリーズを推定出来ていた場合
		} else if (seriesInTitle !== null) {
			resolve([seriesInTitle]);
		}
		// 該当なし(同定失敗)
		else {
			resolve(null);
		}
	}, reject);
});
