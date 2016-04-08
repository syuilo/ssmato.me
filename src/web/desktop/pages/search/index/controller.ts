import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import ui from '../../../ui';
import findByTitle from '../../../../../core/search/find-by-title';

module.exports = (req: express.Request, res: express.Response): void => {
	const q: string = req.query.q;
	ui(req, res).then(() => {
		findByTitle(q).then((sss: ISSThread[]) => {
			res.locals.display({
				q: q,
				sss: sss.map(ss => ss.toObject())
			});
		});
	});
};
