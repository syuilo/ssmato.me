import { ISSThread, ISSThreadPost } from '../db/interfaces';

/**
 * 投稿をフィルタリングします
 * @param ss スレッド
 * @param filterMode フィルターモード
 * @return 投稿がフィルタリングされたSS
 */
export default (ss: ISSThread, filterMode: string): ISSThreadPost[] => {
	let returns: ISSThreadPost[];
	switch (filterMode) {
		case 'auto':
			returns = ss.posts.filter(post => post.isMaster || post.isAnchor);
			break;
		case 'master':
			returns = ss.posts.filter(post => post.isMaster);
			break;
		case 'none':
			returns = ss.posts;
			break;
		default:
			returns = ss.posts;
			break;
	}
	return returns;
}
