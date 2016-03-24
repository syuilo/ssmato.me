const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

import { ISeries, ICharacter, IPost } from './interfaces';

import CharacterIdentity from './character-identity';
import extractNamePartInSerif from './extract-name-part-in-serif';
import identity from './identity';

/**
 * 解析済みSSクラスです
 * @class SSContext
 */
export default class SSContext {

	public series: ISeries[] = null;

	public characters: (ICharacter & {
		onStageRatio: number;
	})[] = null;

	public posts: (IPost & {
		isMaster: boolean;
	})[] = null;

	private highlightCache: any = {};

	constructor();
	constructor(
		series?: ISeries[],
		characters?: (ICharacter & {
			onStageRatio: number;
		})[],
		posts?: (IPost & {
			isMaster: boolean;
		})[]
	) {
		if (series !== undefined) {
			this.series = series;
		}

		if (characters !== undefined) {
			this.characters = characters;
		}

		if (posts !== undefined) {
			this.posts = posts;
		}
	}

	/**
	 * SSのHTMLを生成します。
	 * @method SSContext#genHtml
	 * @return string
	 */
	public genHtml(): string[] {
		return this.posts.map((post, i) => {
			let html: string = entities.encode(post.text);

			// 安価
			html = html.replace(/&gt;&gt;(\d+)/g, '<span class=anchor data-target=$1>$&</span>');

			return html.split('\n').map((x, i) => {
				if (this.characters !== null && this.characters.length > 0 && post.isMaster) {
					x = this.analyzeLine(x);
				}
				return x;
			}).join('<br>');
		});
	}

	/**
	 * 台詞のキャラクタ名部分をハイライトします。
	 * @param allchars 登場キャラクター
	 * @param serif 台詞
	 * @return html
	 */
	private analyzeLine(serif: string): string {
		// 台詞の名前部分を抽出
		let name = extractNamePartInSerif(serif);

		if (name === null) {
			return serif;
		}

		name = entities.decode(name);

		serif = serif.trim();

		if (this.highlightCache.hasOwnProperty(name)) {
			const cache = this.highlightCache[name];
			if (cache === null) {
				return serif;
			} else {
				return cache + serif.substring(entities.encode(name).length);
			}
		}

		// 抽出した名前と思われる文字列に合致する呼び方のキャラクターを抽出
		const characterIdentity = this.characters
			.map(c => identity(c, name))
			.filter(x => x !== null)[0];

		// キャラが見つかったら
		if (characterIdentity !== undefined) {
			return this.highlight(characterIdentity.character, name)
				+ serif.substring(entities.encode(name).length);
		}

		// あまりにも長い名前は解析が困難なので中断
		if (name.length > 32) {
			this.highlightCache[name] = null;
			return serif;
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
					const _char = this.characters
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
							htmls.push(this.highlight(c.character, names[i]));
						} else {
							htmls.push(this.highlight(null, names[i]));
						}
					});

					// セパレータで再結合
					return htmls.join(separator)
						+ serif.substring(entities.encode(name).length);
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
		let highlightHtml = '';

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

				const characterIdentity = this.characters
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
					highlightHtml += this.highlight(candidate.character, candidate.name);

					// 切り出し
					tmpname = tmpname.substring(candidate.name.length);

					// スキャナリセット
					i = 0;
				}
			}
		}

		// 文字列がキャラ名で埋まったら
		if (highlightHtml !== '' && tmpname === '') {
			return highlightHtml + serif.substring(name.length);
		}

		// 諦め
		this.highlightCache[name] = null;
		return serif;
	}

	private highlight(char: ICharacter, name: string): string {
		let html: string;

		const _name = entities.encode(name);

		if (char !== null) {
			html = `<span class=name title="${char.name} (${char.kana})" style="color:${char.color};">${_name}</span>`;
		} else {
			html = _name;
		}

		this.highlightCache[name] = html;

		return html;
	}
}
