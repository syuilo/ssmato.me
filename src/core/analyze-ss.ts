import { ISSThread } from '../db/interfaces';
import detectSeries from './analyze/detect-series';
import extractCharacters from './analyze/analyze-characters-in-ss';
import weakMarkMaster from './analyze/weak-mark-master';
import markMaster from './analyze/mark-master';
import paindId from './analyze/paint-id';
import postHtmlConv from './post-html-conv';

/**
 * SSを解析し利用可能な状態にします
 * @param ss SS
 * @return ss
 */
export default (ss: ISSThread): Promise<ISSThread> => new Promise((resolve, reject) => {
	// ID色付け
	ss.posts.map(paindId);

	// 本文を判別
	/* Note:
	SSを(正確に)同定するには本文の投稿にマークする必要があり、
	本文の投稿を(正確に)マークするにはSSが同定されている必要があるという矛盾に陥るので、
	まずSSが同定されているという前提が必要ない「弱い」マークを実行してSSを同定した後に「強い」(正確な)マークを行えばよい
	*/
	weakMarkMaster(ss);
	ss.markModified('posts');

	// シリーズ同定
	detectSeries(ss).then(series => {
		ss.series = series !== null ? series : [];

		// シリーズが判らなかったら終了
		if (series === null) {
			ss.save((err: any, ss: ISSThread) => {
				if (err !== null) {
					reject(err);
				} else {
					resolve(ss);
				}
			});
			return;
		}

		// シリーズが判ったので「強い」mark-masterを実行できる
		markMaster(ss).then(() => {

			// 登場キャラクター抽出
			extractCharacters(ss).then(characterContexts => {
				const characters = characterContexts.map(c => c.character);

				ss.characters = characterContexts.map(c => {
					return {
						profile: c.character,
						onStageRatio: c.onStageRatio
					};
				});
				ss.markModified('characters');

				// HTML生成
				ss.posts.forEach(post => {
					post.html = postHtmlConv(characters, post);
				});

				ss.markModified('posts');

				ss.save((err: any, ss: ISSThread) => {
					if (err !== null) {
						console.error(err);
						reject(err);
					} else {
						resolve(ss);
					}
				});
			}, reject);
		}, reject);
	}, reject);
});
