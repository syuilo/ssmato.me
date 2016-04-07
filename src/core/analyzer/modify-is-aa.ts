const assign = require('assign-deep');

import { IPost } from './interfaces';

/**
 * アスキーアートであるかどうかを判定します
 * @param post 投稿
 * @return 判定情報が付加された投稿
 */
export default
	<T extends IPost>
	(post: T):
	T & {
		isAA: boolean
	} => {

	let isAA: boolean;

	// 空行が4行以上存在したら
	const brankLinesCount = (post.text.match(/\n\n/g) || []).length;
	if (brankLinesCount >= 4) {
		isAA = false;
	}

	// スペースが256個以上あったら
	const spacesCount = (post.text.match(/ |　/g) || []).length;
	if (spacesCount >= 256) {
		isAA = true;
	} else {
		isAA = false;
	}

	return assign(post, {
		isAA: isAA
	});
}
