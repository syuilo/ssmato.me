const assign = require('assign-deep');

import { IPost } from './interfaces';

const tripSymbol: string = '◆';

/**
 * 投稿に投稿のトリップ情報を付加します
 * @param post 投稿
 * @return トリップ情報が付加された投稿
 */
export default
	<T extends IPost>
	(post: T):
	T & {
		user: {
			trip: string;
		}
	} => {

	let trip: string;

	if (post.user.name.indexOf(tripSymbol) !== -1) {
		trip = post.user.name.split(tripSymbol)[1];
	} else {
		trip = null;
	}

	return assign(post, {
		user: {
			trip: trip
		}
	});
}
