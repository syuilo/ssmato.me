import * as express from 'express';
import { SS } from '../../../../../db/models';
import { ISSThread } from '../../../../../db/interfaces';
import ui from '../../../ui';

module.exports = (req: express.Request, res: express.Response): void => {
	const character = res.locals.character;
	ui(req, res).then(() => {
		SS
		.find({
			'characters.profile': character.id
		})
		.sort({
			// todo
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
