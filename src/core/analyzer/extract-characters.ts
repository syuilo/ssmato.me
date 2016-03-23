import { Character } from '../../db/models';
import { ISeries, ICharacter } from '../../db/interfaces';

import { ISS } from './interfaces';

import askCharacter from './ask-character';

/**
 * 対象のSSに登場するキャラクターとその割合を抽出します
 * @param ss SS
 * @return キャラクター情報と登場の割合を含むオブジェクトの配列
 */
export default (
	ss: ISS & {
		series: ISeries[];
		posts: {
			isMaster: boolean;
		}[]
	}
): Promise<{
	character: ICharacter;
	onStageRatio: number;
}[]> => new Promise((resolve, reject) => {
	// シリーズに登場するキャラクターをすべて取得
	Character.find({
		series: { $in: ss.series }
	},
	'_id name kana screenName aliases color',
	(err: any, allchars: ICharacter[]) => {

		const foundCharacters =
			// 登場するすべてのキャラクターの名前と思われる文字列を取得
			this.extractCharacterNames(ss)
			// その名前(と思われる文字列)で呼ばれているシリーズ内のキャラクターを取得
			.map(name => allchars.filter(char => askCharacter(char, name)))
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
