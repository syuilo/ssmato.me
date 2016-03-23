import { ISS } from './interfaces';

import extractCharacterNamesInText from './extract-character-names-in-text';

/**
 * SSに登場するキャラクター名をすべて抽出します
 * @param ss SS
 * @return キャラクター名の配列
 */
export default (
	ss: ISS & {
		posts: {
			isMaster: boolean;
		}[]
	}
): string[] => {
	return extractCharacterNamesInText(
		// 本文だけ
		ss.posts
		.filter(x => x.isMaster)
		.map(x => x.text)
		// キャラクター名がタイトルに含まれている場合が多い
		// 【安価】のようにタイトルは装飾されていることも多いので非装飾化
		.concat(this.getPlainTitle(ss.title)));
}
