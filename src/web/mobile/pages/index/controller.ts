import * as express from 'express';
import { SS } from '../../../../db/models';
import { ISSThread } from '../../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	SS
	.find({
		'isDeleted': false
	})
	.sort({
		_id: -1
	})
	.limit(16)
	.populate('series')
	.populate('characters.profile', 'name kana screenName aliases color _id')
	.exec((err: any, sss: ISSThread[]) => {
		res.locals.display({
			recentSS: sss.map(ss => ss.toObject())
		});
	});
};
