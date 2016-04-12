import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import search from '../../../../../core/search/search';
import config from '../../../../../config';

module.exports = (req: express.Request, res: express.Response): void => {
	if (req.query.hasOwnProperty('q')) {
		const q: string = req.query.q;
		const from: number = parseInt(req.query.from, 10) || 0;

		if (q === '') {
			res.redirect(config.public.urls.search);
			return;
		}

		search(q, from).then((sss: ISSThread[]) => {
			res.locals.display({
				q: q,
				from: from,
				sss: sss.map(ss => ss.toObject())
			}, 'search/index/result');
		});
	} else {
		res.locals.display();
	}
};
