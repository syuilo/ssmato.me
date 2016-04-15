import { ICharacter } from './interfaces';

import CharacterIdentity from './character-identity';

/**
 * 対象のキャラクターと名前からアイデンティティを生成します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return CharacterIdentity
 */
export default (character: ICharacter, name: string): CharacterIdentity => {
	// 完全一致
	if (match(name)) {
		return instantiation();
	}

	// 括弧付きアイデンティティ
	/* e.g.
	 * 櫻子(幼)
	 *
	 * 状態を表す
	 */
	const bracketsId = test(/[（\(].+?[）\)]/);
	if (bracketsId !== null) {
		return bracketsId;
	}

	// 数字付きアイデンティティ
	/* e.g.
	 * まどか2
	 *
	 * 往々にして複数人に分裂したりする
	 */
	const numberId = test(/(\d|[０-９])+$/);
	if (numberId !== null) {
		return numberId;
	}

	// 乗算アイデンティティ
	/* e.g.
	 * 杏子×100
	 *
	 * 往々にして複数人に分裂したりする
	 */
	const timesId = test(/[×x]\d+$/);
	if (timesId !== null) {
		return timesId;
	}

	// アルファベット付きアイデンティティ
	/* e.g.
	 * 京子B
	 *
	 * 往々にして複数人に分裂したりする
	 */
	const aluphabetId = test(/[a-zA-Zａ-ｚＡ-Ｚ]+$/);
	if (aluphabetId !== null) {
		return aluphabetId;
	}

	// 諦め
	return null;

	function test(reg: RegExp): CharacterIdentity {
		const idMatch = name.match(reg);
		const id = idMatch !== null ? idMatch[0] : null;

		if (id === null) {
			return null;
		}

		if (match(name.replace(reg, ''))) {
			return instantiation(id);
		} else {
			return null;
		}
	}

	/**
	 * キャラクター名がクエリと合致するか否かを取得します。
	 * @param query クエリ
	 * @return bool
	 */
	function match(query: string): boolean {
		query = katakanaToHiragana(removeSpaces(query));
		const name = katakanaToHiragana(removeSpaces(character.name));
		const screenName = katakanaToHiragana(removeSpaces(character.screenName));
		const aliases = character.aliases.map(name => katakanaToHiragana(removeSpaces(name)));

		return name === query ||
			screenName === query ||
			aliases.indexOf(query) !== -1;
	}

	function instantiation(id?: string): CharacterIdentity {
		if (id !== undefined) {
			return new CharacterIdentity(character, name, id);
		} else {
			return new CharacterIdentity(character, name);
		}
	}

	function removeSpaces(s: string): string {
		return s.replace(/\s/g, '');
	}
}

/**
 * カタカナをひらがなに変換します
 * @param {String} src - カタカナ
 * @returns {String} - ひらがな
 */
function katakanaToHiragana(src: string): string {
	return src.replace(/[\u30a1-\u30f6]/g, match => {
		const char = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(char);
	});
}

///**
// * ひらがなをカタカナに変換します
// * @param {String} src - ひらがな
// * @returns {String} - カタカナ
// */
//function hiraganaToKatagana(src: string): string {
//	return src.replace(/[\u3041-\u3096]/g, match => {
//		const char = match.charCodeAt(0) + 0x60;
//		return String.fromCharCode(char);
//	});
//}
