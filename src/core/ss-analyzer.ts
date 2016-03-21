//////////////////////////////////////////////////
// Syuilo SS Analyzer
//////////////////////////////////////////////////

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 syuilo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as seedrandom from 'seedrandom';
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

import { Series, Character } from '../db/models';
import { ISeries, ICharacter } from '../db/interfaces';

interface IPost {
	number: number;
	text: string;
	userId: string;
}

interface IPaintedPost extends IPost {
	backgroundColor: boolean;
	foregroundColor: boolean;
}

interface IMarkedPost extends IPost {
	isMaster: boolean;
}

/**
 * SSの解析を司るクラスです。
 * @class SSAnalyzer
 */
export default class SSAnalyzer {
	public title: string;
	public posts: IPost[];

	constructor(title: string, posts: IPost[]) {
		this.title = title;
		this.posts = posts;
	}

	/**
	 * SSを解析しSSContextを取得します。
	 * @method SSAnalyzer#analyze
	 * @return SSContext
	 */
	public analyze(): Promise<SSContext> {
		return new Promise((resolve, reject) => {
			const context = new SSContext();

			// IDの背景色と文字色を決定
			const posts1 = this.posts.map(post => {
				const colors = paint(post.userId);
				return Object.assign({}, post, {
					backgroundColor: colors[0],
					foregroundColor: colors[1]
				});
			});

			// 本文を判別
			/* Note:
			 * SSを(正確に)同定するには本文の投稿にマークする必要があり、
			 * 本文の投稿を(正確に)マークするにはSSが同定されている必要があるという矛盾に陥るので、
			 * まずSSが同定されているという前提が必要ない「弱い」マークを実行してSSを同定した後に「強い」(正確な)マークを行えばよい
			 */
			const posts2 = this.weakMarkMaster(posts1);

			context.posts = posts2;

			this.detectSeries(posts2).then(series => {
				context.series = series;

				// シリーズが判らなかったら終了
				if (series === null) {
					return resolve(context);
				}

				// シリーズが判ったので「強い」mark-masterを実行できる
				this.strongMarkMaster(posts2, series).then(posts3 => {

					context.posts = posts3;

					// 登場キャラクター抽出
					this.extractCharacters(posts3, series).then(characterContexts => {
						const characters = characterContexts.map(c => c.character);

						context.characters = characters;

						resolve(context);
					}, reject);
				});
			}, reject);
		});
	}

	/**
	 * スレッドタイトル内の括弧(とその中のテキスト)を除去します。
	 * @method SSAnalyzer#getPlainTitle
	 * @return 括弧が削除されたタイトル
	 */
	public getPlainTitle(): string {
		return this.title.replace(/【.+?】/, '');
	}

	/**
	 * SSに登場するキャラクター名をすべて抽出します
	 * @method SSAnalyzer#extractCharacterNames
	 * @param posts マーク済み投稿の配列
	 * @return キャラクター名の配列
	 */
	public extractCharacterNames(posts: IMarkedPost[]): string[] {
		return extractCharacterNamesInText(

			// 本文だけ
			posts
			.filter(x => x.isMaster)
			.map(x => x.text)

			// キャラクター名がタイトルに含まれている場合が多い
			// 【安価】のようにタイトルは装飾されていることも多いので非装飾化
			.concat(this.getPlainTitle()));
	}

	/**
	 * 対象のSSに登場するキャラクターとその割合を抽出します
	 * @method SSAnalyzer#extractCharacters
	 * @param posts マーク済み投稿の配列
	 * @param series シリーズ
	 * @return キャラクター情報と登場の割合を含むオブジェクトの配列
	 */
	public extractCharacters(posts: IMarkedPost[], series: ISeries[]): Promise<{
		character: ICharacter;
		onStageRatio: number;
	}[]>  {
		return new Promise((resolve, reject) => {
			// シリーズに登場するキャラクターをすべて取得
			Character.find({
				series: { $in: series }
			},
			'_id name kana screenName aliases color',
			(err: any, allchars: ICharacter[]) => {

				const foundCharacters =
					// 登場するすべてのキャラクターの名前と思われる文字列を取得
					this.extractCharacterNames(posts)
					// その名前(と思われる文字列)で呼ばれているシリーズ内のキャラクターを取得
					.map(name => allchars.filter(char => ascertainCharacterByName(char, name)))
					// 上の過程で発生した空配列(キャラクターが見つからなかった場合 filter に合致せず[]が返るため)を除去
					.filter(char => char.length === 1)
					// 上の上でfilter使ったせいでキャラクターが配列に入った状態なので取り出す
					.map(char => char[0]);

				// すべてのキャラの登場回数
				const allCount = foundCharacters.length;

				// 重複したキャラクターを除去
				const uniqueFoundChars =
					foundCharacters
					.filter((x, i, self) =>
						self.map(x => x.id).indexOf(x.id) === i);

				const returns = uniqueFoundChars.map(char => {
					// このキャラが何回登場したか
					const onStageCount =
						foundCharacters.filter(x => x.id.toString() === char.id.toString()).length;

					// このキャラの登場の割合は、(このキャラの登場回数 / すべてのキャラの登場回数) で求める
					const onStageRatio = onStageCount / allCount;

					return {
						character: char,
						onStageRatio: onStageRatio
					};
				})
				// 登場頻度で降順ソート
				.sort((a, b) => {
					if (a.onStageRatio > b.onStageRatio) {
						return -1;
					} else if (a.onStageRatio < b.onStageRatio) {
						return 1;
					} else {
						return 0;
					}
				});

				resolve(returns);
			});
		});
	}

	/**
	 * 本文と思われる投稿をマークします(弱)
	 * @method SSAnalyzer#weakMarkMaster
	 * @param posts 投稿の配列
	 * @return マーク情報が付加された投稿の配列
	 */
	public weakMarkMaster(posts: IPost[]): IMarkedPost[] {
		return posts.map(post => {
			let isMaster = false;

			// >>1は問答無用で本文
			if (post.number === 1) {
				isMaster = true;
				return;
			}

			// >>1とIDが同じだったら本文とみて間違いない
			if (post.userId === this.posts[0].userId) {
				isMaster = true;
				return;
			}

			// IDが違っても「SS形式の投稿」なら本文の可能性がそれなりに高い
			if (isSerifs(post.text)) {
				isMaster = true;
				return;
			}

			return Object.assign({}, post, {
				isMaster: isMaster
			});
		});

		function isSerifs(text: string): boolean {
			// キャラの台詞と思われる行が5つ以上あったらtrue
			return text
				.split('\n')
				.filter(line => /^(.+?)[「｢『（\(](.+)$/.test(line))
				.length >= 5;
		}
	}

	/**
	 * 本文と思われる投稿をマークします(強)
	 * @method SSAnalyzer#strongMarkMaster
	 * @param posts 投稿の配列
	 * @param series シリーズ
	 * @return マーク情報が付加された投稿の配列
	 */
	public strongMarkMaster(posts: IPost[], series: ISeries[]): Promise<IMarkedPost[]> {
		const returns: IMarkedPost[] = posts.map(post => {
			return Object.assign({}, post, {
				isMaster: null
			});
		});

		return new Promise((resolve, reject) => {
			// シリーズに登場するすべてのキャラクターを取得
			Character.find({
				series: { $in: series }
			}, '_id name kana screenName aliases series',
			(err: any, allchars: ICharacter[]) => {
				if (err !== null) {
					return reject(err);
				}

				returns.forEach(post => {
					post.isMaster = false;

					// >>1は問答無用で本文
					if (post.number === 1) {
						post.isMaster = true;
						return;
					}

					// >>1とIDが同じだったら本文とみて間違いない
					if (post.userId === posts[0].userId) {
						post.isMaster = true;
						return;
					}

					// 「シリーズのキャラが登場するSS形式の投稿」かどうか
					//  ￣￣￣￣￣￣￣￣￣￣￣￣￣
					(<any>post).isSerifs = isSerifs(post.text);
				});

				const ownerIds: string[] = [posts[0].userId];

				returns.forEach(post => {
					// SSの文と思われる投稿を3回以上しているユーザーはIDの変わった>>1(もしくは引き継ぎ)だと判断する
					if (ownerIds.indexOf(post.userId) === -1) {
						const textsCount = returns
							.filter(x => (<any>x).isSerifs && x.userId === post.userId).length;

						if (textsCount >= 3) {
							ownerIds.push(post.userId);
						}
					}
				});

				returns.forEach(post => {
					// 再度スキャン
					if (ownerIds.indexOf(post.userId) !== -1) {
						post.isMaster = true;
					}
				});

				returns.forEach(post => {
					delete (<any>post).isSerifs;
				});

				resolve(returns);

				// 与えられたテキストが「シリーズのキャラが登場するSS形式の」文章であるかどうかを判定します。
				function isSerifs(text: string): boolean {
					const chars: ICharacter[] = [];

					text.split('\n').forEach(line => {
						const name = extractNamePartInSerif(line);
						if (name !== null) {
							allchars.forEach(c => {
								if (ascertainCharacterByName(c, name)) {
									chars.push(c);
								}
							});
						}
					});

					// 登場したキャラが5人以上(同じキャラでも可)の場合
					return chars.length >= 5;
				}
			});
		});
	}

	/**
	 * SSのシリーズを同定します
	 * @method SSAnalyzer#detectSeries
	 * @param posts マーク済み投稿の配列
	 * @return 同定されたシリーズ
	 */
	public detectSeries(posts: IMarkedPost[]): Promise<ISeries[]> {
		return new Promise((resolve, reject) => {
			Promise.all([
				// Get all series
				Series.find({}, '_id title kana aliases'),
				// Get all characters
				Character.find({}, '_id name kana screenName aliases series')
			]).then((results: any) => {
				const allseries = <ISeries[]>results[0];
				const allchars = <ICharacter[]>results[1];

				// タイトル内の【】内の文字列
				const textInBracketsMatch = this.title.match(/【(.+?)】/g);
				const textInBrackets = textInBracketsMatch === null ? null : textInBracketsMatch
					.map(x => x.trim())
					.map(x => x.substr(1, x.length - 2));

				// 【】内の文字列に一致するシリーズを探す
				const seriesInTitle =
					textInBrackets === null
						? null
						: allseries
							.filter(series =>
								textInBrackets.map(text =>
									ascertainSeries(series, text)
								).indexOf(true) !== -1)
							[0];

				// クロスSSかどうか
				const isCross = this.isCross();

				// SS内に登場するすべてのキャラクター名(と思われる文字列)を抽出
				const extractedNames = this.extractCharacterNames(posts)
					// 重複は除去
					.filter((x, i, self) => self.indexOf(x) === i);

				// 登場頻度ランキング
				let chart: any[] = [];

				allchars.forEach(char => {
					(<string[]>char.series).forEach(charSeries => {
						// ランキング内のシリーズコンテキストを取得
						let seriesContext = chart.filter(x => x.series === charSeries.toString())[0];

						// ランキングにシリーズがまだ登録されてなかったら登録
						if (seriesContext === undefined) {
							const i = chart.push({
								series: charSeries.toString(),
								found: []
							});
							seriesContext = chart[i - 1];
						}

						// キャラがこのSSに登場したらそのキャラのシリーズに+1
						extractedNames.forEach(name => {
							if (ascertainCharacterByName(char, name)) {
								// 同じキャラの複数登場よるn重+1防止
								if (seriesContext.found.indexOf(char.id) === -1) {
									seriesContext.found.push(char.id);
								}
							}
						});
					});
				});

				// 見つかったキャラクターの多さでソート
				chart.sort((a, b) => a.found.length > b.found.length ? -1 : 1);

				// シリーズが見つかったら
				if (chart[0].found.length > 0) {
					// クロスオーバーかつ第二候補も見つかったら
					if (isCross && chart[1].found.length > 0) {
						Series.find({
							_id: { $in: [chart[0].series, chart[1].series] }
						}, (err: any, series: ISeries[]) => {
							if (err !== null) {
								reject(err);
							} else {
								resolve(series);
							}
						});
					}
					// それ以外は最有力候補をシリーズとして断定
					else {
						Series.findById(chart[0].series, (err: any, series: ISeries) => {
							if (err !== null) {
								reject(err);
							} else {
								resolve([series]);
							}
						});
					}
				// SS内からシリーズを判断できないかつSSタイトルでシリーズを推定出来ていた場合
				} else if (seriesInTitle !== null) {
					resolve([seriesInTitle]);
				}
				// 該当なし(同定失敗)
				else {
					resolve(null);
				}
			}, reject);
		});
	}

	/**
	 * クロスオーバーであるかどうかを取得します。
	 * @method SSAnalyzer#isCross
	 * @return bool
	 */
	public isCross(): boolean {
		return find(this.title, '【クロス', 'クロス】') || find(this.posts[0].text, 'クロス');

		function find(target: string, ...xs: string[]): boolean {
			for (let i = 0; i < xs.length; i++) {
				const x = xs[i];
				if (target.indexOf(x) > -1) {
					return true;
				}
			}

			return false;
		}
	}
}

/**
 * 解析済みSSクラスです
 * @class SSContext
 */
class SSContext {
	public series: ISeries[];
	public characters: ICharacter[];

	public posts: IMarkedPost[];

	/**
	 * SSのHTMLを生成します。
	 * @method SSContext#genHtml
	 * @return string
	 */
	public genHtml(): string[] {
		return this.posts.map(post => {
			let html: string = entities.encode(post.text);

			// 安価
			html = html.replace(/&gt;&gt;(\d+)/g, '<span class=anchor data-target=$1>$&</span>');

			return html.split('\n').map(x => {
				if (this.characters !== null && this.characters.length > 0 && post.isMaster) {
					x = this.highlight(x);
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
	private highlight(serif: string): string {
		// 台詞の名前部分を抽出
		let name = extractNamePartInSerif(serif);

		if (name === null) {
			return serif;
		}

		name = entities.decode(name);

		serif = serif.trim();

		// 抽出した名前と思われる文字列に合致する呼び方のキャラクターを抽出
		const characterIdentity = this.characters
			.map(c => identity(c, name))
			.filter(x => x !== null)[0];

		// キャラが見つかったら
		if (characterIdentity !== undefined) {
			return genHtml(characterIdentity.character, name)
				+ serif.substring(entities.encode(name).length);
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
							htmls.push(genHtml(c.character, names[i]));
						} else {
							htmls.push(genHtml(null, names[i]));
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
		let highlight = '';

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
					highlight += genHtml(candidate.character, candidate.name);

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

		function genHtml(char: ICharacter, name: string): string {
			name = entities.encode(name);

			if (char !== null) {
				return `<span class=name title="${char.name} (${char.kana})" style="color:${char.color};">${name}</span>`;
			} else {
				return name;
			}
		}
	}
}

/**
 * キャラクターのアイデンティティを表します。
 * @class CharacterIdentity
 */
class CharacterIdentity {
	/* Note:
	 * 単に「ID(アイディー)」と呼ぶとデータベースのインデックスとしてのIDと紛らわしくなるので アイデンティティ と呼びます。
	 */

	public character: ICharacter;
	public id: string;
	public name: string;

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

/**
 * 対象のキャラクターと名前からアイデンティティを生成します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return CharacterIdentity
 */
function identity(character: ICharacter, name: string): CharacterIdentity {
	// 完全一致
	if (inquiry(name)) {
		return genId();
	}

	// 括弧付きアイデンティティ
	const bracketsId = test(/[（\(].+?[）\)]/);
	if (bracketsId !== null) {
		return bracketsId;
	}

	// 数字付きアイデンティティ
	const numberId = test(/\d+$/);
	if (numberId !== null) {
		return numberId;
	}

	// 乗算アイデンティティ
	const timesId = test(/[×]\d+$/);
	if (timesId !== null) {
		return timesId;
	}

	// アルファベット付きアイデンティティ
	const aluphabetId = test(/[a-zA-Z]+$/);
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

		if (inquiry(name.replace(reg, ''))) {
			return genId(id);
		} else {
			return null;
		}
	}

	function inquiry(query: string): boolean {
		return character.name === query ||
			character.screenName === query ||
			removeWhiteSpaces(character.name) === query ||
			character.aliases.indexOf(query) !== -1;
	}

	function genId(id?: string): CharacterIdentity {
		if (id !== undefined) {
			return new CharacterIdentity(character, name, id);
		} else {
			return new CharacterIdentity(character, name);
		}
	}

	function removeWhiteSpaces(s: string): string {
		return s.replace(/\s/g, '');
	}
}

/**
 * 対象のシリーズがある名前で呼ばれているか否かを取得します。
 * @param series 対象のシリーズ
 * @param title 名前
 * @return bool
 */
function ascertainSeries(series: ISeries, title: string): boolean {
	return series.title === title || series.aliases.indexOf(title) !== -1;
}

/**
 * 対象のキャラクターがある名前で呼ばれているか否かを取得します。
 * @param character 対象のキャラクター
 * @param name 名前
 * @return bool
 */
function ascertainCharacterByName(character: ICharacter, name: string): boolean {
	return identity(character, name) !== null;
}

/**
 * セリフ行の中のキャラクター名部分を抽出します
 * @param serif セリフ
 * @return キャラクター名部分
 */
function extractNamePartInSerif(serif: string): string {
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

/**
 * テキストの中のキャラクター名をすべて抽出します
 * @param text テキスト
 * @return キャラクター名の配列
 */
function extractCharacterNamesInText(text: string | string[]): string[] {
	const texts = typeof text === 'string' ? [text] : text;

	let characters: string[] = [];

	texts.forEach(text => {
		text.split('\n').forEach(x => {
			const name = extractNamePartInSerif(x);
			if (name !== null) {
				characters.push(name);
			}
		});
	});

	return characters;
}

/**
 * 文字列シードに基づいたランダムな背景色と文字色のセットを生成します
 * @param seed シード
 * @return 0番目に背景色、1番目に文字列が格納された配列
 */
function paint(seed: string): string[] {
	// 各チャンネルの重み
	const rWeight = 0.298912;
	const gWeight = 0.586611;
	const bWeight = 0.114478;

	// Init randomizer
	const random = seedrandom(seed);

	// 各チャンネルをランダムに決定
	const r = Math.floor(random() * 255);
	const g = Math.floor(random() * 255);
	const b = Math.floor(random() * 255);

	// 輝度(重み付き)
	const luminance = Math.floor(
		rWeight * r + gWeight * g + bWeight * b);

	// 16進数に変換
	const rHex1 = r.toString(16);
	const gHex1 = g.toString(16);
	const bHex1 = b.toString(16);

	// 0埋め
	const rHex2 = `0${rHex1}`.slice(-2);
	const gHex2 = `0${gHex1}`.slice(-2);
	const bHex2 = `0${bHex1}`.slice(-2);

	// フォーマット
	const background = `#${rHex2}${gHex2}${bHex2}`;
	const foreground = luminance > 180 ? '#000' : '#fff';

	return [background, foreground];
}
