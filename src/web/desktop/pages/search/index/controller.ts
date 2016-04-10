import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import ui from '../../../ui';
import search from '../../../../../core/search/search';

module.exports = (req: express.Request, res: express.Response): void => {
	const q: string = req.query.q;
	ui(req, res).then(() => {
		search(q).then((sss: ISSThread[]) => {
			res.locals.display({
				q: q,
				sss: sss.map(ss => ss.toObject())
			});
		});
	});
};
