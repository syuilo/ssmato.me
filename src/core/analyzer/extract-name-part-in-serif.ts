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

	if (/^(.+?)[（\(].+?[）\)][「｢『《≪（\(].+/.test(serif)) {
		return serif.match(/^((.+?)[（\(].+?[）\)])[「｢『《≪（\(].+/)[1];
	} else if (/^(.+?)[「｢『《≪（\(](.+?)/.test(serif)) {
		return serif.match(/^(.+?)[「｢『《≪（\(](.+?)/)[1];
	} else {
		return null;
	}
}
