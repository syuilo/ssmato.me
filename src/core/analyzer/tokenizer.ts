const assign = require('assign-deep');

import { IPost, ISeries, ICharacter } from './interfaces';
import { Token, IToken, ITextToken, IAnchorToken, ICharacterToken } from './token-types';
import extractNamePart from './extract-name-part-in-serif';
import extractAnchors from './extract-anchors';

import World from './world';

/**
 * キャラ名を複数記述するときの区切り文字の定義
 */
const separators =
	['・', '、', '&', '＆', ' '];

/**
 *
 * @param world World
 * @param ss SS
 * @return
 */
export default
	<T extends IPost & {
		isMaster: boolean;
	}>
	(
		world: World,
		posts: T[],
		series: ISeries[]
	): (T & {
		tokens: Token[]
	})[] => {

	const charMemos: any = {};

	// シリーズに登場するキャラクター
	const seriesChars = world.getAllSeriesCharacters(series);

	const parsers = {
		// === 安価 ===
		anchor: (text: string): IToken[] => {
			const anchorRegExpMatch = extractAnchors(text);

			if (anchorRegExpMatch !== null) {
				const anchor = anchorRegExpMatch[0];
				const anchorTarget = anchorRegExpMatch[1];

				const token = createAnchorToken(anchor, anchorTarget);
				return [token];
			} else {
				return null;
			}
		},

		// === セリフ ===
		serif: (text: string): IToken[] => {
			const part = extractNamePart(text);

			if (part === null) {
				return null;
			}

			// キャッシュがあればそれを利用(メモ化アルゴリズム)
			if (charMemos.hasOwnProperty(part)) {
				const cachedToken = charMemos[part];
				return cachedToken;
			}

			const matchChars = seriesChars
				.filter(c => match(c, part));

			// キャラが見つかったら
			if (matchChars.length !== 0) {
				const matchChar = matchChars[0];

				const token = createCharacterNameToken(part, matchChar);
				charMemos[part] = [token];
				return [token];
			}

			// === 複数のキャラの発言時に A・B・C のように区切って記述する場合がある ===

			const tokens: IToken[] = [];

			const separatorSome = separators.some(separator => {
				// セパレータで分割
				const names = part.split(separator);

				// 区切った中に空文字が含まれていたら(つまり、「、、」などの連続したセパレータが含まれていたら)、
				// それはキャラ名を区切るための表現ではないと判断し中断
				if (names.filter(x => x === '').length > 0) {
					return false;
				}

				if (names.length <= 1) {
					return false;
				}

				const chars: CharacterIdentity[] = [];

				// 区切った各キャラ名に対し合致するキャラを取得
				names.forEach(n => {
					const matchChars = seriesChars
						.map(c => identity(c, n))
						.filter(id => id !== null);

					if (matchChars.length !== 0) {
						const matchChar = matchChars[0];
						chars.push(matchChar);
					} else {
						// 順序を保つためにキャラが見つからなかったら null をpush
						chars.push(null);
					}
				});

				if (chars.length === 0) {
					return false;
				}

				// === 結果を出したら ===

				chars.forEach((id, i) => {
					const nameToken = createCharacterNameToken(id.name, id.character);
					tokens.push(nameToken);

					// 末尾の要素以外はセパレータを挿入
					if (i + 1 < chars.length) {
						const separatorToken = createTextToken(separator);
						tokens.push(separatorToken);
					}
				});

				return true;
			});

			// separatorの解析が成功したら終了
			if (separatorSome) {
				charMemos[part] = tokens;
				return tokens;
			}

			// === 複数のキャラの発言時に まどほむ のように繋げて記述する場合がある ===

			// ただしこの解析は計算量が多いため長い名前は断念する
			if (part.length > 32) {
				return null;
			}

			let chars: CharacterIdentity[] = [];
			let tmpname = part;

			// 文字列内をすべて探索
			for (let i = 1; i < tmpname.length + 1; i++) {
				let candidate: CharacterIdentity = null;

				// 最大の確かさを持つ候補を探索する
				/* Note:
				 * 例えば「あかねあかり」という入力が与えられた場合、最初から探索していくと
				 * まず(赤座 あかりとしての)「あか」が検出される可能性がある(赤座 あかね ではなくてという意味)
				 * その判定を採択すると、残りの入力は「ねあかり」となり、正しい判定ではなくなっていくというのが分かる。
				 * このように、単純に解析を行った結果、キャラクターの同定も間違っているし、区切り方も謝ってしまう。
				 * ─この問題を防ぐために、まず検出時に探索をすぐに打ち切るのではなく、
				 * 全ての可能性を検出して、その中で最も「確かな」解を選択すれば良い。
				 * ここで「確からしさ」の導出が鍵となるが、私は「検出した文字列の長さ」を「確からしさ」として採用した。
				 * そうすることで、「あかねあかり」の入力からまず「あか」と「あかね」が検出され、
				 * 一番長い文字列の解を選択するのであるから、「あかね」解が選択され、残りは「あかり」となり、
				 * 同様に「あかり」に対しても「あか」と「あかり」の候補が検出され、その中から「あかり」が採択されて、
				 * 最終的に「あかね」「あかり」だということが判断でき、正しい解釈を行うことができる。
				 * ─便宜上、このアルゴリズムを syuilo法 と名付けた。
				 * どのような手法にしろ、繋がった名前の解析時には、予め登場するキャラクターが全て把握出来ている必要があり、
				 * この集合から新たなアイデンティティを獲得するのは難しい。
				 * つまり、キャラクター抽出段階では、この対象を解析することは出来ない。
				 */
				for (let j = 1; j < tmpname.length + 1; j++) {
					const part = tmpname.substring(0, j);

					const matchedChars = seriesChars
						.filter(c => match(c, part));

					// キャラが１人見つかったら
					if (matchedChars.length === 1) {
						const matchedChar = matchedChars[0];
						// 候補にする
						candidate = new CharacterIdentity(matchedChar, part);
					}
					// キャラが複数人見つかったら
					else if (matchedChars.length > 1) {
						// TODO: 前後の文脈から判断などする(ただしその場合はキャッシュは使えない)
						const matchedChar = matchedChars[0];
						// 候補にする
						candidate = new CharacterIdentity(matchedChar, part);
					}
				}

				// 候補が見つからなかったらスキップ
				if (candidate === null) {
					continue;
				}

				// 既に同じアイデンティティが登録されていたらスキップ
				if (candidate.find(chars)) {
					continue;
				}

				// アイデンティティ追加
				chars.push(candidate);

				// 切り出し
				tmpname = tmpname.substring(candidate.name.length);

				// スキャナリセット
				i = 0;
			}

			// 埋まったら
			if (chars.map(id => id.name).join('') === part) {
				const tokens = chars.map(id =>
					createCharacterNameToken(id.name, id.character)
				);
				charMemos[part] = tokens;
				return tokens;
			}

			return null;
		}
	};

	return posts.map((post, i) => {
		const tokens: IToken[] = [];
		let buffer = post.text;

		if (buffer === '') {
			return assign(post, {
				tokens: [createTextToken('')]
			});
		}

		while (buffer !== '') {
			const anchorTokens = parsers.anchor(buffer);
			if (anchorTokens !== null) {
				anchorTokens.forEach(pushToken);
				continue;
			}

			if (series !== null && series.length > 0 && post.isMaster) {
				const serifNameTokens = parsers.serif(buffer);
				if (serifNameTokens !== null) {
					serifNameTokens.forEach(pushToken);
					continue;
				}
			}

			const token = createTextToken(buffer[0]);
			pushToken(token);

			function pushToken(token: IToken): void {
				tokens.push(token);
				buffer = buffer.substring(token.text.length);
			}
		}

		return assign(post, {
			tokens
		});
	});
}

function createTextToken(text: string): ITextToken {
	return {
		type: 'text',
		text: text
	};
}

function createAnchorToken(text: string, target: string): IAnchorToken {
	return {
		type: 'anchor',
		text: text,
		target: target
	};
}

function createCharacterNameToken(text: string, character: ICharacter): ICharacterToken {
	return {
		type: 'character-name',
		text: text,
		character: character
	};
}

/**
 * 対象のキャラクターがある名前で呼ばれているか否かを取得します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return bool
 */
function match(character: ICharacter, name: string): boolean {
	return identity(character, name) !== null;
}

/**
 * 対象のキャラクターと名前からアイデンティティを生成します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return CharacterIdentity
 */
function identity(character: ICharacter, name: string): CharacterIdentity {
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
	const numberId = test(/(\d|[０-９])+$/);
	if (numberId !== null) {
		return numberId;
	}

	// 乗算アイデンティティ
	/* e.g.
	 * 杏子×100
	 *
	 * 往々にして複数人に分裂したりする
	 */
	const timesId = test(/[×x]\d+$/);
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
		return character.name === query ||
			character.screenName === query ||
			removeSpaces(character.name) === query ||
			character.aliases.indexOf(query) !== -1;
	}

	function instantiation(id?: string): CharacterIdentity {
		if (id !== undefined) {
			return new CharacterIdentity(character, name, id);
		} else {
			return new CharacterIdentity(character, name);
		}
	}

	function removeSpaces(s: string): string {
		return s.replace(/\s/g, '');
	}
}

/**
 * キャラクターのアイデンティティを表します。
 * @class CharacterIdentity
 */
class CharacterIdentity {

	public character: ICharacter;
	public name: string;
	private id: string;

	constructor(character: ICharacter, name: string);
	constructor(character: ICharacter, name: string, id: string);
	constructor(character: ICharacter, name: string, id?: string) {
		this.character = character;
		this.name = name;

		if (id !== undefined) {
			this.id = id;
		} else {
			this.id = null;
		}
	}

	/**
	 * このキャラクター アイデンティティ インスタンスを表す文字列を取得します。
	 * @method CharacterIdentity#toString
	 * @return string
	 */
	public toString(): string {
		if (this.id !== null) {
			return this.character.id.toString() + this.id;
		} else {
			return this.character.id.toString();
		}
	}

	/**
	 * 与えられたアイデンティティの中に自分と同じアイデンティティがあるか取得します。
	 * @method CharacterIdentity#find
	 * @param identities アイデンティティの配列
	 * @return boolean
	 */
	public find(identities: CharacterIdentity[]): boolean {
		for (let i = 0; i < identities.length; i++) {
			const id = identities[i];
			if (id.toString() === this.toString()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 2つのアイデンティティ インスタンスが等しいか比較します。
	 * @method CharacterIdentity#equals
	 * @return boolean
	 */
	public equals(charIdentity: CharacterIdentity): boolean {
		return charIdentity.toString() === this.toString();
	}
}
