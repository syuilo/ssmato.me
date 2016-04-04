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
	if (inquiry(name)) {
		return genId();
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

		if (inquiry(name.replace(reg, ''))) {
			return genId(id);
		} else {
			return null;
		}
	}

	/**
	 * キャラクター名がクエリと合致するか否かを取得します。
	 * @param query クエリ
	 * @return bool
	 */
	function inquiry(query: string): boolean {
		return character.name === query ||
			character.screenName === query ||
			removeWhiteSpaces(character.name) === query ||
			character.aliases.indexOf(query) !== -1;
	}

	function genId(id?: string): CharacterIdentity {
		if (id !== undefined) {
			return new CharacterIdentity(character, name, id);
		} else {
			return new CharacterIdentity(character, name);
		}
	}

	function removeWhiteSpaces(s: string): string {
		return s.replace(/\s/g, '');
	}
}
