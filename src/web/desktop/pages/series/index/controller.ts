import * as express from 'express';
import { ISSThread } from '../../../../../db/interfaces';
import ui from '../../../ui';
import findBySeries from '../../../../../core/search/find-by-series';

module.exports = (req: express.Request, res: express.Response): void => {
	const series = res.locals.series;
	ui(req, res).then(() => {
		findBySeries(series).then((sss: ISSThread[]) => {
			res.locals.display({
				sss: sss.map(ss => ss.toObject())
			});
		});
	});
};
