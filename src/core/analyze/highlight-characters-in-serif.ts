import { ICharacter } from '../../db/interfaces';
import extractName from './extract-name-part-in-serif';
import ascertainCharacterByName from './ascertain-character-by-name';
// import config from '../../config';

/* tslint:disable:max-line-length */

/**
 * 台詞のキャラクタ名部分をハイライトします。
 * @param allchars 登場キャラクター
 * @param serif 台詞
 * @return html
 */
export default (allchars: ICharacter[], serif: string): string => {
	// 台詞の名前部分を抽出
	const name = extractName(serif);

	if (name === null) {
		return serif;
	}

	serif = serif.trim();

	// 抽出した名前と思われる文字列に合致する呼び方のキャラクターを抽出
	const character = allchars.filter(c => ascertainCharacterByName(c, name))[0];

	// キャラが見つかったら
	if (character !== undefined) {
		return genHtml(character, name)
			+ serif.substring(name.length);
	}

	// 見つからなかったら --- 複数のキャラの発言時に A・B・C のように区切って記述する場合がある

	const separators =
		['・', '、', '&', '＆'];

	const htmls = separators.map(separator => {
		// セパレータで分割
		const names = name.split(separator);

		// 区切った中に空文字が含まれていたら(つまり、「、、」などの連続したセパレータが含まれていたら)、
		// それはキャラ名を区切るための表現ではないと判断し中断
		if (names.filter(x => x === '').length > 0) {
			return null;
		}

		if (names.length > 1) {
			let chars: ICharacter[] = [];

			// 区切った各キャラ名に対し合致するキャラを取得
			names.forEach(n => {
				const _char = allchars.filter(c => ascertainCharacterByName(c, n))[0];
				if (_char !== undefined) {
					chars.push(_char);
				} else {
					// 順序を保つためにキャラが見つからなかったら null をpush
					chars.push(null);
				}
			});

			if (chars.length !== 0) {
				let htmls: string[] = [];

				// 各キャラをハイライト
				chars.forEach((c, i) => {
					htmls.push(genHtml(c, names[i]));
				});

				// セパレータで再結合
				return htmls.join(separator)
					+ serif.substring(name.length);
			} else {
				return null;
			}
		} else {
			return null;
		}
	}).filter(result => result !== null);

	if (htmls.length !== 0) {
		return htmls[0];
	}

	// 見つからなかったら --- 複数のキャラの発言時に まどほむ のように繋げて記述する場合がある
	let tmpname = name;
	let highlight = '';
	let breakFlug = false;
	// キャラが埋まるまで検索
	while (tmpname !== '' && !breakFlug) {
		const before = highlight;
		allchars.forEach(c => {
			const charnames = [c.name, c.kana].concat(c.aliases);
			charnames.forEach(charname => {
				if (new RegExp(`^${charname}`).test(tmpname)) {
					highlight += genHtml(c, charname);
					tmpname = tmpname.substr(charname.length);
				}
			});
		});
		const after = highlight;

		// 検索前と検索後で結果が変わらなかったらこれ以上検索しても無駄なので打ち切る
		if (before === after) {
			breakFlug = true;
		}
	}

	// 文字列がキャラ名で埋まったら
	if (highlight !== '' && tmpname === '') {
		return highlight + serif.substring(name.length);
	}

	// 諦め
	return serif;
}

function genHtml(char: ICharacter, name: string): string {
	if (char !== null) {
		return `<span class=name title="${char.name} (${char.kana})" style="color:${char.color};">${name}</span>`;
	} else {
		return name;
	}
}
