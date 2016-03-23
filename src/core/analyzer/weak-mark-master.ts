import { IPost } from './interfaces';

/**
 * 本文と思われる投稿をマークします(弱)
 * @param posts 投稿の配列
 * @return マーク情報が付加された投稿の配列
 */
export default
	<T extends IPost & {
		user: {
			trip: string
		}
	}>
	(posts: T[]):
	(T & {
		isMaster: boolean
	})[] => {

	return posts.map((post, i) => {
		let isMaster = false;

		// >>1は問答無用で本文
		if (post.number === 1) {
			isMaster = true;
			return;
		}

		// >>1とIDが同じだったら本文とみて間違いない
		if (post.user.id === posts[0].user.id) {
			isMaster = true;
			return;
		}

		// トリップ
		if (post.user.trip === posts[0].user.trip) {
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