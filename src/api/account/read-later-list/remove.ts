import * as express from 'express';
import { ReadLater } from '../../../db/models';
import { IUser, IReadLater } from '../../../db/interfaces';

module.exports = (req: express.Request, res: express.Response): void => {
	if (!res.locals.login) {
		res.sendStatus(401);
		return;
	}

	const me: IUser = res.locals.me;
	const ssId = req.body['ss-id'];

	ReadLater.findOne({
		user: me.id,
		ss: ssId
	}, (err: any, readlater: IReadLater) => {
		if (err !== null) {
			console.error(err);
			res.sendStatus(500);
			return;
		}

		if (readlater === null) {
			res.sendStatus(404);
			return;
		}

		readlater.remove(err => {
			if (err !== null) {
				console.error(err);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	});
};
