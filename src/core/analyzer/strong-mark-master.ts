import { Character } from '../../db/models';
import { ISeries, ICharacter } from '../../db/interfaces';

import { IPost, IUser } from './interfaces';

import extractNamePartInSerif from './extract-name-part-in-serif';
import askCharacter from './ask-character';

/**
 * 本文と思われる投稿をマークします(強)
 * @param posts 投稿の配列
 * @param series シリーズ
 * @return マーク情報が付加された投稿の配列
 */
export default
	<T extends IPost>
	(
		posts: (T & {
			user: {
				trip: string
			}
		})[],
		series: ISeries[]
	):
	Promise<(
		T & {
			isMaster: boolean
		}
	)[]> => new Promise((resolve, reject) => {

	// シリーズに登場するすべてのキャラクターを取得
	Character.find({
		series: { $in: series }
	}, '_id name kana screenName aliases series',
	(err: any, allchars: ICharacter[]) => {
		if (err !== null) {
			return reject(err);
		}

		// 「シリーズのキャラが登場するSS形式の投稿」かどうか
		//  ￣￣￣￣￣￣￣￣￣￣￣￣￣
		const isSerifses = posts.map(post => {
			return {
				isSerifs: isSerifs(post.text),
				user: post.user
			};
		});

		const masters: (IUser & { trip: string; })[] = [];

		posts.forEach((post, i) => {
			const user = post.user;

			if (masters.filter(x => x.id === user.id).length === 0) {
				// >>1はオーナー
				if (post.number === 1) {
					masters.push(user);
					return;
				}

				// トリップ
				if (masters.filter(x => x.trip === user.trip).length !== 0) {
					masters.push(user);
					return;
				}

				// SSの文と思われる投稿を3回以上しているユーザーはIDの変わった>>1(もしくは引き継ぎ)だと判断する
				const textsCount =
					isSerifses
					.filter(x => x.isSerifs && x.user.id === user.id)
					.length;

				if (textsCount >= 3) {
					masters.push(user);
				}
			}
		});

		// スキャン
		const returns = posts.map(post => {
			return Object.assign({}, post, {
				isMaster: (masters.filter(x => x.id === post.user.id).length !== 0)
			});
		});

		resolve(returns);

		// 与えられたテキストが「シリーズのキャラが登場するSS形式の」文章であるかどうかを判定します。
		function isSerifs(text: string): boolean {
			const chars: ICharacter[] = [];

			text.split('\n').forEach(line => {
				const name = extractNamePartInSerif(line);
				if (name !== null) {
					allchars.forEach(c => {
						if (askCharacter(c, name)) {
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
