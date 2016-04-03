import * as express from 'express';
import { Series, SS, Character } from '../../../../../db/models';
import { ISeries, ISSThread, ICharacter } from '../../../../../db/interfaces';
import ui from '../../../ui';

module.exports = (req: express.Request, res: express.Response): void => {
	const series = res.locals.series;
	ui(req, res).then(() => {
		SS
		.find({
			series: series.id
		})
		.sort({
			_id: -1
		})
		.limit(16)
		.populate('series')
		.populate('characters.profile', 'name kana screenName aliases color _id')
		.exec((err: any, sss: ISSThread[]) => {
			res.locals.display({
				sss: sss.map(ss => ss.toObject())
			});
		});
	});
};
