import * as express from 'express';
import { ISSThread } from '../../../../db/interfaces';
import filter from '../../../../core/filter-ss-posts';
import read from '../../../../core/read-ss';
import ui from '../../ui';

module.exports = (req: express.Request, res: express.Response): void => {
	let ss = <ISSThread>res.locals.ss;

	if (ss.url.indexOf('.2ch.') !== -1) {
		res.send('Sorry! まだ2ちゃんねるのコンテンツの転載許可を得ていないため、現時点でこのSSをご提供することは出来ません。ご不便をお掛けしますが、今しばらくお待ちください。');
		return;
	}

	ui(req, res).then(() => {
		const filterMode =
			req.cookies['ss-thread-posts-filter-mode'] !== undefined ?
			req.cookies['ss-thread-posts-filter-mode'] :
			'auto';

		const posts = filter(ss, filterMode);

		res.locals.display({
			ss: ss,
			posts: posts,
			summary: ss.posts[0].html.split('<br>').join(' ').replace(/<.+?>/g, ''),
			filterMode: filterMode
		});

		read(req, res, ss._id);
	});
};
