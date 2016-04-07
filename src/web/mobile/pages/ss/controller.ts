import * as express from 'express';
import { ISSThread } from '../../../../db/interfaces';
import filter from '../../../../core/filter-ss-posts';
import read from '../../../../core/read-ss';

module.exports = (req: express.Request, res: express.Response): void => {
	let ss = <ISSThread>res.locals.ss;

	const filterMode =
		req.cookies['ss-thread-posts-filter-mode'] !== undefined ?
		req.cookies['ss-thread-posts-filter-mode'] :
		'auto';

	const posts = filter(ss, filterMode);

	res.locals.display({
		ss: ss,
		posts: posts,
		filterMode: filterMode
	});

	read(req, res, ss._id);
};
