const assign = require('assign-deep');

import { ISS, IPost } from './interfaces';

/**
 * 投稿の被安価投稿をマークします
 * @param ss スレッド
 * @param posts スレッドの投稿
 * @return マーク情報が付加された投稿の配列
 */
export default
	<T extends IPost & {
		isMaster: boolean
	}>
	(ss: ISS, posts: T[]):
	(T & {
		isAnchor: boolean
	})[] => {

	// 本文内の安価リスト
	const masterAnchors: string[] = [];

	// 安価抽出
	posts
		// 本文のみ
		.filter(x => x.isMaster)
		.filter(x => x.text !== '')
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

	const marked = <(T & {
		isAnchor: boolean;
	})[]>posts.map(post => {
		let isAnchor = false;

		// 本文から安価されている投稿
		if (masterAnchors.indexOf(post.number.toString()) !== -1) {
			isAnchor = true;
		}

		return assign(post, {
			isAnchor: isAnchor
		});
	});

	marked.forEach(post => {
		const text = post.text;

		if (text === '') {
			return;
		}

		if ( // 安価上
			text[0] === '上' ||
			text[0] === '↑' ||
			/安価(.*?)[上↑]/.test(text)
		) {
			const _target = marked
				.filter(x => x.number === post.number - 1);
			if (_target.length !== 0) {
				const target = _target[0];
				target.isAnchor = true;
			}
		} else if ( // 安価下
			text[0] === '下' ||
			text[0] === '↓' ||
			/安価(.*?)[下↓]/.test(text)
		) {
			const _target = marked
				.filter(x => x.number === post.number + 1);
			if (_target.length !== 0) {
				const target = _target[0];
				target.isAnchor = true;
			}
		}

		// 安価先がさらに安価してる場合があるため
		const anchors = text.match(/(>>|＞＞)(\d+)/g);

		if (anchors === null) {
			return;
		}

		anchors.forEach(anchor => {
			anchor = anchor.substr(2);

			marked
			.filter(x => x.number.toString() === anchor)
			.forEach(x => {
				x.isAnchor = true;
			});
		});
	});

	return marked;
}
