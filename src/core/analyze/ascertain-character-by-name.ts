import { ICharacter } from '../../db/interfaces';

/**
 * 対象のキャラクターがある名前で呼ばれているか否かを取得します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return bool
 */
export default (character: ICharacter, name: string): boolean => {
	if (inquiry(name)) {
		return true;
	} else {
		name = name.replace(/[（\(].+?[）\)]/, '');
		if (inquiry(name)) {
			return true;
		} else {
			name = name.replace(/\d+$/, '');
			if (inquiry(name)) {
				return true;
			} else {
				name = name.replace(/[a-zA-Z]+$/, '');
				if (inquiry(name)) {
					return true;
				} else {
					return false;
				}
			}
		}
	}

	function inquiry(query: string): boolean {
		return character.name === query ||
			character.screenName === query ||
			removeWhiteSpaces(character.name) === query ||
			character.aliases.indexOf(query) !== -1;
	}
}

function removeWhiteSpaces(s: string): string {
	return s.replace(/\s/g, '');
}
