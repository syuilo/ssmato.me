import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import search from '../../../../../core/search/search';
import config from '../../../../../config';

module.exports = (req: express.Request, res: express.Response): void => {
	if (req.query.hasOwnProperty('q')) {
		const q: string = req.query.q;
		const from: number = parseInt(req.query.from, 10) || 0;
		const imfeelinglucky = req.query.hasOwnProperty('imfeelinglucky');

		if (q === '') {
			res.redirect(config.public.urls.search);
			return;
		}

		search(q, from).then((sss: ISSThread[]) => {
			if (imfeelinglucky) {
				res.redirect(config.public.url + '/' + sss[0]._id.toString());
			} else {
				res.locals.display({
					q: q,
					from: from,
					sss: sss
				}, 'search/index/result');
			}
		});
	} else {
		res.locals.display();
	}
};
