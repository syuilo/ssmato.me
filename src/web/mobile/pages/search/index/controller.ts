import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import search from '../../../../../core/search/search';
import config from '../../../../../config';

module.exports = (req: express.Request, res: express.Response): void => {
	if (req.query.hasOwnProperty('q')) {
		const q: string = req.query.q;

		if (q === '') {
			res.redirect(config.public.urls.search);
			return;
		}

		search(q).then((sss: ISSThread[]) => {
			res.locals.display({
				q: q,
				sss: sss.map(ss => ss.toObject())
			}, 'search/index/result');
		});
	} else {
		res.locals.display();
	}
};
