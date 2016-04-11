const assign = require('assign-deep');

import { ISS, IPost } from './interfaces';
import { Token, IAnchorToken } from './token-types';

/**
 * 投稿の被安価投稿をマークします
 * @param ss スレッド
 * @param posts スレッドの投稿
 * @return マーク情報が付加された投稿の配列
 */
export default
	<T extends IPost & {
		isMaster: boolean;
		tokens: Token[]
	}>
	(ss: ISS, posts: T[]):
	(T & {
		isAnchor: boolean
	})[] => {

	// 本文内の安価リスト
	const anchors: number[] = [];

	posts.filter(p => p.isMaster).forEach(p => {
		p.tokens.filter(t => t.type === 'anchor').forEach((a: IAnchorToken) => {
			const targets = analyzeAnchor(a.target);
			targets.forEach(anchors.push);
		});
	});

	const titileMatch = ss.title.match(/(>>|＞＞)(\d+)/g);

	if (titileMatch !== null) {
		titileMatch.forEach(a => anchors.push(a.substr(2)));
	}

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

function analyzeAnchor(anchor: string): number[] {
	if (/^\d+$/.test(anchor)) {
		return [parseInt(anchor, 10)];
	} else {
		return null;
	}

	// TODO: >>10~20 や >>10,20 などに対応
/*
	function range(start: number, stop: number, step: number): number[] {
		if (arguments.length <= 1) {
			stop = start || 0;
			start = 0;
		}
		step = step || 1;

		const length = Math.max(Math.ceil((stop - start) / step), 0);
		const range = Array(length);

		for (let idx = 0; idx < length; idx++, start += step) {
			range[idx] = start;
		}

		return range;
	}*/
}
