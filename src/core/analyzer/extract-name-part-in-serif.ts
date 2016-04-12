/**
 * セリフに用いられる括弧の定義
 */
const brackets = [
	'「', // 通常のセリフ
	'｢', // ヽ
	'『', // 回想中のセリフ、電話越しのセリフ、テレパシーなど
	'《', // ヽ
	'≪', // ヽ
	'（', // 思惟や心の中で思ったことなど
	'(' // ヽ
];

const bracketsRegExp =
	brackets
	.map(b => `\\${b}`)
	.join('|');

const serifRegExp =
	`^(([^${bracketsRegExp}|\n]+?)([（\(][^${bracketsRegExp}|\n]+?[）\)])?)(${bracketsRegExp}).+`;

/**
 * セリフ行の中のキャラクター名部分を抽出します
 * @param serif セリフ
 * @return キャラクター名部分
 */
export default (serif: string): string => {
	if (serif === '') {
		return null;
	}

	const serifRegExpMatch =
		serif.match(new RegExp(serifRegExp));

	if (serifRegExpMatch !== null) {
		return serifRegExpMatch[1];
	}

	return null;
}
