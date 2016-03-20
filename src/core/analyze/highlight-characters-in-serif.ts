const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

import { ICharacter } from '../../db/interfaces';
import extractName from './extract-name-part-in-serif';
import CharacterIdentity from './character-identity';
import identity from './identity';
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
	let name = extractName(serif);

	if (name === null) {
		return serif;
	}

	name = entities.decode(name);

	serif = serif.trim();

	// 抽出した名前と思われる文字列に合致する呼び方のキャラクターを抽出
	const characterIdentity = allchars
		.map(c => identity(c, name))
		.filter(x => x !== null)[0];

	// キャラが見つかったら
	if (characterIdentity !== undefined) {
		return genHtml(characterIdentity.character, name)
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
			let chars: CharacterIdentity[] = [];

			// 区切った各キャラ名に対し合致するキャラを取得
			names.forEach(n => {
				const _char = allchars
					.map(c => identity(c, n))
					.filter(x => x !== null)[0];

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
					if (c !== null) {
						htmls.push(genHtml(c.character, names[i]));
					} else {
						htmls.push(genHtml(null, names[i]));
					}
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
	let ids: CharacterIdentity[] = [];
	let tmpname = name;
	let highlight = '';

	for (let i = 1; i < tmpname.length + 1; i++) {
		let candidate: CharacterIdentity = null;

		for (let j = 1; j < tmpname.length + 1; j++) {
			const part = tmpname.substring(0, j);

			const characterIdentity = allchars
				.map(c => identity(c, part))
				.filter(x => x !== null)[0];

			// キャラが見つかったら
			if (characterIdentity !== undefined) {
				// 候補にする
				candidate = characterIdentity;
			}
		}

		// 候補が見つかったら
		if (candidate !== null) {
			// 既に同じアイデンティティが登録されていなかったら
			if (!candidate.find(ids)) {
				// アイデンティティ追加
				ids.push(candidate);

				// ハイライト
				highlight += genHtml(candidate.character, tmpname.substring(0, candidate.name.length));

				// 切り出し
				tmpname = tmpname.substring(candidate.name.length);

				// スキャナリセット
				i = 0;
			}
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
	name = entities.encode(name);

	if (char !== null) {
		return `<span class=name title="${char.name} (${char.kana})" style="color:${char.color};">${name}</span>`;
	} else {
		return name;
	}
}
