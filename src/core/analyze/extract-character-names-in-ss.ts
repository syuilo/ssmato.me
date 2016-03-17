import {ISSThread} from '../../db/interfaces';
import extractCharacterNames from './extract-character-names-in-text';
import plainizeTitle from './plainize-thread-title';

/**
 * SSに登場するキャラクター名をすべて抽出します
 * [この関数を呼び出すには、投稿がマークされている必要があります]
 * @param ss SS
 * @return キャラクター名の配列
 */
export default (ss: ISSThread): string[] => {
	return extractCharacterNames(

		// 本文だけ
		ss.posts
		.filter(x => x.isMaster)
		.map(x => x.text)

		// キャラクター名がタイトルに含まれている場合が多い
		// 【安価】のようにタイトルは装飾されていることも多いので非装飾化
		.concat(plainizeTitle(ss.title)));
}
