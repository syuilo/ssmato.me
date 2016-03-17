import * as express from 'express';
import {Series} from '../../../../../../db/models';

module.exports = (req: express.Request, res: express.Response): void => {
	Series
	.find({}, '_id title kana')
	.sort({
		createdAt: -1
	})
	.limit(16)
	.exec((err, recentSeries) => {
		res.locals.display({
			recentSeries: recentSeries.map(ss => ss.toObject())
		});
	});
};
