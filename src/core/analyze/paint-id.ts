import * as seedrandom from 'seedrandom';
import { ISSThreadPost } from '../../db/interfaces';

// 各チャンネルの重み
const rWeight = 0.298912;
const gWeight = 0.586611;
const bWeight = 0.114478;

/**
 * SSのレスのユーザーIDに色付けします
 * @param post レス
 */
export default (post: ISSThreadPost): void => {
	// Init randomizer
	const random = seedrandom(post.userId);

	// 各チャンネルをランダムに決定
	const r = Math.floor(random() * 255);
	const g = Math.floor(random() * 255);
	const b = Math.floor(random() * 255);

	// 輝度(重み付き)
	const luminance = Math.floor(
		rWeight * r + gWeight * g + bWeight * b);

	// 16新数に変換
	const rHex1 = r.toString(16);
	const gHex1 = g.toString(16);
	const bHex1 = b.toString(16);

	// 0埋め
	const rHex2 = `0${rHex1}`.slice(-2);
	const gHex2 = `0${gHex1}`.slice(-2);
	const bHex2 = `0${bHex1}`.slice(-2);

	// フォーマット
	const background = `#${rHex2}${gHex2}${bHex2}`;
	const foreground = luminance > 180 ? '#000' : '#fff';

	post.userIdBackgroundColor = background;
	post.userIdForegroundColor = foreground;
}
