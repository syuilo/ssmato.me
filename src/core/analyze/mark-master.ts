import { Character } from '../../db/models';
import { ISSThread, ICharacter } from '../../db/interfaces';
import extractName from './extract-name-part-in-serif';
import ascertainCharacter from './ascertain-character-by-name';

/**
 * SS本文の投稿にisMasterフラグを付けます
 * [この関数を呼び出すには、SSのシリーズが確定している必要があります]
 * @param ss スレッド
 */
export default (ss: ISSThread): Promise<void> => new Promise<void>((resolve, reject) => {

	const ssseries = ss.populated('series') !== undefined
		? ss.populated('series') : ss.series;

	// Get all characters
	Character.find({
		series: { $in: ssseries }
	}, '_id name kana screenName aliases series',
	(err: any, allchars: ICharacter[]) => {
		if (err !== null) {
			return reject(err);
		}

		ss.posts.forEach(post => {
			post.isMaster = false;

			// >>1は問答無用で本文
			if (post.number === 1) {
				post.isMaster = true;
				return;
			}

			// >>1とIDが同じだったら本文とみて間違いない
			if (post.userId === ss.posts[0].userId) {
				post.isMaster = true;
				return;
			}

			// 「シリーズのキャラが登場するSS形式の投稿」かどうか
			//  ￣￣￣￣￣￣￣￣￣￣￣￣
			(<any>post).isSerifs = isSerifs(post.text);
		});

		const ownerIds: string[] = [ss.posts[0].userId];

		ss.posts.forEach(post => {
			// 本文と思われる投稿を3回以上しているユーザーはIDの変わった>>1(もしくは引き継ぎ)だと判断する
			if (ownerIds.indexOf(post.userId) === -1) {
				if (ss.posts.filter(x => (<any>x).isSerifs && x.userId === post.userId).length >= 3) {
					ownerIds.push(post.userId);
				}
			}
		});

		ss.posts.forEach(post => {
			// 再度スキャン
			if (ownerIds.indexOf(post.userId) !== -1) {
				post.isMaster = true;
			}
		});

		resolve();

		// 与えられたテキストが「シリーズのキャラが登場するSS形式の」文章であるかどうかを判定します。
		function isSerifs(text: string): boolean {
			const chars: ICharacter[] = [];

			text.split('\n').forEach(line => {
				const name = extractName(line);
				if (name !== null) {
					allchars.forEach(c => {
						if (ascertainCharacter(c, name)) {
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
