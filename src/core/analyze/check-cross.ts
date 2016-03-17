import { ISSThread } from '../../db/interfaces';

/**
 * 対象のSSがクロスオーバーであるかどうかを取得します。
 * @param ss SS
 * @return bool
 */
export default (ss: ISSThread): boolean => {
	return find(ss.title, '【クロス', 'クロス】') || find(ss.posts[0].text, 'クロス');
}

function find(target: string, ...xs: string[]): boolean {
	for (let i = 0; i < xs.length; i++) {
		const x = xs[i];
		if (target.indexOf(x) > -1) {
			return true;
		}
	}

	return false;
}
