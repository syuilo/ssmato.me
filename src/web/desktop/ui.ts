import * as express from 'express';
import { Series, Character } from '../../db/models';

export default (req: express.Request, res: express.Response): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		Promise.all([
			Series
			.find({})
			.sort({
				ssCount: -1
			})
			.limit(30)
			.exec(),

			Character
			.find({}, '_id name kana color ssCount')
			.sort({
				ssCount: -1
			})
			.limit(30)
			.exec(),
		]).then((results) => {
			res.locals.uiPopularSeries = results[0];
			res.locals.uiPopularCharacters = results[1];
			resolve();
		}, reject);
	});
};
