import { ICharacter } from '../../db/interfaces';
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
	const bracketsId = test(/[（\(].+?[）\)]/);
	if (bracketsId !== null) {
		return bracketsId;
	}

	// 数字付きアイデンティティ
	const numberId = test(/\d+$/);
	if (numberId !== null) {
		return numberId;
	}

	// 乗算アイデンティティ
	const timesId = test(/[×]\d+$/);
	if (timesId !== null) {
		return timesId;
	}

	// アルファベット付きアイデンティティ
	const aluphabetId = test(/[a-zA-Z]+$/);
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
}

function removeWhiteSpaces(s: string): string {
	return s.replace(/\s/g, '');
}
