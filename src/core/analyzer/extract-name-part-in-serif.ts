const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const brackets = [
	'「',
	'｢',
	'『',
	'《',
	'≪',
	'（',
	'('
];

const bracketsRegExp =
	brackets
	.map(b => `\\${b}`)
	.concat(
		brackets
		.map(b => '\\' + entities.encode(b))
	)
	.join('|');

/**
 * セリフ行の中のキャラクター名部分を抽出します
 * @param serif セリフ
 * @return キャラクター名部分
 */
export default (serif: string): string => {
	serif = serif.trim();

	if (serif === '') {
		return null;
	}

	const includeBracketsRegExpMatch =
		serif.match(new RegExp(`^((.+?)[（\(].+?[）\)])(${bracketsRegExp}).+`));

	if (includeBracketsRegExpMatch !== null) {
		return includeBracketsRegExpMatch[1];
	}

	const normalRegExpMatch =
		serif.match(new RegExp(`^(.+?)(${bracketsRegExp}).+`));

	if (normalRegExpMatch !== null) {
		return normalRegExpMatch[1];
	}

	return null;
}
