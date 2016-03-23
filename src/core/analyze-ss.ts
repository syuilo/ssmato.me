import { ISSThread } from '../db/interfaces';
import analyze from './analyzer/analyze';

/**
 * SSを解析し利用可能な状態にします
 * @param ss SS
 * @return ss
 */
export default (ss: ISSThread): Promise<ISSThread> => new Promise((resolve, reject) => {
	analyze({
		title: ss.title,
		posts: ss.posts.map(post => {
			return {
				text: post.text,
				number: post.number,
				user: {
					id: post.userId,
					name: post.userName
				}
			};
		})
	}).then(context => {

		// HTML生成
		ss.posts.forEach(post => {
			post.html = postHtmlConv(characters, post);
		});

		ss.markModified('posts');
		ss.markModified('characters');

		ss.save((err: any, ss: ISSThread) => {
			if (err !== null) {
				console.error(err);
				reject(err);
			} else {
				resolve(ss);
			}
		});
	});
});
