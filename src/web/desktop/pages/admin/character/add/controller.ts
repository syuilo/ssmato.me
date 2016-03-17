import * as express from 'express';
import {Series, Character} from '../../../../../../db/models';

module.exports = (req: express.Request, res: express.Response): void => {
	Series.find({}, (err, serieses) => {
		Character
		.find({}, '_id name kana')
		.sort({
			createdAt: -1
		})
		.limit(16)
		.exec((err, recentCharacters) => {
			res.locals.display({
				serieses,
				recentCharacters: recentCharacters.map(ss => ss.toObject())
			});
		});
	});
};
