import { ISSThread, ISSThreadPost } from '../db/interfaces';

/**
 * 投稿をフィルタリングします
 * @param ss スレッド
 * @param posts スレッドの投稿
 * @return フィルタリングされた投稿
 */
export default (ss: ISSThread, posts: ISSThreadPost[]): ISSThreadPost[] => {

	let dist: ISSThreadPost[] = [];

	// 本文内の安価リスト
	const masterAnchors: string[] = [];

	// 安価抽出
	posts
		// 本文のみ
		.filter(x => x.isMaster)
		.map(x => x.text)
		// SSのタイトル自体が安価している場合もある
		.concat(ss.title)
		// 安価っぽい文字列を抽出
		.map(x => x.match(/(>>|＞＞)(\d+)/g))
		// ゴミ除去
		.filter(x => x !== null)
		// 「>>」を除去
		.map(x => x.map(y => y.substr(2)))
		.forEach(x => x.forEach(y => {
			if (masterAnchors.indexOf(y) === -1) {
				masterAnchors.push(y);
			}
		}));

	const base = posts.filter(post => {
		// 本文
		if (post.isMaster) {
			return true;
		}

		// 本文から安価されてる投稿
		if (masterAnchors.indexOf(post.number.toString()) !== -1) {
			return true;
		}

		const likesCount = post.ratings.filter(x => x.rating === 'like').length;
		const dislikesCount = post.ratings.filter(x => x.rating === 'dislike').length;

		// Likeされた数がDislikeされた数よりも多かったら
		if (likesCount > dislikesCount) {
			return true;
		}

		return false;
	});

	// 参照コピーを防ぐ
	// See: http://hensa40.cutegirl.jp/archives/727
	dist = base.concat();

	base.forEach(post => {
		const text = post.text;

		if ( // 安価上
			text[0] === '上' ||
			text[0] === '↑' ||
			/安価(.*?)[上↑]/.test(text)
		) {
			const target = post.number - 1;
			dist.push(
				posts
				.filter(x => x.number === target)
				[0]);
		} else if ( // 安価下
			text[0] === '下' ||
			text[0] === '↓' ||
			/安価(.*?)[下↓]/.test(text)
		) {
			const target = post.number + 1;
			dist.push(
				posts
				.filter(x => x.number === target)
				[0]);
		}

		// 安価先がさらに安価してる場合があるため
		const anchors = text.match(/(>>|＞＞)(\d+)/g);
		if (anchors !== null) {
			anchors.forEach(anchor => {
				anchor = anchor.substr(2);

				posts
				.filter(x => x.number.toString() === anchor)
				.forEach(x => {
					dist.push(x);
				});
			});
		}
	});

	return dist
		// ゴミ除去
		.filter(x => x !== undefined)
		// 重複除去
		.filter((x, i, self) =>
			self
			.map(x => x.number)
			.indexOf(x.number) === i)
		// ソート
		.sort((a, b) =>
			(a.number < b.number) ? -1 : 1
		);
}
