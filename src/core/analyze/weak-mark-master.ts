import { ISSThread } from '../../db/interfaces';

/**
 * SS本文の投稿にisMasterフラグを付けます
 * (SSのシリーズが確定しているという前提が必要ない「弱い」バージョンです)
 * @param ss スレッド
 */
export default (ss: ISSThread): void => {
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

		// IDが違っても「SS形式の投稿」なら本文の可能性がそれなりに高い
		if (isSerifs(post.text)) {
			post.isMaster = true;
			return;
		}
	});
}

function isSerifs(text: string): boolean {
	// キャラの台詞と思われる行が5つ以上あったらtrue
	return text
		.split('\n')
		.filter(line => /^(.+?)[「｢『（\(](.+)$/.test(line))
		.length >= 5;
}
