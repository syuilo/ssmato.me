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
	const numberId = test(/([0-9０-９])+$/);
	if (numberId !== null) {
		return numberId;
	}

	// 乗算アイデンティティ
	/* e.g.
	 * 杏子×100
	 *
	 * 往々にして複数人に分裂したりする
	 */
	const timesId = test(/[×x][0-9０-９]+$/);
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
		query = normalize(query);
		const name = normalize(character.name);
		const screenName = normalize(character.screenName);
		const aliases = character.aliases.map(name => normalize(name));

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
}

function normalize(str: string): string {
	return katakanaToHiragana(hankakukatakanaToZenkakukatakana(removeSpaces(str)));
}

function removeSpaces(s: string): string {
	return s.replace(/\s/g, '');
}

/**
 * 半角カタカナを全角カタカナに変換
 *
 * @param {String} str 変換したい文字列
 */
function hankakukatakanaToZenkakukatakana(str: string): string {
	const kanaMap = {
		'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
		'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
		'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
		'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
		'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
		'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
		'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
		'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
		'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
		'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
		'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
		'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
		'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
		'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
		'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
		'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
		'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
		'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
		'｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
	};

	const reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
	return str
		.replace(reg, match =>
			kanaMap[match]
		)
		.replace(/ﾞ/g, '゛')
		.replace(/ﾟ/g, '゜');
};

/**
 * カタカナをひらがなに変換します
 * @param {String} str - カタカナ
 * @returns {String} - ひらがな
 */
function katakanaToHiragana(str: string): string {
	return str.replace(/[\u30a1-\u30f6]/g, match => {
		const char = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(char);
	});
}

///**
// * ひらがなをカタカナに変換します
// * @param {String} str - ひらがな
// * @returns {String} - カタカナ
// */
//function hiraganaToKatagana(str: string): string {
//	return str.replace(/[\u3041-\u3096]/g, match => {
//		const char = match.charCodeAt(0) + 0x60;
//		return String.fromCharCode(char);
//	});
//}
