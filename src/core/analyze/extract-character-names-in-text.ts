import extractName from './extract-name-part-in-serif';

/**
 * テキストの中のキャラクター名をすべて抽出します
 * @param text テキスト
 * @return キャラクター名の配列
 */
export default (text: string | string[]): string[] => {
	const texts = typeof text === 'string' ? [text] : text;

	let characters: string[] = [];

	texts.forEach(text => {
		text.split('\n').forEach(x => {
			const name = extractName(x);
			if (name !== null) {
				characters.push(name);
			}
		});
	});

	return characters;
}
