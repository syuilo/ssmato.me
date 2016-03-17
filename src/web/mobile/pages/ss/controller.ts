import * as express from 'express';
import { ISSThread } from '../../../../db/interfaces';
import compilePost from '../../../../core/compile-ss-thread-post';
import filter from '../../../../core/analyze/filter-ss-posts';
import read from '../../../../core/read-ss';

module.exports = (req: express.Request, res: express.Response): void => {
	const ss = <ISSThread>res.locals.ss;

	const filterMode =
		req.cookies['ss-thread-posts-filter-mode'] !== undefined ?
		req.cookies['ss-thread-posts-filter-mode'] :
		'auto';

	let posts = compilePost(ss.posts);

	switch (filterMode) {
		case 'auto':
			posts = filter(ss, posts);
			break;
		case 'master':
			posts = posts.filter(post => post.isMaster);
			break;
		case 'none':
			break;
		default:
			break;
	}

	res.locals.display({
		ss: ss.toObject(),
		posts: posts,
		filterMode: filterMode
	});

	read(req, res, ss);
};
