import * as express from 'express';
import { SS } from '../../../../db/models';
import { ISSThread } from '../../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	SS
	.find({
		'isDeleted': false
	})
	.populate({
		path: 'series',
		options: { lean: true }
	})
	.populate({
		path: 'characters.id',
		select: '_id name kana screenName aliases color',
		options: { lean: true }
	})
	.sort({
		_id: 1
	})
	.limit(10)
	.lean()
	.exec((err: any, sss: ISSThread[]) => {
		res.locals.display({
			recentSS: sss
		});
	});
};
