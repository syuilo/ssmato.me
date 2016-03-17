import * as express from 'express';
import config from '../config';

module.exports = (req: express.Request, res: express.Response): void => {
	res.cookie('ss-thread-posts-filter-mode', req.query.mode, {
		path: '/',
		domain: `.${config.public.domain}`,
		httpOnly: true,
		secure: config.https.enable,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
		maxAge: 1000 * 60 * 60 * 24 * 365
	});

	res.redirect(req.query.callback);
};
