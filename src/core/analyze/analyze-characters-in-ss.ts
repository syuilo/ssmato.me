import {Character} from '../../db/models';
import {ISSThread, ICharacter} from '../../db/interfaces';
import extractNames from './extract-character-names-in-ss';
import ascertainCharacterByName from './ascertain-character-by-name';

/**
 * 対象のSSに登場するキャラクターとその割合を抽出します
 * ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
 * [この関数を利用するには、対象のSSのシリーズが確定している必要があります]
 * [この関数を利用するには、投稿がマークされている必要があります]
 * @param ss 対象のSS
 * @return キャラクター情報と登場の割合を含むオブジェクトの配列
 */
export default (ss: ISSThread): Promise<{
	character: ICharacter;
	onStageRatio: number;
}[]> => new Promise((resolve, reject) => {

	// シリーズが同定されていないとキャラの特定のしようがない
	if (ss.series === null || ss.series === []) {
		return reject('must-be-detect-series');
	}

	const series = ss.populated('series') !== undefined
		? ss.populated('series') : ss.series;

	// シリーズに登場するキャラクターをすべて取得
	Character.find({
		series: { $in: series }
	},
	'_id name kana screenName aliases color',
	(err: any, allchars: ICharacter[]) => {

		const foundCharacters =
			// 登場するすべてのキャラクターの名前と思われる文字列を取得
			extractNames(ss)
			// その名前(と思われる文字列)で呼ばれているシリーズ内のキャラクターを取得
			.map(name => allchars.filter(char => ascertainCharacterByName(char, name)))
			// 上の過程で発生した空配列(キャラクターが見つからなかった場合 filter に合致せず[]が返るため)を除去
			.filter(char => char.length === 1)
			// 上の上でfilter使ったせいでキャラクターが配列に入った状態なので取り出す
			.map(char => char[0]);

		// すべてのキャラの登場回数
		const allCount = foundCharacters.length;

		// 重複したキャラクターを除去
		const uniqueFoundChars =
			foundCharacters
			.filter((x, i, self) =>
				self.map(x => x.id).indexOf(x.id) === i);

		const returns = uniqueFoundChars.map(char => {
			// このキャラが何回登場したか
			const onStageCount =
				foundCharacters.filter(x => x.id.toString() === char.id.toString()).length;

			// このキャラの登場の割合は、(このキャラの登場回数 / すべてのキャラの登場回数) で求める
			const onStageRatio = onStageCount / allCount;

			return {
				character: char,
				onStageRatio: onStageRatio
			};
		})
		// 登場頻度で降順ソート
		.sort((a, b) => {
			if (a.onStageRatio > b.onStageRatio) {
				return -1;
			} else if (a.onStageRatio < b.onStageRatio) {
				return 1;
			} else {
				return 0;
			}
		});

		resolve(returns);
	});
});
