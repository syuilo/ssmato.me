/**
 * アスキーアートであるかどうかを判定します。
 * @param text text
 * @return bool
 */
export default(text: string): boolean => {
	// 空行が4行以上存在したら
	const brankLinesCount = (text.match(/\n\n/g) || []).length;
	if (brankLinesCount >= 4) {
		return false;
	}

	// スペースが256個以上あったら
	const spacesCount = (text.match(/ |　/g) || []).length;
	if (spacesCount >= 256) {
		return true;
	} else {
		return false;
	}
}
