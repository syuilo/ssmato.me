import * as express from 'express';
import { Character } from '../../../../../db/models';
import { ISSThread } from '../../../../../db/interfaces';
import findBySeries from '../../../../../core/search/find-by-series';

module.exports = (req: express.Request, res: express.Response): void => {
	const series = res.locals.series;
	findBySeries(series).then((sss: ISSThread[]) => {
		Character
		.find({ series: series._id }, '_id name kana ruby screenName color')
		.lean()
		.exec((err, characters) => {
			res.locals.display({
				characters: characters,
				sss: sss
			});
		});
	});
};
