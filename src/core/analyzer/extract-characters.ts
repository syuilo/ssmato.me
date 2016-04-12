import { ISS, ISeries, ICharacter } from './interfaces';

import World from './world';
import Tokenizer from './tokenizer';
import { Token, ICharacterNameToken } from './token-types';

/**
 * 対象のSSに登場するキャラクターとその割合を抽出します
 * @param world World
 * @param ss SS
 * @return キャラクター情報と登場の割合を含むオブジェクトの配列
 */
export default (
	world: World,
	tokenizer: Tokenizer,
	ss: ISS & {
		series: ISeries[];
		posts: {
			isMaster: boolean;
			tokens: Token[];
		}[]
	}
): (ICharacter & {
	onStageRatio: number;
})[] => {
	const foundCharacters: ICharacter[] = [];

	// 本文中
	ss.posts.forEach((p: any) => {
		p.tokens
		.filter((t: ICharacterNameToken) => t.type === 'character-name')
		.forEach((t: ICharacterNameToken) => {
			foundCharacters.push(t.character);
		});
	});

	// SSタイトル
	(tokenizer.tokenize(ss.title, ['character-name']) || [])
	.filter((t: ICharacterNameToken) => t.type === 'character-name')
	.forEach((t: ICharacterNameToken) => {
		foundCharacters.push(t.character);
	});

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

		return Object.assign({}, char, {
			onStageRatio: onStageRatio
		});
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

	return returns;
}
